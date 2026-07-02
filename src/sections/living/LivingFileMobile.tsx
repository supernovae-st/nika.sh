import { useEffect, useRef } from 'react'
import { CodeFile } from '../../components/CodeFile'
import { type ShowcaseTask } from '../usecases-yaml.generated'
import { DAG, DENY_NODE, FILENAME, SEC_004, YAML } from './living-data'
import { runStateAt, CLI_GLYPH, type RunState } from './run-model'
import { buildMobilePlan, chipFor } from './mobile-model'
import './living-mobile.css'

/* ─── LivingFileMobile · the phone rendering of "The Living File" ─────────────
   On ≤768px the pinned scroll choreography (JS-pinned stage · 340vh track ·
   3D corridor) does not fit a phone — it rendered a 900px-wide stage into a
   390px viewport (the "black void" P0). This is the SAME story as a normal-flow
   vertical sequence instead:

     01 · WRITE   — the file card (the real CodeFile, permits lit)
     02 · THE PLAN — a vertical timeline: waves top→down, parallel tasks 2-up
                     with a "run together" caption, 1px vertical connectors
     03 · ENFORCE — the permits wall as a full-width card (the real SEC-004 row)
     04 · RESULT  — the verdict cards (within bounds ✓ · out of bounds ✗)

   No pinning, no scroll-scrub: plain scroll + in-view reveals (Intersection
   Observer, once per element; reduced-motion reveals everything immediately).
   The run data is the SAME deterministic run-model the desktop plays — the
   telemetry chips read runStateAt(DAG, 1); the mapping is mobile-model.ts
   (unit-tested). This component only mounts client-side (LivingFile.tsx swaps
   it in after a matchMedia check), so there is no SSR/hydration surface. */

const END_STATE: RunState = runStateAt(DAG, 1)
const DENIED_STATE: RunState = runStateAt(DAG, 1, { failAt: DENY_NODE, deny: SEC_004 })
const DENIED_CLI_ROW =
  DENIED_STATE.cli.find((l) => l.includes(SEC_004.code)) ??
  `${CLI_GLYPH.fail} ${DENY_NODE}   ${SEC_004.code}`
const PLAN = buildMobilePlan(DAG)

/* the verb → its canonical hue (the whisper on the lit node's tick) */
const VERB_VAR: Record<ShowcaseTask['verb'], string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/* reveal-once · every [data-mrv] descendant lights when it enters the viewport.
   Reduced-motion (or a missing observer) reveals everything immediately. */
function useRevealAll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const els = root.querySelectorAll<HTMLElement>('[data-mrv]')
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

/* one step of the plan · lights (border + ✓ + chip) as it enters the viewport */
function NodeCard({ task }: { task: ShowcaseTask }) {
  const chip = chipFor(END_STATE.nodes[task.id])
  return (
    <div
      className="lfm-node"
      data-mrv
      style={{ ['--lfm-vhue' as string]: VERB_VAR[task.verb] }}
    >
      <span className="lfm-node-mark" aria-hidden>
        {CLI_GLYPH.done}
      </span>
      <span className="lfm-node-id">{task.id}</span>
      <span className="lfm-node-verb">{task.verb}</span>
      <span className="lfm-node-gloss">{task.gloss}</span>
      {chip ? <span className="lfm-node-chip">{chip}</span> : null}
    </div>
  )
}

export default function LivingFileMobile() {
  const rootRef = useRevealAll<HTMLElement>()
  return (
    <section
      ref={rootRef}
      id="living-file"
      aria-labelledby="living-file-title"
      className="theme-dark lfm scroll-mt-24"
    >
      <div className="lfm-wrap">
        {/* ── header · the same register as the desktop stage ── */}
        <header className="lfm-head">
          <p className="lfm-fig">FIG 1.0 · THE RUN</p>
          <h2 id="living-file-title" className="lfm-title">
            The Living File
          </h2>
          <p className="lfm-lede">
            Not a black box. The agent writes the plan, you review it, the runtime{' '}
            <b>enforces</b> it. Then it runs.
          </p>
        </header>

        {/* ── 01 · WRITE — the file card ── */}
        <div className="lfm-beat" data-mrv>
          <p className="lfm-cap">
            <span className="lfm-cap-step" aria-hidden>
              01
            </span>
            write · the agent declares its plan
          </p>
          <CodeFile yaml={YAML} filename={FILENAME} highlight={[5, 8]} className="lfm-file" />
          <p className="lfm-note">
            <span className="lfm-note-key">permits:</span> everything it may touch, and
            nothing else. You review this before anything runs.
          </p>
        </div>

        {/* ── 02 · THE PLAN — the vertical timeline (waves top→down) ── */}
        <div className="lfm-beat">
          <p className="lfm-cap" data-mrv>
            <span className="lfm-cap-step" aria-hidden>
              02
            </span>
            the plan · {DAG.tasks.length} steps, top to bottom
          </p>
          <ol className="lfm-plan">
            {PLAN.map((wave) => (
              <li className="lfm-wave" key={wave.wave} data-parallel={wave.parallel}>
                {wave.parallel ? (
                  <p className="lfm-wave-cap">run together ×{wave.tasks.length}</p>
                ) : null}
                {wave.rows.map((row, i) => (
                  <div className={`lfm-row${row.length > 1 ? ' lfm-row--2up' : ''}`} key={i}>
                    {row.map((task) => (
                      <NodeCard task={task} key={task.id} />
                    ))}
                  </div>
                ))}
              </li>
            ))}
          </ol>
        </div>

        {/* ── 03 · ENFORCE — the permits wall (full-width card) ── */}
        <div className="lfm-beat" data-mrv>
          <p className="lfm-cap">
            <span className="lfm-cap-step" aria-hidden>
              03
            </span>
            enforce · the permits wall
          </p>
          <div className="lfm-wall" role="note" aria-label="Permits enforcement">
            <pre className="lfm-wall-row" aria-label="A denied action">
              <span className="lfm-wall-glyph" aria-hidden>
                {CLI_GLYPH.fail}
              </span>
              {DENIED_CLI_ROW.replace(new RegExp(`^${CLI_GLYPH.fail}\\s*`), '')}
            </pre>
            <p className="lfm-wall-note">
              A write outside <span className="lfm-note-key">permits:</span> is blocked
              before it runs, not logged after the fact. The boundary is the seatbelt,
              checked on every action.
            </p>
          </div>
        </div>

        {/* ── 04 · THE RESULT — the verdict cards ── */}
        <div className="lfm-beat" data-mrv>
          <p className="lfm-cap">
            <span className="lfm-cap-step" aria-hidden>
              04
            </span>
            the result · the seatbelt held
          </p>
          <div className="lfm-verdict">
            <div className="lfm-verdict-card lfm-verdict-card--ok">
              <span className="lfm-verdict-glyph" aria-hidden>
                {CLI_GLYPH.done}
              </span>
              <p className="lfm-verdict-h">Ran within the permits</p>
              <p className="lfm-verdict-sub">
                exit {END_STATE.exitCode ?? 0} · wrote brief.md · every effect logged.
                The whole run replays from the trace.
              </p>
            </div>
            <div className="lfm-verdict-card lfm-verdict-card--deny">
              <span className="lfm-verdict-glyph lfm-verdict-glyph--deny" aria-hidden>
                {CLI_GLYPH.fail}
              </span>
              <p className="lfm-verdict-h">Out of bounds: denied</p>
              <p className="lfm-verdict-sub">
                a write outside <span className="lfm-note-key">permits:</span> is blocked
                before it runs · <span className="lfm-verdict-code">{SEC_004.code}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
