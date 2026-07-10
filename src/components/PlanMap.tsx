import { useRef } from 'react'
import { useScrollWellTab } from '../lib/use-scroll-well'
import { verbGlyph, type NikaVerb } from './codefile-highlight'
import './plan-map.css'

/* ─── PlanMap · THE plan language, shared (arc 11) ────────────────────────────
   The film (home 01) teaches the site's one visual grammar for « a plan »:
   task = a SLAB CARD (verb-hued inset bar · id in mono 600 · verb label ·
   the tool line), waves = COLUMNS with the film's own captions (« [ 01 ]
   run together ×3 » · « then » · « start »), direction = the wire-blue
   chevron. Every static surface that shows a plan renders THIS component —
   /use-cases first (it spoke pills-and-dots before), /play next — so a
   reader who scrolled the film reads every other plan on sight.

   Anatomy values are copied VERBATIM from the film's flat map (morph.css
   .morph-node / .morph-wave-cap) into plan-map.css `pm-*` classes — the
   film keeps its own classes (they are driver-animated); parity is by
   construction, enforced at the token level. Static, SSR-safe, zero
   measurement (the measured wires stay the film's own instrument — the
   inter-column chevron carries the direction here). */

export interface PlanMapTask {
  id: string
  verb: string
  /** the projected gloss (e.g. « call `nika:read` ») — the backtick span
      becomes the node's tool line, exactly like the film's face chip */
  gloss?: string
  wave: number
  gate?: string
}

const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/** the tool line · the backtick content of the projected gloss (never
    hand-typed — spec truth) */
function toolOf(gloss?: string): string | null {
  const m = gloss?.match(/`([^`]+)`/)
  return m ? m[1] : null
}

export function PlanMap({
  tasks,
  waves,
  well,
}: {
  tasks: PlanMapTask[]
  waves: number
  /** stable id for the overflow well's tab stop (long T3/T4 chains) */
  well?: string
}) {
  const flowRef = useRef<HTMLDivElement>(null)
  useScrollWellTab(flowRef, well ?? 'plan-map')
  if (tasks.length === 0) return null

  /* bucket by topological wave, declared order preserved within a wave */
  const columns: PlanMapTask[][] = Array.from({ length: waves }, () => [])
  for (const t of tasks) (columns[t.wave] ?? columns[columns.length - 1]).push(t)
  const hasGate = tasks.some((t) => t.gate === 'when')

  return (
    <div className="pm-map">
      <div
        ref={flowRef}
        className="pm-flow"
        role="group"
        aria-label={`Plan diagram: ${tasks.length} tasks in ${waves} ${waves === 1 ? 'step' : 'steps'}`}
      >
        {columns.map((col, w) => (
        <div className="pm-wave" key={w}>
          {/* the film's own caption grammar — ScrollMorph renders this exact
              wording over its wave columns */}
          <p className="pm-wave-cap" aria-hidden>
            <span className="pm-wave-n">[ {String(w + 1).padStart(2, '0')} ]</span>
            {col.length > 1 ? `run together ×${col.length}` : w === 0 ? 'start' : 'then'}
          </p>
          <div className="pm-col">
            {col.map((t) => {
              const tool = toolOf(t.gloss)
              return (
                <span
                  key={t.id}
                  className="pm-node"
                  data-gate={t.gate && t.gate !== 'default' ? t.gate : undefined}
                  style={{ ['--node-vhue' as string]: VERB_HUE[t.verb as NikaVerb] }}
                  title={`${t.id} · ${t.verb}${t.gate === 'when' ? ' · conditional' : ''}`}
                >
                  <span className="pm-node-id">{t.id}</span>
                  <span className="pm-node-verb">
                    <span aria-hidden>{verbGlyph(t.verb as NikaVerb)} </span>
                    {t.verb}
                  </span>
                  {tool ? <span className="pm-node-tool">{tool}</span> : null}
                </span>
              )
            })}
          </div>
          {w < columns.length - 1 ? (
            <span className="pm-arrow" aria-hidden>
              ›
            </span>
          ) : null}
        </div>
      ))}
      </div>
      {hasGate ? (
        <p className="pm-gate-note" aria-hidden>
          dashed = conditional (when:)
        </p>
      ) : null}
    </div>
  )
}
