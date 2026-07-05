import { useRevealOnce } from '../sections/use-reveal-once'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { CANON } from '../canon.generated'
import { ENGINE_VERSION, SPEC, REPO, routeHead, VERBS as VERB_CARDS } from '../content'
import { CodeFile } from '../components/CodeFile'
import { verbGlyph } from '../components/codefile-highlight'
import { SHOWCASE_YAML } from '../sections/usecases-yaml.generated'
import '../sections/v4-home.css'
import '../pages/page-chrome.css'
import './spec-page.css'

/* the 4 decorative corner crop-marks — the HUD registration on a content well. */
function HudMarks() {
  return (
    <span className="spec-hud" aria-hidden>
      <span className="spec-hud-mark spec-hud-mark--tl" />
      <span className="spec-hud-mark spec-hud-mark--tr" />
      <span className="spec-hud-mark spec-hud-mark--bl" />
      <span className="spec-hud-mark spec-hud-mark--br" />
    </span>
  )
}

/* ─── /spec · the language reference (theme-dark · blueprint register) ─────────
   Design doc §7 (Routes · /spec) — the FRIENDLY INDEX into the nika language: the
   envelope, the four verbs, the task shape, the standard library, the providers,
   the extract modes, the error namespaces, the license invariants. The GitHub
   nika-spec repo stays canonical; this page is the readable map that links OUT.

   Register: the same "sovereign engineering instrument" used across the home
   sections (src/sections/v4-home.css) — monochrome surfaces, FIG numbering, 1px
   hairline rules, tabular-nums, the .v4belt-* / .v4log ledgers. An
   instrument manual, not a marketing page.

   Spec truth BY CONSTRUCTION: every count + list comes from canon.generated.ts
   (projected from nika-spec canon.yaml · the SSOT) and the in-repo JSON schema /
   error catalog. The craft layer is glosses + grouping only; a canon entry that
   isn't glossed still renders (structural guards below), so the lists can never
   under-render. No YAML is hand-typed: the worked fragment is sliced from a real
   SHOWCASE_YAML workflow.

   SSR-safe: pure DOM (the whole reference lives in the prerendered HTML for SEO
   + an instant paint); the reveal is one IntersectionObserver on mount, content
   fully visible by default (no-JS / reduced-motion). Per-route <head> via
   useHead → prerendered into dist/spec/index.html. */

/* ── the consumer TL;DR · the 5 pillars in one glance-table ───────────────────
   Plain-words register ABOVE the technical reference (jargon may deepen below,
   never gate here). Pillar identity + order come from the spec SSOT
   (canon.yaml `pillars.items` · envelope → verbs → dag → variables → errors ·
   CANON.pillars pins the count); the consumer glosses are craft. */
const TLDR_PILLARS: { name: string; token: string; claim: string; gloss: string }[] = [
  {
    name: 'the envelope',
    token: 'nika: v1',
    claim: 'The format is frozen.',
    gloss: 'One version marker, forever: files you write today won’t break.',
  },
  {
    name: 'the verbs',
    token: 'infer · exec · invoke · agent',
    claim: 'Four moves cover everything.',
    gloss: 'Think · run a command · use a tool · delegate.',
  },
  {
    name: 'the plan (dag)',
    token: 'depends_on',
    claim: 'Tasks, and what they wait on.',
    gloss: 'Independent tasks run at the same time, automatically.',
  },
  {
    name: 'variables',
    token: '${{ }}',
    claim: 'Answers thread by name.',
    gloss: 'One task’s output becomes the next task’s input.',
  },
  {
    name: 'errors',
    token: 'NIKA-*',
    claim: 'Failures come back typed.',
    gloss: 'A stable code, plus whether retrying could help.',
  },
]

/* ── FIG S.0 · the envelope · the top-level keys (from the JSON schema) ─────── */
const ENVELOPE_KEYS: { key: string; req: boolean; gloss: string }[] = [
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

/* ── FIG S.1 · the four verbs · "a distinct native execution model" each ──────
   Each verb is a RICH CARD: a one-line execution model + a real 2-line spec
   example in the premium CodeFile (sliced from content.ts VERBS · spec-valid,
   never hand-typed here). MONOCHROME chrome — the verb hue lights only inside
   the CodeFile frame. The card titles + examples are the single source. */
const VERB_MODEL: Record<string, string> = {
  infer: 'Call a model. Any of the providers; structured output when you give it a schema.',
  exec: 'Run a real process. stdout becomes the output; a non-zero exit becomes an error.',
  invoke: 'Call a tool · a nika: builtin or an mcp: server. Default-deny, args schema-checked.',
  agent: 'Drive an autonomous tool-use loop, bounded by max_turns and a whitelist of tools.',
}

/* ── FIG S.2 · the task shape (from the JSON schema $defs.task) ──────────────
   id is the only required field; exactly one verb binds. The rest are optional
   structural controls — order is the same the schema declares them. */
const TASK_FIELDS: { name: string; req: boolean; gloss: string }[] = [
  { name: 'id', req: true, gloss: 'snake_case · CEL-safe · unique in the workflow' },
  { name: '‹verb›', req: true, gloss: 'exactly one of infer · exec · invoke · agent' },
  { name: 'depends_on', req: false, gloss: 'the edges · ids this task waits on' },
  { name: 'when', req: false, gloss: 'a CEL boolean gate (or true/false) · replaces the success gate' },
  { name: 'for_each', req: false, gloss: 'map the task over a collection' },
  { name: 'max_parallel', req: false, gloss: 'cap concurrent for_each iterations · 1 = sequential' },
  { name: 'timeout', req: false, gloss: 'a quoted Go-duration · e.g. "30s" "5m" "1h30m" · max 24h' },
  { name: 'retry', req: false, gloss: 'attempts + backoff on a transient failure' },
  { name: 'on_error', req: false, gloss: 'fallback · recover from another task · or continue' },
]

/* ── FIG S.3 · the permits · the enforcement model (from public/schema/workflow.json
   §permits + public/errors/catalog.json security_error class) ─────────────────
   The capability boundary an agent must satisfy before it acts. Once `permits:`
   is present, every category is DEFAULT-DENY — anything not declared is refused
   BEFORE the effect runs (not logged after). Worded straight off the JSON schema. */
const PERMIT_CATS: { key: string; cap: string; glyph: string; gloss: string; shape: string }[] = [
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

/* the enforcement codes · what « out of bounds » resolves to — a denial BEFORE
   the effect, from public/errors/catalog.json (security_error class · NIKA-SEC). */
const PERMIT_DENIALS: { code: string; failure: string }[] = [
  { code: 'NIKA-SEC-004', failure: 'effect outside the declared permits: boundary (fs / net / exec / tool)' },
  { code: 'NIKA-SEC-002', failure: 'agent tool call outside the tools: whitelist' },
  { code: 'NIKA-SEC-001', failure: 'exec: blocklist hit' },
]

/* ── FIG S.4 · the stdlib builtins, grouped into 5 families (count from CANON) ─
   The chips DERIVE from CANON.builtinNames; the family grouping is craft. A
   canon builtin not assigned to a family lands in Flow (structural guard), so
   the rendered chip count can never drop below CANON.builtins. */
const BUILTIN_FAMILIES: { label: string; names: string[] }[] = [
  { label: 'Files', names: ['read', 'write', 'edit', 'glob', 'grep'] },
  { label: 'Data', names: ['jq', 'convert', 'validate', 'json_diff', 'json_merge_patch', 'compose', 'hash', 'uuid', 'date'] },
  { label: 'Web', names: ['fetch'] },
  { label: 'Media', names: ['image_generate', 'tts_generate'] },
  { label: 'Flow', names: ['assert', 'done', 'wait', 'emit', 'log', 'notify', 'prompt', 'inspect'] },
]
const FAMILIED = new Set(BUILTIN_FAMILIES.flatMap((f) => f.names))
for (const b of CANON.builtinNames) {
  if (!FAMILIED.has(b)) BUILTIN_FAMILIES[BUILTIN_FAMILIES.length - 1].names.push(b)
}
/* keep each family to the canon set only (drop a glossed name that left canon) */
const BUILTIN_GROUPS = BUILTIN_FAMILIES.map((f) => ({
  label: f.label,
  names: f.names.filter((n) => (CANON.builtinNames as readonly string[]).includes(n)),
}))

/* ── FIG S.5 · providers · local-first → Mistral/cloud → mock (from CANON) ──── */
const PROVIDER_DISPLAY: Record<string, string> = {
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
  mock: 'mock',
}
const display = (id: string) => PROVIDER_DISPLAY[id] ?? id
const PROVIDERS_LOCAL = CANON.providerIdsLocal.map(display)
const PROVIDERS_CLOUD = CANON.providerIdsCloud.map(display)
const PROVIDERS_TEST = CANON.providerIdsTest.map(display)

/* ── FIG S.7 · error namespaces (from public/errors/catalog.json · CANON) ──────
   The 14 NIKA-XXX namespaces + a one-line scope each. CANON.errorNamespaceNames
   is the SSOT for the list + count; the scope glosses are craft (an un-glossed
   namespace renders with a fallback, so the list can never under-render). */
const NS_SCOPE: Record<string, string> = {
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
const nsScope = (ns: string) => NS_SCOPE[ns] ?? 'see the error catalog'

/* the worked fragment · sliced from a REAL showcase workflow (never hand-typed).
   standup-digest exercises 3 of the 4 verbs (invoke · exec · infer) in a tiny
   readable DAG — the friendly first look. Falls back gracefully if the key ever
   leaves the projection. */
const SAMPLE_YAML =
  SHOWCASE_YAML['t1-standup-digest'] ?? Object.values(SHOWCASE_YAML)[0] ?? 'nika: v1\n'

export function Component() {
  /* reveal the section once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  useHead({
    title: 'Spec · Nika',
    link: routeHead('/spec').link,
    meta: [
      ...routeHead('/spec').meta,
      {
        name: 'description',
        content:
          'The whole language at a glance: a frozen format, four verbs (think, run a command, use a tool, delegate), the plan, variables and typed errors.',
      },
      { property: 'og:title', content: 'Spec · Nika' },
      {
        property: 'og:description',
        content:
          'The nika language reference: the v1 envelope, the four verbs, the task shape, the standard library, providers, extract modes and error namespaces.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-spec.png' },
      {
        property: 'og:image:alt',
        content:
          'Nika spec: the contract an agent must satisfy before it acts. permits: infer · exec · invoke · agent.',
      },
      { name: 'twitter:title', content: 'Spec · Nika' },
      {
        name: 'twitter:description',
        content:
          'The nika language reference: envelope, verbs, task shape, stdlib, providers, errors.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-spec.png' },
    ],
  })

  return (
    <main className="theme-dark spec-page">
      <section ref={ref} aria-labelledby="spec-title" className="v4sec">
        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            the language reference
          </p>
          <h1
            id="spec-title"
            className="v4sec-title spec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            The contract an agent must satisfy before it acts.
          </h1>
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch" data-rise style={{ ['--rise-delay' as string]: '90ms' }}>
            The contract. Frozen forever.
          </p>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            A <code className="mono">.nika.yaml</code> is the plan, written down: one envelope,{' '}
            <b>four verbs</b>, a typed task shape, and a <b>permits</b> block that declares,
            and bounds, everything it&apos;s allowed to touch. You review it, the runtime
            enforces it, then it runs. This is the friendly map; the{' '}
            <a href={SPEC} target="_blank" rel="noreferrer" className="spec-inline-link">
              nika-spec repository
            </a>{' '}
            is the canonical, normative source.
          </p>

          {/* ── the consumer TL;DR · the whole language in one glance-table ──
              Museum-plate rows (01 · the envelope → 05 · errors), each a
              two-tone sentence + its mono token. The technical reference
              (S.0+) deepens every row below. */}
          <section
            className="spec-tldr"
            aria-labelledby="spec-tldr-title"
            data-rise
            style={{ ['--rise-delay' as string]: '130ms' }}
          >
            <p className="spec-tldr-kicker">tl;dr · {CANON.pillars} pillars</p>
            <h2 id="spec-tldr-title" className="spec-tldr-title">
              The whole language, at a glance.
            </h2>
            <dl className="spec-tldr-table">
              {TLDR_PILLARS.map((p, i) => (
                <div className="spec-tldr-row" key={p.name}>
                  <dt className="spec-tldr-plate">
                    {String(i + 1).padStart(2, '0')} · {p.name}
                  </dt>
                  <dd className="spec-tldr-gloss">
                    <b>{p.claim}</b> {p.gloss}
                  </dd>
                  <dd className="spec-tldr-token">
                    <code>{p.token}</code>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="spec-tldr-link">
              full text:{' '}
              <a href={SPEC} target="_blank" rel="noreferrer">
                github.com/supernovae-st/nika-spec
              </a>{' '}
              ↗ · machine contract:{' '}
              <a href="/schema/workflow.json" target="_blank" rel="noreferrer">
                workflow.json
              </a>
            </p>
          </section>

          {/* the spec-sheet register · the contract's key dimensions, at a glance.
              Every number derives from CANON (the spec SSOT), never hand-typed. */}
          <ul className="spec-stamp" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
            {[
              { n: CANON.verbs, label: 'verbs', sub: 'locked' },
              { n: CANON.builtins, label: 'builtins', sub: '4 families' },
              { n: CANON.providers, label: 'providers', sub: `${CANON.providersLocal} local` },
              { n: CANON.extractModes, label: 'extract', sub: 'on fetch' },
              { n: CANON.errorNamespaces, label: 'namespaces', sub: `${CANON.errorCodes} codes` },
            ].map((s, i) => (
              <li className="spec-stamp-cell" key={s.label}>
                <span className="spec-stamp-fig" aria-hidden>
                  {String(i).padStart(2, '0')}
                </span>
                <span className="spec-stamp-n">{s.n}</span>
                <span className="spec-stamp-label">{s.label}</span>
                <span className="spec-stamp-sub">{s.sub}</span>
              </li>
            ))}
          </ul>

          {/* a quick contents rail · jump links to each section */}
          <nav className="spec-toc" aria-label="On this page" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {[
              ['S.0', 'Envelope', '#s0'],
              ['S.1', 'Verbs', '#s1'],
              ['S.2', 'Task shape', '#s2'],
              ['S.3', 'Permits', '#permits'],
              ['S.4', 'Stdlib', '#s3'],
              ['S.5', 'Providers', '#s4'],
              ['S.6', 'Extract', '#s5'],
              ['S.7', 'Errors', '#s6'],
              ['S.8', 'License', '#s7'],
            ].map(([n, label, href]) => (
              <a key={n} href={href} className="spec-toc-link">
                <span className="spec-toc-n">{n}</span>
                {label}
              </a>
            ))}
          </nav>

          {/* ══ S.0 · the envelope ══════════════════════════════════════ */}
          <div id="s0" className="spec-block" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            <SpecHead fig="S.0" name="The envelope" count={`${ENVELOPE_KEYS.length} top-level keys`}>
              Every file opens with <code>nika: v1</code>, one version marker, pinned for the v1
              lifetime. No <code>v1.0</code>, no <code>v2</code> migration. Three keys are required;
              the rest are optional.
            </SpecHead>
            <div className="spec-split">
              <ul className="spec-keys">
                {ENVELOPE_KEYS.map((k) => (
                  <li className="spec-key" key={k.key}>
                    <code className="spec-key-name">{k.key}</code>
                    <span className={`spec-key-req${k.req ? '' : ' spec-key-req--opt'}`}>
                      {k.req ? 'required' : 'optional'}
                    </span>
                    <span className="spec-key-gloss">{k.gloss}</span>
                  </li>
                ))}
              </ul>
              <div className="spec-aside">
                <p className="spec-aside-cap">A real file · standup-digest</p>
                <CodeFile
                  yaml={SAMPLE_YAML}
                  filename="standup-digest.nika.yaml"
                  className="spec-code" wrap tips />
              </div>
            </div>
          </div>

          {/* ══ S.1 · the four verbs ════════════════════════════════════
              Rich cards · a real 2-line example open in the premium CodeFile.
              The verb hue lights ONLY inside the code frame — the card chrome
              and the rest of the reference stay monochrome. */}
          <div id="s1" className="spec-block" data-rise>
            <SpecHead fig="S.1" name="The four verbs" count={`${CANON.verbs} · locked forever`}>
              A verb is a <b>distinct native execution model</b>. A task binds exactly one. That is
              the whole operation space: <code>fetch</code>, recall, db and files are <em>tools</em>{' '}
              reached under <code>invoke:</code>, not verbs.
            </SpecHead>
            <div className="spec-verbcards">
              {VERB_CARDS.map((v, i) => (
                <article className="spec-verbcard" key={v.verb}>
                  <HudMarks />
                  <header className="spec-verbcard-head">
                    <span className="spec-verbcard-glyph" aria-hidden>
                      {verbGlyph(v.verb)}
                    </span>
                    <code className="spec-verbcard-name">{v.verb}</code>
                    <span className="spec-verbcard-tag">{v.tagline}</span>
                    <span className="spec-verbcard-fig" aria-hidden>
                      {`S.1.${i + 1}`}
                    </span>
                  </header>
                  <p className="spec-verbcard-model">{VERB_MODEL[v.verb]}</p>
                  <div className="spec-verbcard-code">
                    <CodeFile yaml={v.code} lang="yaml" lineNumbers={false} wrap tips />
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* ══ S.2 · the task shape ════════════════════════════════════
              An anatomy diagram (a labelled node · the required core lit, the
              optional controls dimmed) beside the full field ledger. */}
          <div id="s2" className="spec-block" data-rise>
            <SpecHead fig="S.2" name="The task shape" count="1 required field · 1 verb">
              A task is a DAG node. <code>id</code> is the only required field and exactly one verb
              binds; everything else is an optional structural control.
            </SpecHead>
            <div className="spec-tasksplit">
              {/* the anatomy · a labelled task node */}
              <figure className="spec-anatomy">
                <HudMarks />
                <figcaption className="spec-anatomy-cap mono">anatomy of a task node</figcaption>
                <div className="spec-anatomy-node">
                  <span className="spec-anatomy-line">
                    <span className="spec-anatomy-punct" aria-hidden>
                      -{' '}
                    </span>
                    <span className="spec-anatomy-k spec-anatomy-k--req">id</span>
                    <span className="spec-anatomy-punct">: </span>
                    <span className="spec-anatomy-v">summarize</span>
                    <span className="spec-anatomy-mark spec-anatomy-mark--req">required</span>
                  </span>
                  <span className="spec-anatomy-line spec-anatomy-line--verb">
                    <span className="spec-anatomy-k spec-anatomy-k--verb">infer</span>
                    <span className="spec-anatomy-punct">:</span>
                    <span className="spec-anatomy-mark spec-anatomy-mark--verb">
                      1 of {CANON.verbs} verbs
                    </span>
                  </span>
                  <span className="spec-anatomy-line spec-anatomy-line--nest">
                    <span className="spec-anatomy-punct">  prompt: </span>
                    <span className="spec-anatomy-v">&quot;…&quot;</span>
                  </span>
                  <span className="spec-anatomy-line">
                    <span className="spec-anatomy-k spec-anatomy-k--opt">depends_on</span>
                    <span className="spec-anatomy-punct">: [extract]</span>
                    <span className="spec-anatomy-mark">the edges</span>
                  </span>
                  <span className="spec-anatomy-line">
                    <span className="spec-anatomy-k spec-anatomy-k--opt">when</span>
                    <span className="spec-anatomy-punct">: </span>
                    <span className="spec-anatomy-v">${'{{'} … {'}}'}</span>
                    <span className="spec-anatomy-mark">a CEL gate</span>
                  </span>
                </div>
                <p className="spec-anatomy-legend">
                  <span className="spec-anatomy-legend-item spec-anatomy-legend-item--req">
                    required core
                  </span>
                  <span className="spec-anatomy-legend-item spec-anatomy-legend-item--opt">
                    optional controls
                  </span>
                </p>
              </figure>

              {/* the full ledger · name · req · gloss */}
              <ul className="spec-fields">
                {TASK_FIELDS.map((f) => (
                  <li className="spec-field" key={f.name}>
                    <code className="spec-field-name">{f.name}</code>
                    <span className={`spec-field-req${f.req ? '' : ' spec-field-req--opt'}`}>
                      {f.req ? 'req' : 'opt'}
                    </span>
                    <span className="spec-field-gloss">{f.gloss}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ══ S.3 · the permits — the enforcement model (the seatbelt) ══ */}
          <div id="permits" className="spec-block spec-block--permits" data-rise>
            <SpecHead
              fig="S.3"
              name="The permits"
              count="default-deny once present"
            >
              The <b>capability boundary</b>: the contract an agent must satisfy before it
              acts. Once <code>permits:</code> is present, every category is{' '}
              <b>default-deny</b>: which files it can read, which it can write (read XOR
              write), which hosts it can reach, which programs it can run, which tools it may
              call. The runtime <em>enforces</em> it: out of bounds is <b>denied</b>, not
              logged after the fact.
            </SpecHead>
            {/* the boundary diagram · the plan sits at the centre; every effect
                must pass through one of the four declared gates before it runs.
                Anything off the list is denied at the gate — a refusal, not a log. */}
            <div className="spec-boundary" data-rise>
              <HudMarks />
              <span className="spec-boundary-ring" aria-hidden />
              <span className="spec-boundary-ring spec-boundary-ring--2" aria-hidden />
              <div className="spec-boundary-core">
                <span className="spec-boundary-core-glyph" aria-hidden>
                  ❯
                </span>
                <span className="spec-boundary-core-label">the plan</span>
                <span className="spec-boundary-core-sub mono">default-deny</span>
              </div>
              <ul className="spec-boundary-gates">
                {PERMIT_CATS.map((c, i) => (
                  <li className={`spec-boundary-gate spec-boundary-gate--${c.key}`} key={c.key}>
                    <span className="spec-boundary-gate-glyph" aria-hidden>
                      {c.glyph}
                    </span>
                    <code className="spec-boundary-gate-cap">{c.cap}</code>
                    <span className="spec-boundary-gate-shape mono" aria-hidden>
                      {c.shape}
                    </span>
                    <span className="spec-boundary-gate-fig mono" aria-hidden>
                      {['i', 'ii', 'iii', 'iv'][i]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="spec-permits-grid">
              {/* the four declarable categories · the gloss ledger */}
              <dl className="spec-permits-cats">
                {PERMIT_CATS.map((c, i) => (
                  <div className="spec-permits-cat" key={c.cap}>
                    <dt className="spec-permits-cat-key">
                      <span className="spec-permits-cat-fig" aria-hidden>
                        {['i', 'ii', 'iii', 'iv'][i]}
                      </span>
                      <span className="spec-permits-cat-glyph" aria-hidden>
                        {c.glyph}
                      </span>
                      <code>{c.cap}</code>
                    </dt>
                    <dd className="spec-permits-cat-gloss">
                      {c.gloss}
                      <span className="spec-permits-cat-shape mono" aria-hidden>
                        {c.shape}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              {/* the enforcement codes · denied, before it runs */}
              <div className="spec-permits-denials">
                <p className="spec-permits-denials-head mono">
                  <span className="spec-permits-denials-dot" aria-hidden />
                  denied, before it runs
                </p>
                <ul className="spec-permits-codes">
                  {PERMIT_DENIALS.map((d) => (
                    <li className="spec-permits-code" key={d.code}>
                      <span className="spec-permits-code-id mono">{d.code}</span>
                      <span className="spec-permits-code-fail">{d.failure}</span>
                    </li>
                  ))}
                </ul>
                <p className="spec-permits-foot">
                  See it felt, not told:{' '}
                  <Link to="/#human-in-the-loop" className="spec-inline-link">
                    toggle a permit and watch the runtime obey
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* ══ S.4 · the stdlib ════════════════════════════════════════ */}
          <div id="s3" className="spec-block" data-rise>
            <SpecHead
              fig="S.4"
              name="The standard library"
              count={`${CANON.builtins} builtins · 4 families`}
            >
              <b>{CANON.builtins}</b> builtin tools, all reached with <code>invoke:</code> · nothing
              to install. Grouped by what they touch.
            </SpecHead>
            <div className="spec-fams">
              {BUILTIN_GROUPS.map((f) => (
                <div className="spec-fam" key={f.label}>
                  <p className="spec-fam-label">
                    {f.label}
                    <span className="spec-fam-n">· {f.names.length}</span>
                  </p>
                  <div className="spec-chips">
                    {f.names.map((n) => (
                      <code className="spec-chip" key={n}>
                        {n}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ S.5 · providers ═════════════════════════════════════════ */}
          <div id="s4" className="spec-block" data-rise>
            <SpecHead
              fig="S.5"
              name="Providers"
              count={`${CANON.providers} · ${CANON.providersLocal} local · ${CANON.providersCloud} cloud · ${CANON.providersTest} mock`}
            >
              Pick per task or per file. <b>Local-first</b>: <code>provider: ollama</code> runs
              offline, no key. Cloud is open-weight-first (Mistral leads).
            </SpecHead>
            <div className="spec-fams">
              <div className="spec-fam">
                <p className="spec-fam-label">
                  Local runtimes
                  <span className="spec-fam-n">· {CANON.providersLocal} · offline</span>
                </p>
                <div className="spec-chips">
                  {PROVIDERS_LOCAL.map((p) => (
                    <code className="spec-chip" key={p}>
                      {p}
                    </code>
                  ))}
                </div>
              </div>
              <div className="spec-fam">
                <p className="spec-fam-label">
                  Cloud · open-weight first
                  <span className="spec-fam-n">· {CANON.providersCloud}</span>
                </p>
                <div className="spec-chips">
                  {PROVIDERS_CLOUD.map((p) => (
                    <code className="spec-chip" key={p}>
                      {p}
                    </code>
                  ))}
                </div>
              </div>
              <div className="spec-fam">
                <p className="spec-fam-label">
                  Test
                  <span className="spec-fam-n">· {CANON.providersTest} · deterministic</span>
                </p>
                <div className="spec-chips">
                  {PROVIDERS_TEST.map((p) => (
                    <code className="spec-chip" key={p}>
                      {p}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ══ S.6 · extract modes ═════════════════════════════════════ */}
          <div id="s5" className="spec-block" data-rise>
            <SpecHead
              fig="S.6"
              name="Extract modes"
              count={`${CANON.extractModes} modes on fetch`}
            >
              How <code>nika:fetch</code> turns a page into typed output: from raw{' '}
              <code>text</code> to a parsed <code>article</code>, <code>feed</code> or{' '}
              <code>jq</code> projection.
            </SpecHead>
            <div className="spec-chips">
              {CANON.extractModeNames.map((m) => (
                <code className="spec-chip" key={m}>
                  {m}
                </code>
              ))}
            </div>
          </div>

          {/* ══ S.7 · error namespaces ══════════════════════════════════ */}
          <div id="s6" className="spec-block" data-rise>
            <SpecHead
              fig="S.7"
              name="Error namespaces"
              count={`${CANON.errorNamespaces} namespaces · ${CANON.errorCodes} codes`}
            >
              Every failure carries a typed code (<code>NIKA-‹NS›-NNN</code>) across{' '}
              <b>{CANON.errorNamespaces}</b> namespaces, with a category and a transient flag. The
              full registry lives in <code>errors/catalog.json</code>.
            </SpecHead>
            <ul className="spec-ns">
              {CANON.errorNamespaceNames.map((ns) => (
                <li className="spec-ns-row" key={ns}>
                  <code className="spec-ns-name">{ns}</code>
                  <span className="spec-ns-scope">{nsScope(ns)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ══ S.8 · license + invariants ══════════════════════════════ */}
          <div id="s7" className="spec-block spec-block--last" data-rise>
            <SpecHead fig="S.8" name="License + invariants" count="locked, forever">
              The contract you can count on: the parts that never change.
            </SpecHead>
            <ul className="spec-invariants">
              <Invariant fig="S.8a" claim="Real semver toward 1.0">
                The engine ships on real semver: currently {ENGINE_VERSION}, toward a
                1.0 launch. The language envelope stays <code>nika: v1</code>, frozen forever.
              </Invariant>
              <Invariant fig="S.8b" claim="Four verbs, locked">
                <code>infer · exec · invoke · agent</code>: a closed set, locked forever. New
                capability arrives as a tool, never a fifth verb.
              </Invariant>
              <Invariant fig="S.8c" claim="The spec is Apache-2.0">
                The language spec is permissive: adopt it, build a runtime against it, with a
                patent grant. The standard for the workflow file.
              </Invariant>
              <Invariant fig="S.8d" claim="The engine is AGPL-3.0-or-later">
                Copyleft on the engine: a hosted fork shares its source. Anti-extraction by
                construction.
              </Invariant>
            </ul>

            {/* the close · the dimension line + the forward links */}
            <p className="spec-note">
              {CANON.verbs} verbs · {CANON.builtins} builtins · {CANON.providers} providers ·{' '}
              {CANON.extractModes} extract modes · {CANON.errorNamespaces} error namespaces · every
              count derives from the spec&apos;s <code>canon.yaml</code>, never hand-typed
            </p>

            <div className="spec-links">
              <a href={SPEC} target="_blank" rel="noreferrer" className="spec-link">
                Read the full spec
                <span aria-hidden className="spec-link-arrow">
                  {' '}
                  ↗
                </span>
              </a>
              <Link to="/use-cases" className="spec-link spec-link--dim">
                See it in real workflows
                <span aria-hidden className="spec-link-arrow">
                  {' '}
                  →
                </span>
              </Link>
              <a href={REPO} target="_blank" rel="noreferrer" className="spec-link spec-link--dim">
                <span aria-hidden className="spec-link-glyph">
                  ★
                </span>
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

/* ── a shared sub-head · the section index, the name, an optional count,
   and a one-line caption — the register used at the top of every spec block. */
function SpecHead({
  fig,
  name,
  count,
  children,
}: {
  fig: string
  name: string
  count?: string
  children: React.ReactNode
}) {
  return (
    <div className="spec-head">
      <div className="spec-head-line">
        <span className="spec-head-fig">{fig}</span>
        <h2 className="spec-head-name">{name}</h2>
        {count ? <span className="spec-head-count">{count}</span> : null}
      </div>
      <p className="spec-head-cap">{children}</p>
    </div>
  )
}

/* ── one invariant row · a FIG tick + a claim + a one-line detail ── */
function Invariant({
  fig,
  claim,
  children,
}: {
  fig: string
  claim: string
  children: React.ReactNode
}) {
  return (
    <li className="spec-invariant">
      <p className="spec-invariant-claim">
        <span className="spec-invariant-fig">{fig}</span>
        {claim}
      </p>
      <p className="spec-invariant-detail">{children}</p>
    </li>
  )
}
