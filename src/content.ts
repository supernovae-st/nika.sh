import type { ReactNode } from 'react'

/* ─── all copy + code on the page · verified against nika-spec (spec/02-verbs.md ·
       spec/01-envelope.md · stdlib/builtins-v0.1.md) — never invent YAML ─── */

export const REPO = 'https://github.com/supernovae-st/nika'
export const SPEC = 'https://github.com/supernovae-st/nika-spec'
export const DOCS = 'https://docs.nika.sh'

/* §1 · the language — one real workflow */
export const WF = `nika: v1
workflow: research-pipeline

model: anthropic/claude-sonnet-4-6
vars:
  topic:
    type: string
    required: true

tasks:
  - id: research
    infer:
      prompt: "Research \${{ vars.topic }} in 5 paragraphs"

  - id: write
    depends_on: [research]
    invoke:
      tool: nika:write
      args:
        path: ./brief.md
        content: \${{ tasks.research.output }}

outputs:
  brief: \${{ tasks.write.output }}
`

export const NOTES: { token: string; body: ReactNode }[] = [
  {
    token: 'nika: v1',
    body: 'The contract. One version marker, pinned forever. No framework churn, no v2 migration.',
  },
  {
    token: 'infer · exec · invoke · agent',
    body: 'Four verbs. Call a model, run a process, call a tool, drive an agent. That is the whole operation space.',
  },
  {
    token: '${{ tasks.research.output }}',
    body: "Bindings thread one task's output into the next. The DAG is written as data, not glued in code.",
  },
  {
    token: 'tool: nika:write',
    body: 'Tools live behind invoke:, either nika: builtins or mcp: servers. 22 builtins, 13 providers, nothing to install.',
  },
]

/* §2 · the four verbs — snippets are verbatim spec shapes (02-verbs.md) */
export const VERBS: { verb: string; tagline: string; body: string; code: string }[] = [
  {
    verb: 'infer',
    tagline: 'Call a model',
    body: 'Any of 13 providers: Anthropic, OpenAI, Mistral, Ollama and more. You pick, per task or per file.',
    code: `- id: research
  infer:
    prompt: "Research \${{ vars.topic }}"`,
  },
  {
    verb: 'exec',
    tagline: 'Run a process',
    body: 'A real command on your machine. stdout becomes the task output, exit codes become errors.',
    code: `- id: build
  exec:
    command: "cargo build --release"`,
  },
  {
    verb: 'invoke',
    tagline: 'Call a tool',
    body: '22 nika: builtins (read, write, fetch, jq) plus any mcp: server you already use.',
    code: `- id: read_config
  invoke:
    tool: "nika:read"
    args:
      path: ./config.yaml`,
  },
  {
    verb: 'agent',
    tagline: 'Drive a loop',
    body: 'An autonomous tool-use loop. Tools are default-deny. The whitelist is in the file, reviewable.',
    code: `- id: research
  agent:
    prompt: "Research \${{ vars.topic }}"
    tools: ["nika:fetch"]`,
  },
]

/* §3 · the method — the two-tier wedge */
export const WEDGE = {
  eyebrow: '§ The method',
  title: 'Chat is where work happens. Source is where it lives.',
  body: 'Explore in any chat, any agent, any IDE. Then the work that matters compiles down to a .nika.yaml you keep. Run it again tomorrow. Diff it next week. Own it forever.',
  chat: {
    label: 'The chat tier · ephemeral',
    lines: [
      '“Can you research X and write a brief?”',
      '“Now do it again but for Y…”',
      '“Wait, what prompt did we use last month?”',
    ],
    verdict: 'Gone when the tab closes.',
  },
  source: {
    label: 'The source tier · durable',
    code: `$ nika run research-pipeline.nika.yaml \\
    --var topic="Rust async runtimes"

$ git diff research-pipeline.nika.yaml`,
    verdict: 'Readable. Runnable. Diffable. Yours.',
  },
}

/* ─── §use-cases · concrete workflows anyone can picture ───────────────────
   Each card: what it does in plain words + the verbs it uses. The site-audit
   one is REAL (supernovae-st/nika-site-audit ships today). */
export interface UseCase {
  icon: string
  title: string
  body: string
  verbs: ('infer' | 'exec' | 'invoke' | 'agent')[]
}

export const USECASES: UseCase[] = [
  {
    icon: '📡',
    title: 'Weekly competitive radar',
    body: 'Every Monday: fetch what competitors shipped, summarize the signal, write a one-page brief.',
    verbs: ['invoke', 'infer', 'agent'],
  },
  {
    icon: '🔍',
    title: 'Site audit',
    body: 'Crawl a website, find broken links and SEO issues, file a clean report. Ships today as nika-site-audit.',
    verbs: ['invoke', 'infer'],
  },
  {
    icon: '🚀',
    title: 'Release notes',
    body: 'Read the git log since the last tag, write the changelog in your tone, save it next to the code.',
    verbs: ['exec', 'infer'],
  },
  {
    icon: '🌍',
    title: 'Docs translation',
    body: 'Every new doc gets translated to three languages. Same glossary, same voice, every time.',
    verbs: ['invoke', 'infer'],
  },
  {
    icon: '🧾',
    title: 'Data extraction',
    body: 'Turn messy web pages or PDFs into clean JSON your other tools can actually use.',
    verbs: ['invoke', 'infer'],
  },
  {
    icon: '🛠️',
    title: 'Code review prep',
    body: 'Summarize the diff, flag the risky changes, draft review notes before a human even looks.',
    verbs: ['exec', 'infer', 'agent'],
  },
]

/* ─── §versus · why a file beats the alternatives (direct, no jargon) ─── */
export interface Versus {
  them: string
  fate: string
  themLines: string[]
  nika: string
  nikaLines: string[]
}

export const VERSUS: Versus[] = [
  {
    them: 'Chat sessions',
    fate: 'evaporates',
    themLines: ['Great for exploring', 'Gone when the tab closes', 'Different answer every time'],
    nika: 'A file you keep',
    nikaLines: ['Runs again tomorrow', 'Same steps, same order', 'Diff it like code'],
  },
  {
    them: 'Glue scripts',
    fate: 'rots',
    themLines: ['200 lines of Python + retries', 'One person understands it', 'Breaks when an API changes'],
    nika: 'Four verbs',
    nikaLines: ['The YAML is the logic', 'Anyone can read it', 'Engine handles retries & order'],
  },
  {
    them: 'Cloud automations',
    fate: 'metered',
    themLines: ['Runs on their servers', 'Per-seat, per-run pricing', 'Your data leaves the building'],
    nika: 'Your machine',
    nikaLines: ['One binary, runs local', 'Free, AGPL forever', 'Nothing leaves unless you say so'],
  },
]
