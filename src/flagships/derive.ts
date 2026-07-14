/* ─── derive · ONE derivation feeds every downstream beat ─────────────────────
   V5 law #1: the plan renderer, the replay sequencing and the boundary beat
   all re-render from the SELECTED file. This module is the single derivation
   YAML → { tasks · deps · waves · permits · outputs } they all consume, so a
   rendered plan can never drift from the text the hero shows.

   PURE LOGIC, line-based (regex, no YAML lib — the tokenizer doctrine): the
   flagship files are hand-shaped, and every derived fact is cross-verified
   against a real yaml-lib parse in src/flagships/derive.test.ts. Determinism:
   pure string ops, no I/O, SSR-safe. */

import type { NikaVerbName } from '../design-tokens.generated'

/** the verb vocabulary IS the SSOT's (design/tokens.yaml → generated) —
 *  a fifth verb cannot be typed here by construction */
export type NikaVerb = NikaVerbName

export interface FlagshipTask {
  id: string
  verb: NikaVerb
  /** upstream producers — tasks.X bound in with: (data) ∪ after: keys (control) */
  deps: string[]
  /** the raw when: expression when the task is gated (display verbatim) */
  when?: string
  /** the task fans out per item (declares for_each) */
  fanout?: boolean
  /** topological wave · deps always live in strictly-earlier waves */
  wave: number
  /** 1-based line of the task head (its map key line) in the file */
  line0: number
  /** 1-based last line of the task block */
  line1: number
  /** the human target chip: tool id · argv command · model id · turns cap */
  target: string
}

export interface FlagshipPermit {
  /** the permit family key (fs · net · exec · tools) */
  kind: string
  /** the raw line content after the key, trimmed (shown verbatim) */
  raw: string
  /** 1-based line in the file */
  line: number
}

export interface FlagshipPlanModel {
  workflow: string
  model: string
  tasks: FlagshipTask[]
  /** number of waves (columns of the plan) */
  waveCount: number
  /** tasks grouped by wave, file order preserved inside a wave */
  waves: FlagshipTask[][]
  permits: FlagshipPermit[]
  /** inclusive 1-based line range of the whole permits block */
  permitsRange: [number, number]
  outputs: string[]
}

const VERBS: readonly NikaVerb[] = ['infer', 'exec', 'invoke', 'agent']
const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g

/** indentation width (spaces) of a line */
function indentOf(line: string): number {
  const m = line.match(/^( *)/)
  return m ? m[1].length : 0
}

/* the two doors, line-scanned (W2 « the flow ») · a tasks.X reference inside
   the with: block is a DATA edge · an after: entry is a CONTROL edge — the
   precedence graph is exactly their union. tasks.* reads elsewhere in the
   block (on_error.recover · on_finally) are settled-record reads, NOT
   precedence, and never count as deps. */
function depsOf(body: string[]): string[] {
  const out: string[] = []
  const push = (id: string) => {
    if (!out.includes(id)) out.push(id)
  }
  let door: 'with' | 'after' | null = null
  for (const line of body) {
    if (line.trim() === '') continue
    const indent = indentOf(line)
    if (indent <= 4) door = null
    const head = line.match(/^ {4}(with|after):(.*)$/)
    if (head) {
      door = head[1] as 'with' | 'after'
      const rest = head[2]
      if (door === 'with') for (const m of rest.matchAll(TASK_REF)) push(m[1])
      else for (const m of rest.matchAll(/([a-z][a-z0-9_]*)\s*:/g)) push(m[1])
      continue
    }
    if (door === 'with' && indent > 4) {
      for (const m of line.matchAll(TASK_REF)) push(m[1])
    } else if (door === 'after' && indent > 4) {
      const k = line.match(/^\s+([a-z][a-z0-9_]*)\s*:/)
      if (k) push(k[1])
    }
  }
  return out
}

/** extract the human target chip for a task block, per verb */
function targetOf(verb: NikaVerb, block: string, model: string): string {
  switch (verb) {
    case 'invoke': {
      const m = block.match(/tool:\s*"?([^",\s}]+)/)
      return m ? m[1] : 'tool'
    }
    case 'exec': {
      const arr = block.match(/command:\s*\[([^\]]*)\]/)
      if (arr) {
        return arr[1]
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .join(' ')
      }
      const str = block.match(/command:\s*"([^"]*)"/)
      return str ? str[1] : 'sh'
    }
    case 'infer':
      return model
    case 'agent': {
      const m = block.match(/max_turns:\s*(\d+)/)
      return m ? `${model} · ≤${m[1]} turns` : model
    }
  }
}

/** derive the plan model from a flagship file (see module doc) */
export function deriveWorkflow(yaml: string): FlagshipPlanModel {
  const lines = yaml.split('\n')

  let workflow = ''
  let model = ''
  const permits: FlagshipPermit[] = []
  let permitsRange: [number, number] = [0, 0]
  const outputs: string[] = []

  /* raw task records before wave assignment */
  interface Raw {
    id: string
    line0: number
    line1: number
    body: string[]
  }
  const raws: Raw[] = []

  type Section = '' | 'permits' | 'tasks' | 'outputs' | 'workflow'
  let section: Section = ''
  let current: Raw | null = null

  const closeTask = (endLine: number) => {
    if (current) {
      current.line1 = endLine
      raws.push(current)
      current = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const n = i + 1 // 1-based
    if (line.trim() === '') continue
    const indent = indentOf(line)

    /* top-level keys switch sections */
    if (indent === 0) {
      const top = line.match(/^([a-z_]+):(.*)$/)
      if (top) {
        closeTask(n - 1)
        const [, key, rest] = top
        section = key === 'permits' || key === 'tasks' || key === 'outputs' || key === 'workflow' ? key : ''
        if (key === 'workflow' && rest.trim()) workflow = rest.trim()
        if (key === 'model') model = rest.replace(/#.*$/, '').trim()
        if (key === 'permits') permitsRange = [n, n]
        continue
      }
    }

    if (section === 'workflow') {
      /* W1: the identity object — the display name is its id: field */
      const row = line.match(/^ {2}id:\s*(.+?)\s*(?:#.*)?$/)
      if (row) workflow = row[1]
      continue
    }

    if (section === 'permits') {
      const row = line.match(/^ {2}([a-z]+):(.*)$/)
      if (row) permits.push({ kind: row[1], raw: row[2].trim(), line: n })
      permitsRange = [permitsRange[0], n]
      continue
    }

    if (section === 'outputs') {
      const row = line.match(/^ {2}([A-Za-z0-9_-]+):/)
      if (row) outputs.push(row[1])
      continue
    }

    if (section === 'tasks') {
      /* W1 « the map »: a task opens at its indent-2 key — bare (block
         body follows) or with an inline flow body on the same line */
      const head = line.match(/^ {2}([a-z][a-z0-9_]*):(?:\s*(?:\{.*)?)?(?:\s*#.*)?$/)
      if (head) {
        closeTask(n - 1)
        current = { id: head[1], line0: n, line1: n, body: [line] }
      } else if (current) {
        current.body.push(line)
        current.line1 = n
      }
    }
  }
  closeTask(lines.length)

  /* per-task facts from the collected block */
  const parsed = raws.map((raw) => {
    const block = raw.body.join('\n')
    const deps = depsOf(raw.body)
    const verb = VERBS.find((v) => new RegExp(`(?:^|[\\s{])${v}:`, 'm').test(block))
    if (!verb) throw new Error(`flagship task "${raw.id}" declares no verb`)
    const whenM = block.match(/when:\s*(.+?)\s*$/m)
    const fanout = /^\s*for_each:/m.test(block)
    return {
      id: raw.id,
      verb,
      deps,
      ...(whenM ? { when: whenM[1] } : {}),
      ...(fanout ? { fanout: true } : {}),
      wave: -1,
      line0: raw.line0,
      line1: raw.line1,
      target: targetOf(verb, block, model),
    } satisfies FlagshipTask
  })

  /* topological waves · wave = 1 + max(dep waves); roots sit at 0. The files
     are checked DAGs (the `nika check` gate) — a missing dep is a hard error. */
  const byId = new Map(parsed.map((t) => [t.id, t]))
  const waveOf = (id: string, seen: Set<string>): number => {
    const t = byId.get(id)
    if (!t) throw new Error(`flagship dep "${id}" names no task`)
    if (t.wave >= 0) return t.wave
    if (seen.has(id)) throw new Error(`flagship dep cycle through "${id}"`)
    seen.add(id)
    t.wave = t.deps.length === 0 ? 0 : 1 + Math.max(...t.deps.map((d) => waveOf(d, seen)))
    return t.wave
  }
  for (const t of parsed) waveOf(t.id, new Set())

  const waveCount = 1 + Math.max(...parsed.map((t) => t.wave))
  const waves: FlagshipTask[][] = Array.from({ length: waveCount }, () => [])
  for (const t of parsed) waves[t.wave].push(t)

  return { workflow, model, tasks: parsed, waveCount, waves, permits, permitsRange, outputs }
}
