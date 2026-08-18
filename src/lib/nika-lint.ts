/* ─── nika-lint · the oracle's static checks, in the browser ────────────────
   A TypeScript port of the conformance cross-refs + the eight hard rules
   (docs.nika.sh/guides/agent-authoring), speaking the SHIPPED grammar
   (0.109 · the nine-key envelope · nika · model · inputs · const · secrets ·
   permits · run · tasks · outputs · the value authorities are THREE: inputs ·
   const · secrets — the visitor's own binary is the contract). Same NIKA
   codes, same fix lines — the playground teaches with the engine's own
   vocabulary, and every dead form refuses with the engine's own PARSE-005
   teaching (the destination, not just the refusal). Line numbers
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
  'NIKA-PARSE-005',
  'NIKA-PARSE-024',
  'NIKA-DAG-001',
  'NIKA-DAG-002',
  'NIKA-DAG-004',
  'NIKA-DAG-005',
  'NIKA-DAG-008',
  'NIKA-DAG-009',
  'NIKA-VAR-001',
  'NIKA-VAR-005',
  'NIKA-VAR-008',
  'NIKA-VAR-021',
  'NIKA-SEC-004',
  'NIKA-BUILTIN-DONE-001',
] as const

/** codes the SHIPPED binary emits that the PIN has not ratified yet — no
    /errors room exists until the spec lands them, so every door for these
    renders TEXT-ONLY. EMPTY at the 0.109 pin (2b3d6ac3): every code the
    port claims has its room; the set stays declared so the U1 door law
    (nika-lint-conformance.test.ts) re-tightens by itself the day a shipped
    code runs ahead of the pin again. NIKA-DAG-003 (the 0.104 entry) left
    the port's coverage with the group fold: the port never emitted it. */
export const SHIPPED_AHEAD_CODES = new Set<string>([])

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
  depends_on?: unknown
  with?: unknown
  when?: unknown
  for_each?: unknown
  group?: unknown
  after?: unknown
  [k: string]: unknown
}

/* ─── the nine keys · the whole envelope, nothing else at top level ─────────── */
const ENVELOPE_KEYS = ['nika', 'model', 'inputs', 'const', 'secrets', 'permits', 'run', 'tasks', 'outputs'] as const
const ENVELOPE_LIST = ENVELOPE_KEYS.join(' · ')
/** the dead envelope keys → the engine's own PARSE-005 teaching (the
    destination each one moved to · #974: the refusal names the door) */
const DEAD_ENVELOPE: Record<string, string> = {
  workflow: 'the identity moved onto `nika:` itself (`nika: <id>` · a kebab-case name, no longer `v1`) · its `description:` prose belongs in a `#` comment above `nika:`, never dropped',
  description: 'prose at the top belongs in a `#` comment above `nika:` · the envelope never carried it',
  config: 'a deployment-supplied value is now an `inputs:` entry with `required: false` and a `default:` · a value baked into the file is a `const:` entry',
  policy: 'the block died with the nine-key envelope · the capability boundary is `permits:` (fs · net · exec · tools) · the unconditional laws need no declaration',
  types: 'named types died with the block · write the type inline where it is used · the task\'s `returns:` and the verb\'s `schema:` are the typed doors',
  vars: 'the value authorities are `inputs:` (caller-supplied) · `const:` (baked in) · `secrets:` (vault-backed) · `vars:` and `${{ vars.* }}` died with them',
  env: 'a process environment value is an `inputs:` entry the caller supplies or a `secrets:` reference · `${{ env.* }}` died with the E-split',
  assert: 'assertions left the file · `nika trace verify` judges the run\'s own receipt',
}
/** the dead task-level keys → the same teaching, per key */
const DEAD_TASK_KEYS: Record<string, string> = {
  output: 'renamed `extract:` (2026-08-11) — same shape, the truthful word for what it does',
  on_finally: 'cleanup is a TASK now, joined by an unwind edge — write it as its own task with `after: { <parent>: unwind }` (a `finally` node in graph_format 3)',
  max_parallel: 'the two fan-out knobs live INSIDE the `for_each:` block now (`for_each: { items: …, max_parallel: N, fail_fast: false }`) — they have no meaning without it',
  fail_fast: 'the two fan-out knobs live INSIDE the `for_each:` block now (`for_each: { items: …, max_parallel: N, fail_fast: false }`) — they have no meaning without it',
  declassify: 'merged into `lift:` — the law is a PARAMETER of one door: `lift: [{ law: taint, from: <binding>, because: "…" }]`',
  inert: 'merged into `lift:` — `lift: [{ law: data-as-code, because: "…" }]` names which law the task opens and why',
  id: 'the map KEY is the task id (`tasks: { <id>: … }`) · an `id:` field inside the body is the dead sequence form',
}

const VERBS = ['infer', 'exec', 'invoke', 'agent'] as const
const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g
const EXPR_BODY = /(?<!\\)\$\{\{(.*?)\}\}/gs
const EXPR_OPEN = /(?<!\\)\$\{\{/g
const DURATION = /^([0-9]+(\.[0-9]+)?(ns|us|µs|ms|s|m|h))+$/
const ROOT_ID = /(?<![.\w])([A-Za-z_][A-Za-z0-9_]*)(?:\.([A-Za-z_][A-Za-z0-9_]*))?/g
const CEL_BUILTINS = new Set(['true', 'false', 'null', 'in', 'size'])
export const LOOP_LOCALS = new Set(['item', 'index'])
/* the namespaces are the CANON's (spec canon.yaml → src/canon.generated.ts ·
   never typed here): the three value authorities inputs · const · secrets,
   plus the two graph scopes with · tasks. `config` died with the envelope
   nuke (a deployment default is an input with required: false) · `vars`
   and `env` died at the E-split. `group.<name>` is a FOLD (with:-only ·
   spec 03 §group), not a value namespace — it is judged on its own below. */
export const NAMESPACES = new Set<string>(CANON.namespaceNames)
const NAMESPACE_LIST = [...NAMESPACES].join(' ')
const GROUP_REF = /\bgroup\.([a-z][a-z0-9_]*)\b/g
const PROVIDERS = new Set<string>([
  ...CANON.providerIdsCloud,
  ...CANON.providerIdsLocal,
  ...CANON.providerIdsTest,
])

/** 1-based line of each task head (0.105 · the shipped map). */
function taskLines(src: string): Map<string, number> {
  const out = new Map<string, number>()
  let inTasks = false
  src.split('\n').forEach((l, i) => {
    if (/^[A-Za-z0-9_-]+\s*:/.test(l)) inTasks = /^tasks\s*:/.test(l)
    const m = inTasks ? /^ {2}([a-z][a-z0-9_-]*):/.exec(l) : null
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

  // ── envelope · the nine keys · `nika:` carries the file's NAME ──
  const mark = doc.nika
  if (mark === 'v1')
    diags.push({ line: keyLine(src, 'nika'), code: 'NIKA-PARSE-005', message: '`nika: v1` is the dead version marker — `nika:` carries the file\'s NAME now', fix: 'write `nika: <name>` (kebab-case · e.g. `nika: weekly-radar`) · the envelope has no version key' })
  else if (typeof mark !== 'string' || !/^[a-z][a-z0-9-]*$/.test(mark))
    diags.push({ line: keyLine(src, 'nika'), code: 'NIKA-PARSE', message: mark === undefined ? '`nika:` is required · the file\'s NAME, first key' : `\`nika: ${String(mark)}\` is not a kebab-case name`, fix: 'add `nika: <name>` at the top (kebab-case · lowercase letters, digits, hyphens)' })
  for (const key of Object.keys(doc)) {
    if ((ENVELOPE_KEYS as readonly string[]).includes(key)) continue
    const line = keyLine(src, key)
    if (key in DEAD_ENVELOPE)
      diags.push({ line, code: 'NIKA-PARSE-005', message: `unknown field \`${key}\` in the workflow envelope (strict mode) — this key died with the nine-key envelope (2026-08-12)`, fix: `${DEAD_ENVELOPE[key]} · the fields here: ${ENVELOPE_LIST}` })
    else
      diags.push({ line, code: 'NIKA-PARSE-005', message: `unknown field \`${key}\` in the workflow envelope (strict mode)`, fix: `the fields here: ${ENVELOPE_LIST}` })
  }

  // « the map »: tasks is a MAP keyed by id · uniqueness is structural.
  const rawTasks = doc.tasks
  const tasksMap = rawTasks && typeof rawTasks === 'object' && !Array.isArray(rawTasks)
    ? (rawTasks as Record<string, Task>)
    : null
  const entries: Array<[string, Task]> = Object.entries(tasksMap ?? {})
    .filter((e): e is [string, Task] => !!e[1] && typeof e[1] === 'object')
  if (!tasksMap || entries.length === 0)
    diags.push({ line: keyLine(src, 'tasks'), code: 'NIKA-PARSE', message: 'a workflow needs a non-empty `tasks:` map', fix: 'add at least one entry (`name:` under tasks)' })

  const ids = entries.map(([id]) => id)
  const idset = new Set(ids)

  /* precedence: the BINDING is the edge — every tasks.X read implies it ·
     `after:` carries the control edges ({producer: predicate}). The
     predicate set is CLOSED (DAG-005): success · failure · skipped ·
     terminal · unwind. `unwind` is the E_f cleanup attachment (spec 03
     §unwind): it never enters the precedence graph — no wave, no cycle. */
  const PREDICATES = new Set(['success', 'failure', 'skipped', 'terminal', 'unwind'])
  const aftersOf = (t: Task | null | undefined): Array<[string, unknown]> => {
    const a = (t as Task | undefined)?.after
    if (!a) return []
    if (Array.isArray(a)) return a.filter((d): d is string => typeof d === 'string').map((d) => [d, null])
    if (typeof a === 'object') return Object.entries(a as Record<string, unknown>)
    return []
  }
  /** the producers an unwind task cleans up after (its E_f parents) */
  const unwindParentsOf = (t: Task | null | undefined): string[] =>
    aftersOf(t).filter(([, pred]) => pred === 'unwind').map(([d]) => d)
  const isUnwindTask = (t: Task | null | undefined): boolean => unwindParentsOf(t).length > 0
  /** group name → its declared members (spec 03 §group · membership is DECLARED) */
  const groupMembers = new Map<string, string[]>()
  for (const [gid, gt] of entries)
    if (typeof gt.group === 'string') groupMembers.set(gt.group, [...(groupMembers.get(gt.group) ?? []), gid])
  const producersAll = (t: Task | null | undefined): string[] => {
    const out: string[] = []
    for (const [d, pred] of aftersOf(t)) if (pred !== 'unwind' && !out.includes(d)) out.push(d)
    for (const body of exprBodies(t))
      for (const m of body.matchAll(TASK_REF)) if (!out.includes(m[1])) out.push(m[1])
    /* a group fold in with: is an edge from EVERY member (the fan-in) */
    for (const body of exprBodies((t as Task | undefined)?.with))
      for (const m of body.matchAll(GROUP_REF))
        for (const member of groupMembers.get(m[1]) ?? []) if (!out.includes(member)) out.push(member)
    return out
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

    // the dead task-level keys · PARSE-005 with the engine's own teaching
    for (const key of Object.keys(t))
      if (key in DEAD_TASK_KEYS)
        diags.push({ line, code: 'NIKA-PARSE-005', message: `unknown field \`${key}\` in task '${id}' (strict mode) — dead since the 0.109 grammar`, fix: DEAD_TASK_KEYS[key] })
    // the dead on_error knob · failing loudly IS the default
    const onErrKeys = t.on_error && typeof t.on_error === 'object' ? Object.keys(t.on_error as object) : []
    if (onErrKeys.includes('fail_workflow'))
      diags.push({ line, code: 'NIKA-PARSE-005', message: `unknown field \`fail_workflow\` in \`on_error:\` on '${id}' (strict mode)`, fix: 'a task fails loudly unless on_error says otherwise · the fields here: recover · skip · on_codes' })

    // timeout: quoted Go-duration (used by task · wait rules below)
    const checkDuration = (v: unknown, whereFix: string) => {
      if (typeof v === 'number')
        diags.push({ line, code: 'NIKA-PARSE', message: `timeout ${v} is a number · must be a quoted duration`, fix: `write "${v}s" (${whereFix})` })
      else if (typeof v === 'string' && !v.includes('${{') && !DURATION.test(v))
        diags.push({ line, code: 'NIKA-PARSE', message: `timeout '${v}' is not a Go-duration`, fix: `e.g. "30s" · "5m" · "1h30m" (${whereFix})` })
    }
    checkDuration(t.timeout, 'task timeout')

    // exactly one verb
    const verbs = VERBS.filter((v) => v in t)
    if (verbs.length !== 1)
      diags.push({ line, code: 'NIKA-PARSE', message: verbs.length === 0 ? `task '${id}' has no verb` : `task '${id}' has ${verbs.length} verbs (${verbs.join(' + ')})`, fix: 'exactly one of infer · exec · invoke · agent' })

    for (const v of ['infer', 'agent'] as const) {
      const body = t[v]
      if (body && typeof body === 'object') checkModel((body as Record<string, unknown>).model, line)
    }

    // PARSE-024 · depends_on died at 0.105 — the binding IS the edge
    if ('depends_on' in t)
      diags.push({ line, code: 'NIKA-PARSE-024', message: `task '${id}' carries depends_on: — dead since 0.105`, fix: 'data → with: bindings (the binding IS the edge) · control → after: {producer: success}' })

    // DAG-002 · every control edge must name a task · DAG-005 · predicates
    // DAG-001 · a self-edge is a cycle of length one (after: { self: … })
    for (const [d, pred] of aftersOf(t)) {
      if (d === id)
        diags.push({ line, code: 'NIKA-DAG-001', message: `after: '${id}' waits for itself`, fix: 'a task never depends on itself · drop the self-edge' })
      else if (!idset.has(d))
        diags.push({ line, code: 'NIKA-DAG-002', message: `after: '${d}' is not a task`, fix: 'fix the name or add the task' })
      if (typeof pred === 'string' && !PREDICATES.has(pred))
        diags.push({ line, code: 'NIKA-DAG-005', message: `after.${d}: '${pred}' is not a predicate`, fix: `the set is closed · success · failure · skipped · terminal · unwind${pred === 'succeeded' ? ' · respell `succeeded` as `success`' : pred === 'failed' ? ' · respell `failed` as `failure`' : ''}` })
    }

    // the group fold (spec 03 §group) · DAG-008 a ghost group · DAG-009 an
    // unwind task may not join one · a member folding its own group is a
    // cycle (DAG-001) · the fold is legal in with: only (VAR-021 elsewhere)
    if (typeof t.group === 'string' && isUnwindTask(t))
      diags.push({ line, code: 'NIKA-DAG-009', message: `unwind task '${id}' joins group '${t.group}'`, fix: 'cleanup never schedules · a group is a fan-in of scheduled tasks · drop group: on the unwind task' })
    for (const body of exprBodies(t.with))
      for (const m of body.matchAll(GROUP_REF)) {
        const members = groupMembers.get(m[1])
        if (!members)
          diags.push({ line, code: 'NIKA-DAG-008', message: `with: on '${id}' folds group.${m[1]} · no task declares group: ${m[1]}`, fix: 'membership is DECLARED · add group: to the members or fix the name' })
        else if (members.includes(id))
          diags.push({ line, code: 'NIKA-DAG-001', message: `'${id}' is a member of group '${m[1]}' and folds it`, fix: 'a fold reads its members · a member cannot wait for itself · leave the group or fold another' })
      }
    for (const field of ['when', 'for_each', ...VERBS])
      for (const body of exprBodies(t[field]))
        for (const m of body.matchAll(GROUP_REF))
          diags.push({ line, code: 'NIKA-VAR-021', message: `group.${m[1]} in ${field}: on '${id}' — a fold is a boundary read`, fix: `hoist it into with: and read \${{ with.<name> }}` })

    // DAG-002 · a tasks.X binding must name a task (the binding IS the edge)
    for (const body of exprBodies(t.with))
      for (const m of body.matchAll(TASK_REF)) {
        if (m[1] === id)
          diags.push({ line, code: 'NIKA-DAG-001', message: `with: on '${id}' binds its own output`, fix: 'a task never depends on itself · drop the self-binding' })
        else if (!idset.has(m[1]))
          diags.push({ line, code: 'NIKA-DAG-002', message: `with: binds tasks.${m[1]} · not a task`, fix: 'fix the name or add the task' })
      }

    // VAR-021 · tasks.* is boundary-only — with:/after: declare the edges,
    // the body reads its bindings (when:/for_each:/verb fields are LOCAL).
    // The one settled read: an unwind task may read its PRODUCER anywhere
    // (spec 03 §unwind · the parent is settled by definition when it runs).
    const settledParents = unwindParentsOf(t)
    for (const field of ['when', 'for_each', ...VERBS])
      for (const body of exprBodies(t[field]))
        for (const m of body.matchAll(TASK_REF))
          if (!settledParents.includes(m[1]))
            diags.push({ line, code: 'NIKA-VAR-021', message: `tasks.${m[1]} in ${field}: on '${id}' — the body never reads the graph`, fix: `hoist it into with: and read \${{ with.${m[1]} }}` })

    // VAR-021 · an unwind task reads its PRODUCER only (a sibling may still
    // be running · spec 03 §unwind « what it may read »)
    if (isUnwindTask(t)) {
      const parents = unwindParentsOf(t)
      for (const body of exprBodies(t))
        for (const m of body.matchAll(TASK_REF))
          if (!parents.includes(m[1]))
            diags.push({ line, code: 'NIKA-VAR-021', message: `unwind task '${id}' reads tasks.${m[1]} · only its producer is settled when it runs`, fix: `cleanup reads its producer only · \${{ tasks.${parents[0]}.status }} · .error · .output` })
    }

    // VAR-001 · roots must resolve (the three value authorities + with)
    const inputs = new Set(Object.keys((doc.inputs as object) || {}))
    const consts = new Set(Object.keys((doc.const as object) || {}))
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
        } else if (root === 'group') {
          /* the fold is judged above (DAG-008 · VAR-021) · never a VAR-001 ·
             a BARE `group` names no group at all (DAG-008 · the fold is
             `group.<name>`) */
          if (!seg)
            diags.push({ line, code: 'NIKA-DAG-008', message: `'${id}' reads bare \`group\` · a fold names its group`, fix: 'write ${{ group.<name> }} · the name is what the members declare under group:' })
          continue
        } else if (root === 'inputs' && seg && !inputs.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `inputs.${seg} is not declared`, fix: `declare it under inputs:` })
        else if (root === 'const' && seg && !consts.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `const.${seg} is not declared`, fix: 'declare it under const:' })
        else if (root === 'secrets' && seg && !secrets.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `secrets.${seg} is not declared`, fix: 'declare it under secrets:' })
        else if (root === 'with' && seg && !withKeys.has(seg))
          diags.push({ line, code: 'NIKA-VAR-001', message: `with.${seg} is not in this task's with:`, fix: 'add it to with:' })
        else if (seg && !NAMESPACES.has(root) && !LOOP_LOCALS.has(root))
          diags.push({ line, code: 'NIKA-VAR-001', message: `'${root}.${seg}' uses an unknown namespace${root === 'config' ? ' · config died with the nine-key envelope' : root === 'vars' || root === 'env' ? ` · ${root} died at the E-split` : ''}`, fix: `the namespaces · ${NAMESPACE_LIST}${root === 'config' ? ' · a deployment default is an inputs: entry with required: false + default:' : root === 'env' ? ' · a process value is an inputs: entry or a secrets: reference' : root === 'vars' ? ' · inputs: (supplied) or const: (baked in)' : ''}` })
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
        diags.push({ line, code: 'NIKA-VAR-005', message: `when: on '${id}' is not boolean-shaped`, fix: 'compare something · e.g. ${{ inputs.x > 0 }} · has(inputs.x) · x.contains("…")' })
    }

    // extract: bindings are pure jq — ${{ }} never appears inside them
    const out = t.extract
    if (out && typeof out === 'object')
      for (const [name, expr] of Object.entries(out as Record<string, unknown>))
        if (typeof expr === 'string' && EXPR_BODY.test(expr)) {
          EXPR_BODY.lastIndex = 0
          diags.push({ line, code: 'NIKA-VAR-005', message: `extract.${name} on '${id}' contains \${{ }}`, fix: 'bindings are pure jq over the task output · shape the verb INPUT with ${{ }} instead' })
        }


    // DAG-004 · recover: must not point downstream of this task
    const onErr = t.on_error as Record<string, unknown> | undefined
    if (id && onErr && typeof onErr === 'object' && typeof onErr.recover === 'string')
      for (const m of String(onErr.recover).matchAll(TASK_REF)) {
        const target = m[1]
        if (!idset.has(target)) continue
        // downstream test · does target transitively depend on id? (declared edges)
        const byId = new Map(entries.map(([eid, et]) => [eid, et]))
        const depsOf = (n: string): string[] => producersAll(byId.get(n)).filter((d) => idset.has(d))
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

  // DAG-001 · cycles over the precedence graph (after: + binding edges)
  const graph = new Map(entries.map(([id, t]) => [id, producersAll(t).filter((d) => idset.has(d) && d !== id)]))
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
      diags.push({ line: at(n), code: 'NIKA-DAG-001', message: 'cycle in the graph (after: + binding edges)', fix: 'remove the back-edge · the graph must stay acyclic' })
      break
    }

  return diags.sort((a, b) => a.line - b.line)
}
