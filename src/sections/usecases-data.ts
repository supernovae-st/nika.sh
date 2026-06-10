/* ─── §use-cases · the tabbed explorer data ─────────────────────────────────
   4 personas × 3 workflows + 1 featured YAML each (spec-correct shapes).
   Plain bodies: anyone pictures the outcome. */
import type { Verb } from './transform-data'

export interface UC {
  icon: string
  title: string
  body: string
  verbs: Verb[]
}

export interface UCTab {
  id: string
  label: string
  hook: string
  cases: UC[]
  yamlTitle: string
  yaml: string
  outcome: string
}

export const UC_TABS: UCTab[] = [
  {
    id: 'builders',
    label: 'Builders',
    hook: 'Ship faster. Let the boring parts run themselves.',
    cases: [
      {
        icon: '🚀',
        title: 'Release notes',
        body: 'Reads your git history, writes the changelog in your tone, saves it next to the code.',
        verbs: ['exec', 'infer'],
      },
      {
        icon: '🛠️',
        title: 'Code review prep',
        body: 'Summarizes the diff, flags risky changes, drafts review notes before a human looks.',
        verbs: ['exec', 'infer', 'agent'],
      },
      {
        icon: '🧪',
        title: 'Failure triage',
        body: 'Runs the tests, reads the failures, writes a triage note with the likely cause.',
        verbs: ['exec', 'infer'],
      },
      {
        icon: '🛰️',
        title: 'Dependency radar',
        body: 'Checks your dependencies for new releases and advisories, summarizes what actually affects you.',
        verbs: ['exec', 'invoke', 'infer'],
      },
    ],
    yamlTitle: 'release-notes.nika.yaml',
    yaml: `nika: v1
workflow: release-notes

tasks:
  - id: history
    exec:
      command: "git log v0.8.0..HEAD --oneline"

  - id: notes
    depends_on: [history]
    infer:
      prompt: "Write release notes from:
        \${{ tasks.history.output }}"

  - id: save
    depends_on: [notes]
    invoke:
      tool: nika:write
      args: { path: CHANGELOG.md }`,
    outcome: 'Every release: one command, a changelog in your voice, zero copy-paste.',
  },
  {
    id: 'research',
    label: 'Research',
    hook: 'Watch anything. Get a readable brief, not 40 tabs.',
    cases: [
      {
        icon: '📡',
        title: 'Weekly radar',
        body: 'Every Monday: fetch what competitors shipped, digest the signal, write a one-page brief.',
        verbs: ['invoke', 'infer', 'agent'],
      },
      {
        icon: '📚',
        title: 'Paper digest',
        body: 'Pulls the new papers on your topic, keeps the 3 that matter, explains why.',
        verbs: ['invoke', 'infer'],
      },
      {
        icon: '🧾',
        title: 'Data extraction',
        body: 'Turns messy pages or PDFs into clean JSON your other tools can actually use.',
        verbs: ['invoke', 'infer'],
      },
      {
        icon: '🕵️',
        title: 'Claim checking',
        body: 'Takes a draft, pulls the sources it cites, flags every claim the sources do not back.',
        verbs: ['invoke', 'infer', 'agent'],
      },
    ],
    yamlTitle: 'weekly-radar.nika.yaml',
    yaml: `nika: v1
workflow: weekly-radar
vars:
  topic: { type: string, required: true }

tasks:
  - id: fetch
    invoke:
      tool: nika:fetch
      args:
        url: "https://hn.algolia.com/api/v1/
          search?query=\${{ vars.topic }}"
        mode: jq
        jq: ".hits[].title"

  - id: brief
    depends_on: [fetch]
    infer:
      prompt: "One-page brief from:
        \${{ tasks.fetch.output }}"`,
    outcome: 'Monday morning: the brief is already on your desk. Same sources, same rigor.',
  },
  {
    id: 'content',
    label: 'Content',
    hook: 'Same voice, every language, every channel. Automatically.',
    cases: [
      {
        icon: '🌍',
        title: 'Docs translation',
        body: 'Every new doc translated to three languages. Same glossary, same voice, every time.',
        verbs: ['invoke', 'infer'],
      },
      {
        icon: '✍️',
        title: 'Post repurposing',
        body: 'One blog post becomes a thread, a newsletter blurb and a LinkedIn version.',
        verbs: ['invoke', 'infer'],
      },
      {
        icon: '🔍',
        title: 'SEO site audit',
        body: 'Crawls your site, finds broken links and SEO issues, files a clean report. Ships today as nika-site-audit.',
        verbs: ['invoke', 'infer'],
      },
      {
        icon: '🎙️',
        title: 'Show notes',
        body: 'From an episode transcript: titles, chapter marks, quotes and a description, in your style.',
        verbs: ['invoke', 'infer'],
      },
    ],
    yamlTitle: 'translate-doc.nika.yaml',
    yaml: `nika: v1
workflow: translate-doc
vars:
  path: { type: string, required: true }

tasks:
  - id: read
    invoke:
      tool: nika:read
      args: { path: "\${{ vars.path }}" }

  - id: fr
    depends_on: [read]
    infer:
      prompt: "Translate to French, keep
        the tone: \${{ tasks.read.output }}"

  - id: save
    depends_on: [fr]
    invoke:
      tool: nika:write
      args: { path: "docs/fr/out.md" }`,
    outcome: 'Write once. Publish everywhere. The glossary never drifts.',
  },
  {
    id: 'ops',
    label: 'Ops',
    hook: 'The recurring chores: described once, done forever.',
    cases: [
      {
        icon: '📊',
        title: 'Monday report',
        body: 'Collects the numbers, compares to last week, writes the summary your team reads.',
        verbs: ['invoke', 'exec', 'infer'],
      },
      {
        icon: '📥',
        title: 'Inbox triage',
        body: 'Reads exported tickets, tags by urgency, drafts first replies for review.',
        verbs: ['invoke', 'infer', 'agent'],
      },
      {
        icon: '🗂️',
        title: 'Meeting minutes',
        body: 'Turns a raw transcript into decisions, owners and deadlines, filed where they belong.',
        verbs: ['invoke', 'infer'],
      },
      {
        icon: '🧯',
        title: 'Incident timeline',
        body: 'After an outage: assembles logs and messages into a clean timeline, drafts the postmortem skeleton.',
        verbs: ['exec', 'invoke', 'infer'],
      },
    ],
    yamlTitle: 'monday-report.nika.yaml',
    yaml: `nika: v1
workflow: monday-report

tasks:
  - id: numbers
    exec:
      command: "./scripts/export-kpis.sh"

  - id: report
    depends_on: [numbers]
    agent:
      prompt: "Compare to last week and
        write the Monday summary"
      tools: ["nika:read", "nika:write"]

outputs:
  report: \${{ tasks.report.output }}`,
    outcome: 'The report writes itself before standup. You read it, you don’t assemble it.',
  },
]
