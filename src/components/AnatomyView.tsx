import { useMemo } from 'react'
import type { Anatomy } from '../content/anatomy.generated'
import type { ShowcaseDag } from '../content/showcase-dag.generated'
import './anatomy-view.css'

/* ─── AnatomyView · the engine's own reading, beside the file (WO-14) ────────
   Renders the VENDORED `nika inspect` graph — the released binary's verdict
   on the exact file the room serves, never a site-side re-derivation. One
   row per task in wave order: verb chip · the target in the engine's words
   (tool / model / argv) · the gates it declared (when · fan_out) · the
   permit rows THIS task needs. Hovering (or focusing — the rows are
   buttons) a row lifts the task id to the room, which lights the file's
   exact lines (the SHOWCASE_DAG line pins re-aimed by the door pass);
   hovering file lines lights the row back. Desktop sits side-by-side with
   the file; under the fold the panel stacks and taps do the sync — same
   component, the CSS owns the layout. */

export interface AnatomyViewProps {
  anatomy: Anatomy
  /** the projected plan facts (wave order + line pins) — join by task id */
  dag?: ShowcaseDag
  /** the engine release the graph was read from (provenance line) */
  engine: string
  /** the task the room currently lights (either side may set it) */
  focus: string | null
  onFocus: (taskId: string | null) => void
}

export function AnatomyView({ anatomy, dag, engine, focus, onFocus }: AnatomyViewProps) {
  const byWave = useMemo(() => {
    const waveOf = new Map((dag?.tasks ?? []).map((t) => [t.id, t.wave]))
    const rows = anatomy.nodes.map((n) => ({ node: n, wave: waveOf.get(n.id) ?? 0 }))
    const count = 1 + Math.max(0, ...rows.map((r) => r.wave))
    const waves: (typeof rows)[] = Array.from({ length: count }, () => [])
    for (const r of rows) waves[r.wave].push(r)
    return waves
  }, [anatomy, dag])

  return (
    <div className="anat" role="group" aria-label="The engine's own reading of this file">
      <p className="anat-provenance mono">
        nika inspect · engine {engine} · vendored graph, never re-derived
      </p>
      <div className="anat-waves">
        {byWave.map((rows, w) => (
          <div className="anat-wave" key={w}>
            <p className="anat-wave-kick mono" aria-hidden>
              wave {w + 1}
            </p>
            {rows.map(({ node }) => (
              <button
                key={node.id}
                type="button"
                className="anat-row"
                data-verb={node.verb}
                data-lit={focus === node.id || undefined}
                onPointerEnter={() => onFocus(node.id)}
                onPointerLeave={() => onFocus(null)}
                onFocus={() => onFocus(node.id)}
                onBlur={() => onFocus(null)}
                onClick={() => onFocus(focus === node.id ? null : node.id)}
              >
                <span className="anat-id mono">{node.id}</span>
                <span className="anat-verb mono" data-verb={node.verb}>
                  {node.verb}
                </span>
                <span className="anat-target mono">
                  {node.tool ?? node.model ?? (node.verb === 'exec' ? 'argv' : '')}
                </span>
                {(node.when || node.fan_out != null) && (
                  <span className="anat-gates mono">
                    {node.when ? 'when' : ''}
                    {node.when && node.fan_out != null ? ' · ' : ''}
                    {node.fan_out != null ? 'fan-out' : ''}
                  </span>
                )}
                {node.permits.length > 0 && (
                  <span
                    className="anat-permits mono"
                    title={node.permits.join('\n')}
                  >
                    {node.permits.length} permit{node.permits.length > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="anat-edges mono">
        {anatomy.edges.length} declared edge{anatomy.edges.length === 1 ? '' : 's'} ·{' '}
        {byWave.length} wave{byWave.length === 1 ? '' : 's'} · the plan falls out of the
        bindings
      </p>
    </div>
  )
}
