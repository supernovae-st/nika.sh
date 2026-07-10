/* ─── changelog · the ship log (home preview FIG 8.0 · /changelog page FIG C) ─
   A SEED changelog of REAL project milestones — honest, no invented features,
   no fabricated metrics. Each entry is a dated, tagged, one-line record of
   something that actually happened (the spec license, the four-verb lock, the
   stdlib surface, the provider catalog, this very site). Numbers that appear in
   the copy come from CANON (the spec single source of truth), never hand-typed.

   Exported as a flat, newest-first list so BOTH surfaces reuse it:
     · the HOME section <ChangelogPreview/> shows the latest few (FIG 8.0)
     · the /changelog page (Phase 4) renders the full register.

   DATE HONESTY: `release` entries carry the REAL GitHub release dates
   (github.com/supernovae-st/nika/releases) and render day-true. Everything
   else is a public MILESTONE — its ISO date orders the register, but only the
   month is recorded fact, so milestones RENDER at month precision (entryDate /
   entryDateTime below) and never claim a day we did not log. Tags are a small
   closed vocabulary so the register reads like a real ship log, not marketing. */

import { CANON } from '../canon.generated'

export type ChangelogTag =
  | 'release'
  | 'spec'
  | 'language'
  | 'stdlib'
  | 'providers'
  | 'security'
  | 'tooling'
  | 'site'

export interface ChangelogEntry {
  /** ISO date · used for the <time> + the displayed register date. */
  date: string
  /** the short register tag (a closed vocabulary · drives the mono label). */
  tag: ChangelogTag
  /** the headline · one line, honest, no invented feature claims. */
  title: string
  /** the one-line description · the body register line. */
  body: string
  /** the GitHub release URL — release-tagged entries carry their notes (one voice) */
  gh?: string
}

/* newest-first. LIVE counts interpolate from CANON so they can never drift
   from the spec; DATED milestones never carry live counts (they'd rewrite
   their own history — twice caught, now law). */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-07-10',
    tag: 'release',
    title: 'v0.99.0 · the audit tells the whole truth, the run narrates its own',
    body: 'The check ladder earns its MODELS rung: every model: must resolve in THIS binary — a bare id or an undriveable provider is a finding with the fix taught in-line, pricing refuses to conjure what it cannot resolve, and the MCP nika_check lane obeys the same law. Two media builtins graduate: nika:image_fx (15 deterministic op families over a hand-rolled PNG codec, recipe in the tEXt chunk) and nika:chart (five chart types compiled to byte-identical SVG, parity proven across architectures) — both zero-dep, both sha256-chained into the trace. Egress to outputs closes the one documented gap: the workflow boundary gets its own sink-only declassification valve, and every embedded template now passes its own audit. explain --forecast computes duration/cost/risk priors from YOUR local traces (p50/p90 earned at n ≥ 5, never a model call); wire covers opencode and hermes (8 targets); and the release tarball itself is funnel-gated — a stranger’s broken first run never uploads.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.99.0',
  },
  {
    date: '2026-07-09',
    tag: 'site',
    title: 'nika.sh v4.6 · the black frame, and the page learns its colour law',
    body: 'The device contour is rebuilt around one rule: the material is black, the colour is light. A near-black frame carries a static edge-light whose hue and richness read the section under it (blue over the hero, coral at the close, calm on reading pages), the screen recesses into the frame on all four edges, and the ambient loop that breathes the iridescence is finally alive at rest — a mount-order race had silenced it since the frame was born. The home composition gains the same clarity: dark is the stage, every light or blue chapter is a sheet laid on it. And a dark-only site learns to print: white paper, black ink, whole code panels.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.6.0',
  },
  {
    date: '2026-07-08',
    tag: 'site',
    title: 'nika.sh v4.5 · the film becomes an instrument',
    body: 'The home film gains a real transport: a docked run monitor with live timecode, seek from any surface (a DAG node, a log line, the file itself), and an ending that lands on the $0.00 · local punchline — then hands the exact file you watched to the playground, one click from editable. The whole site now lives inside a living device frame: a dark skeuomorphic contour whose colour, depth and light read the section and route you are on, igniting while a run plays.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.5.0',
  },
  {
    date: '2026-07-08',
    tag: 'release',
    title: 'v0.98.0 · native answers, one lexer',
    body: 'Structured output rides each provider\u2019s own grammar (Anthropic output_config, Gemini responseJsonSchema, OpenAI strict-mode honesty) with a coercion ladder that repairs before any paid retry; the checker closes run-fail gaps (the block-sequence bomb dies as NIKA-PARSE-001, env: binds at run exactly as checked); the ${{ }} scanner becomes one shared crate for checker AND runtime — parity by construction; and the first 30 seconds learn to speak: nika welcome mirrors your machine, nika explain narrates a file, init briefs six agent surfaces, --max-cost-usd refuses to start past the static floor.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.98.0',
  },
  {
    date: '2026-07-07',
    tag: 'release',
    title: 'v0.97.0 · the run becomes evidence',
    body: 'Every journal line carries a hash chain — trace verify walks it and names the first broken link; trace reproduce says whether a run is reproducible and WHY not; the journal attests which engine on which platform wrote it. Models are priced before the first run (602 rules from models.dev — the VS Code preflight shows $/1M on this tag); check IS the dry-run (the plan names what dispatches when); doctor speaks JSON; bare init/new converse; and the drift warn tells a re-encode from an edit.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.97.0',
  },
  {
    date: '2026-07-06',
    tag: 'release',
    title: 'v0.96.0 · the run becomes a place',
    body: 'nika dap brings time-travel replay debugging over the run journal (breakpoints in your YAML, step forward AND backward — the VS Code F5 integration lights up on this tag); trace export projects any journal to OTLP for Jaeger/Grafana/Langfuse; check --json states the caller contract (requirements: models, keys, secrets, env) before any token; a typo\'d field teaches (did you mean `infer`?); runs record their source sha and skips say why.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.96.0',
  },
  {
    date: '2026-07-06',
    tag: 'release',
    title: 'v0.95.0 · the catalog practices local-first',
    body: 'The 5 local servers (Ollama, LM Studio, llama.cpp, LocalAI, vLLM) join the catalog with descriptions, tags and seed models — keyless by construction, sovereign models stay unpriced, never « free ». A bare nika suggests the next command; write honors create_dirs: false loudly, date resolves timezones from the bundled db, log neutralizes control sequences, and the MCP stdio transport bounds its reads.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.95.0',
  },
  {
    date: '2026-07-06',
    tag: 'release',
    title: 'v0.94.0 · the media suite · every run leaves a journal',
    body: 'Two media builtins take the stdlib to 25 — image generation and editing plus speech synthesis, sovereign-first with provenance manifests; every run now writes .nika/traces by default, --task scopes execution to one cone, the catalog rides the wire (catalog/tools --json + an 8-tool MCP oracle on 2026-07-28), cost_usd never lies, and doctor --ping actually probes the local ports.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.94.0',
  },
  {
    date: '2026-07-05',
    tag: 'providers',
    title: `${CANON.providers} model providers · Hugging Face and NVIDIA join`,
    body: `Two more ways to bring your own model: Hugging Face and NVIDIA endpoints join the catalog (${CANON.providersLocal} local runtimes unchanged — the sovereign path stays the default).`,
  },
  {
    date: '2026-07-05',
    tag: 'release',
    title: 'v0.93.1 · the pack teaches 2026 models',
    body: 'The embedded teaching pack vendors the current spec cascade, so nika init hands a 2026 local model the language on day one; the README gains the daily-commands loop.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.93.1',
  },
  {
    date: '2026-07-05',
    tag: 'release',
    title: 'v0.93.0 · the run becomes durable',
    body: 'Kill a run mid-flight and --resume banks the finished work as visible cache hits; a nika:prompt gate pauses durably for a human answer; nika test joins the CLI and local models get honest timeouts.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.93.0',
  },
  {
    date: '2026-07-05',
    tag: 'site',
    title: 'The blog is a folder',
    body: 'content/blog in the site repo IS the blog: PR-able markdown compiled to real pages with the product’s editor panels. The archive backfills the journey, one post per milestone, at its real date.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.3.0',
  },
  {
    date: '2026-07-04',
    tag: 'tooling',
    title: 'The playground draws the plan',
    body: 'nika.sh/play renders the live DAG of your file as you type, simulates the run order over the real topology (no fabricated timings), and reads the declared blast radius back to you.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.2.0',
  },
  {
    date: '2026-07-03',
    tag: 'release',
    title: 'v0.92.0 · the agent-native release',
    body: 'Agents learn the language from the binary: MCP tools serve the schema, examples and canon; nika init scaffolds AGENTS.md; nika wire reaches Codex and the Claude Code plugin marketplace. macOS binaries ship signed and notarized.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.92.0',
  },
  {
    /* a dated entry NEVER carries the live version variable — this one once
       interpolated ENGINE_VERSION and silently rewrote itself at each bump. */
    date: '2026-06-25',
    tag: 'release',
    title: 'v0.91.0 · smoother first fifteen minutes',
    body: 'nika examples run --model previews any embedded workflow offline: no key, no model server; nika init and nika wire handle onboarding; headless Linux builds compile clean.',
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.91.0',
  },
  {
    date: '2026-06-21',
    tag: 'release',
    title: 'v0.90.0 · first public release',
    body: `One brew-installable binary for macOS and Linux: the ${CANON.verbs} verbs end to end, the nika check static audit, and an embedded examples pack.`,
    gh: 'https://github.com/supernovae-st/nika/releases/tag/v0.90.0',
  },
  {
    date: '2026-06-17',
    tag: 'site',
    title: 'nika.sh v4 · Intent as Code',
    body: 'The site rebuilt around one idea: a real .nika.yaml file, instant and crawlable, with the spec as the single source of truth.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v4.0.0',
  },
  {
    date: '2026-06-12',
    tag: 'tooling',
    title: 'The playground · validate Nika in the browser',
    body: 'Edit a real workflow at nika.sh/play and watch it check as you type, with the engine’s own NIKA error codes. No install to try it.',
    gh: 'https://github.com/supernovae-st/nika.sh/releases/tag/v3-playground',
  },
  {
    date: '2026-06-02',
    tag: 'security',
    title: 'permits: · the declared blast radius',
    body: 'Every plan can state exactly what it may touch: files, hosts, programs, tools. Once permits: is present, every category is default-deny.',
  },
  {
    date: '2026-05-28',
    tag: 'security',
    title: 'Enforced before it runs · NIKA-SEC codes',
    body: 'Out-of-bounds is denied, not logged after the fact: an effect past the permits: boundary fails with NIKA-SEC-004 before the action happens.',
  },
  {
    /* count-free on purpose: this DATED milestone once interpolated the live
       CANON counts and silently rewrote itself at every catalog change (the
       same self-rewriting class as the ENGINE_VERSION entry, fixed 2026-07-04).
       The catalog's CURRENT size lives in dated entries of its own. */
    date: '2026-05-22',
    tag: 'providers',
    title: 'The provider catalog goes local-first',
    body: 'One verb, any model: five local runtimes (Ollama, LM Studio, llama.cpp, LocalAI, vLLM) and a cloud catalog led by open-weight. Your machine, your choice.',
  },
  {
    date: '2026-05-22',
    tag: 'language',
    title: 'Four verbs, locked forever',
    body: 'infer · exec · invoke · agent: a verb is a distinct native execution model. No fifth verb, ever (D-2026-05-22-N18).',
  },
  {
    date: '2026-05-18',
    tag: 'tooling',
    title: 'MCP, native · any server through invoke',
    body: 'Reach a Model Context Protocol server the same way as a builtin: invoke a mcp: tool id. Default-deny: the file whitelists what an agent may call.',
  },
  {
    date: '2026-05-14',
    tag: 'stdlib',
    title: `fetch · ${CANON.extractModes} extract modes`,
    body: `One builtin turns a page into typed output ${CANON.extractModes} ways: article, markdown, text, links, metadata, selector, sitemap, feed and jq. Read-only by design.`,
  },
  {
    date: '2026-05-10',
    tag: 'stdlib',
    title: `Standard library v0.1 · ${CANON.builtins} builtins`,
    body: `${CANON.builtins} builtin tools across files, data, web and flow, all reached the same way, with invoke:. Nothing to install.`,
  },
  {
    date: '2026-05-04',
    tag: 'spec',
    title: `The error catalog · ${CANON.errorCodes} typed codes`,
    body: `Every failure has a stable NIKA-* code across ${CANON.errorNamespaces} namespaces: published, machine-readable, the same in a CLI run and the validator.`,
  },
  {
    date: '2026-05-01',
    tag: 'spec',
    title: 'The JSON Schema · one workflow contract',
    body: 'workflow.json describes a valid plan end to end: the nika: v1 envelope, the four verbs, the permits: block. Your editor checks it as you write.',
  },
  {
    date: '2026-04-29',
    tag: 'spec',
    title: 'The spec, released under Apache-2.0',
    body: 'nika-spec is open and runtime-agnostic: the envelope, the verbs, the JSON schema and the conformance suite, free to adopt.',
  },
]

/* the closed tag vocabulary, in legend order. The rendered chip label IS the
   tag id (the old TAG_LABEL was an identity map — a dead abstraction). */
export const TAGS: readonly ChangelogTag[] = [
  'release',
  'spec',
  'language',
  'stdlib',
  'providers',
  'security',
  'tooling',
  'site',
]

/* format an ISO date as a compact register date (e.g. "2026 · 06 · 17"),
   tabular and locale-stable (no Intl drift between SSR + client). */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y} · ${m} · ${d}`
}

/* a release ships on a day; a milestone is honest at month precision. Both
   surfaces (home preview + /changelog) render through these two so the
   register can never over-claim a date. */
export const isRelease = (e: ChangelogEntry): boolean => e.tag === 'release'

export function entryDate(e: ChangelogEntry): string {
  if (isRelease(e)) return fmtDate(e.date)
  const [y, m] = e.date.split('-')
  return `${y} · ${m}`
}

/** the <time dateTime> value · YYYY-MM-DD for releases, YYYY-MM for milestones */
export function entryDateTime(e: ChangelogEntry): string {
  return isRelease(e) ? e.date : e.date.slice(0, 7)
}
