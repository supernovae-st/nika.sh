import { useLayoutEffect, useRef } from 'react'
import type { ParsedPlan } from '../lib/parse-plan'
import { useScrollWellTab } from '../lib/use-scroll-well'
import { verbGlyph } from './codefile-highlight'
import {
  nikaNodeClass,
  NIKA_NODE_CLASSES,
  NIKA_NODE_STATUS,
  type NikaVerbName,
} from '../design-tokens.generated'
import '../styles/node.generated.css'
import './dag-view.css'

/* ── THE CARD IS THE CANVAS'S CARD ────────────────────────────────────────────
   This page used to draw a node of its own invention: 21 `.dv-*` selectors,
   ZERO of them shared with the 139 the VS Code canvas styles. Two surfaces
   drawing the same object, agreeing on nothing, because there was nothing to
   agree with.

   What converges is the STRUCTURE and the VOCABULARY — the class string comes
   from nikaNodeClass(), the parts carry the canvas's names, the geometry is
   projected. What does NOT converge is the skin: this page's blue plate is its
   own register and stays in dag-view.css, layered on top. `node.generated.css`
   carries no colour on purpose, so it can be worn by both.

   A task with no verb yet is genuinely site-only — the canvas never renders a
   half-written file — so it keeps a `dv-` prefix. Shared concepts take the
   shared name; site concepts keep the site's. */
function cardClass(
  verb: string | null | undefined,
  status: (typeof NIKA_NODE_STATUS)[number] | undefined,
): string {
  if (!verb) return `${NIKA_NODE_CLASSES.wrapper} dv-draft`
  return nikaNodeClass({ status: status ?? 'pending', verb: verb as NikaVerbName })
}

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
  lit,
  onNodeHover,
}: {
  plan: ParsedPlan
  stale?: boolean
  simWave?: number
  /** U5 · task id to light (the editor's hovered line resolved to its task) */
  lit?: string | null
  /** U5 · pointer enters/leaves a task card */
  onNodeHover?: (id: string | null) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>())
  const wireRefs = useRef<(SVGPathElement | null)[]>([])
  const flowRefs = useRef<(SVGPathElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])
  /* narrow screens: the map overflows sideways in its own well (the CodeFile
     well law) — the well is a keyboard tab stop while it actually scrolls */
  useScrollWellTab(boxRef, plan)

  useLayoutEffect(() => {
    /* wires are projected in TRACK space — the track spans the full
       scrollable content width, so wires reach nodes beyond the fold */
    const box = trackRef.current
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
      /* LE SOL DU CANVAS · la trame de croix, la vignette qui connaît le run,
         la lampe bleue et le curseur d’arpentage viennent tous du fichier que
         nika-spec projette (styles/ground.generated.css) — le même que le
         canvas VS Code reçoit. Le site cesse ici de dessiner sa propre nappe. */
      className="dv nk-ground"
      data-stale={stale || undefined}
      role="img"
      aria-label={`The plan: ${plan.waves.map((w) => w.map((t) => t.id).join(' + ')).join(', then ')}${plan.cyclic ? ' (cycle detected)' : ''}`}
    >
      <div ref={trackRef} className="dv-track">
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
                className={cardClass(
                  t.verb,
                  simWave === undefined
                    ? undefined
                    : w < simWave
                      ? 'success'
                      : w === simWave
                        ? 'running'
                        : 'pending',
                )}
                data-lit={lit === t.id || undefined}
                onPointerEnter={onNodeHover ? () => onNodeHover(t.id) : undefined}
                onPointerLeave={onNodeHover ? () => onNodeHover(null) : undefined}
              >
                <div className="nc">
                  <div className="nc-head">
                    <span className="nc-tile" aria-hidden>
                      {t.verb ? verbGlyph(t.verb) : '·'}
                    </span>
                    <span className="nc-id">{t.id}</span>
                    {/* NO nc-badge. That slot is the canvas's FAN-OUT COUNT
                        (`×3` · empty otherwise) — putting the verb's name in it
                        was inventing a meaning for a word that already had one,
                        and the symptom was the id truncating to « gath… » on a
                        108px card. The verb reads from the tile and from the
                        wrapper's verb- class, which tints the whole card. */}
                    {simWave !== undefined && (
                      <span className="nc-st" aria-hidden>
                        <i className="nc-dot" />
                      </span>
                    )}
                  </div>
                  <div className="nc-sub">
                    <span className="nc-sub-k" title={t.target}>
                      {t.target}
                    </span>
                  </div>
                  {(t.gated || simWave !== undefined) && (
                    <div className="nc-policy">
                      {t.gated && (
                        <span className="nc-chip" aria-label="gated by when:">
                          when:
                        </span>
                      )}
                      {simWave !== undefined && (
                        <span className="nc-chip dv-run">
                          {w < simWave ? 'done' : w === simWave ? 'running' : 'queued'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {plan.cyclic && (
        <p className="dv-note">cycle in the wiring (with/after) · showing file order</p>
      )}
      </div>
    </div>
  )
}
