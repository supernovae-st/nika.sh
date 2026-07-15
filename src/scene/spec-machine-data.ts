import { CANON } from '../canon.generated'
import { SHOWCASE_DAG, type ShowcaseTask } from '../content/showcase-dag.generated'

/* ─── spec-machine-data · the strata graph of THE SPEC MACHINE ────────────────
   The whole language as one machine: every stratum, node and count on /spec —
   the 2D schematic (fallback truth), the 3D machine (W1) and the HUD readouts —
   renders from THIS module. Counts and lists derive from canon.generated.ts
   (the spec SSOT projection) + the showcase DAG projection; the craft layer is
   grouping, glosses and anchors only. A canon entry that isn't glossed still
   renders (structural guards below), so no list can ever under-render.
   Pure data (no three import) — testable, deterministic, SSR-safe. */

export type StratumKey =
  | 'frame'
  | 'verbs'
  | 'plan'
  | 'permits'
  | 'stdlib'
  | 'providers'
  | 'extract'
  | 'errors'
  | 'license'

export type VerbName = (typeof CANON.verbNames)[number]

export interface SpecSection {
  key: StratumKey
  fig: string
  title: string
  /** the in-page anchor · a PUBLISHED contract (#s0…#s7 + #permits) */
  anchor: string
  /** the live HUD count for this section (derived, never a literal) */
  count: number
  /** the mono HUD label the count reads under (dot-leader grammar) */
  countLabel: string
  /** the S-chip one-liner (craft · consumer register, mirrors the TL;DR) */
  chipGloss: string
  /** the ship stratum this section IS (the v2 axial read · craft naming) */
  shipPart: string
}

export interface MachineNode {
  /** stable id · `kind:name` (the hover/click bus key + test identity) */
  id: string
  label: string
  kind: 'key' | 'verb' | 'task' | 'gate' | 'builtin' | 'provider' | 'extract' | 'errns'
  stratum: StratumKey
  /** the DOM twin · every 3D/2D node points at a real /spec anchor */
  anchor: string
  /** builtin family label · provider tier (local/cloud/test) */
  family?: string
  /** the verb hue key (verb nodes + plan-ring task nodes) */
  verb?: VerbName
  /** plan-ring edges · upstream producers (with: refs ∪ after: keys) */
  deps?: string[]
  gloss?: string
}

/* ── the envelope keys · from the JSON schema (required rows FIRST — the
   disclosure fold slices this list at the required/optional boundary) ─────── */
export const ENVELOPE_KEYS: { key: string; req: boolean; gloss: string }[] = [
  { key: 'nika', req: true, gloss: 'the version marker · exactly v1, forever' },
  { key: 'workflow', req: true, gloss: 'the workflow id · kebab-case · unique in the file' },
  { key: 'tasks', req: true, gloss: 'the DAG · one or more nodes, each binding one verb' },
  { key: 'description', req: false, gloss: 'a human note · free text' },
  { key: 'model', req: false, gloss: 'the default model · provider/name (e.g. ollama/llama3.2:3b)' },
  { key: 'vars', req: false, gloss: 'typed inputs · ${{ vars.X }} · with required / default' },
  { key: 'env', req: false, gloss: 'non-sensitive runtime config · ${{ env.X }}' },
  { key: 'secrets', req: false, gloss: 'vault-backed references · never inline literals' },
  { key: 'permits', req: false, gloss: 'the capability boundary · default-deny once present' },
  { key: 'outputs', req: false, gloss: 'the return value · ${{ tasks.X.output }} · symmetric to vars' },
]

/* ── the task shape · from the JSON schema $defs.task (required first) ─────── */
export const TASK_FIELDS: { name: string; req: boolean; gloss: string }[] = [
  { name: '‹key›', req: true, gloss: 'the map key IS the identity · snake_case · CEL-safe · unique' },
  { name: '‹verb›', req: true, gloss: 'exactly one of infer · exec · invoke · agent' },
  { name: 'with', req: false, gloss: 'the data door · each ${{ tasks.X }} binding IS a typed edge' },
  { name: 'after', req: false, gloss: 'the control door · {producer: succeeded|failed|skipped|terminal}' },
  { name: 'when', req: false, gloss: 'a local CEL yes/no (or true/false) · post-gate · false → skipped' },
  { name: 'for_each', req: false, gloss: 'map the task over a collection' },
  { name: 'max_parallel', req: false, gloss: 'cap concurrent for_each iterations · 1 = sequential' },
  { name: 'timeout', req: false, gloss: 'a quoted Go-duration · e.g. "30s" "5m" "1h30m" · max 24h' },
  { name: 'retry', req: false, gloss: 'attempts + backoff on a transient failure' },
  { name: 'on_error', req: false, gloss: 'fallback · recover from another task · or continue' },
]

/* ── the permits · the 4 declarable gates (the collar at the cardinals) ─────── */
export const PERMIT_CATS: { key: string; cap: string; glyph: string; gloss: string; shape: string }[] = [
  {
    key: 'fs',
    cap: 'fs.read / fs.write',
    glyph: '▤',
    gloss: 'which files it can read, which it can write: read XOR write, by glob.',
    shape: 'read: [globs] · write: [globs]',
  },
  {
    key: 'net',
    cap: 'net.http',
    glyph: '◈',
    gloss: 'which hosts it can reach. Omit the category and the plan cannot touch the network at all.',
    shape: 'http: [host allowlist]',
  },
  {
    key: 'exec',
    cap: 'exec',
    glyph: '▷',
    gloss: 'which programs it can run: none, any (blocklist-gated), or a named allowlist.',
    shape: 'false · true · [program names]',
  },
  {
    key: 'tools',
    cap: 'tools',
    glyph: '◆',
    gloss: 'which nika:/mcp: tools it may call. Anything off the list is unreachable.',
    shape: 'tools: [allowed tool ids]',
  },
]

/* the enforcement codes · « out of bounds » resolves to a denial BEFORE the
   effect (public/errors/catalog.json · security_error class · NIKA-SEC) */
export const PERMIT_DENIALS: { code: string; failure: string }[] = [
  { code: 'NIKA-SEC-004', failure: 'effect outside the declared permits: boundary (fs / net / exec / tool)' },
  { code: 'NIKA-SEC-002', failure: 'agent tool call outside the tools: whitelist' },
  { code: 'NIKA-SEC-001', failure: 'exec: blocklist hit' },
]

/* ── the stdlib families · craft grouping over CANON.builtinNames ─────────────
   The guard below catches any FUTURE canon entry (an unglossed builtin lands
   in Flow rather than vanishing), and the canon-filter drops a glossed name
   that ever leaves canon — the chips can never under- OR over-render. */
const BUILTIN_FAMILIES: { label: string; names: string[] }[] = [
  { label: 'Files', names: ['read', 'write', 'edit', 'glob', 'grep'] },
  { label: 'Data', names: ['jq', 'convert', 'validate', 'json_diff', 'json_merge_patch', 'compose', 'hash', 'uuid', 'date', 'chart'] },
  { label: 'Web', names: ['fetch'] },
  { label: 'Media', names: ['image_generate', 'tts_generate', 'image_fx'] },
  { label: 'Flow', names: ['assert', 'done', 'wait', 'emit', 'log', 'notify', 'prompt', 'inspect'] },
]
const FAMILIED = new Set(BUILTIN_FAMILIES.flatMap((f) => f.names))
for (const b of CANON.builtinNames) {
  if (!FAMILIED.has(b)) BUILTIN_FAMILIES[BUILTIN_FAMILIES.length - 1].names.push(b)
}
export const BUILTIN_GROUPS = BUILTIN_FAMILIES.map((f) => ({
  label: f.label,
  names: f.names.filter((n) => (CANON.builtinNames as readonly string[]).includes(n)),
}))

/** the honest microchart · builtins per family, in family order */
export const BUILTINS_PER_FAMILY = BUILTIN_GROUPS.map((f) => f.names.length)

/* ── providers · display names (craft) over the CANON id tiers ──────────────── */
export const PROVIDER_DISPLAY: Record<string, string> = {
  ollama: 'Ollama',
  lmstudio: 'LM Studio',
  llamacpp: 'llama.cpp',
  localai: 'LocalAI',
  vllm: 'vLLM',
  mistral: 'Mistral',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  xai: 'xAI',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  huggingface: 'Hugging Face',
  nvidia: 'NVIDIA',
  mock: 'mock',
}
export const displayProvider = (id: string): string => PROVIDER_DISPLAY[id] ?? id

/* ── the error-namespace scopes (craft · an unglossed namespace still renders) */
export const NS_SCOPE: Record<string, string> = {
  'NIKA-PARSE': 'YAML parse + envelope validation',
  'NIKA-DAG': 'DAG topology · cycles · invalid deps',
  'NIKA-VAR': 'variable + expression resolution',
  'NIKA-INFER': 'infer: the model call',
  'NIKA-EXEC': 'exec: the local process',
  'NIKA-INVOKE': 'invoke: the tool call',
  'NIKA-AGENT': 'agent: the loop budget',
  'NIKA-BUILTIN': 'builtin tool argument contracts',
  'NIKA-MCP': 'MCP client + transport',
  'NIKA-PROVIDER': 'provider adapter failures',
  'NIKA-SEC': 'security policy · SSRF · whitelist · permits',
  'NIKA-TIMEOUT': 'task or step timeouts',
  'NIKA-CANCEL': 'task or workflow cancellation',
  'NIKA-IMPL': 'engine-internal errors',
}
export const nsScope = (ns: string): string => NS_SCOPE[ns] ?? 'see the error catalog'

/* ── the plan ring · the SAME workflow the page's CodeFile shows ──────────────
   standup-digest (invoke · exec · infer in a tiny readable DAG) — sliced from
   the showcase projection, with the same graceful fallback as SAMPLE_YAML. */
const PLAN_DAG =
  SHOWCASE_DAG['t1-standup-digest'] ?? Object.values(SHOWCASE_DAG)[0] ?? { tasks: [], outputs: [], waves: 0 }
export const PLAN_TASKS: ShowcaseTask[] = PLAN_DAG.tasks
export const PLAN_WAVES: number = PLAN_DAG.waves

/* ── the nine-section spine · fig + anchor (published) + HUD count ────────────
   The TOC, the legend, the schematic, the index rail and the machine's poses
   all read THIS list. The anchor ids are an inbound contract — never renumber. */
export const SPEC_SECTIONS: SpecSection[] = [
  { key: 'frame', fig: 'S.0', title: 'Envelope', anchor: '#s0', count: ENVELOPE_KEYS.length, countLabel: 'KEYS', chipGloss: 'The container.', shipPart: 'the keel' },
  { key: 'verbs', fig: 'S.1', title: 'Verbs', anchor: '#s1', count: CANON.verbs, countLabel: 'VERBS', chipGloss: 'Four moves cover everything.', shipPart: 'the core' },
  { key: 'plan', fig: 'S.2', title: 'Task shape', anchor: '#s2', count: TASK_FIELDS.length, countLabel: 'FIELDS', chipGloss: 'Tasks, and what they wait on.', shipPart: 'the bridge' },
  { key: 'permits', fig: 'S.3', title: 'Permits', anchor: '#permits', count: PERMIT_CATS.length, countLabel: 'GATES', chipGloss: 'Gates bound what may pass.', shipPart: 'the ring' },
  { key: 'stdlib', fig: 'S.4', title: 'Stdlib', anchor: '#s3', count: CANON.builtins, countLabel: 'BUILTINS', chipGloss: 'Tools aboard, nothing to install.', shipPart: 'the hold' },
  { key: 'providers', fig: 'S.5', title: 'Providers', anchor: '#s4', count: CANON.providers, countLabel: 'PROVIDERS', chipGloss: 'Local first, then cloud.', shipPart: 'the engines' },
  { key: 'extract', fig: 'S.6', title: 'Extract', anchor: '#s5', count: CANON.extractModes, countLabel: 'MODES', chipGloss: 'A page becomes typed output.', shipPart: 'the array' },
  { key: 'errors', fig: 'S.7', title: 'Errors', anchor: '#s6', count: CANON.errorNamespaces, countLabel: 'NAMESPACES', chipGloss: 'Failures come back typed.', shipPart: 'the shield' },
  { key: 'license', fig: 'S.8', title: 'License', anchor: '#s7', count: 4, countLabel: 'INVARIANTS', chipGloss: 'Open spec. Copyleft engine.', shipPart: 'the flag' },
]

const ANCHOR: Record<StratumKey, string> = Object.fromEntries(
  SPEC_SECTIONS.map((s) => [s.key, s.anchor]),
) as Record<StratumKey, string>

/* ── the machine nodes · every stratum member, DOM-anchored ─────────────────── */
export const MACHINE_NODES: MachineNode[] = [
  /* the keel · S.0 · the envelope's 10 top-level keys ARE the ship's spine
     (the file's skeleton = the ship's skeleton · required keys lead the bow) */
  ...ENVELOPE_KEYS.map((k) => ({
    id: `key:${k.key}`,
    label: k.key,
    kind: 'key' as const,
    stratum: 'frame' as const,
    anchor: ANCHOR.frame,
    family: k.req ? 'required' : 'optional',
    gloss: k.gloss,
  })),
  /* the core tetrad · S.1 */
  ...CANON.verbNames.map((v) => ({
    id: `verb:${v}`,
    label: v,
    kind: 'verb' as const,
    stratum: 'verbs' as const,
    anchor: ANCHOR.verbs,
    verb: v,
  })),
  /* the plan ring · S.2 · the standup-digest slabs */
  ...PLAN_TASKS.map((t) => ({
    id: `task:${t.id}`,
    label: t.id,
    kind: 'task' as const,
    stratum: 'plan' as const,
    anchor: ANCHOR.plan,
    verb: t.verb,
    deps: t.deps,
    gloss: t.gloss,
  })),
  /* the gate collar · S.3 · the 4 cardinals */
  ...PERMIT_CATS.map((c) => ({
    id: `gate:${c.key}`,
    label: c.cap,
    kind: 'gate' as const,
    stratum: 'permits' as const,
    anchor: ANCHOR.permits,
    gloss: c.gloss,
  })),
  /* the tool belt · S.4 · 5 family arcs */
  ...BUILTIN_GROUPS.flatMap((f) =>
    f.names.map((n) => ({
      id: `builtin:${n}`,
      label: n,
      kind: 'builtin' as const,
      stratum: 'stdlib' as const,
      anchor: ANCHOR.stdlib,
      family: f.label,
    })),
  ),
  /* the provider halo · S.5 · docked local, distant cloud, dim mock */
  ...CANON.providerIdsLocal.map((p) => ({
    id: `provider:${p}`,
    label: displayProvider(p),
    kind: 'provider' as const,
    stratum: 'providers' as const,
    anchor: ANCHOR.providers,
    family: 'local',
  })),
  ...CANON.providerIdsCloud.map((p) => ({
    id: `provider:${p}`,
    label: displayProvider(p),
    kind: 'provider' as const,
    stratum: 'providers' as const,
    anchor: ANCHOR.providers,
    family: 'cloud',
  })),
  ...CANON.providerIdsTest.map((p) => ({
    id: `provider:${p}`,
    label: displayProvider(p),
    kind: 'provider' as const,
    stratum: 'providers' as const,
    anchor: ANCHOR.providers,
    family: 'test',
  })),
  /* the fetch manifold · S.6 · 9 ports off the fetch belt block */
  ...CANON.extractModeNames.map((m) => ({
    id: `extract:${m}`,
    label: m,
    kind: 'extract' as const,
    stratum: 'extract' as const,
    anchor: ANCHOR.extract,
  })),
  /* the containment shell · S.7 · 14 cells */
  ...CANON.errorNamespaceNames.map((ns) => ({
    id: `ns:${ns}`,
    label: ns,
    kind: 'errns' as const,
    stratum: 'errors' as const,
    anchor: ANCHOR.errors,
  })),
]

export function nodesFor(stratum: StratumKey): MachineNode[] {
  return MACHINE_NODES.filter((n) => n.stratum === stratum)
}

const NODE_BY_ID = new Map(MACHINE_NODES.map((n) => [n.id, n]))
export const nodeById = (id: string): MachineNode | undefined => NODE_BY_ID.get(id)

/* ── the MR hover whisper · `fetch·····web · 9 modes` (dot-leader grammar) ────
   One line per node, derived from the graph — the machine's hover readout and
   the DOM chips' shared vocabulary. Counts appear only where they are real. */
export function nodeReadout(id: string): string | null {
  const n = NODE_BY_ID.get(id)
  if (!n) return null
  switch (n.kind) {
    case 'key':
      return `${n.label}·····envelope key · ${n.family}`
    case 'verb':
      return `${n.label}·····verb · locked`
    case 'task': {
      const t = PLAN_TASKS.find((x) => x.id === n.label)
      return `${n.label}·····${n.verb}${t ? ` · wave ${t.wave}` : ''}`
    }
    case 'gate':
      return `${n.label}·····permit gate`
    case 'builtin':
      return n.label === 'fetch'
        ? `${n.label}·····${n.family?.toLowerCase()} · ${CANON.extractModes} modes`
        : `${n.label}·····${n.family?.toLowerCase()}`
    case 'provider':
      return `${n.label}·····${n.family}`
    case 'extract':
      return `${n.label}·····mode on fetch`
    case 'errns':
      return `${n.label}·····error namespace`
  }
}
