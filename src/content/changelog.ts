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
import { ENGINE_VERSION } from '../content'

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
}

/* newest-first. Counts interpolate from CANON so they can never drift from the
   spec (4 verbs · 23 builtins · 14 providers / 5 local). */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-06-25',
    tag: 'release',
    title: `${ENGINE_VERSION} — smoother first fifteen minutes`,
    body: 'nika examples run --model previews any embedded workflow offline — no key, no model server; nika init and nika wire handle onboarding; headless Linux builds compile clean.',
  },
  {
    date: '2026-06-21',
    tag: 'release',
    title: 'v0.90.0 — first public release',
    body: `One brew-installable binary for macOS and Linux: the ${CANON.verbs} verbs end to end, the nika check static audit, and an embedded examples pack.`,
  },
  {
    date: '2026-06-17',
    tag: 'site',
    title: 'nika.sh v4 — Intent as Code',
    body: 'The site rebuilt around one idea: a real .nika.yaml file, instant and crawlable, with the spec as the single source of truth.',
  },
  {
    date: '2026-06-12',
    tag: 'tooling',
    title: 'The playground — validate Nika in the browser',
    body: 'Edit a real workflow at nika.sh/play and watch it check as you type, with the engine’s own NIKA error codes. No install to try it.',
  },
  {
    date: '2026-06-02',
    tag: 'security',
    title: 'permits: — the declared blast radius',
    body: 'Every plan can state exactly what it may touch — files, hosts, programs, tools. Once permits: is present, every category is default-deny.',
  },
  {
    date: '2026-05-28',
    tag: 'security',
    title: 'Enforced before it runs — NIKA-SEC codes',
    body: 'Out-of-bounds is denied, not logged after the fact: an effect past the permits: boundary fails with NIKA-SEC-004 before the action happens.',
  },
  {
    date: '2026-05-22',
    tag: 'providers',
    title: `${CANON.providers} model providers — local-first`,
    body: `One verb, any model: ${CANON.providersLocal} local runtimes (Ollama, LM Studio, llama.cpp, LocalAI, vLLM) and ${CANON.providersCloud} cloud, led by open-weight. Your machine, your choice.`,
  },
  {
    date: '2026-05-22',
    tag: 'language',
    title: 'Four verbs, locked forever',
    body: 'infer · exec · invoke · agent — a verb is a distinct native execution model. No fifth verb, ever (D-2026-05-22-N18).',
  },
  {
    date: '2026-05-18',
    tag: 'tooling',
    title: 'MCP, native — any server through invoke',
    body: 'Reach a Model Context Protocol server the same way as a builtin: invoke a mcp: tool id. Default-deny — the file whitelists what an agent may call.',
  },
  {
    date: '2026-05-14',
    tag: 'stdlib',
    title: `fetch — ${CANON.extractModes} extract modes`,
    body: `One builtin turns a page into typed output ${CANON.extractModes} ways: article, markdown, text, links, metadata, selector, sitemap, feed and jq. Read-only by design.`,
  },
  {
    date: '2026-05-10',
    tag: 'stdlib',
    title: `Standard library v0.1 — ${CANON.builtins} builtins`,
    body: `${CANON.builtins} builtin tools across files, data, web and flow — all reached the same way, with invoke:. Nothing to install.`,
  },
  {
    date: '2026-05-04',
    tag: 'spec',
    title: `The error catalog — ${CANON.errorCodes} typed codes`,
    body: `Every failure has a stable NIKA-* code across ${CANON.errorNamespaces} namespaces — published, machine-readable, the same in a CLI run and the validator.`,
  },
  {
    date: '2026-05-01',
    tag: 'spec',
    title: 'The JSON Schema — one workflow contract',
    body: 'workflow.json describes a valid plan end to end: the nika: v1 envelope, the four verbs, the permits: block — your editor checks it as you write.',
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
