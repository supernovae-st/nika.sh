import { useMemo } from 'react'
import { tokenize, verbGlyph, type Token, type TokenKind } from './codefile-highlight'
import { useCopy } from '../lib/use-copy'
import { CopyIcon } from './CopyRow'
import '../shell/shell.css'
import './codefile.css'

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
  if (token.kind === 'verb') {
    const verb = token.verb ?? token.text
    // the verb keyword + its leading glyph both carry the verb-hue (the product
    // replica's one place where the 4 verbs read in their canonical colours).
    return (
      <span className={`cf-verb cf-verb--${verb}`}>
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
    <span className={KIND_CLASS[token.kind]} suppressHydrationWarning>
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
  className,
}: CodeFileProps) {
  const lines = useMemo(() => tokenize(yaml), [yaml])
  const [hStart, hEnd] = highlight ?? [0, -1]
  // the gutter is as wide as the largest line number needs (min 2 cols).
  const gutterCh = Math.max(2, String(lines.length).length)

  return (
    <div className={`cf-panel ${className ?? ''}`}>
      {/* ── window chrome · a real editor titlebar ───────────────────────────── */}
      <div className="cf-chrome">
        <span className="cf-lights" aria-hidden>
          <span className="cf-light cf-light--r" />
          <span className="cf-light cf-light--y" />
          <span className="cf-light cf-light--g" />
        </span>
        {filename ? (
          <span className="cf-tab" title={filename}>
            <span className="cf-tab-prompt" aria-hidden>
              ❯
            </span>
            <span className="cf-tab-name">{filename}</span>
          </span>
        ) : (
          <span className="cf-tab cf-tab--anon">
            <span className="cf-tab-prompt" aria-hidden>
              ❯
            </span>
            <span className="cf-tab-name">{lang}</span>
          </span>
        )}
        <span className="cf-chrome-right">
          {filename ? (
            <span className="cf-lang" aria-hidden>
              {lang}
            </span>
          ) : null}
          <CopyButton value={yaml} />
        </span>
      </div>

      {/* ── the editor body · gutter + code, one horizontal scroll well ──────── */}
      <div className="cf-body">
        <pre className="cf-pre" style={{ ['--cf-gutter' as string]: `${gutterCh}ch` }}>
          <code className="cf-code">
            {lines.map((line, i) => {
              const n = i + 1
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
                  <span className="cf-line-text">
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
