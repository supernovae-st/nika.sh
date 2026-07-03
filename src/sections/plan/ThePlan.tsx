import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { useRevealOnce } from '../use-reveal-once'
import { formatMs, type FlagshipEntry, type FlagshipTask } from '../../flagships'
import './plan.css'

/* ─── THE PLAN · beat 3 · the same file, rendered as its plan ─────────────────
   The SELECTED flagship's derivation (derive.ts — the ONE derivation, pinned
   by test to the YAML) renders as wave columns: independent tasks stack in
   the same column under a « run together » caption, dependencies draw as REAL
   wires (SVG overlay, measured from the laid-out cards), verb hues live on
   the node tick (sanctioned: this is the run's anatomy). Real durations come
   from the recorded trace — the plan and the replay can never disagree.

   Hover/tap intelligence: focusing a task lights its card, its upstream deps
   (strong) and its dependents (soft), and raises the wires that touch it —
   comprehension by contrast, never decoration. Mobile (≤767px) is a vertical
   timeline: waves top→down, parallel tasks 2-up, hairline connectors. */

interface Edge {
  from: string
  to: string
  d: string
  /** the wire endpoints (registration dots · Attio grammar) */
  x1: number
  y1: number
  x2: number
  y2: number
}

/** the settled chip per task, from the RECORDED run (real numbers only) */
function chipFor(entry: FlagshipEntry, task: FlagshipTask): { text: string; skipped: boolean } {
  const done = entry.trace.steps.find((s) => s.kind === 'task_completed' && s.task === task.id)
  if (done?.durationMs !== undefined) return { text: formatMs(done.durationMs), skipped: false }
  const skipped = entry.trace.steps.some((s) => s.kind === 'task_skipped' && s.task === task.id)
  return { text: skipped ? 'skipped · gate closed' : '', skipped }
}

/** strip the template wrapper for the when: badge (verbatim expression) */
function whenLabel(when: string): string {
  return when.replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '')
}

export default function ThePlan({ flagship }: { flagship: FlagshipEntry }) {
  const rootRef = useRevealOnce<HTMLElement>()
  const wrapRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>())
  const [edges, setEdges] = useState<Edge[]>([])
  const [focus, setFocus] = useState<string | null>(null)
  const plan = flagship.plan

  /* dependency closure for the hover states (direct edges — the files are
     small and one level reads clearer) */
  const rdeps = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const t of plan.tasks)
      for (const d of t.deps) m.set(d, [...(m.get(d) ?? []), t.id])
    return m
  }, [plan])

  /* measure the wires from the real laid-out cards (desktop columns only) */
  const measure = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    if (window.matchMedia('(max-width: 767px)').matches) {
      setEdges([])
      return
    }
    const wr = wrap.getBoundingClientRect()
    const next: Edge[] = []
    for (const t of plan.tasks) {
      const toEl = nodeRefs.current.get(t.id)
      if (!toEl) continue
      const tr = toEl.getBoundingClientRect()
      for (const d of t.deps) {
        const fromEl = nodeRefs.current.get(d)
        if (!fromEl) continue
        const fr = fromEl.getBoundingClientRect()
        const x1 = fr.right - wr.left
        const y1 = fr.top + fr.height / 2 - wr.top
        const x2 = tr.left - wr.left
        const y2 = tr.top + tr.height / 2 - wr.top
        const mx = (x2 - x1) / 2
        next.push({
          from: d,
          to: t.id,
          d: `M ${x1} ${y1} C ${x1 + mx} ${y1}, ${x2 - mx} ${y2}, ${x2} ${y2}`,
          x1,
          y1,
          x2,
          y2,
        })
      }
    }
    setEdges(next)
  }, [plan])

  useEffect(() => {
    if (typeof window === 'undefined') return
    /* rAF: measure AFTER layout settles (also avoids sync setState-in-effect) */
    let raf = requestAnimationFrame(measure)
    const wrap = wrapRef.current
    const ro =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(measure)
          })
    if (wrap && ro) ro.observe(wrap)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [measure])

  /* focus states · hover on fine pointers, tap-toggle on coarse */
  const stateOf = (id: string): string | undefined => {
    if (!focus) return undefined
    if (id === focus) return 'focus'
    const t = plan.tasks.find((x) => x.id === focus)
    if (t?.deps.includes(id)) return 'dep-up'
    if (rdeps.get(focus)?.includes(id)) return 'dep-down'
    return 'off'
  }

  return (
    <section
      ref={rootRef}
      id="the-plan"
      aria-labelledby="the-plan-title"
      className="theme-dark v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <SectionHead fig="02" id="the-plan-title" title="One file. A plan you can read.">
          The engine derives the order from <code className="mono">depends_on</code>.
          Steps with no dependency between them <b>run together</b>. Nothing runs
          that is not written in the file.
        </SectionHead>

        <div
          className="v5plan-wrap"
          data-rise
          ref={wrapRef}
          onPointerLeave={() => setFocus(null)}
          data-focused={focus ? 'true' : undefined}
        >
          {/* the wires · real measured dependencies (≥12% ink · raised on focus) */}
          <svg className="v5plan-wires" aria-hidden>
            {edges.map((e, i) => (
              <g key={i}>
                <path
                  d={e.d}
                  data-hot={
                    focus !== null && (e.from === focus || e.to === focus) ? 'true' : undefined
                  }
                />
                <circle cx={e.x1} cy={e.y1} r={2} />
                <circle cx={e.x2} cy={e.y2} r={2} />
              </g>
            ))}
          </svg>

          {plan.waves.map((wave, w) => (
            <div className="v5plan-wave" key={w}>
              <p className="v5plan-wave-cap">
                <span className="v5plan-wave-n">[ {String(w + 1).padStart(2, '0')} ]</span>
                {wave.length > 1 ? `run together ×${wave.length}` : w === 0 ? 'start' : 'then'}
              </p>
              <div className="v5plan-col">
                {wave.map((task) => {
                  const chip = chipFor(flagship, task)
                  return (
                    /* tap-toggle on coarse pointers, hover on fine — and the
                       SAME toggle from the keyboard (role=button + Enter/Space
                       + the global :focus-visible ring): the wire-tracing
                       intelligence must not be pointer-only. */
                    <div
                      key={task.id}
                      ref={(el) => {
                        nodeRefs.current.set(task.id, el)
                      }}
                      className="v5plan-node"
                      data-verb={task.verb}
                      data-state={stateOf(task.id)}
                      data-skipped={chip.skipped || undefined}
                      role="button"
                      tabIndex={0}
                      aria-pressed={focus === task.id}
                      aria-label={`trace ${task.id} · ${task.verb}`}
                      onPointerEnter={(e) => {
                        if (e.pointerType === 'mouse') setFocus(task.id)
                      }}
                      onClick={() => setFocus((f) => (f === task.id ? null : task.id))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setFocus((f) => (f === task.id ? null : task.id))
                        }
                      }}
                    >
                      <span className="v5plan-node-id">{task.id}</span>
                      <span className="v5plan-node-verb">{task.verb}</span>
                      <span className="v5plan-node-target" title={task.target}>
                        {task.target}
                      </span>
                      {task.when ? (
                        <span className="v5plan-node-when" title={task.when}>
                          when: {whenLabel(task.when)}
                        </span>
                      ) : null}
                      {chip.text ? (
                        <span className="v5plan-node-chip" data-skipped={chip.skipped || undefined}>
                          {chip.skipped ? '⊘' : '✓'} {chip.text}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="v5plan-note" data-rise>
          durations recorded from the real run · hover a step to trace its wires
        </p>
      </div>
    </section>
  )
}
