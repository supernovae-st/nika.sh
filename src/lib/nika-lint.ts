/* ─── nika-lint · the oracle's static checks, in the browser ────────────────
   A TypeScript port of the conformance cross-refs + the eight hard rules
   (docs.nika.sh/guides/agent-authoring). Same NIKA codes, same fix lines —
   the playground teaches with the engine's own vocabulary. Line numbers
   come from a light scanner over the source text (task blocks + envelope
   keys), not a CST: precise enough to put the squiggle on the right task.
   Note · 'exec' below is the Nika VERB (a yaml key) — nothing here runs
   anything; this module is a pure linter. */
import { parse } from 'yaml'
import { CANON } from '../canon.generated'

export interface LintDiag {
  line: number // 1-based
  code: string
  message: string
  fix: string
}

interface Task {
  id?: unknown
  depends_on?: unknown
  when?: unknown
  for_each?: unknown
  [k: string]: unknown
}

const VERBS = ['infer', 'exec', 'invoke', 'agent'] as const
const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g
const EXPR_BODY = /\$\{\{(.*?)\}\}/gs
const ROOT_ID = /(?<![.\w])([A-Za-z_][A-Za-z0-9_]*)(?:\.([A-Za-z_][A-Za-z0-9_]*))?/g
const CEL_BUILTINS = new Set(['true', 'false', 'null', 'in', 'size'])
const LOOP_LOCALS = new Set(['item', 'index'])
const NAMESPACES = new Set(['vars', 'with', 'tasks', 'env', 'secrets'])
const PROVIDERS = new Set<string>([
  ...CANON.providerIdsCloud,
  ...CANON.providerIdsLocal,
  ...CANON.providerIdsTest,
])

/** 1-based line of each `- id: <name>` task opener (mirrors the projector) */
function taskLines(src: string): Map<string, number> {
  const out = new Map<string, number>()
  src.split('\n').forEach((l, i) => {
    const m = /^ {2}- id: ([a-z][a-z0-9_-]*)\s*$/.exec(l)
    if (m && !out.has(m[1])) out.set(m[1], i + 1)
  })
  return out
}

function keyLine(src: string, key: string): number {
  const i = src.split('\n').findIndex((l) => l.startsWith(`${key}:`))
  return i === -1 ? 1 : i + 1
}

function* strings(value: unknown): Generator<string> {
  if (typeof value === 'string') yield value
  else if (Array.isArray(value)) for (const v of value) yield* strings(v)
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) yield* strings(v)
}

function exprBodies(value: unknown): string[] {
  const out: string[] = []
  for (const s of strings(value))
    for (const m of s.matchAll(EXPR_BODY)) out.push(m[1].replace(/'[^']*'|"[^"]*"/g, ' '))
  return out
}

export function lintNika(src: string): LintDiag[] {
  const diags: LintDiag[] = []
  const lines = taskLines(src)
  const at = (id: string | undefined) => (id && lines.get(id)) || 1

  let doc: Record<string, unknown>
  try {
    doc = parse(src) as Record<string, unknown>
  } catch (e) {
    const mark = /at line (\d+)/.exec(String(e))
    return [{
      line: mark ? Number(mark[1]) : 1,
      code: 'NIKA-PARSE',
      message: `YAML does not parse · ${String(e).split('\n')[0].slice(0, 110)}`,
      fix: 'fix the YAML syntax first — nothing else can be checked',
    }]
  }
  if (!doc || typeof doc !== 'object') {
    return [{ line: 1, code: 'NIKA-PARSE', message: 'the file is not a YAML mapping', fix: 'start from a template' }]
  }

  // ── envelope ──
  if (doc.nika !== 'v1')
    diags.push({ line: 1, code: 'NIKA-PARSE', message: '`nika: v1` is required — the exact value, first line', fix: 'add `nika: v1` at the top' })
  if (typeof doc.workflow !== 'string' || !/^[a-z][a-z0-9-]*$/.test(doc.workflow))
    diags.push({ line: keyLine(src, 'workflow'), code: 'NIKA-PARSE', message: '`workflow:` must be kebab-case', fix: 'e.g. `workflow: my-job`' })

  const tasks = (Array.isArray(doc.tasks) ? doc.tasks : []) as Task[]
  if (!Array.isArray(doc.tasks) || tasks.length === 0)
    diags.push({ line: keyLine(src, 'tasks'), code: 'NIKA-PARSE', message: 'a workflow needs a non-empty `tasks:` list', fix: 'add at least one task' })

  const ids = tasks.map((t) => t?.id).filter((i): i is string => typeof i === 'string')
  const idset = new Set(ids)

  // model: provider prefix (envelope + per-task overrides)
  const checkModel = (model: unknown, line: number) => {
    if (typeof model !== 'string' || model.includes('${{')) return
    const [prefix, ...rest] = model.split('/')
    if (rest.length === 0 || rest.join('/') === '')
      diags.push({ line, code: 'NIKA-PROVIDER', message: `model '${model}' is not <provider>/<name>`, fix: 'the provider is the prefix · e.g. `mock/echo`' })
    else if (!PROVIDERS.has(prefix))
      diags.push({ line, code: 'NIKA-PROVIDER', message: `unknown provider '${prefix}'`, fix: `one of · ${[...PROVIDERS].join(' · ')}` })
  }
  checkModel(doc.model, keyLine(src, 'model'))

  const seen = new Set<string>()
  for (const t of tasks) {
    if (!t || typeof t !== 'object') continue
    const id = typeof t.id === 'string' ? t.id : undefined
    const line = at(id)

    // ids · snake_case + unique
    if (!id || !/^[a-z][a-z0-9_]*$/.test(id))
      diags.push({ line, code: 'NIKA-PARSE', message: `task id ${JSON.stringify(t.id)} must be snake_case`, fix: 'a hyphen is CEL subtraction — use _' })
    if (id) {
      if (seen.has(id)) diags.push({ line, code: 'NIKA-PARSE', message: `duplicate task id '${id}'`, fix: 'rename one of them' })
      seen.add(id)
    }

    // exactly one verb
    const verbs = VERBS.filter((v) => v in t)
    if (verbs.length !== 1)
      diags.push({ line, code: 'NIKA-PARSE', message: verbs.length === 0 ? `task '${id}' has no verb` : `task '${id}' has ${verbs.length} verbs (${verbs.join(' + ')})`, fix: 'exactly one of infer · exec · invoke · agent' })

    for (const v of ['infer', 'agent'] as const) {
      const body = t[v]
      if (body && typeof body === 'object') checkModel((body as Record<string, unknown>).model, line)
    }

    // DAG-003 · every tasks.X reference needs depends_on
    const declared = new Set(Array.isArray(t.depends_on) ? (t.depends_on as string[]) : [])
    const refs = new Set<string>()
    for (const field of ['when', 'with', 'for_each', 'infer', 'exec', 'invoke', 'agent'])
      for (const body of exprBodies(t[field]))
        for (const m of body.matchAll(TASK_REF)) refs.add(m[1])
    for (const r of refs)
      if (idset.has(r) && !declared.has(r))
        diags.push({ line, code: 'NIKA-DAG-003', message: `task '${id}' references tasks.${r} without an edge`, fix: `add depends_on: [${r}]` })

    // DAG-002 · depends_on must resolve
    for (const dep of declared)
      if (!idset.has(dep))
        diags.push({ line, code: 'NIKA-DAG-002', message: `depends_on '${dep}' is not a task`, fix: 'fix the name or add the task' })

    // VAR-001 · roots must resolve
    const vars = new Set(Object.keys((doc.vars as object) || {}))
    const env = new Set(Object.keys((doc.env as object) || {}))
    const secrets = new Set(Object.keys((doc.secrets as object) || {}))
    const withKeys = new Set(Object.keys((t.with as object) || {}))
    const inForEach = 'for_each' in t
    for (const body of exprBodies(t))
      for (const m of body.matchAll(ROOT_ID)) {
        const [, root, seg] = m
        if (CEL_BUILTINS.has(root)) continue
        if (LOOP_LOCALS.has(root)) {
          if (!inForEach)
            diags.push({ line, code: 'NIKA-VAR-001', message: `'${root}' is a for_each loop-local — no for_each on '${id}'`, fix: 'add for_each: or use a namespace' })
        } else if (root === 'vars' && seg && !vars.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `vars.${seg} is not declared`, fix: `declare it under vars:` })
        else if (root === 'env' && seg && !env.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `env.${seg} is not declared`, fix: 'declare it under env:' })
        else if (root === 'secrets' && seg && !secrets.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `secrets.${seg} is not declared`, fix: 'declare it under secrets:' })
        else if (root === 'with' && seg && !withKeys.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `with.${seg} is not in this task's with:`, fix: 'add it to with:' })
        else if (root === 'tasks' && seg && !idset.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `tasks.${seg} does not exist`, fix: 'fix the task name' })
        else if (seg && !NAMESPACES.has(root) && !LOOP_LOCALS.has(root))
          diags.push({ line, code: 'NIKA-VAR-001', message: `'${root}.${seg}' uses an unknown namespace`, fix: 'the five namespaces · vars with tasks env secrets' })
      }

    // hard rule 6 · write needs content
    const inv = t.invoke as Record<string, unknown> | undefined
    if (inv && typeof inv === 'object' && inv.tool === 'nika:write') {
      const args = (inv.args as Record<string, unknown>) || {}
      if (!('content' in args))
        diags.push({ line, code: 'NIKA-BUILTIN', message: `task '${id}' · nika:write without content:`, fix: 'a write without content writes nothing' })
    }
    // hard rule 7 · done only in agent.tools
    if (inv && typeof inv === 'object' && inv.tool === 'nika:done')
      diags.push({ line, code: 'NIKA-BUILTIN', message: 'nika:done outside an agent loop', fix: 'it is the loop sentinel — grant it in agent.tools instead' })

    // hard rule 4 · when: should look boolean
    if (typeof t.when === 'string') {
      const body = [...t.when.matchAll(EXPR_BODY)].map((m) => m[1]).join(' ')
      if (body && !/[=!<>]|&&|\|\||\bin\b|size\s*\(|^\s*!/.test(body))
        diags.push({ line, code: 'NIKA-VAR', message: `when: on '${id}' is not boolean-shaped`, fix: 'compare something · e.g. ${{ vars.x > 0 }}' })
    }
  }

  // DAG-001 · cycles
  const graph = new Map(tasks.filter((t) => typeof t?.id === 'string').map((t) => [t.id as string, (Array.isArray(t.depends_on) ? (t.depends_on as string[]) : []).filter((d) => idset.has(d))]))
  const color = new Map<string, number>()
  const dfs = (n: string): boolean => {
    color.set(n, 1)
    for (const m of graph.get(n) || []) {
      if (color.get(m) === 1) return true
      if (!color.has(m) && dfs(m)) return true
    }
    color.set(n, 2)
    return false
  }
  for (const n of graph.keys())
    if (!color.has(n) && dfs(n)) {
      diags.push({ line: at(n), code: 'NIKA-DAG-001', message: 'cycle in depends_on', fix: 'remove the back-edge — a DAG has no loops' })
      break
    }

  return diags.sort((a, b) => a.line - b.line)
}
