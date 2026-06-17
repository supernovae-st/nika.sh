import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { CANON } from '../canon.generated'
import { SPEC, REPO } from '../content'
import { CodeFile } from '../components/CodeFile'
import { verbGlyph } from '../components/codefile-highlight'
import { SHOWCASE_YAML } from '../sections/usecases-yaml.generated'
import '../sections/v4-home.css'
import './spec-page.css'

/* ─── /spec · the language reference (theme-dark · blueprint register) ─────────
   Design doc §7 (Routes · /spec) — the FRIENDLY INDEX into the nika language: the
   envelope, the four verbs, the task shape, the standard library, the providers,
   the extract modes, the error namespaces, the license invariants. The GitHub
   nika-spec repo stays canonical; this page is the readable map that links OUT.

   Register: the same "sovereign engineering instrument" used across the home
   sections (src/sections/v4-home.css) — monochrome surfaces, FIG numbering, 1px
   hairline rules, tabular-nums, the .v4belt-* / .v4log / .v4own-row ledgers. An
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

/* ── FIG S.0 · the envelope · the top-level keys (from the JSON schema) ─────── */
const ENVELOPE_KEYS: { key: string; req: boolean; gloss: string }[] = [
  { key: 'nika', req: true, gloss: 'the version marker · exactly v1, forever' },
  { key: 'workflow', req: true, gloss: 'the workflow id · kebab-case · unique in the file' },
  { key: 'tasks', req: true, gloss: 'the DAG · one or more nodes, each binding one verb' },
  { key: 'description', req: false, gloss: 'a human note · free text' },
  { key: 'model', req: false, gloss: 'the default model · provider/name (e.g. ollama/llama3.1)' },
  { key: 'vars', req: false, gloss: 'typed inputs · ${{ vars.X }} · with required / default' },
  { key: 'env', req: false, gloss: 'non-sensitive runtime config · ${{ env.X }}' },
  { key: 'secrets', req: false, gloss: 'vault-backed references · never inline literals' },
  { key: 'permits', req: false, gloss: 'the capability boundary · default-deny once present' },
  { key: 'outputs', req: false, gloss: 'the return value · ${{ tasks.X.output }} · symmetric to vars' },
]

/* ── FIG S.1 · the four verbs · "a distinct native execution model" each ────── */
const VERBS: { verb: string; line: string }[] = [
  { verb: 'infer', line: 'Call a model. Any of the 14 providers; structured output when you give it a schema.' },
  { verb: 'exec', line: 'Run a real process. stdout becomes the output; a non-zero exit becomes an error.' },
  { verb: 'invoke', line: 'Call a tool — a nika: builtin or an mcp: server. Default-deny, args schema-checked.' },
  { verb: 'agent', line: 'Drive an autonomous tool-use loop, bounded by max_turns and a whitelist of tools.' },
]

/* ── FIG S.2 · the task shape (from the JSON schema $defs.task) ──────────────
   id is the only required field; exactly one verb binds. The rest are optional
   structural controls — order is the same the schema declares them. */
const TASK_FIELDS: { name: string; req: boolean; gloss: string }[] = [
  { name: 'id', req: true, gloss: 'snake_case · CEL-safe · unique in the workflow' },
  { name: '‹verb›', req: true, gloss: 'exactly one of infer · exec · invoke · agent' },
  { name: 'depends_on', req: false, gloss: 'the edges · ids this task waits on' },
  { name: 'when', req: false, gloss: 'a CEL boolean gate (or true/false) — replaces the success gate' },
  { name: 'for_each', req: false, gloss: 'map the task over a collection' },
  { name: 'max_parallel', req: false, gloss: 'cap concurrent for_each iterations · 1 = sequential' },
  { name: 'timeout', req: false, gloss: 'a quoted Go-duration · e.g. "30s" "5m" "1h30m" · max 24h' },
  { name: 'retry', req: false, gloss: 'attempts + backoff on a transient failure' },
  { name: 'on_error', req: false, gloss: 'fallback · recover from another task · or continue' },
]

/* ── FIG S.3 · the stdlib · 23 builtins, grouped into 4 families ──────────────
   The chips DERIVE from CANON.builtinNames; the family grouping is craft. A
   canon builtin not assigned to a family lands in Flow (structural guard), so
   the rendered chip count can never drop below CANON.builtins. */
const BUILTIN_FAMILIES: { label: string; names: string[] }[] = [
  { label: 'Files', names: ['read', 'write', 'edit', 'glob', 'grep'] },
  { label: 'Data', names: ['jq', 'convert', 'validate', 'json_diff', 'json_merge_patch', 'compose', 'hash', 'uuid', 'date'] },
  { label: 'Web', names: ['fetch'] },
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

/* ── FIG S.4 · providers · local-first → Mistral/cloud → mock (from CANON) ──── */
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

/* ── FIG S.6 · error namespaces (from public/errors/catalog.json · CANON) ──────
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
  const ref = useRef<HTMLElement>(null)

  useHead({
    title: 'Spec · Nika',
    meta: [
      {
        name: 'description',
        content:
          'The Nika language reference: the nika: v1 envelope, the four verbs (infer · exec · invoke · agent), the task shape, 23 builtins, 14 providers, 9 extract modes, and the 14 NIKA-XXX error namespaces. The friendly index into the nika-spec.',
      },
      { property: 'og:title', content: 'Spec · Nika' },
      {
        property: 'og:description',
        content:
          'The nika language reference — the v1 envelope, the four verbs, the task shape, the standard library, providers, extract modes and error namespaces.',
      },
      { name: 'twitter:title', content: 'Spec · Nika' },
      {
        name: 'twitter:description',
        content:
          'The nika language reference — envelope, verbs, task shape, stdlib, providers, errors.',
      },
    ],
  })

  /* reveal the section once, on first intersection (motion-safe; default visible) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('v4-in')
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.02, rootMargin: '0px 0px -4% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <main className="theme-dark spec-page">
      <section ref={ref} aria-labelledby="spec-title" className="v4sec">
        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            FIG S · the language reference
          </p>
          <h1
            id="spec-title"
            className="v4sec-title spec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            One file. The whole contract.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            A <code className="mono">.nika.yaml</code> is a small, closed language: one envelope,{' '}
            <b>four verbs</b>, a typed task shape, and a standard library you don&apos;t install.
            This is the friendly map. The{' '}
            <a href={SPEC} target="_blank" rel="noreferrer" className="spec-inline-link">
              nika-spec repository
            </a>{' '}
            is the canonical, normative source.
          </p>

          {/* a quick contents rail · jump links to each FIG */}
          <nav className="spec-toc" aria-label="On this page" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {[
              ['S.0', 'Envelope', '#s0'],
              ['S.1', 'Verbs', '#s1'],
              ['S.2', 'Task shape', '#s2'],
              ['S.3', 'Stdlib', '#s3'],
              ['S.4', 'Providers', '#s4'],
              ['S.5', 'Extract', '#s5'],
              ['S.6', 'Errors', '#s6'],
              ['S.7', 'License', '#s7'],
            ].map(([n, label, href]) => (
              <a key={n} href={href} className="spec-toc-link">
                <span className="spec-toc-n">{n}</span>
                {label}
              </a>
            ))}
          </nav>

          {/* ══ FIG S.0 · the envelope ══════════════════════════════════════ */}
          <div id="s0" className="spec-block" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            <SpecHead fig="FIG S.0" name="The envelope" count={`${ENVELOPE_KEYS.length} top-level keys`}>
              Every file opens with <code>nika: v1</code> — one version marker, pinned for the v1
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
                  className="spec-code"
                />
              </div>
            </div>
          </div>

          {/* ══ FIG S.1 · the four verbs ════════════════════════════════════ */}
          <div id="s1" className="spec-block" data-rise>
            <SpecHead fig="FIG S.1" name="The four verbs" count="4 · locked forever">
              A verb is a <b>distinct native execution model</b>. A task binds exactly one. That is
              the whole operation space — <code>fetch</code>, recall, db and files are <em>tools</em>{' '}
              reached under <code>invoke:</code>, not verbs.
            </SpecHead>
            <ul className="spec-verbs">
              {VERBS.map((v) => (
                <li className="spec-verb" key={v.verb}>
                  <span className="spec-verb-glyph" aria-hidden>
                    {verbGlyph(v.verb)}
                  </span>
                  <code className="spec-verb-name">{v.verb}</code>
                  <span className="spec-verb-line">{v.line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ══ FIG S.2 · the task shape ════════════════════════════════════ */}
          <div id="s2" className="spec-block" data-rise>
            <SpecHead fig="FIG S.2" name="The task shape" count="1 required field · 1 verb">
              A task is a DAG node. <code>id</code> is the only required field and exactly one verb
              binds; everything else is an optional structural control.
            </SpecHead>
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

          {/* ══ FIG S.3 · the stdlib ════════════════════════════════════════ */}
          <div id="s3" className="spec-block" data-rise>
            <SpecHead
              fig="FIG S.3"
              name="The standard library"
              count={`${CANON.builtins} builtins · 4 families`}
            >
              <b>{CANON.builtins}</b> builtin tools, all reached with <code>invoke:</code> — nothing
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

          {/* ══ FIG S.4 · providers ═════════════════════════════════════════ */}
          <div id="s4" className="spec-block" data-rise>
            <SpecHead
              fig="FIG S.4"
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

          {/* ══ FIG S.5 · extract modes ═════════════════════════════════════ */}
          <div id="s5" className="spec-block" data-rise>
            <SpecHead
              fig="FIG S.5"
              name="Extract modes"
              count={`${CANON.extractModes} modes on fetch`}
            >
              How <code>nika:fetch</code> turns a page into typed output — from raw{' '}
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

          {/* ══ FIG S.6 · error namespaces ══════════════════════════════════ */}
          <div id="s6" className="spec-block" data-rise>
            <SpecHead
              fig="FIG S.6"
              name="Error namespaces"
              count={`${CANON.errorNamespaces} namespaces · ${CANON.errorCodes} codes`}
            >
              Every failure carries a typed code — <code>NIKA-‹NS›-NNN</code> — across{' '}
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

          {/* ══ FIG S.7 · license + invariants ══════════════════════════════ */}
          <div id="s7" className="spec-block spec-block--last" data-rise>
            <SpecHead fig="FIG S.7" name="License + invariants" count="locked, forever">
              The contract you can count on — the parts that never change.
            </SpecHead>
            <ul className="spec-invariants">
              <Invariant fig="S.7a" claim="Forever v0.x">
                No v1.0 target. The engine matures in place; the language envelope stays{' '}
                <code>nika: v1</code>.
              </Invariant>
              <Invariant fig="S.7b" claim="Four verbs, locked">
                <code>infer · exec · invoke · agent</code> — a closed set, locked forever. New
                capability arrives as a tool, never a fifth verb.
              </Invariant>
              <Invariant fig="S.7c" claim="The spec is Apache-2.0">
                The language spec is permissive — adopt it, build a runtime against it, with a
                patent grant. The standard for the workflow file.
              </Invariant>
              <Invariant fig="S.7d" claim="The engine is AGPL-3.0-or-later">
                Copyleft on the engine — a hosted fork shares its source. Anti-extraction by
                construction.
              </Invariant>
            </ul>

            {/* the close · the dimension line + the forward links */}
            <p className="spec-note">
              {CANON.verbs} verbs · {CANON.builtins} builtins · {CANON.providers} providers ·{' '}
              {CANON.extractModes} extract modes · {CANON.errorNamespaces} error namespaces — every
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

/* ── a shared FIG sub-head · the figure number, the name, an optional count,
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
