/* ─── §use-cases · the tabbed explorer data ─────────────────────────────────
   5 métiers × 3-4 workflows = the 16 showcase files from nika-spec.
   Every YAML here is REAL: imported from usecases-yaml.generated.ts,
   which scripts/showcase-projector.py projects from
   nika-spec/examples/showcase/*.nika.yaml — each file passes the spec's
   conformance gate (schema + DAG cross-refs + stdlib surface).
   Hand-curated craft = icons, copy, outcomes. Truth = projected. */
import type { NikaVerb } from '../components/codefile-highlight'
import { SHOWCASE_DAG } from '../content/showcase-dag.generated'

export type Tier = 'T1' | 'T2' | 'T3' | 'T4'

export interface UC {
  /** showcase slug = filename without .nika.yaml · keys SHOWCASE_YAML + docs link */
  slug: string
  icon: string
  title: string
  body: string
  tier: Tier
  outcome: string
}

export interface UCTab {
  id: string
  label: string
  hook: string
  cases: UC[]
}

export const DOCS_EXAMPLES_BASE = 'https://docs.nika.sh/examples'

/* yamlFor DIED with the register diet: raw yaml reaches pages through
   showcase-yaml-access (SSR door + async chunk) and per-page byte islands
   — a shared static lookup here would re-pin the 79K to the initial chunk
   (the namespace-retention law). */
/** verb chips DERIVE from the projected DAG model — never hand-typed */
export const verbsFor = (uc: UC): NikaVerb[] => {
  const seen: NikaVerb[] = []
  for (const t of SHOWCASE_DAG[uc.slug]?.tasks ?? []) {
    if (!seen.includes(t.verb)) seen.push(t.verb)
  }
  return seen
}
export const fileFor = (uc: UC): string => `${uc.slug}.nika.yaml`
/** docs pages drop the tier prefix from the slug */
export const docsFor = (uc: UC): string =>
  `${DOCS_EXAMPLES_BASE}/${uc.slug.replace(/^t[1-4]-/, '')}`

export const UC_TABS: UCTab[] = [
  {
    id: 'builders',
    label: 'Builders',
    hook: 'Ship faster. Let the boring parts run themselves.',
    cases: [
      {
        slug: 't1-standup-digest',
        icon: '🌅',
        title: 'Standup digest',
        body: 'Reads yesterday’s commits, stamps the date from a builtin, and writes your three bullets.',
        tier: 'T1',
        outcome: 'Every morning: the note is already written. You glance, you tweak one word, you go.',
      },
      {
        slug: 't2-release-notes',
        icon: '🚀',
        title: 'Release notes',
        body: 'git log in, typed notes out, the CHANGELOG edited in place and the team pinged with the headline.',
        tier: 'T2',
        outcome: 'Release day: one command, a changelog in your voice, zero copy-paste.',
      },
      {
        slug: 't2-model-bench',
        icon: '⚖️',
        title: 'Model bench',
        body: 'The same question fanned to three local models in parallel; a jq fan-in tabulates measured latency and length: no judge model, facts only.',
        tier: 'T2',
        outcome: 'Pick your default model on a measured table, not vibes: zero keys, zero spend.',
      },
      {
        slug: 't2-release-radar',
        icon: '🛰️',
        title: 'Release radar',
        body: 'Reads your dependencies’ release feeds and diffs against last run, so only new ships reach you.',
        tier: 'T2',
        outcome: 'No ping, nothing shipped. A ping, something worth a look. You stop checking tabs.',
      },
      {
        slug: 't3-pr-review-fanout',
        icon: '🐝',
        title: 'PR review swarm',
        body: 'One read-only review agent per changed file, in parallel and under budget. jq merges the findings.',
        tier: 'T3',
        outcome: 'Big PRs get deep reviews, because attention now scales with the diff.',
      },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    hook: 'Watch anything. Get a readable brief, not 40 tabs.',
    cases: [
      {
        slug: 't3-competitor-radar',
        icon: '📡',
        title: 'Competitor radar',
        body: 'Maps their sitemap, reads the freshest pages in parallel with retry, then digests one brief.',
        tier: 'T3',
        outcome: 'Monday 8am, everything they shipped last week is on your desk, with what it signals.',
      },
      {
        slug: 't2-bookmark-triage',
        icon: '🔖',
        title: 'Bookmark triage',
        body: 'One metadata fetch per URL (retry for blips, recover for dead links), then jq renders the triage table.',
        tier: 'T2',
        outcome: 'The pile becomes a sortable table. Dead links say dead instead of killing the batch.',
      },
      {
        slug: 't4-release-train',
        icon: '🚂',
        title: 'Release train',
        body: 'Tests, lint and audit run in parallel. Only if all three are green does a human sign the GO; then it holds for the window, ships, and verifies prod reports the new version.',
        tier: 'T4',
        outcome: 'No green gates, no departure. No human GO, no departure. It ships on time or not at all, and the journal records which.',
      },
      {
        slug: 't4-deep-research-brief',
        icon: '🔬',
        title: 'Deep research brief',
        body: 'A fast model writes the plan, an agent works the web inside hard budgets, a thinking model writes the brief.',
        tier: 'T4',
        outcome: '“Get me up to speed by Thursday” becomes a pipeline you can audit end to end.',
      },
      {
        slug: 't4-ceo-monday-brief',
        icon: '💼',
        title: 'CEO Monday brief',
        body: 'Market + repo pulse + KPI sheet gathered in parallel, jq sums the revenue, thinking model writes.',
        tier: 'T4',
        outcome: 'The ping ends with the run’s own cost line. The workflow reports its own bill.',
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    hook: 'Same voice, every language, every channel. Automatically.',
    cases: [
      {
        slug: 't1-social-repurpose',
        icon: '✍️',
        title: 'Social repurpose',
        body: 'One post becomes a thread, a LinkedIn version and a newsletter blurb, rewritten in parallel.',
        tier: 'T1',
        outcome: 'Write once, publish everywhere, same voice on every channel.',
      },
      {
        slug: 't2-seo-content-brief',
        icon: '🔍',
        title: 'SEO content brief',
        body: 'Maps the competitor’s sitemap, reads their best page, then writes a typed brief that goes after the gaps.',
        tier: 'T2',
        outcome: 'Your writer starts from gaps and search intent, grounded in pages that actually rank.',
      },
      {
        slug: 't1-image-fx-batch',
        icon: '🎞️',
        title: 'Image FX batch',
        body: 'glob lists the folder, for_each styles every photo through the same deterministic ops chain: no model, pure pixels.',
        tier: 'T1',
        outcome: 'The preset lives in git. Re-run in a year: byte-identical art, zero clicks.',
      },
      {
        slug: 't2-transcript-shownotes',
        icon: '🎙️',
        title: 'Transcript show-notes',
        body: 'One bounded infer extracts chapters, quotes and summary as schema-typed data; jq and write render the page.',
        tier: 'T2',
        outcome: 'Episode recorded → notes publishable, for the price of exactly one model call.',
      },
      {
        slug: 't3-localization-factory',
        icon: '🌍',
        title: 'Localization factory',
        body: 'glob finds every doc, two fan-outs read + translate in parallel, jq zips the mirror tree back.',
        tier: 'T3',
        outcome: '“Can we have the docs in French?” Yes, by lunch, with the original paths preserved.',
      },
    ],
  },
  {
    id: 'ops',
    label: 'Ops & Support',
    hook: 'The recurring chores: described once, done forever.',
    cases: [
      {
        slug: 't2-support-triage',
        icon: '📥',
        title: 'Support triage',
        body: 'The overnight queue gets classified with schema enums, first replies drafted, urgent tickets escalated.',
        tier: 'T2',
        outcome: 'By 9am the board is tagged, drafted and batched. Humans handle the hard ones.',
      },
      {
        slug: 't3-config-drift-sentinel',
        icon: '🛡️',
        title: 'Config drift sentinel',
        body: 'Builds the sanctioned baseline (RFC 7396 merge), diffs it against live prod (RFC 6902), and pages on-call only for the drift nobody approved, with a model explaining what changed.',
        tier: 'T3',
        outcome: 'Silence means prod matches exactly what was signed off. That is the whole alert policy.',
      },
      {
        slug: 't2-etl-quarantine',
        icon: '🧪',
        title: 'ETL quarantine',
        body: 'A schema gate splits good rows from bad. Rejects land in a quarantine file and the pipeline keeps going.',
        tier: 'T2',
        outcome: '“Re-run the whole night” turns into “fix three rows tomorrow morning”.',
      },
      {
        slug: 't4-incident-war-room',
        icon: '🧯',
        title: 'Incident war room',
        body: 'Logs, status history and the runbook gathered in parallel, a typed timeline, and a recovery check before any draft.',
        tier: 'T4',
        outcome: 'The postmortem draft is ready before the retro is scheduled.',
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    hook: 'Finance, legal, meetings: typed outputs, human gates.',
    cases: [
      {
        slug: 't1-meeting-actions',
        icon: '🗂️',
        title: 'Meeting actions',
        body: 'A transcript goes in, typed {owner, task, due} items come out, validated and ready for your tracker.',
        tier: 'T1',
        outcome: 'Nobody re-reads the transcript. The tracker import is already done.',
      },
      {
        slug: 't1-price-watch',
        icon: '🏷️',
        title: 'Price watch',
        body: 'Pulls one field from the shop API, compares it in CEL, pings your webhook. No model call anywhere.',
        tier: 'T1',
        outcome: 'Not everything needs an LLM. The engine alone is a robot you can already trust.',
      },
      {
        slug: 't1-og-images',
        icon: '🖼️',
        title: 'OG images',
        body: 'Brief in, OG variants on disk + a provenance manifest out. Mock renders real PNGs offline; flip one line for your local server (sovereign), gemini, openai or xai. Real spend lands on the run ledger.',
        tier: 'T1',
        outcome: 'Every save permit-gated, every byte sha256-verified, provenance embedded in the PNG itself. No other engine treats images this honestly.',
      },
      {
        slug: 't2-invoice-chaser',
        icon: '🧾',
        title: 'Invoice chaser',
        body: 'jq filters the overdue rows out of the CSV, reminders get drafted, and a human gate sits before anything is saved.',
        tier: 'T2',
        outcome: 'Friday’s awkward chore shrinks to reading the drafts and typing yes.',
      },
      {
        slug: 't2-csv-chart-report',
        icon: '📊',
        title: 'CSV chart report',
        body: 'convert types the spreadsheet, jq aggregates, chart renders a real image, write assembles the report. Zero model calls.',
        tier: 'T2',
        outcome: 'Paste the export, get the slide: same data, same bytes, works on a plane.',
      },
      {
        slug: 't3-resume-screener',
        icon: '🧑‍💼',
        title: 'Resume screener',
        body: 'One local-model rubric per candidate, with enums and required evidence quotes. jq does the ranking.',
        tier: 'T3',
        outcome: 'Candidate #1 and #40 get the same rubric, and the PII never leaves the machine.',
      },
      {
        slug: 't2-contract-guard',
        icon: '⚖️',
        title: 'Contract guard',
        body: 'Clause extraction on a local model, so the contract never leaves the machine. A validate and an assert gate the memo.',
        tier: 'T2',
        outcome: 'Legal-grade caution, sovereign by default. Ollama runs the whole review offline.',
      },
    ],
  },
]
