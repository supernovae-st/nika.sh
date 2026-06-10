/* ─── §use-cases · the tabbed explorer data ─────────────────────────────────
   5 métiers × 3-4 workflows = the 16 showcase files from nika-spec.
   Every YAML here is REAL: imported from usecases-yaml.generated.ts,
   which scripts/showcase-projector.py projects from
   nika-spec/examples/showcase/*.nika.yaml — each file passes the spec's
   conformance gate (schema + DAG cross-refs + stdlib surface).
   Hand-curated craft = icons, copy, outcomes. Truth = projected. */
import type { Verb } from './transform-data'
import { SHOWCASE_DAG, SHOWCASE_YAML } from './usecases-yaml.generated'

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

export const yamlFor = (uc: UC): string => SHOWCASE_YAML[uc.slug] ?? ''
/** verb chips DERIVE from the projected DAG model — never hand-typed */
export const verbsFor = (uc: UC): Verb[] => {
  const seen: Verb[] = []
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
        body: 'Reads yesterday’s commits, stamps the date from a builtin, writes your three bullets.',
        tier: 'T1',
        outcome: 'Every morning: the note is already written. You glance, you tweak one word, you go.',
      },
      {
        slug: 't2-release-notes',
        icon: '🚀',
        title: 'Release notes',
        body: 'git log → typed notes → CHANGELOG edited in place → the team pinged with the headline.',
        tier: 'T2',
        outcome: 'Release day: one command, a changelog in your voice, zero copy-paste.',
      },
      {
        slug: 't2-release-radar',
        icon: '🛰️',
        title: 'Release radar',
        body: 'Reads your dependencies’ release feeds, diffs against last run — only the NEW ships reach you.',
        tier: 'T2',
        outcome: 'Silence means nothing shipped. A ping means it matters. Zero tab-checking.',
      },
      {
        slug: 't3-pr-review-fanout',
        icon: '🐝',
        title: 'PR review swarm',
        body: 'One read-only review agent per changed file, in parallel, under budget. jq merges the findings.',
        tier: 'T3',
        outcome: 'Big PRs get deep reviews — attention finally scales with the diff.',
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
        body: 'Maps their sitemap, reads the 8 freshest pages in parallel — with retry — digests one brief.',
        tier: 'T3',
        outcome: 'Monday 8am: everything they shipped last week, on your desk, with what it signals.',
      },
      {
        slug: 't4-release-train',
        icon: '🚂',
        title: 'Release train',
        body: 'Parallel gates, a human GO with full information, a hold until the window — ship, verify, record.',
        tier: 'T4',
        outcome: 'The train departs on time or not at all — and the journal knows either way.',
      },
      {
        slug: 't4-deep-research-brief',
        icon: '🔬',
        title: 'Deep research brief',
        body: 'A fast model plans, an agent works the web under budgets, a thinking model synthesizes.',
        tier: 'T4',
        outcome: '“Get me up to speed by Thursday” becomes a pipeline — auditable end to end.',
      },
      {
        slug: 't4-ceo-monday-brief',
        icon: '💼',
        title: 'CEO Monday brief',
        body: 'Market + repo pulse + KPI sheet gathered in parallel, jq sums the revenue, thinking model writes.',
        tier: 'T4',
        outcome: 'The ping ends with “run cost $0.14” — the workflow reports its own bill.',
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
        body: 'One post becomes a thread, a LinkedIn version and a newsletter blurb — three parallel rewrites.',
        tier: 'T1',
        outcome: 'Write once. Publish everywhere. The voice never drifts.',
      },
      {
        slug: 't2-seo-content-brief',
        icon: '🔍',
        title: 'SEO content brief',
        body: 'Maps the competitor’s sitemap, reads their best page, writes the brief that beats it. Typed.',
        tier: 'T2',
        outcome: 'Your writer starts from gaps and intent — grounded in what actually ranks, not vibes.',
      },
      {
        slug: 't3-localization-factory',
        icon: '🌍',
        title: 'Localization factory',
        body: 'glob finds every doc, two fan-outs read + translate in parallel, jq zips the mirror tree back.',
        tier: 'T3',
        outcome: '“Can we have the docs in French?” — yes, by lunch, original paths preserved.',
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
        body: 'The overnight queue classified with schema enums, first replies drafted, urgent ones escalated.',
        tier: 'T2',
        outcome: 'By 9am the board is tagged, drafted and batched — humans handle only the hard ones.',
      },
      {
        slug: 't3-config-drift-sentinel',
        icon: '🛡️',
        title: 'Config drift sentinel',
        body: 'RFC 7396 merges sanctioned overrides, RFC 6902 diffs live prod — only real drift pages anyone.',
        tier: 'T3',
        outcome: 'Alert fatigue dies: silence means prod matches what was signed off. Exactly.',
      },
      {
        slug: 't2-etl-quarantine',
        icon: '🧪',
        title: 'ETL quarantine',
        body: 'The schema gate splits good rows from bad — rejects land in a quarantine file, the pipeline lives.',
        tier: 'T2',
        outcome: '“Re-run the whole night” becomes “fix three rows tomorrow morning.”',
      },
      {
        slug: 't4-incident-war-room',
        icon: '🧯',
        title: 'Incident war room',
        body: 'Logs + status + runbook gathered in parallel, a typed timeline, recovery PROVEN before the draft.',
        tier: 'T4',
        outcome: 'The postmortem draft is waiting before the retro is even scheduled.',
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    hook: 'Finance, legal, meetings — typed outputs, human gates.',
    cases: [
      {
        slug: 't1-meeting-actions',
        icon: '🗂️',
        title: 'Meeting actions',
        body: 'Transcript in → typed {owner, task, due} out. Schema-validated, tracker-ready.',
        tier: 'T1',
        outcome: 'Nobody re-reads the transcript. The tracker import is just… there.',
      },
      {
        slug: 't1-price-watch',
        icon: '🏷️',
        title: 'Price watch',
        body: 'Pulls one field from the shop API, compares in CEL, pings your webhook. Zero model calls.',
        tier: 'T1',
        outcome: 'Not everything needs an LLM — the engine alone is a robot you already trust.',
      },
      {
        slug: 't2-invoice-chaser',
        icon: '🧾',
        title: 'Invoice chaser',
        body: 'CSV → jq filters the overdue → reminders drafted → a human gate before anything is saved.',
        tier: 'T2',
        outcome: 'Friday’s awkward chore becomes: read the drafts, type yes.',
      },
      {
        slug: 't3-resume-screener',
        icon: '🧑‍💼',
        title: 'Resume screener',
        body: 'One local-model rubric per candidate — enums, evidence quotes required, jq ranks deterministically.',
        tier: 'T3',
        outcome: 'Candidate #1 and #40 get the same rubric. PII never leaves the machine.',
      },
      {
        slug: 't2-contract-guard',
        icon: '⚖️',
        title: 'Contract guard',
        body: 'Clause extraction on a LOCAL model — the contract never leaves the machine. validate + assert gate the memo.',
        tier: 'T2',
        outcome: 'Legal-grade caution, sovereign by default: ollama runs it offline.',
      },
    ],
  },
]
