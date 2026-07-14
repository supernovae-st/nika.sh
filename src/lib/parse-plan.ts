/* ─── parse-plan · yaml → the live plan (W12b · E1) ───────────────────────────
   The playground's DAG extractor: real YAML (the same `yaml` parser the
   linter ships) → tasks, dependency edges, and Kahn-layered waves — the
   exact shape the flat DAG renders. TOLERANT by contract: mid-edit sources
   return null and the caller keeps the last valid plan on screen (dimmed),
   so the picture never flickers while you type.

   Honesty notes · a cycle can't be layered: `cyclic` flips true and the
   waves fall back to file order (the linter's NIKA-DAG-001 carries the
   message). Unknown with:/after: targets don't edge (NIKA-DAG-002 speaks).

   W2 « the flow » · edges are DERIVED from the two doors: every tasks.X
   reference in a with: value is a data edge, every after: key a control
   edge — G_p = E_d ∪ E_c (the binding IS the edge · no invisible edges). */
import { parse } from 'yaml'

export type PlanVerb = 'infer' | 'exec' | 'invoke' | 'agent'
const VERBS: readonly PlanVerb[] = ['infer', 'exec', 'invoke', 'agent']

export interface PlanTask {
  id: string
  /** the ONE verb, or null while the task is still being written */
  verb: PlanVerb | null
  /** resolved producers — with: bindings (data) ∪ after: keys (control) */
  deps: string[]
  /** the card's third line — tool / argv head / model register */
  target: string
  /** a when: gate is declared */
  gated: boolean
}

export interface PlanPermits {
  fsRead: string[]
  fsWrite: string[]
  tools: string[]
  /** argv allow-list, or the blanket boolean */
  exec: string[] | boolean
  hosts: string[]
}

export interface ParsedPlan {
  tasks: PlanTask[]
  /** Kahn layers (parallel tasks share a wave) · file order when cyclic */
  waves: PlanTask[][]
  edges: { from: string; to: string }[]
  cyclic: boolean
  /** the declared boundary · null when the file declares none */
  permits: PlanPermits | null
}

const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g

function* strings(value: unknown): Generator<string> {
  if (typeof value === 'string') yield value
  else if (Array.isArray(value)) for (const v of value) yield* strings(v)
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) yield* strings(v)
}

/** the two doors → the producers (W2) · with: refs = data · after: keys = control */
function producersOf(t: Record<string, unknown>): string[] {
  const out = new Set<string>()
  for (const s of strings(t.with)) for (const m of s.matchAll(TASK_REF)) out.add(m[1])
  if (t.after && typeof t.after === 'object' && !Array.isArray(t.after))
    for (const k of Object.keys(t.after as object)) out.add(k)
  return [...out]
}

function permitsOf(doc: Record<string, unknown>): PlanPermits | null {
  const p = doc.permits
  if (!p || typeof p !== 'object') return null
  const pm = p as Record<string, unknown>
  const fs = (pm.fs ?? {}) as Record<string, unknown>
  const net = (pm.net ?? {}) as Record<string, unknown>
  return {
    fsRead: strs(fs.read),
    fsWrite: strs(fs.write),
    tools: strs(pm.tools),
    exec: pm.exec === true ? true : Array.isArray(pm.exec) ? strs(pm.exec) : false,
    hosts: strs(net.http),
  }
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
  // W1 « the map »: tasks is a MAP whose key IS the identity.
  if (!rawTasks || typeof rawTasks !== 'object' || Array.isArray(rawTasks)) return null

  const tasks: PlanTask[] = []
  const seen = new Set<string>()
  for (const [id, rt] of Object.entries(rawTasks as Record<string, unknown>)) {
    if (!rt || typeof rt !== 'object') continue
    const t = rt as Record<string, unknown>
    if (!id || seen.has(id)) continue
    seen.add(id)
    const verb = VERBS.find((v) => v in t) ?? null
    tasks.push({ id, verb, deps: producersOf(t), target: targetOf(t, verb), gated: 'when' in t })
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
  return { tasks, waves, edges, cyclic, permits: permitsOf(doc as Record<string, unknown>) }
}
