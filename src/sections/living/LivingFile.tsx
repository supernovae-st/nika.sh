import { useEffect, useMemo, useRef, useState } from 'react'
import { CodeFile } from '../../components/CodeFile'
import { useAuroraPulse } from '../../fx/aurora-context'
import { SHOWCASE_DAG, SHOWCASE_YAML, type ShowcaseTask } from '../usecases-yaml.generated'
import { runStateAt, CLI_GLYPH, type RunState, type TaskStatus } from './run-model'
import Corridor from './Corridor'
import './living.css'
import './corridor.css'

/* ─── The Living File · the CONTROL centerpiece (plan §4 · FIG 1.0) ────────────
   A theme-dark sticky-scroll section: a tall outer track with a sticky,
   viewport-height inner STAGE driven by the section's OWN scroll progress
   t ∈ [0,1] — computed from getBoundingClientRect in a rAF loop.

   The narrative is CONTROL, in four beats:
     1 · WRITE   — the agent emits its plan as a file (the YAML). "What it intends."
     2 · REVIEW  — the human-readable plan + the `permits:` block lit up: everything
                   it's allowed to touch, and nothing else. A human gate.
     3 · ENFORCE — the runtime checks every action against `permits`. An out-of-bounds
                   write is DENIED (`NIKA-SEC-004`) — the seatbelt, made visible.
     4 · RUN     — it executes WITHIN bounds; the CLI / NDJSON stream is the audit
                   trail (replayable).

   One `runStateAt(dag, t)` per frame is the SINGLE SOURCE OF TRUTH for the happy
   (within-bounds) path: it drives the 2D DAG / 3D corridor, the live CLI/NDJSON
   stream AND the outputs. A SECOND, scroll-independent `DENIED` state surfaces the
   enforced-denial row in the ENFORCE callout (a real `✗ NIKA-SEC-004` line).

   Fil-rouge = `t3-resume-screener` — the only projected showcase with a real
   `permits:` block (a LOCAL model screens CVs · no `net:` at all · PII cannot
   leave the machine even if a CV hijacks the model). Its richer 8-wave DAG makes
   a deeper corridor.

   SSR / no-JS / reduced-motion: the stage renders a sensible STATIC end-state
   (the fully-executed within-bounds run · full log + outputs) so the section is
   coherent with zero scroll animation. The rAF scroll-scrub + 3D corridor are
   prefers-reduced-motion: no-preference enhancements added on mount. */

const DAG = SHOWCASE_DAG['t3-resume-screener']
const YAML = SHOWCASE_YAML['t3-resume-screener']
const FILENAME = 'screen-cvs.nika.yaml'
/** the static frame used for SSR / no-JS / reduced-motion (fully executed). */
const END_STATE: RunState = runStateAt(DAG, 1)

/* ── the ENFORCE beat · a real `permits:`-boundary denial ─────────────────────
   The runtime checks every effect against the declared `permits:`. We model an
   out-of-bounds WRITE on the terminal `save` node: it tries to write outside the
   declared paths → the engine DENIES it with `NIKA-SEC-004` (effect outside the
   permits capability boundary). Real catalog row (public/errors/catalog.json).
   This is scroll-INDEPENDENT — it's the "what the seatbelt does" proof, shown as
   a fixed callout, while the main timeline stays the happy within-bounds run. */
const DENY_NODE = 'save'
const SEC_004 = {
  code: 'NIKA-SEC-004',
  category: 'security_error',
  transient: false,
  message: 'effect outside the declared permits: capability boundary (fs/net/exec/tool)',
} as const
const DENIED_STATE: RunState = runStateAt(DAG, 1, { failAt: DENY_NODE, deny: SEC_004 })
/** the single pretty-CLI row that shows the denied write (✗ <id> NIKA-SEC-004). */
const DENIED_CLI_ROW =
  DENIED_STATE.cli.find((l) => l.includes(SEC_004.code)) ??
  `${CLI_GLYPH.fail} ${DENY_NODE}   ${SEC_004.code}`

/* ── beat boundaries on the master t-timeline ──────────────────────────────────
   file (write) → morph → DAG (comprehend · the flat plan · parallel waves) →
   corridor (run · the flat DAG tilts into depth and executes). Splitting the old
   single "run" half into a COMPREHENSION beat (2D DAG) THEN the immersive run is
   the design-doc ③→④ order — you understand the plan's shape before you fly it. */
const T_FILE_END = 0.18 // file → morph
const T_MORPH_END = 0.3 // morph → DAG (the plan has landed as a graph)
const T_TILT_START = 0.44 // the DAG stays FLAT (comprehend) until here, then tips
const T_DAG_END = 0.54 // DAG → corridor (the tilt completes, the run begins)
const T_RUN_END = 0.85 // corridor run → the verdict (the result + enforce payoff)

/** map the master t (0..1) onto the EXECUTION sub-progress (0..1 across the run).
    The run executes during the CORRIDOR phase, completing by the verdict beat. */
function runProgress(t: number): number {
  if (t <= T_DAG_END) return 0
  return Math.min(1, (t - T_DAG_END) / (T_RUN_END - T_DAG_END))
}

/** how "detached from the file → landed as a graph" the morph is (0..1). */
function morphProgress(t: number): number {
  if (t <= T_FILE_END) return 0
  if (t >= T_MORPH_END) return 1
  return (t - T_FILE_END) / (T_MORPH_END - T_FILE_END)
}

/** how tilted from the flat 2D DAG (0) into the 3D corridor (1) — drives the
    signature "the plan tips into depth" transition between the two layers. */
function tiltProgress(t: number): number {
  if (t <= T_TILT_START) return 0
  if (t >= T_DAG_END) return 1
  return (t - T_TILT_START) / (T_DAG_END - T_TILT_START)
}

/* ── 2D DAG layout · column = wave · row = index within wave (RunSim's math) ── */
const NODE_W = 116
const NODE_H = 34
const COL_W = 150
const ROW_H = 50
const PAD_X = 14
const PAD_Y = 14

interface Pt {
  x: number
  y: number
}

interface Layout {
  width: number
  height: number
  at: Record<string, Pt>
  byWave: ShowcaseTask[][]
}

function computeLayout(): Layout {
  const byWave: ShowcaseTask[][] = Array.from({ length: DAG.waves }, () => [])
  for (const task of DAG.tasks) byWave[task.wave].push(task)
  for (const col of byWave) col.sort((a, b) => a.line0 - b.line0 || (a.id < b.id ? -1 : 1))
  const maxRows = Math.max(...byWave.map((w) => w.length))
  const width = PAD_X * 2 + DAG.waves * COL_W - (COL_W - NODE_W)
  const height = PAD_Y * 2 + maxRows * ROW_H - (ROW_H - NODE_H)
  const at: Record<string, Pt> = {}
  for (const task of DAG.tasks) {
    const col = byWave[task.wave]
    const idx = col.indexOf(task)
    const colH = col.length * ROW_H - (ROW_H - NODE_H)
    at[task.id] = {
      x: PAD_X + task.wave * COL_W,
      y: PAD_Y + (height - PAD_Y * 2 - colH) / 2 + idx * ROW_H,
    }
  }
  return { width, height, at, byWave }
}

const LAYOUT = computeLayout()

/* the verb → CSS var(); a whisper of the verb hue only while the node is
   `running` (diegetic · design doc §3.3). Everything else is grayscale ink. */
const VERB_VAR: Record<ShowcaseTask['verb'], string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/** a status → a stable, compositor-cheap CSS class on the node group. */
function nodeClass(status: TaskStatus): string {
  return `lf-node lf-node--${status}`
}

/* ── the 2D DAG (SVG) ──────────────────────────────────────────────────────── */
function Dag({ run, morph }: { run: RunState; morph: number }) {
  const { width, height, at } = LAYOUT
  return (
    <svg
      className="lf-dag"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Workflow DAG · columns are parallel waves · nodes light as the run reaches them"
      style={{ ['--lf-morph' as string]: morph }}
    >
      {/* edges first (under nodes) · flow when the source completes */}
      {DAG.tasks.flatMap((task) =>
        task.deps.map((dep) => {
          const a = at[dep]
          const b = at[task.id]
          if (!a || !b) return null
          const x1 = a.x + NODE_W
          const y1 = a.y + NODE_H / 2
          const x2 = b.x
          const y2 = b.y + NODE_H / 2
          const flowing =
            run.nodes[dep]?.status === 'success' && run.nodes[task.id]?.status !== 'pending'
          return (
            <path
              key={`${dep}->${task.id}`}
              className={`lf-edge ${flowing ? 'lf-edge--flow' : ''}`}
              d={`M ${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}`}
              fill="none"
            />
          )
        }),
      )}

      {/* nodes */}
      {DAG.tasks.map((task) => {
        const p = at[task.id]
        const node = run.nodes[task.id]
        const status = node?.status ?? 'pending'
        const running = status === 'running'
        const hue = running ? VERB_VAR[task.verb] : undefined
        const mark =
          status === 'success'
            ? CLI_GLYPH.done
            : status === 'failure'
              ? CLI_GLYPH.fail
              : status === 'cancelled' || status === 'skipped'
                ? CLI_GLYPH.cancel
                : ''
        // fan-out tasks (cvs ≤8 · screened ≤2) spawn many in parallel — show the
        // parallelism as a ghost stack behind the node + a ×N tally.
        const fanFlag = task.flags.find((f) => f.startsWith('fan-out'))
        const fanN = fanFlag?.match(/(\d+)/)?.[1]
        return (
          <g
            key={task.id}
            className={nodeClass(status)}
            style={{
              ['--lf-vhue' as string]: VERB_VAR[task.verb],
              ...(hue ? { ['--lf-hue' as string]: hue } : {}),
            }}
          >
            <title>{`${task.id} · ${task.gloss}`}</title>
            {fanN ? (
              <>
                <rect className="lf-node-stack" x={p.x + 5} y={p.y - 5} width={NODE_W} height={NODE_H} rx={9} />
                <rect className="lf-node-stack" x={p.x + 2.5} y={p.y - 2.5} width={NODE_W} height={NODE_H} rx={9} />
              </>
            ) : null}
            <rect className="lf-node-box" x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={9} />
            <circle className="lf-node-dot" cx={p.x + 13} cy={p.y + NODE_H / 2} r={3.2} />
            <text className="lf-node-id" x={p.x + 24} y={p.y + NODE_H / 2 + 3.5}>
              {task.id}
            </text>
            <text className="lf-node-verb" x={p.x + NODE_W - 12} y={p.y + NODE_H / 2 + 3.5} textAnchor="end">
              {mark || task.verb}
            </text>
            {fanN ? (
              <text className="lf-node-fan" x={p.x + NODE_W - 12} y={p.y - 7} textAnchor="end" aria-hidden>
                ×{fanN}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

/* ── the screen-reader run summary · the corridor's accessible equivalent ─────
   The 3D corridor is an aria-hidden decorative visual, and the role="img" <Dag>
   only renders in the 2D fallback — so corridor users would get NO textual
   equivalent of the workflow. This renders the ordered plan (wave order ==
   topological order) as a real, always-present sr-only list: each step's id,
   verb and gloss, plus the permits/enforce note. It is NOT either/or with the
   corridor — both ship together, so SR users always have the run described. */
const ORDERED_TASKS = [...DAG.tasks].sort(
  (a, b) => a.wave - b.wave || a.line0 - b.line0 || (a.id < b.id ? -1 : 1),
)

function RunSummarySR() {
  return (
    <div className="sr-only">
      <h3>Workflow run · {FILENAME}</h3>
      <p>
        The plan runs {DAG.tasks.length} steps across {DAG.waves} parallel waves.
        Steps in the same wave run in parallel; each step’s verb is its execution
        model (infer · exec · invoke · agent).
      </p>
      <ol>
        {ORDERED_TASKS.map((task) => (
          <li key={task.id}>
            {task.id} — {task.verb}: {task.gloss}
            {task.deps.length > 0 ? ` (after ${task.deps.join(', ')})` : ''}
          </li>
        ))}
      </ol>
      <p>
        It declares a <code>permits:</code> block: a local model with no network
        access at all, so the CVs cannot leave this machine even if one hijacks
        the model. The runtime enforces those permits on every action — an effect
        outside the declared boundary is denied with {SEC_004.code} before it
        runs, not logged after the fact.
      </p>
    </div>
  )
}

/* ── the live event stream · pretty CLI ↔ raw NDJSON (design doc §5.4) ───────── */
type StreamMode = 'cli' | 'ndjson'

/** classify a pretty CLI row so we can tint only the active (running) row. */
function cliRowKind(line: string): { running: boolean; done: boolean; fail: boolean; rule: boolean } {
  return {
    running: line.startsWith(CLI_GLYPH.run),
    done: line.startsWith(CLI_GLYPH.done),
    fail: line.startsWith(CLI_GLYPH.fail) || line.startsWith(CLI_GLYPH.cancel),
    rule: line.startsWith('──') || line.startsWith('exit '),
  }
}

/** which task a running CLI row belongs to (so we can pick its verb hue). */
function runningRowVerb(line: string, run: RunState): string | undefined {
  // a running row is "▶ <id>  <verb>  → <target>"; find the matching running task
  for (const task of DAG.tasks) {
    if (run.nodes[task.id]?.status !== 'running') continue
    if (line.includes(` ${task.id} `) || line.includes(`${CLI_GLYPH.run} ${task.id}`)) {
      return VERB_VAR[task.verb]
    }
  }
  return undefined
}

function Stream({ run, mode }: { run: RunState; mode: StreamMode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // keep the latest line in view as the log grows (the terminal-tail feel)
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  if (mode === 'ndjson') {
    return (
      <div className="lf-stream-scroll" ref={scrollRef}>
        <pre className="lf-ndjson" aria-label="Raw NDJSON event stream">
          {run.events.length === 0 ? (
            <span className="lf-ndjson-idle">{'// nika run --events ndjson · waiting for the run…'}</span>
          ) : (
            run.events.map((e) => (
              <span className="lf-ndjson-line" key={e.id}>
                {JSON.stringify({ kind: e.kind, task_id: e.payload.task_id, timestamp_ms: e.timestamp_ms })}
              </span>
            ))
          )}
        </pre>
      </div>
    )
  }

  return (
    <div className="lf-stream-scroll" ref={scrollRef}>
      <pre className="lf-cli" aria-label="nika run · live output">
        {run.cli.length === 0 ? (
          <span className="lf-cli-idle">{`❯ nika run ${FILENAME}`}</span>
        ) : (
          run.cli.map((line, i) => {
            const k = cliRowKind(line)
            const hue = k.running ? runningRowVerb(line, run) : undefined
            const cls = k.running
              ? 'lf-cli-row lf-cli-row--running'
              : k.done
                ? 'lf-cli-row lf-cli-row--done'
                : k.fail
                  ? 'lf-cli-row lf-cli-row--fail'
                  : k.rule
                    ? 'lf-cli-row lf-cli-row--rule'
                    : 'lf-cli-row lf-cli-row--sub'
            return (
              <span className={cls} key={i} style={hue ? { color: hue } : undefined}>
                {line}
              </span>
            )
          })
        )}
      </pre>
    </div>
  )
}

/* ── the outputs panel · the outputs object + exit code (design doc §5.4e) ───── */
function Outputs({ run }: { run: RunState }) {
  const done = run.exitCode !== null
  const failed = run.exitCode !== null && run.exitCode !== 0
  return (
    <div className="lf-outputs" data-state={!done ? 'pending' : failed ? 'fail' : 'ok'}>
      <p className="lf-panel-cap">
        <span aria-hidden>FIG 1.3</span>
        <span aria-hidden className="lf-cap-dash">
          —
        </span>
        outputs <span className="lf-cap-mono">(stdout)</span>
      </p>
      {!done ? (
        <p className="lf-outputs-pending mono">…the run is still in flight</p>
      ) : (
        <>
          <pre className="lf-outputs-json">
            {run.outputs
              ? JSON.stringify(run.outputs, null, 2)
              : '{ "error": "run did not complete" }'}
          </pre>
          <p className="lf-exit mono" data-fail={failed}>
            <span aria-hidden>{failed ? CLI_GLYPH.fail : CLI_GLYPH.done}</span> exit {run.exitCode}
          </p>
        </>
      )}
    </div>
  )
}

/* ── the ENFORCE callout · the seatbelt, made visible (plan §4 · FIG 1.0 beat 3)
   A small fixed panel that shows what the runtime does when an action steps
   OUTSIDE the declared `permits:`: it is DENIED with `NIKA-SEC-004` — not logged
   after the fact, blocked before it happens. The denied row is a REAL pretty-CLI
   line from a `failAt`+`deny` run (DENIED_STATE), so the code + format are the
   engine's, not decoration. Out of bounds = denied. */
function EnforceCallout() {
  return (
    <div className="lf-enforce" role="note" aria-label="Permits enforcement">
      <p className="lf-panel-cap">
        <span aria-hidden>FIG 1.3</span>
        <span aria-hidden className="lf-cap-dash">
          —
        </span>
        enforce — out of bounds
        <span className="lf-enforce-cap-deny" aria-hidden>
          denied
        </span>
      </p>
      {/* the denied write, as the engine prints it (✗ <id>  NIKA-SEC-004) */}
      <pre className="lf-enforce-row mono" aria-label="A denied action — NIKA-SEC-004">
        <span className="lf-enforce-glyph" aria-hidden>
          {CLI_GLYPH.fail}
        </span>
        {DENIED_CLI_ROW.replace(new RegExp(`^${CLI_GLYPH.fail}\\s*`), '')}
      </pre>
      <p className="lf-enforce-note">
        tried to write outside <span className="lf-enforce-key">permits:</span> →{' '}
        denied. The boundary is the seatbelt — checked on every action, before it
        runs.
      </p>
    </div>
  )
}

/* The comprehension layer IS the real 2D <Dag> now (nodes + dependency edges,
   rendered big over the tunnel at the `dag` + `run` beats). The old numbered
   plain-words PlanFlow was dropped — a row of cards is not a DAG. */

/* ── the verdict · the control narrative's PUNCHLINE (its own beat) ───────────
   After the corridor flies the run, the payoff lands as one clear contrast: it
   ran WITHIN the permits (exit 0 · the brief written · replayable), AND a write
   OUT of bounds would be denied before it runs (NIKA-SEC-004). The seatbelt, made
   explicit — not buried in a log. */
function VerdictBeat({ run }: { run: RunState }) {
  const code = run.exitCode ?? 0
  return (
    <div className="lf-verdict">
      <p className="lf-verdict-cap mono" aria-hidden>
        FIG 1.4 <span className="lf-cap-dash">—</span> the result · the seatbelt held
      </p>
      <div className="lf-verdict-grid">
        <div className="lf-verdict-card lf-verdict-card--ok">
          <span className="lf-verdict-glyph" aria-hidden>
            {CLI_GLYPH.done}
          </span>
          <p className="lf-verdict-h">Ran within the permits</p>
          <p className="lf-verdict-sub">
            exit {code} · wrote the shortlist brief · every effect logged — the
            whole run replays from the trace.
          </p>
        </div>
        <div className="lf-verdict-card lf-verdict-card--deny">
          <span className="lf-verdict-glyph lf-verdict-glyph--deny" aria-hidden>
            {CLI_GLYPH.fail}
          </span>
          <p className="lf-verdict-h">Out of bounds → denied</p>
          <p className="lf-verdict-sub">
            a write outside <span className="lf-verdict-key">permits:</span> is blocked
            before it runs — <span className="lf-verdict-code">NIKA-SEC-004</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── beat caption · the one-line "where you are" register (the control beats) */
function beatLabel(t: number): { fig: string; title: string } {
  if (t < T_FILE_END) return { fig: 'FIG 1.0', title: 'Write — the agent declares its plan' }
  if (t < T_MORPH_END) return { fig: 'FIG 1.1', title: 'Review — what it’s allowed to touch' }
  if (t < T_DAG_END) return { fig: 'FIG 1.2', title: 'The plan — the pipeline, step by step' }
  if (t < T_RUN_END) return { fig: 'FIG 1.3', title: 'Run — within the permits' }
  return { fig: 'FIG 1.4', title: 'The result — within bounds, enforced' }
}

export default function LivingFile() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pulse = useAuroraPulse()

  /* The run state that drives EVERYTHING. Initialised to the END state so the
     prerendered / no-JS / reduced-motion DOM is the coherent fully-executed
     frame (full log + outputs). On mount (motion allowed) we reset to t=0 and
     follow the section's scroll. */
  const [run, setRun] = useState<RunState>(END_STATE)
  const [t, setT] = useState(1)
  const [mode, setMode] = useState<StreamMode>('cli')
  /* false until the rAF scroll-scrub takes over (motion allowed) → gates the tall
     track + absolute pin. Default false keeps the SSR / no-JS / reduced-motion
     frame a normal in-flow full section showing the static end-state. */
  const [scrub, setScrub] = useState(false)
  /* the CSS-3D depth corridor (Pass 2). Default false → SSR / no-JS /
     reduced-motion / low-end render the flat 2D <Dag> (the fallback). Flipped
     true on mount, only when motion is allowed AND the device isn't coarse +
     narrow (a cheap low-end heuristic), so the corridor stays an enhancement. */
  const [corridor3d, setCorridor3d] = useState(false)
  /* dev/test only · ?lf=<t> freezes a beat as a fixed full-viewport overlay so a
     headless capture (which can't scroll) can see any scroll state. */
  const [frozen, setFrozen] = useState(false)

  /* refs the rAF loop reads/writes WITHOUT re-rendering every frame. We only
     setState (re-render) when the DISCRETIZED state actually changes — the
     run-state "signature" (status set + revealed-line count) or a coarse t step
     for the beat transitions. This keeps React churn low while staying smooth. */
  const sigRef = useRef<string>('')
  const tStepRef = useRef(-1)
  const completedRef = useRef<Set<string>>(new Set(DAG.tasks.map((x) => x.id))) // end-state: all done

  useEffect(() => {
    if (typeof window === 'undefined') return
    // dev/test freeze · ?lf=<0..1> renders a FIXED beat (a headless capture of a
    // scroll state, the way ?it=N freezes the intro). When present we set the
    // frozen run + corridor, scroll it into view, and skip the scrub entirely.
    // No effect on normal visits (param absent). */
    const lfParam = new URLSearchParams(window.location.search).get('lf')
    if (lfParam !== null) {
      const v = Math.min(1, Math.max(0, parseFloat(lfParam) || 0))
      // defer the state set off the effect body (cascading-render lint + the
      // codebase's own mount pattern) — set the frozen beat on the next frame.
      const fr = requestAnimationFrame(() => {
        setCorridor3d(true)
        setFrozen(true)
        setRun(runStateAt(DAG, runProgress(v)))
        setT(v)
      })
      return () => cancelAnimationFrame(fr)
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return // keep the static end-state frame · no scrub

    // a cheap low-end gate for the 3D corridor: a coarse pointer on a narrow
    // viewport (phones) keeps the clean 2D DAG (the fallback). The scroll-scrub
    // run still plays; only the depth corridor is withheld (design doc §5.3 perf
    // tier). Everything else (fine pointer / wide viewport) gets the corridor.
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const enable3d = !(coarse && window.innerWidth < 640)

    // motion allowed → take over from the static end-state. The reset (start the
    // run at the top) happens INSIDE the first rAF tick, not synchronously in the
    // effect body, so it never triggers a cascading render at mount.
    let raf = 0
    let primed = false
    const tick = () => {
      if (!primed) {
        primed = true
        completedRef.current = new Set()
        sigRef.current = ''
        tStepRef.current = -1
        // enable the tall track + absolute pin · done in the first rAF tick (not
        // synchronously in the effect body) so it never cascades a render at mount
        setScrub(true)
        if (enable3d) setCorridor3d(true)
      }
      const track = trackRef.current
      const stage = stageRef.current
      if (track && stage) {
        const rect = track.getBoundingClientRect()
        const vh = window.innerHeight
        // progress = how far the stage has travelled through the track.
        // 0 when the track top hits the viewport top; 1 when its bottom is one
        // viewport-height from the top (the stage's full travel).
        const travel = rect.height - vh
        const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0

        // PIN the stage ourselves (CSS position:sticky is dead here because an
        // ancestor — body — has overflow-x:hidden, which silently turns it into a
        // scroll container and disables sticky for descendants). We translate the
        // absolutely-positioned stage so it tracks the viewport across the track's
        // travel, then releases at the ends. transform-only → stays compositor-cheap.
        const pinned = Math.min(Math.max(-rect.top, 0), travel)
        stage.style.transform = `translate3d(0, ${pinned}px, 0)`

        // coarse t step (1/120) gates beat-caption + progress re-renders
        const step = Math.round(p * 120)
        // the run EXECUTES during the corridor phase (runProgress) — so the flat
        // DAG comprehension beat shows the plan STRUCTURE (all pending) and the
        // corridor camera (also runP-driven) stays in sync with the execution.
        const next = runStateAt(DAG, runProgress(p))

        // signature = status of every node + revealed line count. Cheap to diff.
        let sig = `${next.cli.length}|`
        for (const task of DAG.tasks) sig += next.nodes[task.id].status[0]

        if (sig !== sigRef.current || step !== tStepRef.current) {
          // newly-completed nodes → beat the drum (the aurora pulse)
          for (const task of DAG.tasks) {
            const st = next.nodes[task.id].status
            if ((st === 'success' || st === 'failure') && !completedRef.current.has(task.id)) {
              completedRef.current.add(task.id)
              pulse()
            }
          }
          sigRef.current = sig
          tStepRef.current = step
          setRun(next)
          setT(p)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pulse])

  const morph = useMemo(() => morphProgress(t), [t])
  const runP = useMemo(() => runProgress(t), [t])
  const tilt = useMemo(() => tiltProgress(t), [t])
  const beat = beatLabel(t)
  /* which beat owns the stage (drives the CSS cross-fades): file → morph → dag
     (the flat plan · comprehension) → run (the corridor · the flat plan tilts
     into depth and executes). */
  const stageBeat =
    t < T_FILE_END
      ? 'file'
      : t < T_MORPH_END
        ? 'morph'
        : t < T_DAG_END
          ? 'dag'
          : t < T_RUN_END
            ? 'run'
            : 'verdict'

  return (
    <section
      id="living-file"
      aria-labelledby="living-file-title"
      className="theme-dark lf-section scroll-mt-24"
      data-scrub={scrub}
      data-frozen={frozen || undefined}
    >
      {/* the tall scroll track — its height defines the scrub distance */}
      <div ref={trackRef} className="lf-track">
        {/* the viewport-height stage · JS-pinned (see the rAF loop) because CSS
            position:sticky is disabled by the body's overflow-x:hidden ancestor */}
        <div ref={stageRef} className="lf-stage" data-beat={stageBeat}>
          {/* ── header · the FIG register + the section title ── */}
          <div className="lf-head">
            <p className="lf-head-fig mono">
              <span aria-hidden>{beat.fig}</span>
              <span aria-hidden className="lf-cap-dash">
                —
              </span>
              <span className="lf-head-step" aria-live="polite">
                {beat.title}
              </span>
            </p>
            <h2 id="living-file-title" className="lf-title">
              The Living File
            </h2>
            <p className="lf-lede">
              Not a black box. The agent writes the plan — you review it — the
              runtime <span className="lf-em">enforces</span> it — then it runs.
            </p>
            {/* a dimension line · the blueprint HUD register (decorative) */}
            <svg className="lf-dim" width="180" height="12" viewBox="0 0 180 12" fill="none" aria-hidden>
              <path d="M2 2v8M178 2v8M2 6h176" stroke="currentColor" strokeWidth="1" />
              <path d="M2 6l6-2.6M2 6l6 2.6M178 6l-6-2.6M178 6l-6 2.6" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>

          {/* ── the stage body · the file, the graph, the run surfaces ── */}
          <div className="lf-body">
            {/* BEAT 1 · WRITE · the agent's plan, as a file (the permits: block
                lit — what it's allowed to touch, and nothing else). */}
            <div className="lf-file" aria-hidden={stageBeat !== 'file'}>
              <p className="lf-panel-cap">
                <span aria-hidden>FIG 1.0</span>
                <span aria-hidden className="lf-cap-dash">
                  —
                </span>
                write — the plan, before it acts
              </p>
              <CodeFile filename={FILENAME} yaml={YAML} highlight={[7, 11]} />
              {/* the REVIEW gloss · the permits: block is the star (plan §4 FIG 1.0) */}
              <p className="lf-file-note mono">
                <span aria-hidden className="lf-file-note-mark">
                  permits:
                </span>{' '}
                a LOCAL model · <b>no </b>
                <span className="lf-file-note-key">net:</span>
                <b> at all</b> — the CVs cannot leave this machine, even if one
                hijacks the model.
              </p>
            </div>

            {/* BEAT 2+3 · the graph + (during execution) the stream & outputs.
                In 3D-corridor mode the graph is the MAIN stage and the stream
                becomes a right rail; the flat <Dag> stays the fallback. */}
            <div
              className="lf-run"
              data-corridor={corridor3d}
              style={{ ['--lf-tilt' as string]: tilt }}
            >
              <div className="lf-graph">
                <p className="lf-panel-cap">
                  <span aria-hidden>FIG 1.1</span>
                  <span aria-hidden className="lf-cap-dash">
                    —
                  </span>
                  {corridor3d ? 'the plan, in depth — every step legible' : 'the plan · columns are parallel waves'}
                </p>
                {corridor3d ? (
                  <>
                    {/* the corridor is an aria-hidden visual · this sr-only
                        summary is its textual equivalent (always alongside it) */}
                    <RunSummarySR />
                    {/* the COMPREHENSION layer · the FLAT 2D DAG (columns are
                        parallel waves · arrows are dependencies). You read the
                        plan's shape here; then it tilts back into depth (--lf-tilt)
                        as the corridor takes over — the design-doc ③→④ handoff. */}
                    <div className="lf-dag-layer">
                      <div className="lf-dag-wrap lf-dag-wrap--stage">
                        <Dag run={run} morph={morph} />
                      </div>
                      <p className="lf-dag-hint mono" aria-hidden>
                        nodes are tasks · arrows are dependencies · the run lights them as it reaches them
                      </p>
                    </div>
                    {/* the immersive run · the 3D corridor the plan flies through */}
                    <div className="lf-corridor-layer">
                      <Corridor dag={DAG} run={run} runP={runP} />
                    </div>
                    {/* the verdict · the result + the seatbelt, the payoff beat */}
                    <div className="lf-verdict-layer">
                      <VerdictBeat run={run} />
                    </div>
                  </>
                ) : (
                  <div className="lf-dag-wrap">
                    <Dag run={run} morph={morph} />
                  </div>
                )}
              </div>

              {/* the observability column · live stream + outputs (execution beat) */}
              <div className="lf-obs">
                <div className="lf-stream">
                  <div className="lf-stream-head">
                    <p className="lf-panel-cap lf-panel-cap--inline">
                      <span aria-hidden>FIG 1.2</span>
                      <span aria-hidden className="lf-cap-dash">
                        —
                      </span>
                      run — the audit trail (replayable)
                    </p>
                    {/* the CLI ↔ NDJSON toggle (the detail that proves a real engine) */}
                    <div className="lf-toggle" role="group" aria-label="Event stream format">
                      <button
                        type="button"
                        className="lf-toggle-btn"
                        aria-pressed={mode === 'cli'}
                        onClick={() => setMode('cli')}
                      >
                        pretty
                      </button>
                      <button
                        type="button"
                        className="lf-toggle-btn"
                        aria-pressed={mode === 'ndjson'}
                        onClick={() => setMode('ndjson')}
                      >
                        NDJSON
                      </button>
                    </div>
                  </div>
                  <Stream run={run} mode={mode} />
                </div>
                <Outputs run={run} />
                <EnforceCallout />
              </div>
            </div>
          </div>

          {/* a thin progress rail at the stage foot — where you are in the run */}
          <div className="lf-rail" aria-hidden>
            <div className="lf-rail-fill" style={{ transform: `scaleX(${runP})` }} />
          </div>
        </div>
      </div>
    </section>
  )
}
