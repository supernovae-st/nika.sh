import { TermFrame, type TermLine } from './TermFrame'
import { ENGINE_VERSION } from '../content'
import './term-frame.css'

/* ─── TermCapture · a terminal capture that carries its stamp (§2bis law 4) ──
   TermFrame + the visible provenance line: every capture rendered through
   THIS says which release printed it and what pins it. The transcripts are
   recorded at the DISPLAYED release (version.test.ts pins the surfaces to
   ENGINE_VERSION · the release cascade re-captures) — the stamp reads that
   one truth, never a hand-typed version. New captures are release-gated
   (Nika Lens L5); this component is the door they will all use. */

export function TermCapture({
  title,
  lines,
  command,
}: {
  title: string
  lines: TermLine[]
  /** the command that produced these bytes (rendered in the stamp) */
  command?: string
}) {
  return (
    <div className="tc-wrap">
      <TermFrame title={title} lines={lines} />
      <p className="tc-stamp">
        real output · nika {ENGINE_VERSION.replace(/^v/, '')}
        {command ? <> · {command}</> : null} · re-captured at every release
      </p>
    </div>
  )
}
