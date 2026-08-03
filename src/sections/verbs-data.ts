import type { NikaVerb } from '../components/codefile-highlight'

/* the four verb chapters · data module (react-refresh: components-only files
   must not export data — the chapters live here, faq-data pattern). */

/* one sub-index entry · `to` links a REAL route (+anchor) from routes.tsx /
   a real in-page section id; entries without one render as plain text. */
export type SubEntry = { n: string; label: string; to?: string }

export type Chapter = {
  verb: NikaVerb
  /** the chapter index under the section plate · '2.1' (FIG N.n.m grammar) */
  n: string
  /** the white claim (the job, one word-ish) */
  claim: string
  /** the dim elaboration (the rest of the two-tone sentence) */
  gloss: string
  filename: string
  /** a COMPLETE minimal workflow · schema-valid · 6-8 lines */
  yaml: string
  sub: SubEntry[]
}

export const CHAPTERS: Chapter[] = [
  {
    verb: 'infer',
    n: '5.1',
    claim: 'Think.',
    gloss: 'Ask any model · local or cloud.',
    filename: 'think.nika.yaml',
    yaml: `nika: v1
workflow:
  id: think
  description: "the infer verb alone · one bounded model call"
model: ollama/llama3.2:3b
permits: {}
tasks:
  summarize:
    infer:
      prompt: "Three risks in this release, ranked"
      max_tokens: 256

outputs:
  summary: \${{ tasks.summarize.output }}`,
    sub: [
      { n: '5.1.1', label: 'providers', to: '/catalog/providers' },
      { n: '5.1.2', label: 'structured output', to: '/language/spec/errors#structured-output-validation' },
      { n: '5.1.3', label: 'local models', to: '/catalog/models' },
    ],
  },
  {
    verb: 'exec',
    n: '5.2',
    claim: 'Run.',
    gloss: 'A shell command, captured and typed.',
    filename: 'run.nika.yaml',
    yaml: `nika: v1
workflow:
  id: run
  description: "the exec verb alone · one program, argv form, allowlisted"
permits:
  exec: ["cargo"]
tasks:
  build:
    exec:
      command: ["cargo", "build", "--release"]`,
    sub: [
      { n: '5.2.1', label: 'capture & exit codes' },
      { n: '5.2.2', label: 'retry · timeout', to: '/language/spec/errors#retry-policy' },
      { n: '5.2.3', label: 'permitted programs', to: '/language/permits' },
    ],
  },
  {
    verb: 'invoke',
    n: '5.3',
    claim: 'Use a tool.',
    gloss: 'Fetch a page, write a file, call GitHub. Every tool explicit.',
    filename: 'use-a-tool.nika.yaml',
    yaml: `nika: v1
workflow:
  id: use-a-tool
  description: "the invoke verb alone · one tool call under the two-part grant"
permits:
  tools: ["nika:fetch"]
  net: { http: ["nika.sh"] }
tasks:
  page:
    invoke:
      tool: "nika:fetch"
      args: { url: "https://nika.sh" }`,
    sub: [
      { n: '5.3.1', label: 'builtins', to: '/language/stdlib' },
      { n: '5.3.2', label: 'extract modes', to: '/language/modes' },
      { n: '5.3.3', label: 'MCP servers' },
    ],
  },
  {
    verb: 'agent',
    n: '5.4',
    claim: 'Delegate.',
    gloss: 'An autonomous loop, on a leash you can read.',
    filename: 'delegate.nika.yaml',
    yaml: `nika: v1
workflow:
  id: delegate
  description: "the agent verb alone · goal + tool whitelist, loop bounded"
model: ollama/llama3.2:3b
permits:
  tools: ["nika:read", "nika:fetch"]
  net: { http: ["nika.sh"] }
  fs:
    read: ["./docs/*"]
tasks:
  audit:
    agent:
      prompt: "Find every dead link in ./docs"
      tools: [ "nika:read", "nika:fetch" ]
      max_tokens_total: 8192

outputs:
  report: \${{ tasks.audit.output }}`,
    sub: [
      { n: '5.4.1', label: 'tool allow-list', to: '/language/permits' },
      { n: '5.4.2', label: 'max turns' },
      { n: '5.4.3', label: 'the human gate', to: '#run-explains' },
    ],
  },
]
