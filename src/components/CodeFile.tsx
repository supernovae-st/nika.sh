import { useMemo, useState } from 'react'
import { tokenize, verbGlyph, type Token, type TokenKind } from './codefile-highlight'
import '../shell/shell.css'

/* ─── CodeFile · static, monochrome, syntax-highlighted .nika.yaml panel ──────
   Design doc §4 (hero) + §5.1 (Living File). A pure, SERVER-RENDERED panel:
   real <pre>/<code> DOM text (NOT a CodeMirror editor) so the YAML lives in the
   prerendered HTML (SEO) and paints instantly. The interactive editor stays on
   /play only.

   Monochrome: keys = text-text · strings/values = text-dim · comments &
   punctuation = text-faint. The 4 Nika verbs get a small leading GLYPH
   (verbGlyph) — grayscale by default; the verb-hue "whisper" is reserved for
   the LIVE run, not this static panel (§3.4).

   Uses the v4 tokens (bg-bg-raised, border-line, text-*) so it adapts to the
   section theme (theme-dark / theme-light) automatically. SSR-safe: no window/
   document at render time; the copy handler reads navigator.clipboard inside
   the click callback only. */

export interface CodeFileProps {
  /** the raw YAML to render (also what the copy button copies, verbatim) */
  yaml: string
  /** optional inclusive 1-based line range to emphasize, e.g. [5, 9] */
  highlight?: [number, number]
  /** optional filename — renders a chrome bar above the code */
  filename?: string
  /** optional extra classes on the outer panel */
  className?: string
}

/* token kind → monochrome ink class (resolves per section theme via tokens) */
const KIND_CLASS: Record<TokenKind, string> = {
  comment: 'text-faint',
  key: 'text-text',
  verb: 'text-text',
  string: 'text-dim',
  number: 'text-dim',
  punct: 'text-faint',
  plain: 'text-dim',
}

function TokenSpan({ token }: { token: Token }) {
  if (token.kind === 'verb') {
    // verb keyword stays bright (text-text); the leading glyph reads CLEARLY
    // (text-dim, not faint) so the ◇▷◆✦ marks are legible — still grayscale.
    return (
      <span className="font-medium text-text">
        <span className="mr-1 text-dim select-none" aria-hidden>
          {verbGlyph(token.verb ?? token.text)}
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
  const [copied, setCopied] = useState(false)
  const copy = () => {
    // navigator is only touched inside the handler → SSR/prerender safe.
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy'}
      title="Copy"
      className="rounded-md p-1.5 text-faint transition-colors hover:text-text"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
    </button>
  )
}

export function CodeFile({ yaml, highlight, filename, className }: CodeFileProps) {
  const lines = useMemo(() => tokenize(yaml), [yaml])
  const [hStart, hEnd] = highlight ?? [0, -1]

  return (
    <div
      className={`overflow-hidden rounded-xl border border-line bg-bg-raised ${className ?? ''}`}
    >
      {filename ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
          <div className="mono flex items-center gap-2 text-[12px] text-dim">
            <span aria-hidden className="text-faint">
              ❯
            </span>
            <span>{filename}</span>
          </div>
          <CopyButton value={yaml} />
        </div>
      ) : null}

      <div className="relative">
        {filename ? null : (
          <div className="absolute top-2 right-2 z-10">
            <CopyButton value={yaml} />
          </div>
        )}
        <pre className="mono overflow-x-auto px-4 py-3 text-[12.5px] leading-[1.65] whitespace-pre">
          <code className="block">
            {lines.map((line, i) => {
              const n = i + 1
              const lit = n >= hStart && n <= hEnd
              return (
                <span
                  key={i}
                  className={`block min-h-[1.65em] ${lit ? 'v4code-lit' : ''}`}
                >
                  {line.tokens.length === 0 ? (
                    /* empty line · the zero-width filler is wrapped in an ELEMENT (not
                       a bare text node) so the line stays tall and hydrates cleanly. */
                    <span aria-hidden>{'​'}</span>
                  ) : (
                    line.tokens.map((t, j) => <TokenSpan key={j} token={t} />)
                  )}
                </span>
              )
            })}
          </code>
        </pre>
      </div>
    </div>
  )
}
