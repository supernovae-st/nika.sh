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

/** the EXACT codes this port can emit ('NIKA-PARSE' bare = the envelope
    catch-all, spec latitude) — the conformance replay
    (nika-lint-conformance.test.ts) reads this to scope its assertions,
    and the I8 wasm parity gate inherits the same list. Extending the
    port = extending this, and the corpus judges the claim. */
export const LINT_COVERAGE = [
  'NIKA-PARSE',
  'NIKA-PARSE-024',
  'NIKA-DAG-001',
  'NIKA-DAG-002',
  'NIKA-DAG-004',
  'NIKA-DAG-005',
  'NIKA-VAR-001',
  'NIKA-VAR-005',
  'NIKA-VAR-008',
  'NIKA-VAR-021',
  'NIKA-SEC-004',
  'NIKA-BUILTIN-DONE-001',
] as const

/* ─── the oracle seam (WO-11 · U3 · the I8 contract, born early) ─────────────
   The day the engine ships its wasm check artifact it registers
   window.NikaOracle; every judge-surface on the site PREFERS the oracle
   and falls back to this port — the site becomes truer without a line of
   site code changing. checkNika is the ONE door the call-sites use. */
export interface NikaOracle {
  /** the real `nika check` verdict · findings in check --json shape */
  check(src: string): LintDiag[]
}

export function checkNika(src: string): LintDiag[] {
  const oracle = (globalThis as { NikaOracle?: NikaOracle }).NikaOracle
  if (oracle) {
    try {
      return oracle.check(src)
    } catch {
      /* a broken oracle never breaks the page — the port stays the floor */
    }
  }
  return lintNika(src)
}

interface Task {
  id?: unknown
  with?: unknown
  after?: unknown
  when?: unknown
  for_each?: unknown
  [k: string]: unknown
}

const AFTER_PREDICATES = ['succeeded', 'failed', 'skipped', 'terminal'] as const

const VERBS = ['infer', 'exec', 'invoke', 'agent'] as const
const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g
const EXPR_BODY = /(?<!\\)\$\{\{(.*?)\}\}/gs
const EXPR_OPEN = /(?<!\\)\$\{\{/g
const DURATION = /^([0-9]+(\.[0-9]+)?(ns|us|µs|ms|s|m|h))+$/
const ROOT_ID = /(?<![.\w])([A-Za-z_][A-Za-z0-9_]*)(?:\.([A-Za-z_][A-Za-z0-9_]*))?/g
const CEL_BUILTINS = new Set(['true', 'false', 'null', 'in', 'size'])
const LOOP_LOCALS = new Set(['item', 'index'])
const NAMESPACES = new Set(['vars', 'with', 'tasks', 'env', 'secrets'])
const PROVIDERS = new Set<string>([
  ...CANON.providerIdsCloud,
  ...CANON.providerIdsLocal,
  ...CANON.providerIdsTest,
])

/** 1-based line of each task map key (mirrors the projector · W1). */
function taskLines(src: string): Map<string, number> {
  const out = new Map<string, number>()
  let inTasks = false
  src.split('\n').forEach((l, i) => {
    if (/^[A-Za-z0-9_-]+\s*:/.test(l)) inTasks = /^tasks\s*:/.test(l)
    const m = inTasks ? /^ {2}([a-z][a-z0-9_-]*)\s*:\s*(?:#.*)?$/.exec(l) : null
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
      fix: 'fix the YAML syntax first · nothing else can be checked',
    }]
  }
  if (!doc || typeof doc !== 'object') {
    return [{ line: 1, code: 'NIKA-PARSE', message: 'the file is not a YAML mapping', fix: 'start from a template' }]
  }

  // ── envelope ──
  if (doc.nika !== 'v1')
    diags.push({ line: 1, code: 'NIKA-PARSE', message: '`nika: v1` is required · the exact value, first line', fix: 'add `nika: v1` at the top' })
  const wfObj = (doc.workflow && typeof doc.workflow === 'object' && !Array.isArray(doc.workflow))
    ? (doc.workflow as Record<string, unknown>)
    : null
  if (!wfObj || typeof wfObj.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(wfObj.id))
    diags.push({ line: keyLine(src, 'workflow'), code: 'NIKA-PARSE', message: '`workflow:` is an object · `id:` must be kebab-case', fix: 'e.g. `workflow:` then `  id: my-job`' })

  // W1 « the map »: tasks is a MAP · the key IS the identity.
  const tasksMap = (doc.tasks && typeof doc.tasks === 'object' && !Array.isArray(doc.tasks))
    ? (doc.tasks as Record<string, Task>)
    : null
  const entries: Array<[string, Task]> = tasksMap ? Object.entries(tasksMap) : []
  if (!tasksMap || entries.length === 0)
    diags.push({ line: keyLine(src, 'tasks'), code: 'NIKA-PARSE', message: 'a workflow needs a non-empty `tasks:` map', fix: 'add at least one task (`name:` under tasks)' })

  const ids = entries.map(([id]) => id)
  const idset = new Set(ids)

  /* W2 « the flow » · a task's producers are its two doors — every tasks.X
     reference in a with: value is a DATA edge, every after: key a CONTROL
     edge. G_p = E_d ∪ E_c (the binding IS the edge · no invisible edges). */
  const producersOf = (t: Task | null | undefined): string[] => {
    if (!t || typeof t !== 'object') return []
    const out = new Set<string>()
    for (const body of exprBodies(t.with))
      for (const m of body.matchAll(TASK_REF)) out.add(m[1])
    if (t.after && typeof t.after === 'object' && !Array.isArray(t.after))
      for (const k of Object.keys(t.after as object)) out.add(k)
    return [...out].filter((d) => idset.has(d))
  }

  // model: provider prefix (envelope + per-task overrides)
  const checkModel = (model: unknown, line: number) => {
    if (typeof model !== 'string' || model.includes('${{')) return
    const [prefix, ...rest] = model.split('/')
    if (rest.length === 0 || rest.join('/') === '')
      diags.push({ line, code: 'NIKA-PROVIDER', message: `model '${model}' is not <provider>/<name>`, fix: 'the provider is the prefix · e.g. `ollama/llama3.2:3b`' })
    else if (!PROVIDERS.has(prefix))
      diags.push({ line, code: 'NIKA-PROVIDER', message: `unknown provider '${prefix}'`, fix: `one of · ${[...PROVIDERS].join(' · ')}` })
  }
  checkModel(doc.model, keyLine(src, 'model'))

  for (const [id, t] of entries) {
    if (!t || typeof t !== 'object') continue
    const line = at(id)

    // ids · snake_case (uniqueness is structural: map keys cannot repeat)
    if (!/^[a-z][a-z0-9_]*$/.test(id))
      diags.push({ line, code: 'NIKA-PARSE', message: `task id ${JSON.stringify(id)} must be snake_case`, fix: 'a hyphen is CEL subtraction · use _' })

    // timeout: quoted Go-duration (used by task · wait · on_finally rules below)
    const checkDuration = (v: unknown, whereFix: string) => {
      if (typeof v === 'number')
        diags.push({ line, code: 'NIKA-PARSE', message: `timeout ${v} is a number · must be a quoted duration`, fix: `write "${v}s" (${whereFix})` })
      else if (typeof v === 'string' && !v.includes('${{') && !DURATION.test(v))
        diags.push({ line, code: 'NIKA-PARSE', message: `timeout '${v}' is not a Go-duration`, fix: `e.g. "30s" · "5m" · "1h30m" (${whereFix})` })
    }
    checkDuration(t.timeout, 'task timeout')
    for (const step of Array.isArray(t.on_finally) ? (t.on_finally as Record<string, unknown>[]) : [])
      if (step && typeof step === 'object') checkDuration(step.timeout, 'on_finally timeout')

    // exactly one verb
    const verbs = VERBS.filter((v) => v in t)
    if (verbs.length !== 1)
      diags.push({ line, code: 'NIKA-PARSE', message: verbs.length === 0 ? `task '${id}' has no verb` : `task '${id}' has ${verbs.length} verbs (${verbs.join(' + ')})`, fix: 'exactly one of infer · exec · invoke · agent' })

    for (const v of ['infer', 'agent'] as const) {
      const body = t[v]
      if (body && typeof body === 'object') checkModel((body as Record<string, unknown>).model, line)
    }

    // PARSE-024 · depends_on is dead since W2 — the language spells the intent
    if ('depends_on' in t)
      diags.push({ line, code: 'NIKA-PARSE-024', message: `task '${id}' carries depends_on: — dead since W2`, fix: 'data → with: bindings (the binding IS the edge) · control → after: {producer: succeeded} · always → after: {producer: terminal}' })

    // DAG-002 · every with:/after: edge target must be a declared task
    for (const body of exprBodies(t.with))
      for (const m of body.matchAll(TASK_REF))
        if (!idset.has(m[1]))
          diags.push({ line, code: 'NIKA-DAG-002', message: `with: binds tasks.${m[1]} · not a task`, fix: 'fix the name or add the task' })

    // DAG-005 · after: predicates are a closed set
    const afterObj = (t.after && typeof t.after === 'object' && !Array.isArray(t.after))
      ? (t.after as Record<string, unknown>)
      : null
    if (afterObj)
      for (const [prod, pred] of Object.entries(afterObj)) {
        if (!idset.has(prod))
          diags.push({ line, code: 'NIKA-DAG-002', message: `after: '${prod}' is not a task`, fix: 'fix the name or add the task' })
        if (typeof pred !== 'string' || !(AFTER_PREDICATES as readonly string[]).includes(pred))
          diags.push({ line, code: 'NIKA-DAG-005', message: `after: predicate '${String(pred)}' on '${prod}' is unknown`, fix: 'the closed set · succeeded · failed · skipped · terminal (terminal includes cancelled)' })
      }

    // VAR-021 · tasks.* is boundary-only — with:/after: declare the edges,
    // the body reads its bindings (when:/for_each:/verb fields are LOCAL)
    for (const field of ['when', 'for_each', ...VERBS])
      for (const body of exprBodies(t[field]))
        for (const m of body.matchAll(TASK_REF))
          diags.push({ line, code: 'NIKA-VAR-021', message: `tasks.${m[1]} in ${field}: on '${id}' — the body never reads the graph`, fix: `hoist it into with: and read \${{ with.${m[1]} }}` })

    // VAR-021 · on_finally reads its PARENT only (a sibling may still be running)
    for (const step of Array.isArray(t.on_finally) ? (t.on_finally as unknown[]) : [])
      for (const body of exprBodies(step))
        for (const m of body.matchAll(TASK_REF))
          if (m[1] !== id)
            diags.push({ line, code: 'NIKA-VAR-021', message: `on_finally on '${id}' reads tasks.${m[1]} · only the parent is legal there`, fix: `cleanup reads its parent only · \${{ tasks.${id}.status }}` })

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
            diags.push({ line, code: 'NIKA-VAR-001', message: `'${root}' is a for_each loop-local · no for_each on '${id}'`, fix: 'add for_each: or use a namespace' })
        } else if (root === 'vars' && seg && !vars.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `vars.${seg} is not declared`, fix: `declare it under vars:` })
        else if (root === 'env' && seg && !env.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `env.${seg} is not declared`, fix: 'declare it under env:' })
        else if (root === 'secrets' && seg && !secrets.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `secrets.${seg} is not declared`, fix: 'declare it under secrets:' })
        else if (root === 'with' && seg && !withKeys.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `with.${seg} is not in this task's with:`, fix: 'add it to with:' })
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
    // fetch: mode must be canonical · jq arg only with mode: jq
    if (inv && typeof inv === 'object' && inv.tool === 'nika:fetch') {
      const args = (inv.args as Record<string, unknown>) || {}
      const mode = args.mode
      if (typeof mode === 'string' && !mode.includes('${{') && !(CANON.extractModeNames as readonly string[]).includes(mode))
        diags.push({ line, code: 'NIKA-BUILTIN', message: `unknown extract mode '${mode}'`, fix: `one of · ${CANON.extractModeNames.join(' · ')}` })
      if ('jq' in args && args.mode !== 'jq')
        diags.push({ line, code: 'NIKA-BUILTIN', message: `'jq' argument without mode: jq`, fix: 'set mode: jq (the jq program needs the jq mode)' })
    }
    // wait: durations
    if (inv && typeof inv === 'object' && inv.tool === 'nika:wait') {
      const args = (inv.args as Record<string, unknown>) || {}
      checkDuration(args.duration, 'wait duration')
      checkDuration(args.timeout, 'wait timeout')
    }

    // hard rule 7 · done only in agent.tools
    if (inv && typeof inv === 'object' && inv.tool === 'nika:done')
      diags.push({ line, code: 'NIKA-BUILTIN-DONE-001', message: 'nika:done outside an agent loop', fix: 'it is the loop sentinel · grant it in agent.tools instead' })

    // hard rule 4 · when: is a ${{ }} CEL boolean OR a YAML boolean literal
    if (typeof t.when === 'string') {
      const body = [...t.when.matchAll(EXPR_BODY)].map((m) => m[1]).join(' ')
      if (!body)
        diags.push({ line, code: 'NIKA-VAR-005', message: `when: on '${id}' is a bare string · never evaluated`, fix: 'wrap it · when: ${{ … }} · or use the literal true/false' })
      else if (!/[=!<>?]|&&|\|\||\bin\b|\b(size|has)\s*\(|\.(contains|startsWith|endsWith)\s*\(|^\s*!/.test(body))
        diags.push({ line, code: 'NIKA-VAR-005', message: `when: on '${id}' is not boolean-shaped`, fix: 'compare something · e.g. ${{ vars.x > 0 }} · has(vars.x) · x.contains("…")' })
    }

    // output: bindings are pure jq — ${{ }} never appears inside them
    const out = t.output
    if (out && typeof out === 'object')
      for (const [name, expr] of Object.entries(out as Record<string, unknown>))
        if (typeof expr === 'string' && EXPR_BODY.test(expr)) {
          EXPR_BODY.lastIndex = 0
          diags.push({ line, code: 'NIKA-VAR-005', message: `output.${name} on '${id}' contains \${{ }}`, fix: 'bindings are pure jq over the task output · shape the verb INPUT with ${{ }} instead' })
        }


    // DAG-004 · recover: must not point downstream of this task
    const onErr = t.on_error as Record<string, unknown> | undefined
    if (id && onErr && typeof onErr === 'object' && typeof onErr.recover === 'string')
      for (const m of String(onErr.recover).matchAll(TASK_REF)) {
        const target = m[1]
        if (!idset.has(target)) continue
        // downstream test · does target transitively depend on id? (over G_p)
        const depsOf = (n: string): string[] => producersOf(tasksMap?.[n])
        const stack = [target]
        const seenD = new Set<string>()
        while (stack.length) {
          const n = stack.pop() as string
          if (n === id) {
            diags.push({ line, code: 'NIKA-DAG-004', message: `recover: on '${id}' reads tasks.${target} · downstream of '${id}'`, fix: 'a recovery source must be upstream or independent (the await would deadlock)' })
            break
          }
          if (seenD.has(n)) continue
          seenD.add(n)
          stack.push(...depsOf(n))
        }
      }
  }

  // unclosed ${{ — an opener with no closing }}
  src.split('\n').forEach((l, i) => {
    const opens = (l.match(EXPR_OPEN) || []).length
    EXPR_OPEN.lastIndex = 0
    const closed = [...l.matchAll(EXPR_BODY)].length
    EXPR_BODY.lastIndex = 0
    if (opens > closed)
      diags.push({ line: i + 1, code: 'NIKA-VAR-008', message: 'unclosed ${{ · the opener never closes', fix: 'close the expression with }}' })
  })

  // PERMITS-FIT · once permits: is present the body must fit it (01 §permits)
  const permits = doc.permits as Record<string, unknown> | undefined
  if (permits && typeof permits === 'object') {
    // gitignore-style glob → regex (* never crosses / · ** does · : literal)
    const globRe = (pat: string) =>
      new RegExp(
        '^' +
          pat
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '<GLOBSTAR>')
            .replace(/\*/g, '[^/]*')
            .replace(/<GLOBSTAR>/g, '.*') +
          '$',
      )
    const toolPats = Array.isArray(permits.tools)
      ? (permits.tools as string[]).filter((x) => typeof x === 'string' && !x.startsWith('!'))
      : null
    const toolOk = (tool: string) => toolPats !== null && toolPats.some((p2) => globRe(p2).test(tool))
    const execRule = 'exec' in permits ? permits.exec : false
    const net = permits.net as Record<string, unknown> | undefined
    const hosts = net && Array.isArray(net.http) ? (net.http as string[]) : null

    for (const [id, t] of entries) {
      if (!t || typeof t !== 'object') continue
      const line = at(id)
      if ('exec' in t) {
        const body = t.exec as Record<string, unknown> | undefined
        const cmd = body && typeof body === 'object' ? body.command : undefined
        if (execRule === false || execRule === undefined || execRule === null)
          diags.push({ line, code: 'NIKA-SEC-004', message: `task '${id}' uses exec: but permits.exec is false/omitted`, fix: 'permits is default-deny once present · allow exec or drop the task' })
        else if (Array.isArray(execRule) && Array.isArray(cmd) && typeof cmd[0] === 'string' && !cmd[0].includes('${{') && !execRule.includes(cmd[0]))
          diags.push({ line, code: 'NIKA-SEC-004', message: `argv program '${cmd[0]}' not in permits.exec`, fix: `allowed: ${execRule.join(' · ')}` })
      }
      const pinv = t.invoke as Record<string, unknown> | undefined
      if (pinv && typeof pinv === 'object' && typeof pinv.tool === 'string') {
        if (!toolOk(pinv.tool))
          diags.push({ line, code: 'NIKA-SEC-004', message: `invoke ${pinv.tool} outside permits.tools`, fix: 'the file IS the blast radius · permit the tool or drop the call' })
        if (pinv.tool === 'nika:fetch' && hosts) {
          const url = ((pinv.args as Record<string, unknown>) || {}).url
          if (typeof url === 'string' && !url.includes('${{')) {
            const host = (() => { try { return new URL(url).hostname } catch { return '' } })()
            if (host && !hosts.some((h) => globRe(h).test(host)))
              diags.push({ line, code: 'NIKA-SEC-004', message: `fetch host '${host}' not in permits.net.http`, fix: `allowed hosts: ${hosts.join(' · ')}` })
          }
        }
      }
      const pag = t.agent as Record<string, unknown> | undefined
      if (pag && typeof pag === 'object' && Array.isArray(pag.tools))
        for (const w of pag.tools as string[])
          if (typeof w === 'string' && !w.startsWith('!') && !toolOk(w))
            diags.push({ line, code: 'NIKA-SEC-004', message: `agent whitelist '${w}' outside permits.tools`, fix: 'the agent cannot exceed the file boundary' })
    }
  }

  // DAG-001 · cycles over the precedence graph G_p = E_d ∪ E_c
  const graph = new Map(entries.map(([id, t]) => [id, producersOf(t)]))
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
      diags.push({ line: at(n), code: 'NIKA-DAG-001', message: 'cycle in the graph (with/after edges)', fix: 'remove the back-edge · G_p = data ∪ control edges must stay acyclic' })
      break
    }

  return diags.sort((a, b) => a.line - b.line)
}
