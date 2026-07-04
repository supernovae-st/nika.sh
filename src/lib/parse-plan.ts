/* ─── parse-plan · yaml → the live plan (W12b · E1) ───────────────────────────
   The playground's DAG extractor: real YAML (the same `yaml` parser the
   linter ships) → tasks, dependency edges, and Kahn-layered waves — the
   exact shape the flat DAG renders. TOLERANT by contract: mid-edit sources
   return null and the caller keeps the last valid plan on screen (dimmed),
   so the picture never flickers while you type.

   Honesty notes · a cycle can't be layered: `cyclic` flips true and the
   waves fall back to file order (the linter's NIKA-DAG-001 carries the
   message). Unknown depends_on names don't edge (NIKA-DAG-002 speaks). */
import { parse } from 'yaml'

export type PlanVerb = 'infer' | 'exec' | 'invoke' | 'agent'
const VERBS: readonly PlanVerb[] = ['infer', 'exec', 'invoke', 'agent']

export interface PlanTask {
  id: string
  /** the ONE verb, or null while the task is still being written */
  verb: PlanVerb | null
  /** resolved depends_on (only ids that exist) */
  deps: string[]
  /** the card's third line — tool / argv head / model register */
  target: string
  /** a when: gate is declared */
  gated: boolean
}

export interface ParsedPlan {
  tasks: PlanTask[]
  /** Kahn layers (parallel tasks share a wave) · file order when cyclic */
  waves: PlanTask[][]
  edges: { from: string; to: string }[]
  cyclic: boolean
}

function targetOf(t: Record<string, unknown>, verb: PlanVerb | null): string {
  if (verb === 'invoke') {
    const tool = (t.invoke as Record<string, unknown> | undefined)?.tool
    return typeof tool === 'string' ? tool : 'tool'
  }
  if (verb === 'exec') {
    const cmd = (t.exec as Record<string, unknown> | undefined)?.command
    if (typeof cmd === 'string') return cmd.split(/\s+/)[0] || 'shell'
    if (Array.isArray(cmd) && typeof cmd[0] === 'string') return cmd[0]
    return 'shell'
  }
  if (verb === 'infer' || verb === 'agent') {
    const model = (t[verb] as Record<string, unknown> | undefined)?.model
    if (typeof model === 'string' && !model.includes('${{')) return model
    return verb === 'infer' ? 'prompt' : 'loop'
  }
  return '…'
}

export function parsePlan(src: string): ParsedPlan | null {
  let doc: unknown
  try {
    doc = parse(src)
  } catch {
    return null
  }
  if (!doc || typeof doc !== 'object') return null
  const rawTasks = (doc as Record<string, unknown>).tasks
  if (!Array.isArray(rawTasks)) return null

  const tasks: PlanTask[] = []
  const seen = new Set<string>()
  for (const rt of rawTasks) {
    if (!rt || typeof rt !== 'object') continue
    const t = rt as Record<string, unknown>
    const id = typeof t.id === 'string' && t.id.length > 0 ? t.id : null
    if (!id || seen.has(id)) continue /* the linter names dup/missing ids */
    seen.add(id)
    const verb = VERBS.find((v) => v in t) ?? null
    const deps = Array.isArray(t.depends_on)
      ? (t.depends_on as unknown[]).filter((d): d is string => typeof d === 'string')
      : []
    tasks.push({ id, verb, deps, target: targetOf(t, verb), gated: 'when' in t })
  }
  if (tasks.length === 0) return null

  const idset = new Set(tasks.map((t) => t.id))
  for (const t of tasks) t.deps = t.deps.filter((d) => idset.has(d) && d !== t.id)
  const edges = tasks.flatMap((t) => t.deps.map((from) => ({ from, to: t.id })))

  /* Kahn layering · wave(t) = 1 + max(wave(deps)) */
  const waveOf = new Map<string, number>()
  let remaining = tasks.slice()
  let cyclic = false
  for (let round = 0; remaining.length > 0; round++) {
    const ready = remaining.filter((t) => t.deps.every((d) => waveOf.has(d)))
    if (ready.length === 0) {
      cyclic = true
      break
    }
    for (const t of ready) waveOf.set(t.id, round)
    remaining = remaining.filter((t) => !waveOf.has(t.id))
  }

  let waves: PlanTask[][]
  if (cyclic) {
    /* file order fallback · every task visible, the lint says why */
    waves = tasks.map((t) => [t])
  } else {
    const count = Math.max(...[...waveOf.values()], 0) + 1
    waves = Array.from({ length: count }, () => [])
    for (const t of tasks) waves[waveOf.get(t.id) ?? 0].push(t)
  }
  return { tasks, waves, edges, cyclic }
}
