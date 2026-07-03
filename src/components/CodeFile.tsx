import { useEffect, useMemo, useRef } from 'react'
import { tokenize, verbGlyph, type Token, type TokenKind } from './codefile-highlight'
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
}: CodeFileProps) {
  const lines = useMemo(() => tokenize(yaml), [yaml])
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
  useEffect(() => {
    const pre = preRef.current
    const body = pre?.parentElement
    if (!pre || !body) return
    const update = () => {
      const overflowing = pre.scrollWidth - pre.clientWidth > 1
      const atEnd = pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 2
      body.dataset.overflowing = String(overflowing)
      body.dataset.atEnd = String(atEnd)
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
           filename in dim mono + ONE functional chip (copy). */}
      <div className="cf-chrome">
        <span className="cf-ticks" aria-hidden>
          <span className="cf-tick" />
          <span className="cf-tick" />
          <span className="cf-tick" />
        </span>
        {filename ? (
          <span className="cf-tab" title={filename}>
            <span className="cf-tab-name">{filename}</span>
          </span>
        ) : (
          <span className="cf-tab cf-tab--anon">
            <span className="cf-tab-name">{lang}</span>
          </span>
        )}
        <span className="cf-chrome-right">
          <CopyButton value={yaml} />
        </span>
      </div>

      {/* ── the editor body · gutter + code, one horizontal scroll well ──────── */}
      <div className="cf-body">
        <pre ref={preRef} className="cf-pre" style={{ ['--cf-gutter' as string]: `${gutterCh}ch` }}>
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
      </div>
    </div>
  )
}
