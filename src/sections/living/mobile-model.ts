/* ─── mobile-model · the vertical plan mapping for phones ─────────────────────
   PURE LOGIC, no UI (run-model's sibling). On ≤768px the pinned scroll
   choreography is replaced by a normal-flow vertical story (LivingFileMobile):
   the file card, then the plan as a top→down TIMELINE — parallel tasks render
   side-by-side (2-up max) under a "run together" caption, sequential tasks as
   single full-width steps — then the permits-wall beat and the verdict.

   This module maps a ShowcaseDag onto that vertical structure and formats the
   inline telemetry chips off the SAME deterministic run-model state the desktop
   choreography plays. Same inputs → same rows, so it is unit-testable. */

import type { ShowcaseDag, ShowcaseTask } from '../usecases-yaml.generated'
import type { NodeState } from './run-model'

/** a wave of the vertical plan · `rows` chunk parallel siblings 2-up max. */
export interface PlanWave {
  wave: number
  /** every task in the wave, in the deterministic order (line0, then id) */
  tasks: ShowcaseTask[]
  /** the tasks chunked into render rows of ≤2 (the 2-up mobile constraint) */
  rows: ShowcaseTask[][]
  /** true when the wave holds >1 task (side-by-side + "run together" caption) */
  parallel: boolean
}

/** the deterministic in-wave order — MUST match run-model's buildSchedule. */
function waveOrder(a: ShowcaseTask, b: ShowcaseTask): number {
  return a.line0 - b.line0 || (a.id < b.id ? -1 : 1)
}

/** the vertical plan · one entry per wave, top→down (wave order == topological
    order per the projector guarantee run-model already relies on). */
export function buildMobilePlan(dag: ShowcaseDag): PlanWave[] {
  const byWave: ShowcaseTask[][] = Array.from({ length: dag.waves }, () => [])
  for (const task of dag.tasks) byWave[task.wave].push(task)
  return byWave.map((tasks, wave) => {
    const sorted = [...tasks].sort(waveOrder)
    const rows: ShowcaseTask[][] = []
    for (let i = 0; i < sorted.length; i += 2) rows.push(sorted.slice(i, i + 2))
    return { wave, tasks: sorted, rows, parallel: sorted.length > 1 }
  })
}

/** "1.9s" — a compact duration for the inline chip (deterministic input). */
export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

/** the inline telemetry chip for a settled node — e.g. "1.9s · 14 items".
    Running/pending nodes get no chip (the mobile flow reveals settled steps). */
export function chipFor(node: NodeState | undefined): string | null {
  if (!node || node.status !== 'success' || node.durationMs === null) return null
  const dur = formatDuration(node.durationMs)
  return node.output && node.output !== 'ok' ? `${dur} · ${node.output}` : dur
}
