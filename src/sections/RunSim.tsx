import { useEffect, useRef, useState } from 'react'
import { VERB_COLOR } from './transform-data'
import type { ShowcaseDag, ShowcaseTask } from './usecases-yaml.generated'

/* ─── §use-cases · the run simulator ────────────────────────────────────────
   Plays a workflow the way the engine schedules it: wave by wave (waves =
   topological depth · projected into SHOWCASE_DAG by showcase-projector.py).
   All tasks of a wave light up TOGETHER (parallelism is the lesson), then
   each is narrated in turn — its gloss in the caption, its lines lit in the
   YAML panel via onTask. Deterministic data, zero client YAML parsing. */

type Status = 'pending' | 'running' | 'done'
type Phase = 'idle' | 'running' | 'done'

const NODE_W = 102
const NODE_H = 28
const COL_W = 128
const ROW_H = 42
const PAD_X = 10
const PAD_Y = 10

export default function RunSim({
  dag,
  onTask,
}: {
  dag: ShowcaseDag
  /** the task being narrated (null = nothing lit) — drives the YAML highlight */
  onTask: (t: ShowcaseTask | null) => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [current, setCurrent] = useState<ShowcaseTask | null>(null)
  const [waveIdx, setWaveIdx] = useState(-1)
  const [fast, setFast] = useState(false)
  const timers = useRef<number[]>([])
  const fastRef = useRef(false)
  useEffect(() => {
    fastRef.current = fast
  }, [fast])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  /* layout · column = wave · row = index within wave */
  const byWave: ShowcaseTask[][] = Array.from({ length: dag.waves }, () => [])
  dag.tasks.forEach((t) => byWave[t.wave].push(t))
  const maxRows = Math.max(...byWave.map((w) => w.length))
  const width = PAD_X * 2 + dag.waves * COL_W - (COL_W - NODE_W)
  const height = PAD_Y * 2 + maxRows * ROW_H - (ROW_H - NODE_H)
  const pos = (t: ShowcaseTask) => {
    const col = byWave[t.wave]
    const idx = col.indexOf(t)
    const colH = col.length * ROW_H - (ROW_H - NODE_H)
    return {
      x: PAD_X + t.wave * COL_W,
      y: PAD_Y + (height - PAD_Y * 2 - colH) / 2 + idx * ROW_H,
    }
  }
  const at = Object.fromEntries(dag.tasks.map((t) => [t.id, pos(t)]))

  const reset = () => {
    clearTimers()
    setPhase('idle')
    setStatus({})
    setCurrent(null)
    setWaveIdx(-1)
    onTask(null)
  }

  const play = () => {
    clearTimers()
    setPhase('running')
    setStatus(Object.fromEntries(dag.tasks.map((t) => [t.id, 'pending'])))
    setCurrent(null)
    let delay = 120
    const schedule = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, delay))
      delay += ms / (fastRef.current ? 2 : 1)
    }
    byWave.forEach((wave, w) => {
      // the whole wave starts together — parallelism made visible
      schedule(() => {
        setWaveIdx(w)
        setStatus((s) => ({
          ...s,
          ...Object.fromEntries(wave.map((t) => [t.id, 'running' as Status])),
        }))
      }, 420)
      // then each task is narrated, and completes
      wave.forEach((t) => {
        schedule(() => {
          setCurrent(t)
          onTask(t)
        }, 1050)
        schedule(() => {
          setStatus((s) => ({ ...s, [t.id]: 'done' }))
        }, 160)
      })
    })
    schedule(() => {
      setCurrent(null)
      onTask(null)
      setPhase('done')
    }, 0)
  }

  const stColor = (t: ShowcaseTask) => VERB_COLOR[t.verb]
  const stClass = (id: string) =>
    phase === 'idle' ? 'rs-node' : `rs-node rs-${status[id] ?? 'pending'}`

  return (
    <div className="px-5 pt-4">
      {/* ── controls ── */}
      <div className="mb-3 flex items-center gap-3">
        {phase === 'running' ? (
          <button
            onClick={reset}
            className="mono rounded-md border px-3 py-1 text-[11.5px] text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            style={{ borderColor: 'var(--hair)' }}
          >
            ■ stop
          </button>
        ) : (
          <button
            onClick={play}
            className="skeuo-brand mono rounded-md px-3 py-1 text-[11.5px] text-white transition-transform hover:-translate-y-px"
          >
            {phase === 'done' ? '↻ replay' : '▶ run it'}
          </button>
        )}
        <button
          onClick={() => setFast((f) => !f)}
          aria-pressed={fast}
          className="mono rounded-md border px-2 py-1 text-[11px] text-[var(--fg-dim)] transition-colors hover:text-[var(--fg)]"
          style={{ borderColor: 'var(--hair)' }}
        >
          {fast ? '2×' : '1×'}
        </button>
        <span className="mono ml-auto text-[10.5px] text-[var(--fg-ghost)]">
          {dag.tasks.length} tasks · {dag.waves} waves
        </span>
      </div>

      {/* ── the DAG · columns are waves ── */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: 170 }}
        role="img"
        aria-label="Workflow DAG · columns are parallel waves"
      >
        {/* edges first (under nodes) */}
        {dag.tasks.flatMap((t) =>
          t.deps.map((d) => {
            const a = at[d]
            const b = at[t.id]
            if (!a || !b) return null
            const x1 = a.x + NODE_W
            const y1 = a.y + NODE_H / 2
            const x2 = b.x
            const y2 = b.y + NODE_H / 2
            const lit = status[d] === 'done' && status[t.id] !== 'pending' && phase !== 'idle'
            return (
              <path
                key={`${d}->${t.id}`}
                d={`M ${x1} ${y1} C ${x1 + 26} ${y1}, ${x2 - 26} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={lit ? stColor(t) : 'var(--hair)'}
                strokeWidth={lit ? 1.5 : 1}
                opacity={lit ? 0.7 : 0.6}
                style={{ transition: 'stroke .3s, opacity .3s' }}
              />
            )
          }),
        )}
        {/* nodes */}
        {dag.tasks.map((t) => {
          const p = at[t.id]
          const c = stColor(t)
          const active = current?.id === t.id
          return (
            <g
              key={t.id}
              className={stClass(t.id)}
              style={{ ['--rs-c' as string]: c, cursor: 'pointer' }}
              onClick={() => phase !== 'running' && onTask(t)}
            >
              <title>{`${t.id} · ${t.gloss}`}</title>
              <rect
                x={p.x}
                y={p.y}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={`color-mix(in srgb, ${c} ${active ? 30 : status[t.id] === 'done' ? 20 : 12}%, transparent)`}
                stroke={c}
                strokeWidth={active ? 1.6 : 1}
              />
              <text
                x={p.x + 10}
                y={p.y + NODE_H / 2 + 3.5}
                className="mono"
                fontSize={10}
                fill={c}
              >
                {t.id.length > 11 ? `${t.id.slice(0, 10)}…` : t.id}
                {t.flags.some((f) => f.startsWith('fan-out')) ? ' ∥' : ''}
              </text>
              {status[t.id] === 'done' && (
                <text x={p.x + NODE_W - 14} y={p.y + NODE_H / 2 + 3.5} fontSize={10} fill={c}>
                  ✓
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* ── the narration · every action explained ── */}
      <div
        aria-live="polite"
        className="mt-2 min-h-[44px] rounded-lg px-3 py-2 text-[12.5px] leading-relaxed"
        style={{ background: 'color-mix(in srgb, var(--cyan) 5%, transparent)' }}
      >
        {phase === 'idle' && !current && (
          <span className="text-[var(--fg-dim)]">
            ▶ run it — watch the waves schedule themselves, every action explained. Or click any
            node to jump to its lines.
          </span>
        )}
        {phase === 'idle' && current && (
          <span>
            <span className="mono" style={{ color: stColor(current) }}>
              {current.id}
            </span>
            <span className="text-[var(--fg-mute)]"> — {current.gloss}</span>
          </span>
        )}
        {phase === 'running' && (
          <span>
            <span className="mono text-[var(--fg-ghost)]">
              wave {waveIdx + 1}/{dag.waves}
              {byWave[waveIdx]?.length > 1 ? ` · ${byWave[waveIdx].length} in parallel` : ''} ·{' '}
            </span>
            {current ? (
              <>
                <span className="mono" style={{ color: stColor(current) }}>
                  {current.id}
                </span>
                <span className="text-[var(--fg-mute)]"> — {current.gloss}</span>
                {current.deps.length > 0 && (
                  <span className="text-[var(--fg-ghost)]">
                    {' '}
                    (after <span className="mono">{current.deps.join(' + ')}</span>)
                  </span>
                )}
                {current.flags.length > 0 && (
                  <span className="mono text-[10.5px] text-[var(--fg-ghost)]">
                    {'  '}· {current.flags.join(' · ')}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[var(--fg-mute)]">scheduling…</span>
            )}
          </span>
        )}
        {phase === 'done' && (
          <span className="text-[var(--cyan)]">
            ✓ done · {dag.waves} waves
            {dag.outputs.length > 0 && (
              <span className="text-[var(--fg-mute)]">
                {' '}
                · outputs ready: <span className="mono">{dag.outputs.join(', ')}</span>
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
