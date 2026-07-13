import { useMemo } from 'react'
import { layoutMiniDag, type MiniDagOrientation } from './mini-dag-layout'
import type { FlagshipPlanModel } from '../flagships/derive'
import './mini-dag.css'

/* ─── MiniDag · the compact plan diagram beside the hero editor (wave K) ──────
   A comprehension instrument, not decoration: the SELECTED file's task graph,
   derived (mini-dag-layout.ts ← derive.ts, the one derivation) so every
   library file gets its drawing for free. Same visual vocabulary as the
   /learn static plate and the morph's flat plan: verb-hued dots, mono ids,
   thin dependency curves, parallel waves sharing one start line. When-gated
   tasks carry the seal (◈), fan-outs the sheaf (⧉).

   SSR-static: pure layout, real DOM buttons over one SVG underlay (the
   buttons give focus/hover to every node — the bidirectional pairing with
   the editor wires through pairTask/onPair). The stage remounts per file
   (key) and the plan ASSEMBLES in time order (wave N): each wave's nodes
   rise on a staggered delay and every wire draws INTO its target as that
   wave lands (pathLength dash trick — deterministic, no measuring). The
   choreography is the comprehension device: parallel work appears together,
   dependent work after. Reduced-motion is instant (mini-dag.css gates). */

/* the wave beat · node w rises at w×STEP; its incoming wire starts drawing a
   touch earlier so the line arrives as the node lands */
const STEP_MS = 110
const nodeDelay = (wave: number): number => wave * STEP_MS
const wireDelay = (toWave: number): number => Math.max(40, toWave * STEP_MS - 70)

export interface MiniDagProps {
  plan: FlagshipPlanModel
  orientation: MiniDagOrientation
  /** keys the stage remount (the file-switch transition) */
  fileId: string
  /** the paired task to mirror (editor-side hover drives it) */
  pairTask?: string | null
  /** a node took hover/focus (null on leave) — the editor lights its lines */
  onPair?: (id: string | null) => void
  /** an interactive slot at the caption row's right end (wave O · the hero's
      run handoff lives at title level, beside the steps meta) */
  action?: React.ReactNode
  className?: string
}

/** the plain sentence a screen reader gets instead of the drawing */
function planSentence(plan: FlagshipPlanModel): string {
  return plan.waves
    .map((wave, w) => {
      const names = wave.map((t) => t.id).join(', ')
      if (w === 0) return wave.length > 1 ? `${names} start together` : `${names} starts`
      return wave.length > 1 ? `then ${names} run together` : `then ${names}`
    })
    .join(' · ')
}

export function MiniDag({
  plan,
  orientation,
  fileId,
  pairTask,
  onPair,
  action,
  className,
}: MiniDagProps) {
  const lay = useMemo(() => layoutMiniDag(plan, orientation), [plan, orientation])
  /* wave lookup for the wire choreography (an edge draws on its TARGET's beat) */
  const waveOf = useMemo(() => new Map(lay.nodes.map((n) => [n.id, n.wave])), [lay])
  /* THE PLATE HOLDS STILL (operator 2026-07-13) · the caption/title used to
     swap to the paired node's id + verb words on hover — the text width
     changed, the tie flexed, and THE WHOLE DRAWING JUMPED sideways on every
     enter/leave (« ça se téléporte »). The pairing already speaks through
     the node halo + the lit code lines; the plate stays constant. */
  return (
    <figure className={`mdag mdag--${orientation} ${className ?? ''}`}>
      {/* THE SURVEY FRAME (wave S · operator reference) — the block reads as
          one INSTRUMENT: the title sits IN the top rule (dots terminate the
          rules, the drawing vocabulary), the content hugs inside, a base rule
          closes the frame against the window below. Reading order: title →
          plate (meta · action) → the tie flowing INTO the drawing — time
          falls off the right edge where the run story continues. Decorative
          text is aria-hidden; the group carries the plan for AT. */}
      <p className="mdag-title" aria-hidden>
        <i className="mdag-rule mdag-rule--lead" />
        <span className="mdag-title-text">the plan</span>
        <i className="mdag-rule mdag-rule--trail" />
      </p>
      <div className="mdag-row">
        <p className="mdag-side">
          <span className="mdag-cap-meta" aria-hidden>
            {`${plan.tasks.length} steps · time ${orientation === 'rail' ? '↓' : '→'}`}
          </span>
          {action}
        </p>
        <span className="mdag-tie" aria-hidden />
        <div className="mdag-scroll">
          <div
            className="mdag-stage"
            key={fileId}
            style={{ width: lay.w, height: lay.h }}
            role="group"
            aria-label={`the plan of this file · ${planSentence(plan)}`}
          >
            <svg className="mdag-wires" viewBox={`0 0 ${lay.w} ${lay.h}`} aria-hidden>
              {lay.edges.map((e) => (
                <path
                  key={`${e.from}-${e.to}`}
                  d={e.d}
                  pathLength={1}
                  style={
                    { '--mdag-d': `${wireDelay(waveOf.get(e.to) ?? 1)}ms` } as React.CSSProperties
                  }
                />
              ))}
            </svg>
            {lay.nodes.map((n) => (
              <button
                key={n.id}
                type="button"
                className="mdag-node"
                data-task={n.id}
                data-verb={n.verb}
                data-hi={pairTask === n.id || undefined}
                style={
                  {
                    left: n.x,
                    top: n.y,
                    '--mdag-d': `${nodeDelay(n.wave)}ms`,
                  } as React.CSSProperties
                }
                aria-label={`${n.id} · ${n.verb}${n.gated ? ' · when-gated' : ''}${
                  n.fanout ? ' · fans out per item' : ''
                }`}
                onPointerEnter={onPair ? () => onPair(n.id) : undefined}
                onPointerLeave={onPair ? () => onPair(null) : undefined}
                onFocus={onPair ? () => onPair(n.id) : undefined}
                onBlur={onPair ? () => onPair(null) : undefined}
              >
                <span className="mdag-dot" aria-hidden />
                <span className="mdag-id" aria-hidden>
                  {n.id}
                  {n.gated ? (
                    <span className="mdag-seal" title="when-gated">
                      ◈
                    </span>
                  ) : null}
                  {n.fanout ? (
                    <span className="mdag-fan" title="fans out per item">
                      ⧉
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="mdag-base" aria-hidden />
    </figure>
  )
}
