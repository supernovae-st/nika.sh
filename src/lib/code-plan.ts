import type { FlagshipPlanModel, FlagshipTask } from '../flagships/derive'
import { NIKA_VERBS, type NikaVerb } from '../components/codefile-highlight'

/* ─── code-plan · a plan model for ANY yaml a CodeFile shows ──────────────────
   The minimap used to belong to the hero alone, because only the hero had a
   plan: the flagships ship a derived FlagshipPlanModel and everything else
   rendered a bare CodeFile. The site therefore taught the plan grammar on one
   surface out of thirty (operator 2026-07-27: « tous les yaml du site, même
   design, même minimap, même interaction »).

   This closes it from the other end — derive the plan from the BYTES, so any
   block can carry one. Two tiers, and the second is the point:

     1 · a COMPLETE workflow (`tasks:` is a map) lays out properly: real ids,
         real edges read from the tasks.X references, real waves.
     2 · a FRAGMENT (a verb block lifted out of a file for teaching) has no
         tasks map and no edges. It still names a verb, so it still draws:
         one node per verb occurrence, one wave.

   Tier 2 is deliberately a SKETCH and says so by shape — a fragment has no
   dependencies to show, so a single row of nodes is the honest drawing. The
   alternative was to leave two thirds of the site's yaml undiagrammed.

   Kept regex-only on purpose: this runs for every CodeFile on the page and
   must not pull a YAML parser into the initial graph (the budget sits within
   a kilobyte of its ceiling). The layered parse already lives in
   lib/parse-plan for the playground, which can afford it. */

const VERB_SET = new Set<string>(NIKA_VERBS)

/** the enclosing task id for a verb line: the nearest shallower `key:` above */
function ownerOf(lines: string[], at: number, indent: number): string | null {
  for (let i = at - 1; i >= 0; i -= 1) {
    const l = lines[i]
    if (!l.trim() || l.trim().startsWith('#')) continue
    const m = /^(\s*)([A-Za-z0-9_-]+)\s*:/.exec(l)
    if (!m) continue
    const ind = m[1].length
    if (ind < indent) {
      const key = m[2]
      return VERB_SET.has(key) || key === 'tasks' ? null : key
    }
  }
  return null
}

/** tier 2 · a fragment sketch: one node per verb block, a single wave */
function sketch(yaml: string): FlagshipPlanModel | null {
  const lines = yaml.replace(/\r\n/g, '\n').split('\n')
  const tasks: FlagshipTask[] = []
  const used = new Set<string>()
  lines.forEach((line, i) => {
    const m = /^(\s*)(?:[-]\s+)?([a-z_]+)\s*:/.exec(line)
    if (!m) return
    const pad = m[1]
    const key = m[2]
    if (!VERB_SET.has(key)) return
    const verb = key as NikaVerb
    let id = ownerOf(lines, i, pad.length) ?? verb
    if (used.has(id)) id = `${id} ${used.size + 1}`
    used.add(id)
    tasks.push({ id, verb, target: verb, deps: [], wave: 0, line0: i + 1, line1: i + 1 })
  })
  if (tasks.length === 0 || tasks.length > 12) return null
  return {
    workflow: '',
    model: '',
    tasks,
    waveCount: 1,
    waves: [tasks],
    permits: [],
    permitsRange: [0, 0],
    outputs: [],
  }
}

/** tier 1 · a complete workflow (`tasks:` map) laid out with real waves */
function full(yaml: string): FlagshipPlanModel | null {
  const lines = yaml.replace(/\r\n/g, '\n').split('\n')
  const heads: { id: string; line: number }[] = []
  let inTasks = false
  let tasksIndent = -1
  lines.forEach((l, i) => {
    const top = /^(\s*)([A-Za-z0-9_-]+)\s*:/.exec(l)
    if (top && top[1].length === 0) {
      inTasks = top[2] === 'tasks'
      tasksIndent = -1
      return
    }
    if (!inTasks) return
    const m = /^(\s+)([a-z][a-z0-9_]*)\s*:/.exec(l)
    if (!m) return
    const ind = m[1].length
    if (tasksIndent === -1) tasksIndent = ind
    if (ind !== tasksIndent) return
    heads.push({ id: m[2], line: i + 1 })
  })
  if (heads.length === 0) return null

  const spanOf = (k: number): [number, number] => {
    const start = heads[k].line
    let end = k + 1 < heads.length ? heads[k + 1].line - 1 : lines.length
    while (end > start && !lines[end - 1].trim()) end -= 1
    return [start, end]
  }

  const ids = new Set(heads.map((h) => h.id))
  const raw: FlagshipTask[] = heads.map((h, k) => {
    const [line0, line1] = spanOf(k)
    const body = lines.slice(line0 - 1, line1).join('\n')
    const found = NIKA_VERBS.find((v) => new RegExp('(^|\\s)' + v + '\\s*:', 'm').test(body))
    const deps = [...new Set([...body.matchAll(/tasks\.([a-z][a-z0-9_]*)/g)].map((x) => x[1]))].filter(
      (d) => ids.has(d) && d !== h.id,
    )
    return {
      id: h.id,
      verb: (found ?? 'invoke') as NikaVerb,
      /* the chip label · chipTarget owns the rich one for the flagships;
         a derived plan shows the verb, which is all the bytes promise */
      target: (found ?? 'invoke') as string,
      deps,
      wave: 0,
      line0,
      line1,
      when: /(^|\s)when\s*:/m.test(body) ? '' : undefined,
      fanout: /(^|\s)for_each\s*:/m.test(body) || undefined,
    }
  })

  /* Kahn layering — wave(t) = 1 + max(wave(deps)); a cycle stops the climb */
  const wave = new Map<string, number>()
  let left = raw.slice()
  let guard = 0
  while (left.length && guard < 40) {
    guard += 1
    const ready = left.filter((t) => t.deps.every((d) => wave.has(d)))
    if (!ready.length) break
    for (const t of ready) {
      wave.set(t.id, t.deps.length ? Math.max(...t.deps.map((d) => wave.get(d) ?? 0)) + 1 : 0)
    }
    left = left.filter((t) => !wave.has(t.id))
  }
  for (const t of left) wave.set(t.id, 0)
  const tasks = raw.map((t) => ({ ...t, wave: wave.get(t.id) ?? 0 }))
  const waveCount = Math.max(...tasks.map((t) => t.wave)) + 1
  const waves: FlagshipTask[][] = Array.from({ length: waveCount }, () => [])
  for (const t of tasks) waves[t.wave].push(t)

  return {
    workflow: /^workflow:\s*\n\s+id:\s*(\S+)/m.exec(yaml)?.[1] ?? '',
    model: /^model:\s*(\S+)/m.exec(yaml)?.[1] ?? '',
    tasks,
    waveCount,
    waves,
    permits: [],
    permitsRange: [0, 0],
    outputs: [],
  }
}

/** the plan a CodeFile can draw for this yaml, or null when there is none */
export function planForCode(yaml: string): FlagshipPlanModel | null {
  if (!yaml || yaml.length > 20000) return null
  return full(yaml) ?? sketch(yaml)
}
