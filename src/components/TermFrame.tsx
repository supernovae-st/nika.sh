import { useRef } from 'react'
import { useScrollWellTab } from '../lib/use-scroll-well'
import './term-frame.css'

/* ─── TermFrame · the honest terminal window ──────────────────────────────────
   The DOM sibling of CodeFile for TERMINAL OUTPUT: same product-frame chrome
   (3 square ticks + a dim mono title), a dark body of typed lines. Every line
   shown through this frame is REAL captured output from the shipping binary —
   the component renders it verbatim; it must never be used to fabricate a
   transcript the binary doesn't print.

   Line kinds map to the CLI's own voice (one colour seam law):
     cmd   the prompt line (❯ dim + command in ink)
     ok    a ✔ verdict row (the CLI's green)
     soft  a ○/↳ advisory row (dim)
     out   plain program output (ink)
     dim   secondary narration (faint)
   SSR-static, zero measurement except the shared scroll-well tab law. */

export type TermLine = { kind: 'cmd' | 'ok' | 'warn' | 'soft' | 'out' | 'dim'; text: string }

export function TermFrame({ title, lines }: { title: string; lines: TermLine[] }) {
  const preRef = useRef<HTMLPreElement>(null)
  useScrollWellTab(preRef, lines)
  return (
    <div className="tf-panel">
      <div className="tf-chrome">
        <span className="tf-ticks" aria-hidden>
          <span className="tf-tick" />
          <span className="tf-tick" />
          <span className="tf-tick" />
        </span>
        <span className="tf-title">{title}</span>
      </div>
      <pre ref={preRef} className="tf-body" role="group" aria-label={title}>
        {lines.map((l, i) =>
          l.kind === 'cmd' ? (
            <span key={i} className="tf-line tf-line--cmd">
              <span className="tf-prompt" aria-hidden>
                ❯{' '}
              </span>
              {l.text}
            </span>
          ) : l.kind === 'ok' && l.text.trimStart().startsWith('✔') ? (
            /* presentation split only — the DOM text stays the verbatim line */
            <span key={i} className="tf-line tf-line--ok">
              {l.text.slice(0, l.text.indexOf('✔'))}
              <span className="tf-check">✔</span>
              {l.text.slice(l.text.indexOf('✔') + 1)}
            </span>
          ) : l.kind === 'warn' && l.text.includes('⚠') ? (
            <span key={i} className="tf-line tf-line--ok">
              {l.text.slice(0, l.text.indexOf('⚠'))}
              <span className="tf-warn">⚠</span>
              {l.text.slice(l.text.indexOf('⚠') + 1)}
            </span>
          ) : (
            <span key={i} className={`tf-line tf-line--${l.kind}`}>
              {l.text}
            </span>
          ),
        )}
      </pre>
    </div>
  )
}
