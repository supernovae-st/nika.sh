import { useMemo } from 'react'
import { layoutMiniDag, type MiniDagOrientation } from './mini-dag-layout'
import type { FlagshipPlanModel } from '../flagships/derive'
import { VERB_WORDS } from '../sections/morph/plain-words'
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
  /* the caption doubles as the gloss line: while a node is paired it speaks
     that task in plain words (the shared VERB_WORDS · zero drift with the 3D
     tips and the /learn dictionary), then returns to the steps count. */
  const pairedNode = pairTask ? lay.nodes.find((n) => n.id === pairTask) : undefined
  return (
    <figure className={`mdag mdag--${orientation} ${className ?? ''}`}>
      {/* ONE row (wave Q): the drawing LEFT · a hairline tie · the side plate
          RIGHT (name over meta over the call-site action). The tie extends the
          dag's own wire vocabulary toward the plate — the plan flows into
          « see it run » — and gives the two a real visual link instead of two
          anchors floating apart (operator annotation). Only the decorative
          text is aria-hidden; the group below carries the plan for AT. */}
      <div className="mdag-row">
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
        <span className="mdag-tie" aria-hidden />
        <p className="mdag-side">
          {pairedNode ? (
            <>
              <span className="mdag-cap-name mdag-cap-name--pair" aria-hidden>
                {pairedNode.id}
              </span>
              <span className="mdag-cap-meta" aria-hidden>
                {VERB_WORDS[pairedNode.verb]}
              </span>
            </>
          ) : (
            <>
              <span className="mdag-cap-name" aria-hidden>
                the plan
              </span>
              <span className="mdag-cap-meta" aria-hidden>
                {plan.tasks.length} steps · time {orientation === 'rail' ? '↓' : '→'}
              </span>
            </>
          )}
          {action}
        </p>
      </div>
    </figure>
  )
}
