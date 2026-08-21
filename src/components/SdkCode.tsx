import { useRef } from 'react'
import { useCopy } from '../lib/use-copy'
import { useScrollWellTab } from '../lib/use-scroll-well'
import { CopyIcon } from './CopyRow'
import type { SdkCodeLanguage } from '../content/sdk'

/* ─── SDK code plate · code that is not YAML ────────────────────────────────
   YAML keeps the site-wide CodeFile surface and its derived minimap. SDK
   examples are TypeScript, shell or JSON, so they use this sibling plate:
   the same titlebar, copy grammar, scroll-well law and mono scale without
   asking the YAML tokenizer to pretend TypeScript is a workflow. */

export function SdkCode({
  code,
  language = 'text',
  filename,
}: {
  code: string
  language?: SdkCodeLanguage
  filename?: string
}) {
  const { copied, copy } = useCopy(code)
  const wellRef = useRef<HTMLPreElement>(null)
  useScrollWellTab(wellRef, filename ?? language)
  const lines = code.split('\n')

  return (
    <div className="sdk-code">
      <div className="sdk-code-head">
        <span className="sdk-code-lights" aria-hidden><i /><i /><i /></span>
        <span className="sdk-code-file">{filename ?? 'example'}</span>
        <span className="sdk-code-lang">{language}</span>
        <button
          type="button"
          className="sdk-code-copy"
          onClick={copy}
          data-copied={copied || undefined}
          aria-label={`Copy ${filename ?? language} code`}
        >
          <span role="status" className="sr-only">
            {copied ? 'Copied to clipboard' : ''}
          </span>
          <CopyIcon copied={copied} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre ref={wellRef} className="sdk-code-well" aria-label={`${language} example`}>
        <code>
          {lines.map((line, index) => (
            <span className="sdk-code-line" key={`${index}-${line}`}>
              <span className="sdk-code-number" aria-hidden>{String(index + 1).padStart(2, '0')}</span>
              <span className="sdk-code-source">{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
