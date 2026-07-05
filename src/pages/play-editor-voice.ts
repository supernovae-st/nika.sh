import {
  Decoration,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  hoverTooltip,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { HighlightStyle } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { tipFor, tipHref, type CodeTip } from '../components/codefile-tips'

/* ─── /play · the editor's yaml voice (loop T6 · one-voice law) ──────────────
   The live editor must speak the SAME dialect as the static CodeFile
   (components/codefile.css): the exact --cf-* token hues, the 4 verb keys in
   their canonical colours, ${{ refs }} in teal live-wiring. Two layers:

   1. cfHighlight — a HighlightStyle over the lezer-yaml tags. lezer tags every
      plain scalar as `content` (no number/bool distinction), which matches the
      CodeFile tokenizer's own rule: bare scalars read as strings (sage).
   2. nikaMarks — one MatchDecorator for the three signatures the grammar can't
      see: verb KEYS, ${{ refs }}, and bare number/bool values. Same rules as
      the CodeFile tokenizer (verbs only in key position; bools cover the YAML
      1.1 forms). PlayEditor's theme colours the mark classes — editor-scoped
      selectors, so the marks win over single-class highlight spans. */

export const CF_BG = '#0d0e12'
export const CF_LINE = 'rgb(255 255 255 / 0.07)'
export const CF_GUTTER_INK = '#555b67'
export const CF_REF = '#5fd3d1' /* the teal live-wiring accent (= --cf-ref) */
export const CF_KEY = '#e7eaf0'
export const CF_STR = '#9bd29a'
export const CF_NUM = '#e6b873'
export const CF_BOOL = '#c79bf2'
export const CF_COMMENT = '#757c8a'
export const CF_PUNCT = '#78808e'
export const CF_PLAIN = '#aab0bb'

/* the token voice · mirrors src/styles/tokens.css --cf-* (keys brightest ink,
   strings sage, structure receding). lezer-yaml maps: Key/* → definition(
   propertyName) · QuotedLiteral → string · Literal/BlockLiteralContent →
   content · Anchor/Alias → labelName · Tag → typeName · ":-," → separator. */
export const cfHighlight = HighlightStyle.define([
  { tag: t.definition(t.propertyName), color: CF_KEY, fontWeight: '500' },
  { tag: [t.string, t.content], color: CF_STR },
  { tag: t.special(t.string), color: CF_PUNCT } /* block headers · | and > */,
  { tag: t.number, color: CF_NUM },
  { tag: [t.bool, t.null], color: CF_BOOL, fontWeight: '500' },
  { tag: [t.labelName, t.typeName], color: CF_REF } /* &anchors · *aliases · !!tags */,
  { tag: [t.comment, t.lineComment], color: CF_COMMENT },
  { tag: [t.separator, t.punctuation, t.brace, t.squareBracket, t.meta], color: CF_PUNCT },
  { tag: t.keyword, color: CF_BOOL } /* %YAML directive names */,
])

/* the three grammar-blind signatures, one line-scan:
   group 2 → a verb KEY (indent · optional "- " · verb · lookahead ":")
   group 3 → a ${{ … }} ref (anywhere, incl. inside quoted strings)
   group 5 → a bare number/bool/null VALUE ("key: 3" · "- true"), nothing else
             before line end but an optional trailing comment */
export const NIKA_MARK_RE =
  /^(\s*(?:-\s+)?)(agent|exec|infer|invoke)(?=:)|(\$\{\{[^}]*\}\})|(:\s+|^\s*-\s+)(-?\d+(?:\.\d+)?|true|false|null|~|yes|no|on|off)(?=\s*(?:#.*)?$)/g

const verbMark: Record<string, Decoration> = Object.fromEntries(
  ['agent', 'exec', 'infer', 'invoke'].map((v) => [
    v,
    Decoration.mark({ class: `cm-nika-verb cm-nika-verb--${v}` }),
  ]),
)
const refMark = Decoration.mark({ class: 'cm-nika-ref' })
const numMark = Decoration.mark({ class: 'cm-nika-num' })
const boolMark = Decoration.mark({ class: 'cm-nika-bool' })

const nikaMatcher = new MatchDecorator({
  regexp: NIKA_MARK_RE,
  decorate(add, from, _to, m) {
    if (m[2]) {
      const s = from + m[1].length
      add(s, s + m[2].length, verbMark[m[2]])
    } else if (m[3]) {
      add(from, from + m[0].length, refMark)
    } else if (m[5]) {
      const s = from + m[4].length
      add(s, s + m[5].length, /^[-\d]/.test(m[5]) ? numMark : boolMark)
    }
  },
})

export const nikaMarks = ViewPlugin.fromClass(
  class {
    deco: DecorationSet
    constructor(view: EditorView) {
      this.deco = nikaMatcher.createDeco(view)
    }
    update(u: ViewUpdate) {
      this.deco = nikaMatcher.updateDeco(u, this.deco)
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
