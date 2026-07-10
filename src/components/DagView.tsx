import { useLayoutEffect, useRef } from 'react'
import type { ParsedPlan } from '../lib/parse-plan'
import { verbGlyph } from './codefile-highlight'
import './dag-view.css'

/* ─── DagView · the standalone live plan (W12b · E1) ──────────────────────────
   The flat DAG as a pure component: waves left→right, parallel tasks
   stacked, curved wires with the site's dash circulation — the W11 blue
   slab-card register, decoupled from the morph's scroll driver so the
   playground (and anything else) can render a plan from data alone.

   Wires are MEASURED, not computed from layout math: after every render the
   layout effect re-projects each edge from the real node rects and mutates
   the <path> d attributes directly (the ScrollMorph wireRefs idiom — no
   measurement state, no cascading renders). A ResizeObserver keeps them
   glued through container resizes. Node keys are task ids, so an edit that
   ADDS a task pops only the new card in (motion-safe). */

/** simWave · undefined = idle; N = wave N running (earlier waves done);
    >= waves.length = the whole order verified */
export function DagView({
  plan,
  stale,
  simWave,
}: {
  plan: ParsedPlan
  stale?: boolean
  simWave?: number
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>())
  const wireRefs = useRef<(SVGPathElement | null)[]>([])
  const flowRefs = useRef<(SVGPathElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const measure = () => {
      const br = box.getBoundingClientRect()
      plan.edges.forEach((e, i) => {
        const wire = wireRefs.current[i]
        const flow = flowRefs.current[i]
        const a = nodeRefs.current.get(e.from)?.getBoundingClientRect()
        const b = nodeRefs.current.get(e.to)?.getBoundingClientRect()
        if (!wire || !flow || !a || !b) return
        const x1 = a.right - br.left
        const y1 = a.top + a.height / 2 - br.top
        const x2 = b.left - br.left
        const y2 = b.top + b.height / 2 - br.top
        const mx = (x1 + x2) / 2
        const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${mx.toFixed(1)} ${y1.toFixed(1)}, ${mx.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`
        wire.setAttribute('d', d)
        flow.setAttribute('d', d)
        const d1 = dotRefs.current[i * 2]
        const d2 = dotRefs.current[i * 2 + 1]
        d1?.setAttribute('cx', x1.toFixed(1))
        d1?.setAttribute('cy', y1.toFixed(1))
        d2?.setAttribute('cx', x2.toFixed(1))
        d2?.setAttribute('cy', y2.toFixed(1))
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, [plan])

  return (
    <div
      ref={boxRef}
      className="dv"
      data-stale={stale || undefined}
      role="img"
      aria-label={`The plan: ${plan.waves.map((w) => w.map((t) => t.id).join(' + ')).join(', then ')}${plan.cyclic ? ' (cycle detected)' : ''}`}
    >
      <svg className="dv-wires" aria-hidden>
        {/* the arrowhead (arc 11 · the film's grammar, W2) — « every arrow is
            a wait » holds here too: a hairline chevron on each wire's end
            tangent, replacing the target socket dot (the flat-map convention
            since arc 10h). Marker content is exempt from any path blanket
            rule by its own class. */}
        <defs>
          <marker
            id="dv-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="5.4"
            refY="3"
            orient="auto"
          >
            <path className="dv-arrow-head" d="M1,0.4 L5.6,3 L1,5.6" />
          </marker>
        </defs>
        {plan.edges.map((e, i) => (
          <g key={`${e.from}->${e.to}`}>
            <path
              ref={(el) => {
                wireRefs.current[i] = el
              }}
              className="dv-wire"
            />
            <path
              ref={(el) => {
                flowRefs.current[i] = el
              }}
              className="dv-wire-flow"
              markerEnd="url(#dv-arrow)"
            />
            <circle
              ref={(el) => {
                dotRefs.current[i * 2] = el
              }}
              r={2}
            />
          </g>
        ))}
      </svg>
      {plan.waves.map((wave, w) => (
        <div className="dv-wave" key={w}>
          <p className="dv-cap" aria-hidden>
            <span className="dv-cap-n">[ {String(w + 1).padStart(2, '0')} ]</span>
            {wave.length > 1 ? `run together ×${wave.length}` : w === 0 ? 'start' : 'then'}
          </p>
          <div className="dv-col">
            {wave.map((t) => (
              <div
                key={t.id}
                ref={(el) => {
                  nodeRefs.current.set(t.id, el)
                }}
                className="dv-node"
                data-verb={t.verb ?? undefined}
                data-run={
                  simWave === undefined
                    ? undefined
                    : w < simWave
                      ? 'done'
                      : w === simWave
                        ? 'running'
                        : 'pending'
                }
              >
                <span className="dv-node-id">{t.id}</span>
                <span className="dv-node-verb">
                  {t.verb ? (
                    <>
                      <span aria-hidden>{verbGlyph(t.verb)} </span>
                      {t.verb}
                    </>
                  ) : (
                    'no verb yet'
                  )}
                </span>
                <span className="dv-node-target" title={t.target}>
                  {t.target}
                </span>
                {t.gated && (
                  <span className="dv-node-when" aria-label="gated by when:">
                    when:
                  </span>
                )}
                {simWave !== undefined && (
                  <span className="dv-node-run" aria-hidden>
                    {w < simWave ? '✓ done' : w === simWave ? '● running' : '· queued'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {plan.cyclic && (
        <p className="dv-note">cycle in depends_on · showing file order</p>
      )}
    </div>
  )
}
