import { useRef, useState } from 'react'
import { DiagnosticList, type Finding } from '../components/Diagnostic'
import { SectionHead } from '../components/SectionHead'
import { useRevealOnce } from './use-reveal-once'
import {
  HERO_BROKEN_FILE,
  HERO_ENGINE,
  HERO_FINDINGS,
  HERO_FIXED_FILE,
  HERO_FIXED_VERDICT,
  HERO_REPAIRS,
} from '../content/hero-check.generated'
import './the-reading.css'

/* ─── 01 · THE READING · the H1's promise, kept in the next screen ────────────
   The hero says « Nika reads it back »; this is the reading, in full. An
   agent's draft of the same shape of file, two keystrokes early, and the three
   findings the binary emitted about it — one at a time, held still, each with
   a human caption OUTSIDE the code (the TypeScript-ladder form: reader-driven
   states, never a playback; tool output never animates, and a diagnostic is
   the most expensive object on the page to read).

   Every message is captured (hero-check.generated · drift-gated · re-proven
   against the binary), and the LAST stop is the engine's own repair:
   hero-check.test.ts proves the fixed twin IS `nika check --fix` applied to
   the broken one, byte for byte, so the diff shown is a fact about two served
   files. The counter says « two keystrokes · three findings » because the
   count of findings is NOT the count of mistakes, and a reader who is not
   told that counts their own errors instead of the checker's reach. */

/* one human caption per captured code — the reader's words, outside the code.
   Keyed by code and gated by the-reading.test.tsx: a re-captured corpus with
   an unmapped code goes red rather than rendering a caption-less stop. */
const CAPTIONS: Record<string, string> = {
  'NIKA-DAG-002':
    'the first keystroke: a reference to a task that does not exist, and the checker names what you meant',
  'NIKA-SEC-004':
    'the second keystroke, seen from the boundary: a tool the permits never granted',
  'NIKA-BUILTIN-001':
    'the same keystroke, seen from the catalog: no such builtin, and the fix is named',
}

/* the captured row, in the atom's shape — the source line rides the capture
   (never re-sliced from the byte span in JS: the two arithmetics disagree) */
const FINDINGS: Finding[] = HERO_FINDINGS.map((f) => ({
  code: f.code,
  gate: f.gate,
  severity: f.severity,
  message: f.message,
  docsUrl: f.docsUrl,
  line: f.line ?? undefined,
  col: f.col ?? undefined,
  source: f.sourceLine ?? undefined,
  task: f.task ?? undefined,
  filename: f.line != null ? 'pr-review.broken.nika.yaml' : undefined,
}))

const REPAIR_STOP = FINDINGS.length

export default function TheReading() {
  const rootRef = useRevealOnce<HTMLElement>()
  const [stop, setStop] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  /* the ladder is a tablist (the hero's FileTabs idiom): arrows walk the
     stops, Home/End jump, the panel is the one tabpanel. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = REPAIR_STOP
    let next: number
    if (e.key === 'ArrowRight') next = stop === last ? 0 : stop + 1
    else if (e.key === 'ArrowLeft') next = stop === 0 ? last : stop - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    setStop(next)
    refs.current[next]?.focus()
  }

  const finding = stop < REPAIR_STOP ? FINDINGS[stop] : null

  return (
    <section
      ref={rootRef}
      id="the-reading"
      aria-labelledby="the-reading-title"
      className="theme-dark v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <p className="v4beyebrow" data-rise>
          [ THE READING ]
        </p>
        <SectionHead fig="01" id="the-reading-title" title="The file, read back.">
          An agent&rsquo;s draft, two keystrokes early. Step through what the
          checker saw before a token was spent, then the repair: applied by the
          engine itself, not by hand.
        </SectionHead>

        {/* the counter · the law made visible: findings are not mistakes */}
        <p className="rd-counter" data-rise>
          two keystrokes · {FINDINGS.length} findings · zero tokens spent
        </p>

        <div className="rd" data-rise>
          {/* the ladder · one stop per finding + the repair */}
          <div className="rd-rail" role="tablist" aria-label="The findings, one at a time">
            {FINDINGS.map((f, i) => (
              <button
                key={`${f.code}-${i}`}
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`rd-stop-${i}`}
                aria-selected={stop === i}
                aria-controls="rd-panel"
                tabIndex={stop === i ? 0 : -1}
                className="rd-stop"
                data-sev={f.severity}
                onClick={() => setStop(i)}
                onKeyDown={onKeyDown}
              >
                <span className="rd-stop-glyph" aria-hidden>
                  ✖
                </span>
                {f.gate}
              </button>
            ))}
            <button
              type="button"
              role="tab"
              id={`rd-stop-${REPAIR_STOP}`}
              ref={(el) => {
                refs.current[REPAIR_STOP] = el
              }}
              aria-selected={stop === REPAIR_STOP}
              aria-controls="rd-panel"
              tabIndex={stop === REPAIR_STOP ? 0 : -1}
              className="rd-stop rd-stop--repair"
              onClick={() => setStop(REPAIR_STOP)}
              onKeyDown={onKeyDown}
            >
              <span className="rd-stop-glyph rd-stop-glyph--ok" aria-hidden>
                ✔
              </span>
              the repair
            </button>
          </div>

          {/* the panel · ONE finding held still, or the repair */}
          <div
            id="rd-panel"
            role="tabpanel"
            aria-labelledby={`rd-stop-${stop}`}
            className="rd-panel"
          >
            {finding ? (
              <>
                <DiagnosticList findings={[finding]} label="one finding" />
                {CAPTIONS[finding.code ?? ''] && (
                  <p className="rd-caption">{CAPTIONS[finding.code ?? '']}</p>
                )}
              </>
            ) : (
              <div className="rd-repair">
                {/* the engine's own fix · the diff is a captured fact about
                    two served files, and the pair law is byte-gated */}
                <p className="rd-repair-cmd">
                  <code>nika check --fix</code>
                  <span className="rd-repair-cmd-note">
                    applied exactly these lines, nothing else
                  </span>
                </p>
                {HERO_REPAIRS.map((r) => (
                  <div className="rd-diff" key={r.line}>
                    <pre className="rd-diff-row rd-diff-row--before">
                      <span className="rd-diff-ln" aria-hidden>
                        {r.line}
                      </span>
                      <span className="rd-diff-sign">-</span>
                      <span className="rd-diff-code">{r.before}</span>
                    </pre>
                    <pre className="rd-diff-row rd-diff-row--after">
                      <span className="rd-diff-ln" aria-hidden />
                      <span className="rd-diff-sign">+</span>
                      <span className="rd-diff-code">{r.after}</span>
                    </pre>
                  </div>
                ))}
                <p className="v4verdict rd-repair-verdict">
                  <span className="sr-only">nika check: </span>
                  <span className="v4verdict-tick" aria-hidden>
                    ✔
                  </span>
                  audited · {HERO_FIXED_VERDICT.tasks} tasks ·{' '}
                  {HERO_FIXED_VERDICT.waves} waves ·{' '}
                  {HERO_FIXED_VERDICT.permitsDeclared
                    ? 'permits declared'
                    : 'permits none'}
                  <span className="v4verdict-engine">nika {HERO_ENGINE}</span>
                </p>
                <p className="rd-twins">
                  both files are served, byte for byte:{' '}
                  <a href={HERO_BROKEN_FILE}>the draft</a> ·{' '}
                  <a href={HERO_FIXED_FILE}>the repair</a> · run the pair
                  yourself
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
