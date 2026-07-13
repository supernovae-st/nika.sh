import { useEffect, useMemo, useRef } from 'react'
import {
  NIKA_VERBS,
  tokenize,
  verbGlyph,
  type NikaVerb,
  type Token,
  type TokenKind,
} from './codefile-highlight'
import { tipFor, tipHref, type CodeTip } from './codefile-tips'
import { useCopy } from '../lib/use-copy'
import { CopyIcon } from './CopyRow'
import { armIdleFlag } from '../fx/idle-flag'
import '../shell/shell.css'
import './codefile.css'
import '../fx/panel-sheen.css'

/* ─── CodeFile · the premium, dense, SSR-static .nika.yaml editor panel ───────
   The shared code surface across the site (hero · Living File · Permits ·
   GetStarted · Spec · UseCases). It is the PRODUCT replica — a real editor view
   of a plan file — so it reads like an IDE window: skeuo window chrome (a
   filename tab · traffic-light dots · a lang badge · a copy button), a real
   dimmed line-number gutter with a hairline divider, and a restrained-but-real
   YAML syntax theme (color is allowed HERE — this is the product).

   It stays SERVER-RENDERED: real <pre>/<code> DOM text, NOT a CodeMirror editor.
   The YAML lives verbatim in the prerendered HTML (crawlable · paints instantly).
   The interactive editor stays on /play only.

   The syntax hues are theme-aware CSS vars (codefile.css), so the panel adapts to
   theme-dark / theme-light automatically. SSR-safe: no window/document at render;
   the copy handler reads navigator.clipboard inside the click callback only. */

/* the token cache · module-level, keyed by the raw yaml string. tokenize is
   pure and costs ~13ms per 40-line file — the home mounts the SAME flagship
   yaml in up to six panels (hero · morph card · done panel · boundary ·
   wedge · get-started), so hydration paid it six times, and every hero tab
   RETURN paid it again across all of them (~300ms of main thread under a
   4× mobile CPU). The site's yamls are a finite static set (flagships ·
   learn · spec · showcase — /play and /convert never render CodeFile from
   user input), so an unbounded Map is a bounded cache in practice. */
const TOKEN_CACHE = new Map<string, ReturnType<typeof tokenize>>()
function tokenizeCached(yaml: string): ReturnType<typeof tokenize> {
  let lines = TOKEN_CACHE.get(yaml)
  if (!lines) {
    lines = tokenize(yaml)
    TOKEN_CACHE.set(yaml, lines)
  }
  return lines
}

export interface CodeFileProps {
  /** the raw YAML to render (also what the copy button copies, verbatim) */
  yaml: string
  /** optional inclusive 1-based line range to emphasize, e.g. [5, 9] */
  highlight?: [number, number]
  /** optional filename — renders a window-chrome tab above the code */
  filename?: string
  /** optional language badge in the chrome (defaults to "yaml") */
  lang?: string
  /** render the line-number gutter (default: true) */
  lineNumbers?: boolean
  /** 1-based number of the FIRST line — an excerpt keeps its real file lines
      (the same body, partially shown · never a second version of the file) */
  firstLine?: number
  /** density variant: soft-wrap long lines INSIDE the panel with a hanging
      indent (aligned 2ch past each line's own indentation) instead of the
      horizontal scroll well. Opt-in (the hero reading surface) — every other
      call-site keeps the default pre + scroll register. */
  wrap?: boolean
  /** optional extra classes on the outer panel */
  className?: string
  /** a pointer entered a code line (1-based) · null on leave — the mini-DAG
      pairing surface (hero). Delegated on the body: zero cost when absent. */
  onLineHover?: (line: number | null) => void
  /** smart hover layer (wave O): hovering a curated key / verb / `${{ … }}`
      ref floats its plain-words line in an IDE-hover card (term · words · a
      link into the /spec block that owns the term). Opt-in (the hero reading
      surface); positioned imperatively — zero re-renders per hover, fine
      pointers only (codefile.css gates hover:none). */
  tips?: boolean
  /** the evidence range's hover card (wave P): hovering ANYWHERE on these
      lit lines — not just a curated token — floats the range's own card
      (the tab's gloss, back where it belongs). Requires `tips`. */
  rangeTip?: { lines: [number, number]; term: string; words: string }
  /** replaces the chrome's filename tab with call-site content (wave P: the
      hero's file tabs live IN the titlebar — a real editor's tab bar). */
  chromeSlot?: React.ReactNode
  /** moves the copy button from the chrome into a floating chip at the code
      well's top-right (GitHub register) — frees the titlebar for the tabs. */
  copyInBody?: boolean
  /** attributes for the .cf-body element — the hero marks the CODE area as
      the tabpanel its chrome tabs control (correct APG topology: the tablist
      must not live inside the panel it labels). */
  bodyProps?: React.HTMLAttributes<HTMLDivElement>
  /** the file's OFFICIAL registered source — renders a corner link beside
      the copy (spec pack blob · served /library file). */
  sourceHref?: string
}

/* token kind → syntax class (the literal hue resolves per theme via codefile.css) */
const KIND_CLASS: Record<TokenKind, string> = {
  comment: 'cf-comment',
  key: 'cf-key',
  verb: 'cf-verb',
  string: 'cf-str',
  number: 'cf-num',
  boolean: 'cf-bool',
  tref: 'cf-ref',
  punct: 'cf-punct',
  plain: 'cf-plain',
}

function TokenSpan({ token }: { token: Token }) {
  /* space-less tokens are ATOMIC machine strings (paths · filenames · slugs ·
     model ids) — under the wrap variant they must never break mid-token (CSS
     treats a hyphen as a break opportunity: "./action-items.json" would split
     at the "-"). The class is inert outside .cf-panel--wrap (white-space: pre
     never wraps anyway). Prose strings / comments keep their internal spaces
     and wrap freely. */
  const atom = token.text.includes(' ') ? '' : ' cf-atom'
  if (token.kind === 'verb') {
    const verb = token.verb ?? token.text
    // the verb keyword + its leading glyph both carry the verb-hue (the product
    // replica's one place where the 4 verbs read in their canonical colours).
    return (
      <span className={`cf-verb cf-verb--${verb}${atom}`}>
        <span className="cf-verb-glyph select-none" aria-hidden>
          {verbGlyph(verb)}
        </span>
        {token.text}
      </span>
    )
  }
  /* suppressHydrationWarning: YAML scalars are commonly double-quoted ("…").
     React's server renderers escape a bare " in text to &quot;, while the client
     renders the raw " — a serialization-only difference that round-trips to the
     same DOM text but trips React 19's byte-level hydration check (this threw
     React #418 on /use-cases, which renders many quoted values). The text node
     is the lowest element carrying the quote, so the suppression is scoped tight;
     the server text is correct, so React keeps it instead of regenerating. */
  return (
    <span className={`${KIND_CLASS[token.kind]}${atom}`} suppressHydrationWarning>
      {token.text}
    </span>
  )
}

/* the file's OFFICIAL source, beside the copy (operator 2026-07-13):
   every yaml on the site is registered — the corner link takes you to the
   registration (the spec pack blob, or the served /library file). */
function SourceLink({ href }: { href: string }) {
  const external = href.startsWith('http')
  return (
    <a
      className="cf-src"
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      title="The registered source of this file"
    >
      source<span aria-hidden> ↗</span>
    </a>
  )
}

function CopyButton({ value }: { value: string }) {
  const { copied, copy } = useCopy(value) // shared state · one reset delay · unmount-safe
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy file contents"
      title={copied ? 'Copied' : 'Copy'}
      data-copied={copied || undefined}
      className="cf-copy"
    >
      {/* polite live region — an aria-label swap alone is not reliably announced */}
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
      <CopyIcon copied={copied} />
      <span className="cf-copy-label" aria-hidden>
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
}

export function CodeFile({
  yaml,
  highlight,
  filename,
  lang = 'yaml',
  lineNumbers = true,
  firstLine = 1,
  wrap = false,
  className,
  onLineHover,
  tips = false,
  rangeTip,
  chromeSlot,
  copyInBody = false,
  sourceHref,
  bodyProps,
}: CodeFileProps) {
  const lines = useMemo(() => tokenizeCached(yaml), [yaml])
  /* the title-bar sheen (panel-sheen.css) parks when the tab hides — arm the
     shared root [data-idle] flag (idempotent · one listener for all panels) */
  useEffect(armIdleFlag, [])
  /* wrap variant only: each line's leading-space count, in ch — codefile.css
     turns it into the hanging indent (a wrapped continuation lands 2ch past
     the line's own indentation, like a real editor's wrap guide). */
  const indents = useMemo(
    () =>
      wrap
        ? yaml
            .replace(/\r\n/g, '\n')
            .split('\n')
            .map((l) => l.length - l.trimStart().length)
        : null,
    [yaml, wrap],
  )
  const [hStart, hEnd] = highlight ?? [0, -1]
  // the gutter is as wide as the largest line number needs (min 2 cols).
  const gutterCh = Math.max(2, String(firstLine + lines.length - 1).length)

  /* ── the horizontal-scroll affordance (mobile P0) ──────────────────────────
     When a long line overflows the panel, the page must NEVER widen — the code
     scrolls inside .cf-pre. But an invisible scroll well reads as CLIPPED text
     on touch, so we surface the cue: `data-overflowing` on .cf-body lights the
     right-edge fade (codefile.css), and `data-at-end` clears it once the reader
     has scrolled the line to its end. SSR ships no attribute (no fade) — the
     measurer runs on mount and tracks scroll + resize from there. */
  const preRef = useRef<HTMLPreElement>(null)
  /* the smart-hover card (wave O·P) · one floating box, moved imperatively —
     React never re-renders on hover (zero-lag law). */
  const tipRef = useRef<HTMLSpanElement>(null)
  const tipTermRef = useRef<HTMLElement>(null)
  const tipWordsRef = useRef<HTMLSpanElement>(null)
  const tipLinkRef = useRef<HTMLAnchorElement>(null)
  const hideTip = () => {
    const box = tipRef.current
    if (box) delete box.dataset.on
  }
  /* fill + place the card over an anchor rect (a token span or a lit row) */
  const showTip = (tip: CodeTip, anchor: DOMRect, body: HTMLElement) => {
    const box = tipRef.current
    if (!box) return
    if (tipTermRef.current) tipTermRef.current.textContent = tip.term
    if (tipWordsRef.current) tipWordsRef.current.textContent = tip.words
    if (tip.verb) box.dataset.verb = tip.verb
    else delete box.dataset.verb
    const href = tipHref(tip.term)
    if (tipLinkRef.current && href) tipLinkRef.current.setAttribute('href', href)
    box.dataset.link = href ? '1' : ''
    const b = body.getBoundingClientRect()
    /* the body clips at its own bounds (overflow) — clamp the
       translateX(-50%) center by the box's MEASURED half-width (content was
       just set, so this reads the real layout), never a guessed constant.
       Same for the flip: above only when the WHOLE box fits over the anchor. */
    const half = box.offsetWidth / 2 + 8
    const cx = Math.min(Math.max(anchor.left - b.left + anchor.width / 2, half), b.width - half)
    const above = anchor.top - b.top > box.offsetHeight + 14
    box.style.left = `${Math.round(cx)}px`
    box.style.top = above
      ? `${Math.round(anchor.top - b.top - 7)}px`
      : `${Math.round(anchor.bottom - b.top + 7)}px`
    box.dataset.pos = above ? 'top' : 'bottom'
    box.dataset.on = '1'
  }
  useEffect(() => {
    const pre = preRef.current
    const body = pre?.parentElement
    if (!pre || !body) return
    const update = () => {
      const overflowing = pre.scrollWidth - pre.clientWidth > 1
      const atEnd = pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 2
      body.dataset.overflowing = String(overflowing)
      body.dataset.atEnd = String(atEnd)
      /* keyboard law · a scroll well must be reachable to be scrolled — each
         element earns a tab stop exactly while IT can scroll (zero tolerance:
         axe's judgment) and gives it back when it can't. Two distinct wells
         can coexist: the pre scrolls X (long lines), and a height-capped
         call-site (fadebottom / spec wells) makes the BODY scroll Y. */
      if (pre.scrollWidth > pre.clientWidth || pre.scrollHeight > pre.clientHeight)
        pre.tabIndex = 0
      else pre.removeAttribute('tabindex')
      const bodyScrolls =
        body.scrollHeight > body.clientHeight || body.scrollWidth > body.clientWidth
      if (bodyScrolls && /auto|scroll/.test(getComputedStyle(body).overflowY)) {
        body.tabIndex = 0
        if (!body.getAttribute('aria-label')) body.setAttribute('aria-label', pre.getAttribute('aria-label') ?? 'code')
        if (!body.getAttribute('role')) body.setAttribute('role', 'group')
      } else body.removeAttribute('tabindex')
      /* any scroll/resize stales the tip's measured anchor — drop it */
      const box = tipRef.current
      if (box) delete box.dataset.on
    }
    update()
    pre.addEventListener('scroll', update, { passive: true })
    // jsdom (tests) has no ResizeObserver — the scroll cue degrades to
    // measure-on-mount + on-scroll there, which is all the tests render anyway.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    ro?.observe(pre)
    return () => {
      pre.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [yaml])

  return (
    <div className={`cf-panel ${wrap ? 'cf-panel--wrap' : ''} ${className ?? ''}`}>
      {/* ── window chrome · the minimal titlebar register (product-frame recipe):
           3 square ticks (the affordance — never macOS traffic lights) + the
           filename in dim mono (or the call-site's chromeSlot — the hero puts
           its file TABS here, a real editor's tab bar) + the copy chip unless
           it floats in the body. The sheen (panel-sheen.css) rides its own
           clipped layer so the chrome can let a popover escape downward. */}
      <div className="cf-chrome">
        <span className="cf-sheen" aria-hidden />
        <span className="cf-ticks" aria-hidden>
          <span className="cf-tick" />
          <span className="cf-tick" />
          <span className="cf-tick" />
        </span>
        {chromeSlot ??
          (filename ? (
            <span className="cf-tab" title={filename}>
              <span className="cf-tab-name">{filename}</span>
            </span>
          ) : (
            <span className="cf-tab cf-tab--anon">
              <span className="cf-tab-name">{lang}</span>
            </span>
          ))}
        {copyInBody ? null : (
          <span className="cf-chrome-right">
            {sourceHref ? <SourceLink href={sourceHref} /> : null}
            <CopyButton value={yaml} />
          </span>
        )}
      </div>

      {/* ── the editor body · gutter + code, one horizontal scroll well ────────
           One delegated pointerover serves BOTH hover layers (only fires on
           element boundaries, never per-move): the line pairing resolves the
           1-based line from the row's data-ln; the smart card resolves the
           hovered key/verb/ref span — or, anywhere on the lit evidence lines,
           the range's own card (wave P) — and is positioned imperatively.
           Hovering the card itself keeps it open (its link is clickable).
           Neither prop = zero listeners. */}
      <div
        {...bodyProps}
        className="cf-body"
        onPointerOver={
          onLineHover || tips
            ? (e) => {
                const target = e.target as HTMLElement
                const box = tipRef.current
                /* over the card (or its bridge) — keep it, touch nothing */
                if (box?.contains(target)) return
                const row = target.closest<HTMLElement>('.cf-line')
                const ln = row ? Number(row.dataset.ln) : NaN
                if (onLineHover) onLineHover(Number.isFinite(ln) ? ln : null)
                if (!tips || !box) return
                const span = target.closest<HTMLElement>('.cf-key, .cf-verb, .cf-ref')
                const kind = !span
                  ? ''
                  : span.classList.contains('cf-verb')
                    ? 'verb'
                    : span.classList.contains('cf-key')
                      ? 'key'
                      : 'tref'
                const tokenTip = span ? tipFor(kind, span.textContent ?? '') : null
                const body = e.currentTarget as HTMLElement
                if (span && tokenTip) {
                  showTip(tokenTip, span.getBoundingClientRect(), body)
                  return
                }
                /* no curated token under the pointer — the lit evidence range
                   speaks for its whole band (operator wave P: « sur toute la
                   sélection, pas que sur les mots ») */
                if (
                  rangeTip &&
                  row &&
                  Number.isFinite(ln) &&
                  ln >= rangeTip.lines[0] &&
                  ln <= rangeTip.lines[1]
                ) {
                  const verb = rangeTip.term
                  showTip(
                    {
                      term: rangeTip.term,
                      words: rangeTip.words,
                      verb: (NIKA_VERBS as readonly string[]).includes(verb)
                        ? (verb as NikaVerb)
                        : undefined,
                    },
                    row.getBoundingClientRect(),
                    body,
                  )
                  return
                }
                /* line fallback (wave R): hovering ANYWHERE on a line — the
                   empty air right of the text included — speaks the line's
                   own concept: its verb if it binds one, else its leading
                   key. The card still anchors on the token it explains. */
                if (row) {
                  const lineEl =
                    row.querySelector<HTMLElement>('.cf-verb') ??
                    row.querySelector<HTMLElement>('.cf-key')
                  const lineTip = lineEl
                    ? tipFor(
                        lineEl.classList.contains('cf-verb') ? 'verb' : 'key',
                        lineEl.textContent ?? '',
                      )
                    : null
                  if (lineEl && lineTip) {
                    showTip(lineTip, lineEl.getBoundingClientRect(), body)
                    return
                  }
                }
                delete box.dataset.on
              }
            : undefined
        }
        onPointerLeave={
          onLineHover || tips
            ? () => {
                onLineHover?.(null)
                hideTip()
              }
            : undefined
        }
      >
        <pre
          ref={preRef}
          className="cf-pre"
          role="group"
          aria-label={filename ?? lang}
          style={{ ['--cf-gutter' as string]: `${gutterCh}ch` }}
        >
          <code className="cf-code">
            {lines.map((line, i) => {
              const n = i + firstLine
              const lit = n >= hStart && n <= hEnd
              return (
                <span
                  key={i}
                  className={`cf-line ${lit ? 'cf-line--lit' : ''}`}
                  data-ln={n}
                >
                  {lineNumbers ? (
                    <span className="cf-ln" aria-hidden>
                      {n}
                    </span>
                  ) : null}
                  <span
                    className="cf-line-text"
                    style={
                      indents && indents[i]
                        ? ({ '--cf-indent': `${indents[i]}ch` } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {line.tokens.length === 0 ? (
                      /* empty line · the zero-width filler is wrapped in an ELEMENT
                         (not a bare text node) so the line stays tall and hydrates
                         cleanly. */
                      <span aria-hidden>{'​'}</span>
                    ) : (
                      line.tokens.map((t, j) => <TokenSpan key={j} token={t} />)
                    )}
                  </span>
                </span>
              )
            })}
          </code>
        </pre>
        {/* the smart-hover card · decorative twin of the /learn + boundary
            pedagogy (same plain-words source) — pointer courtesy only, so it
            stays out of the accessibility tree (the link is tabIndex -1: the
            same anchors are keyboard-reachable on /spec itself); hover:none
            displays none. Hovering the card keeps it open — the spec link is
            clickable (the ::after bridge spans the gap to the anchor). */}
        {tips ? (
          <span ref={tipRef} className="cf-tipbox" aria-hidden>
            <span className="cf-tipbox-main">
              <b ref={tipTermRef} className="cf-tipbox-term" />
              <span ref={tipWordsRef} className="cf-tipbox-words" />
            </span>
            <a ref={tipLinkRef} className="cf-tipbox-link" tabIndex={-1}>
              read it in the spec
              <span className="cf-tipbox-link-arrow"> →</span>
            </a>
          </span>
        ) : null}
        {/* the floating copy (wave P) · the titlebar belongs to the tabs — the
            copy chip moves into the code well's corner, GitHub register. */}
        {copyInBody ? (
          <span className="cf-copy-float">
            {sourceHref ? <SourceLink href={sourceHref} /> : null}
            <CopyButton value={yaml} />
          </span>
        ) : null}
      </div>
    </div>
  )
}
