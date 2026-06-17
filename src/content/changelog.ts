/* ─── changelog · the ship log (FIG 7.0) ─────────────────────────────────────
   A SEED changelog of REAL project milestones — honest, no invented features,
   no fabricated metrics. Each entry is a dated, tagged, one-line record of
   something that actually happened (the spec license, the four-verb lock, the
   stdlib surface, the provider catalog, this very site). Numbers that appear in
   the copy come from CANON (the spec single source of truth), never hand-typed.

   Exported as a flat, newest-first list so BOTH surfaces reuse it:
     · the HOME section <ChangelogPreview/> shows the latest few (FIG 7.0)
     · the /changelog page (Phase 4) renders the full register.

   Dates are plausible 2026 ship dates (the project's real timeline lives in the
   engine; these mark public milestones). Tags are a small closed vocabulary so
   the register reads like a real ship log, not marketing. */

import { CANON } from '../canon.generated'

export type ChangelogTag = 'spec' | 'language' | 'stdlib' | 'providers' | 'site'

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
    date: '2026-06-17',
    tag: 'site',
    title: 'nika.sh v4 — Intent as Code',
    body: 'The site rebuilt around one idea: a real .nika.yaml file, instant and crawlable, with the spec as the single source of truth.',
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
    date: '2026-05-10',
    tag: 'stdlib',
    title: `Standard library v0.1 — ${CANON.builtins} builtins`,
    body: `${CANON.builtins} builtin tools across files, data, web and flow — all reached the same way, with invoke:. Nothing to install.`,
  },
  {
    date: '2026-04-29',
    tag: 'spec',
    title: 'The spec, released under Apache-2.0',
    body: 'nika-spec is open and runtime-agnostic: the envelope, the verbs, the JSON schema and the conformance suite, free to adopt.',
  },
]

/* a human-readable label per tag (the mono register chip on each entry). */
export const TAG_LABEL: Record<ChangelogTag, string> = {
  spec: 'spec',
  language: 'language',
  stdlib: 'stdlib',
  providers: 'providers',
  site: 'site',
}

/* format an ISO date as a compact register date (e.g. "2026 · 06 · 17"),
   tabular and locale-stable (no Intl drift between SSR + client). */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y} · ${m} · ${d}`
}
