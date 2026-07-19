/* ─── parse-plan · yaml → the live plan (W12b · E1) ───────────────────────────
   The playground's DAG extractor: real YAML (the same `yaml` parser the
   linter ships) → tasks, dependency edges, and Kahn-layered waves — the
   exact shape the flat DAG renders. TOLERANT by contract: mid-edit sources
   return null and the caller keeps the last valid plan on screen (dimmed),
   so the picture never flickers while you type.

   Honesty notes · a cycle can't be layered: `cyclic` flips true and the
   waves fall back to file order (the linter's NIKA-DAG-001 carries the
   message). Unknown depends_on targets don't edge (NIKA-DAG-002 speaks).

   0.104 · the shipped W2 grammar: edges are DECLARED — depends_on carries
   the whole precedence graph (the engine refuses an undeclared tasks.X
   edge — G_p = E_d ∪ E_c (the binding IS the edge · no invisible edges). */
import { parse } from 'yaml'

export type PlanVerb = 'infer' | 'exec' | 'invoke' | 'agent'
const VERBS: readonly PlanVerb[] = ['infer', 'exec', 'invoke', 'agent']

export interface PlanTask {
  id: string
  /** the ONE verb, or null while the task is still being written */
  verb: PlanVerb | null
  /** resolved producers — the declared depends_on list, file order */
  deps: string[]
  /** 1-based line of the task's `- id:` head (0 = unknown · U5 sync) */
  line0: number
  /** 1-based last line of the task block (inclusive · U5 sync) */
  line1: number
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

/** the declared producers (W2 · depends_on IS the precedence graph) */
function producersOf(t: Record<string, unknown>): string[] {
  return Array.isArray(t.depends_on)
    ? (t.depends_on as unknown[]).filter((d): d is string => typeof d === 'string')
    : []
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
  // 0.104 « the sequence »: tasks is a LIST · each item declares its id.
  if (!Array.isArray(rawTasks)) return null

  /* the line pins (U5 · editor↔DAG sync): a light scan for each `- id:`
     head — the same tokenizer doctrine as the flagship derivation; a block
     runs to the line before the next head (or the next top-level key) */
  const srcLines = src.split('\n')
  const heads: { id: string; line: number }[] = []
  let inTasks = false
  srcLines.forEach((l, i) => {
    if (/^[A-Za-z0-9_-]+\s*:/.test(l)) inTasks = /^tasks\s*:/.test(l)
    const m = inTasks
      ? (/^ {2}- id:\s*([a-z][a-z0-9_]*)/.exec(l) ?? /^ {2}- \{ id:\s*([a-z][a-z0-9_]*)/.exec(l))
      : null
    if (m) heads.push({ id: m[1], line: i + 1 })
  })
  const lineSpanOf = (id: string): [number, number] => {
    const at = heads.findIndex((h) => h.id === id)
    if (at === -1) return [0, 0]
    let end = at + 1 < heads.length ? heads[at + 1].line - 1 : srcLines.length
    while (end > heads[at].line && srcLines[end - 1].trim() === '') end -= 1
    return [heads[at].line, end]
  }

  const tasks: PlanTask[] = []
  const seen = new Set<string>()
  for (const rt of rawTasks) {
    if (!rt || typeof rt !== 'object') continue
    const t = rt as Record<string, unknown>
    const id = typeof t.id === 'string' ? t.id : ''
    if (!id || seen.has(id)) continue
    seen.add(id)
    const verb = VERBS.find((v) => v in t) ?? null
    const [line0, line1] = lineSpanOf(id)
    tasks.push({ id, verb, deps: producersOf(t), target: targetOf(t, verb), gated: 'when' in t, line0, line1 })
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
