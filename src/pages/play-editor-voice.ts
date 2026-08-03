import {
  Decoration,
  EditorView,
  ViewPlugin,
  hoverTooltip,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { RangeSetBuilder, type Range } from '@codemirror/state'
import { tipFor, tipHref, type CodeTip } from '../components/codefile-tips'
import { tokenize, type Token } from '../components/codefile-highlight'

/* ─── /play · the editor's yaml voice · ONE classifier ───────────────────────
   The live editor speaks the SAME dialect as the static CodeFile because it
   now runs the SAME code: tokenize(), the site's whole-file pass, drives every
   coloured span in here. Until 2026-07-28 this file kept a second grammar — a
   lezer HighlightStyle for base YAML plus a MatchDecorator regex for the nika
   signatures — and a regex knows only spelling. The panel's own law says
   POSITION OVERRULES SPELLING: `exec:` under `permits:` is a permit category,
   demoted to a key wearing the boundary; the regex kept painting it as the
   orange verb, so /play told the reader the opposite of the truth inside the
   one block that most needed to be read right.

   One classifier, two renderers. The panel renders tokens as spans at build
   time; this file maps the SAME tokens to CodeMirror decorations at edit time.
   tokenize() is lossless per line (its tokens concatenate back to the source
   line), which is what makes the offset mapping below exact rather than
   heuristic. The lezer yaml language stays mounted for STRUCTURE only —
   indentation and folding — and paints nothing. */

/* The palette READS the design registry (styles/tokens.css) instead of
   carrying a copy of it. This block used to be eleven hand-typed hex values
   "matching" the --cf-* vars — and it had already drifted (CF_BG said
   #0d0e12 while the canon says #0a0d12), which is exactly how /play stopped
   looking like the static panels: a hand-typed mirror validates nothing and
   rots quietly. Every consumer here lands in CSS (the CodeMirror theme is a
   stylesheet · zero canvas/SVG-attr contexts, grep-verified), so var() is
   safe everywhere; the fallback keeps a bare test-DOM readable and is NOT a
   second registry — the parity test pins each fallback to tokens.css. */
export const CF_BG = 'var(--cf-bg, #0a0d12)'
export const CF_LINE = 'var(--cf-line, rgb(255 255 255 / 0.07))'
export const CF_GUTTER_INK = 'var(--cf-gutter-ink, #555b67)'
export const CF_REF = 'var(--cf-ref, #5fd3d1)' /* the teal live-wiring accent */
export const CF_KEY = 'var(--cf-key, #e7eaf0)'
export const CF_STR = 'var(--cf-str, #9bd29a)'
export const CF_NUM = 'var(--cf-num, #e6b873)'
export const CF_BOOL = 'var(--cf-bool, #c79bf2)'
export const CF_COMMENT = 'var(--cf-comment, #757c8a)'
export const CF_PUNCT = 'var(--cf-punct, #78808e)'
export const CF_PLAIN = 'var(--cf-plain, #aab0bb)'

/* ── token → decoration class · the ONE mapping ──────────────────────────────
   Mirrors the static panel's KIND_CLASS (CodeFile.tsx): every kind that
   carries ink gets a class the PlayEditor theme paints from the same CF_*
   values / projected tokens. `plain` carries none — the content base colour
   IS its ink. A role rides WITH the kind class, exactly as the panel stacks
   `cf-key cf-role--boundary`: the role's entry sits later in the theme, so it
   wins at equal specificity — the cascade IS the precedence, stated. */
const KIND_CLASS: Partial<Record<Token['kind'], string>> = {
  key: 'cm-cf-key',
  string: 'cm-cf-str',
  comment: 'cm-cf-comment',
  punct: 'cm-cf-punct',
  tref: 'cm-nika-ref',
  number: 'cm-nika-num',
  boolean: 'cm-nika-bool',
}

function classOf(t: Token): string | null {
  if (t.kind === 'verb' && t.verb) return `cm-nika-verb cm-nika-verb--${t.verb}`
  const base = KIND_CLASS[t.kind]
  const role = t.role ? ` cm-nika-role cm-nika-role--${t.role}` : ''
  if (!base && !role) return null
  return `${base ?? ''}${role}`.trim()
}

export interface NikaSpan {
  from: number
  to: number
  cls: string
}

/** the whole document's voice, as spans + boundary-band line indices — pure
    and testable. This is the seam the parity gate probes: the editor's
    classification IS tokenize()'s, so the panel and the editor can only
    disagree if this function stops being called. */
export function nikaSpansOf(doc: string): { spans: NikaSpan[]; bands: number[] } {
  const lines = tokenize(doc)
  const raw = doc.split('\n')
  const spans: NikaSpan[] = []
  const bands: number[] = []
  let off = 0
  lines.forEach((cl, i) => {
    if (cl.band === 'boundary') bands.push(i)
    let col = 0
    for (const t of cl.tokens) {
      const cls = classOf(t)
      if (cls && t.text.length > 0) spans.push({ from: off + col, to: off + col + t.text.length, cls })
      col += t.text.length
    }
    off += (raw[i]?.length ?? 0) + 1
  })
  return { spans, bands }
}

/* decorations are interned per class — a rebuild re-uses them, so a keystroke
   allocates ranges, never mark objects */
const markCache = new Map<string, Decoration>()
function markFor(cls: string): Decoration {
  let d = markCache.get(cls)
  if (!d) {
    d = Decoration.mark({ class: cls })
    markCache.set(cls, d)
  }
  return d
}
/* the boundary band · the static panel's gutter spine, as a line class */
const bandLine = Decoration.line({ class: 'cm-nika-band' })

function buildVoice(view: EditorView): DecorationSet {
  const { spans, bands } = nikaSpansOf(view.state.doc.toString())
  const ranges: Range<Decoration>[] = []
  for (const b of bands) {
    if (b + 1 <= view.state.doc.lines) ranges.push(bandLine.range(view.state.doc.line(b + 1).from))
  }
  for (const s of spans) if (s.to > s.from) ranges.push(markFor(s.cls).range(s.from, s.to))
  /* Decoration.set sorts — line decos and marks interleave at the same from */
  return Decoration.set(ranges, true)
}

export const nikaMarks = ViewPlugin.fromClass(
  class {
    deco: DecorationSet
    constructor(view: EditorView) {
      this.deco = buildVoice(view)
    }
    update(u: ViewUpdate) {
      /* whole-doc re-tokenize per edit: the files this editor holds are tens
         of lines, and the semantic pass is positional (an indent change up
         top can re-parent everything below) — incremental would be wrong,
         not just complex */
      if (u.docChanged) this.deco = buildVoice(u.view)
    }
  },
  { decorations: (v) => v.deco },
)

/* ─── the hanging indent · the static panel's wrap law, live ─────────────────
   Under lineWrapping a continuation row falls back to the panel's left edge —
   the static CodeFile never does that (wrapped rows hang at the line's own
   indent). One line decoration per indented line: pull the first row back by
   the leading-space width, pad the whole line by the same amount. ch units on
   the mono font = exact columns; the 14px matches the theme's .cm-line base. */
function buildHang(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>()
  for (const { from, to } of view.visibleRanges) {
    let pos = from
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos)
      const ws = (line.text.match(/^ */) as RegExpMatchArray)[0].length
      if (ws > 0 && ws < line.text.length)
        b.add(
          line.from,
          line.from,
          Decoration.line({
            attributes: { style: `text-indent:-${ws}ch;padding-left:calc(14px + ${ws}ch)` },
          }),
        )
      pos = line.to + 1
    }
  }
  return b.finish()
}

export const wrapHang = ViewPlugin.fromClass(
  class {
    deco: DecorationSet
    constructor(view: EditorView) {
      this.deco = buildHang(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.deco = buildHang(u.view)
    }
  },
  { decorations: (v) => v.deco },
)

/* ─── the smart hover · the same card the static panels speak ────────────────
   The static CodeFile's curated glossary (plain-words → codefile-tips) rides
   a CodeMirror hoverTooltip here: hover a KEY, a VERB key or a ${{ ref }} and
   the same term · plain-words card appears, with the same "read it in the
   spec" footer. Curation is tipFor's: plumbing keys stay silent. */
const ANY_KEY_RE = /^(\s*(?:-\s+)?)([A-Za-z_][\w.-]*)(?=:)/
const VERB_KEY_RE = /^\s*(?:-\s+)?(agent|exec|infer|invoke)(?=:)/
const REF_RE = /\$\{\{[^}]*\}\}/g

/** the tip target at a column of a line — pure, testable */
export function cmTipAt(
  text: string,
  col: number,
): { from: number; to: number; tip: CodeTip } | null {
  for (const m of text.matchAll(REF_RE)) {
    const s = m.index
    const e = s + m[0].length
    if (col >= s && col < e) {
      const tip = tipFor('tref', m[0])
      return tip ? { from: s, to: e, tip } : null
    }
  }
  const key = text.match(ANY_KEY_RE)
  if (key) {
    const s = key[1].length
    const e = s + key[2].length
    if (col >= s && col < e) {
      const verb = text.match(VERB_KEY_RE)
      const tip = verb ? tipFor('verb', verb[1]) : tipFor('key', key[2])
      return tip ? { from: s, to: e, tip } : null
    }
  }
  return null
}

/* the card DOM · the exact structure the static tipbox renders (codefile.css
   owns both looks via the .cm-nika-tipcard twin block) */
function tipCard(tip: CodeTip): HTMLElement {
  const dom = document.createElement('div')
  dom.className = 'cm-nika-tipcard'
  dom.setAttribute('aria-hidden', 'true')
  if (tip.verb) dom.dataset.verb = tip.verb
  const main = document.createElement('span')
  main.className = 'cf-tipbox-main'
  const term = document.createElement('b')
  term.className = 'cf-tipbox-term'
  term.textContent = tip.term
  const words = document.createElement('span')
  words.className = 'cf-tipbox-words'
  words.textContent = tip.words
  main.append(term, words)
  dom.append(main)
  const href = tipHref(tip.term)
  if (href) {
    dom.dataset.link = '1'
    const a = document.createElement('a')
    a.className = 'cf-tipbox-link'
    a.href = href
    a.tabIndex = -1
    a.append('read it in the spec')
    const arrow = document.createElement('span')
    arrow.className = 'cf-tipbox-link-arrow'
    arrow.textContent = ' →'
    a.append(arrow)
    dom.append(a)
  }
  return dom
}

export const nikaHoverTips = hoverTooltip(
  (view, pos) => {
    const line = view.state.doc.lineAt(pos)
    const hit = cmTipAt(line.text, pos - line.from)
    if (!hit) return null
    return {
      pos: line.from + hit.from,
      end: line.from + hit.to,
      above: true,
      create: () => ({ dom: tipCard(hit.tip) }),
    }
  },
  { hoverTime: 160 } /* the IDE patience — same delay as the static card */,
)
