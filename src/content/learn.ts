/* ─── /learn content · the nine-step walkthrough data ─────────────────────────
   Data lives OUTSIDE the page component (react-refresh: pages export only
   components) so the fragment-validity test suite can import it directly.
   Every YAML fragment is spec-correct (nika-spec 01-envelope · 03-dag ·
   05-errors) AND parses as standalone YAML · guarded by
   src/test/learn-fragments.test.ts. */

import { VERB_WORDS, DEPENDS_WORDS, WHEN_WORDS, PERMITS_WORDS } from '../sections/morph/plain-words'
import type { TermLine } from '../components/TermFrame'

/* ── the plain-words dictionary · one line per key, anyone-register ───────────
   The hover/focus glossary for every YAML panel on /learn (Learn.tsx wraps
   CodeFile in LearnFile — the component defaults stay untouched). The four
   verbs + depends_on + when + permits REUSE the site-wide plain-words module
   (the morph 3D tooltips read the same strings — the two surfaces can never
   explain the same key differently). Keys are the token texts the CodeFile
   tokenizer emits (no trailing colon). */
export const DICT: Record<string, string> = {
  nika: 'the format marker · v1 is frozen, files you write today keep working',
  workflow: 'the file’s name · what you call when you run it',
  model: 'which brain to ask · local or any cloud, one line to swap',
  vars: 'the inputs · change them from the command line, not the file',
  permits: PERMITS_WORDS,
  tasks: 'the to-do list · each item does exactly one thing',
  id: 'the step’s name · other steps point at it',
  depends_on: `this step ${DEPENDS_WORDS}`,
  when: WHEN_WORDS,
  infer: VERB_WORDS.infer,
  exec: VERB_WORDS.exec,
  invoke: VERB_WORDS.invoke,
  agent: VERB_WORDS.agent,
  retry: 'try again on failure, with a pause between tries',
  max_attempts: 'how many tries before giving up',
  backoff_ms: 'the pause between tries, in milliseconds',
  on_error: 'the plan B · what steps in when retries run out',
  recover: 'the value that stands in when the step still fails',
  output: 'picks pieces of this step’s result and names them',
  outputs: 'what the whole workflow hands back, by name',
  prompt: 'the question sent to the model',
  tool: 'which tool to use · always named, never guessed',
  command: 'the shell command to run · captured, with its exit code',
  type: 'what kind of value this input is',
  required: 'the run refuses to start without it',
  description: 'a human note about this input',
}

export interface Step {
  n: string
  topic: string
  title: string
  plain: string
  yaml: string
  file: string
  note?: string
  /** step 06 renders the 2D mini-DAG plate under the text + file pair */
  dag?: boolean
}

export const STEPS: Step[] = [
  {
    n: '01',
    topic: 'the file',
    title: 'A workflow is a file you can read',
    plain:
      'The whole thing is one plain-text file. Two lines make it real: name the language, name the workflow. That header is the whole ceremony: no project setup, no boilerplate, no config.',
    file: 'weekly-radar.nika.yaml',
    yaml: `nika: v1
workflow: weekly-radar`,
    note: 'nika: v1 means the format is frozen. Files you write today won’t break.',
  },
  {
    n: '02',
    topic: 'the inputs',
    title: 'Declare what can change',
    plain:
      'Inputs live in vars. A bare value is a default you can override from the command line; a typed var documents itself and gets validated before anything runs.',
    file: 'vars',
    yaml: `vars:
  output_dir: "./radar"
  topic:
    type: string
    required: true
    description: "Subject to research"`,
    note: 'Use it anywhere as ${{ vars.topic }}. Change the input, not the file.',
  },
  {
    n: '03',
    topic: 'the model',
    title: 'Pick a brain. Any brain.',
    plain:
      'One line chooses the default model, any model: local Ollama, or any API. Start on your own machine (no key, no cloud) and swap providers whenever you want; nothing else changes.',
    file: 'model',
    yaml: `# fully local · no cloud needed
model: ollama/llama3.2:3b

# or swap to any cloud provider:
# model: mistral/mistral-large`,
  },
  {
    n: '04',
    topic: 'the verbs',
    title: 'A task is a verb',
    plain:
      'Each task does exactly one thing, with one of the four verbs. This one thinks: it sends a prompt to the model and keeps the answer as its output.',
    file: 'tasks',
    yaml: `tasks:
  - id: digest
    infer:
      prompt: "Summarize in 5 bullets: \${{ tasks.fetch_news.output }}"`,
    note: 'infer thinks · exec runs a command · invoke uses a tool · agent delegates.',
  },
  {
    n: '05',
    topic: 'the plan',
    title: 'Order is one word. The plan is free.',
    plain:
      'depends_on is all you write. Tasks that don’t wait on each other run in parallel automatically. You never schedule anything. The plan (which tasks wait on which) falls out of the file.',
    file: 'depends_on',
    yaml: `- id: fetch_news
  invoke:
    tool: "nika:fetch"

- id: repo_log
  exec:
    command: "git log --since='1 week'"

- id: digest
  depends_on: [ fetch_news, repo_log ]   # waits for BOTH
  infer:
    prompt: "Cross-reference news with our work…"`,
    note: 'fetch_news and repo_log run at the same time. digest waits for both.',
  },
  {
    n: '06',
    topic: 'the waves',
    title: 'Steps that wait, steps that run together',
    plain:
      'A workflow is a to-do list where some steps wait for others. Steps that wait on nothing all start at the same time, automatically; you never schedule anything. Before anything runs, the runtime reads every depends_on and draws the plan: here, three sources start together, the digest waits for all three, and the save waits for the digest.',
    file: 'tasks · the whole plan',
    yaml: `tasks:
  - id: fetch_news
    invoke:
      tool: "nika:fetch"
  - id: repo_log
    exec:
      command: "git log --since='1 week'"
  - id: read_notes
    invoke:
      tool: "nika:read"
  - id: digest
    depends_on: [ fetch_news, repo_log, read_notes ]
    infer:
      prompt: "One weekly radar, five bullets"
  - id: save
    depends_on: [ digest ]
    invoke:
      tool: "nika:write"`,
    note: 'Nothing in this file says parallel. The picture below is the plan drawn from these five steps: follow the arrows, not the line order.',
    dag: true,
  },
  {
    n: '07',
    topic: 'the branch',
    title: 'Branch like an adult',
    plain:
      'when: makes a task conditional, a yes/no test over what already happened. Waiting for success is free (depends_on already does it); when: is for conditions beyond it, like a value check.',
    file: 'when',
    yaml: `- id: alert
  depends_on: [ check ]
  when: \${{ tasks.check.output.errors > 0 }}
  invoke:
    tool: "nika:notify"`,
  },
  {
    n: '08',
    topic: 'the failure',
    title: 'When things fail, you get data',
    plain:
      'Errors come back typed: a stable code, a category, and whether retrying could help. Tasks declare their own retry policy and a fallback. No stack-trace archaeology.',
    file: 'retry · on_error',
    yaml: `- id: research
  retry:
    max_attempts: 3
    backoff_ms: 1000
  on_error:
    recover: \${{ tasks.cache.output }}
  infer:
    prompt: "…"`,
    note: 'A failed call retries with backoff; if it still fails, the cached result steps in.',
  },
  {
    n: '09',
    topic: 'the outputs',
    title: 'Name what comes out',
    plain:
      'output: binds pieces of a task result to names; the workflow declares what it returns. Downstream tasks (and you) read clean names, not raw API responses.',
    file: 'output · outputs',
    yaml: `tasks:
  - id: digest
    infer:
      prompt: "…"
    output:
      result: ".choices[0].message.content"

outputs:
  brief: \${{ tasks.digest.output.result }}`,
  },
]

/* ── the whole file · the nine fragments, assembled ───────────────────────────
   Every idea above, composed into the ONE workflow the page teaches. This
   exact text passes `nika check` on the shipping binary — the transcript
   below is that run, VERBATIM (captured 2026-07-06 · nika 0.96.0). The
   honesty law: re-capture when the CLI's voice changes, never hand-edit. */
export const FULL_FILE = `nika: v1
workflow: weekly-radar

vars:
  output_dir: "./radar"
  topic:
    type: string
    required: true
    description: "Subject to research"

model: ollama/llama3.2:3b

tasks:
  - id: fetch_news
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://hnrss.org/frontpage"

  - id: repo_log
    exec:
      command: "git log --since='1 week'"

  - id: read_notes
    invoke:
      tool: "nika:read"
      args:
        path: "./notes.md"

  - id: digest
    depends_on: [ fetch_news, repo_log, read_notes ]
    retry:
      max_attempts: 3
      backoff_ms: 1000
    infer:
      prompt: "One weekly radar on \${{ vars.topic }}, five bullets: \${{ tasks.fetch_news.output }} \${{ tasks.repo_log.output }} \${{ tasks.read_notes.output }}"

  - id: save
    depends_on: [ digest ]
    invoke:
      tool: "nika:write"
      args:
        path: "\${{ vars.output_dir }}/radar.md"
        content: "\${{ tasks.digest.output }}"

outputs:
  brief: \${{ tasks.digest.output }}
`

export const FULL_FILE_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: 'nika check weekly-radar.nika.yaml' },
  { kind: 'out', text: 'nika check · weekly-radar.nika.yaml' },
  { kind: 'ok', text: ' ✔ PLAN     3 wave(s) · 5 task(s) · max parallelism 3' },
  { kind: 'warn', text: ' ⚠  COST     $0.0000 – $0.0000 FLOOR (unbounded tasks present)' },
  { kind: 'dim', text: '   digest  ollama/llama3.2:3b  UNBOUNDED — no max_tokens declared' },
  { kind: 'ok', text: ' ✔ SECRETS  no information-flow escapes' },
  { kind: 'ok', text: ' ✔ TYPES    every deep output reference fits its declared shape' },
  { kind: 'ok', text: ' ✔ TOOLS    every nika: tool names a canonical builtin' },
  { kind: 'ok', text: ' ✔ ARGS     every invoke arg key is declared + every required arg is present' },
  { kind: 'ok', text: ' ✔ SCHEMA   every authored schema: is satisfiable' },
  { kind: 'soft', text: ' ○ PERMITS  no boundary declared (engine floor only) · `--infer-permits` writes one' },
  { kind: 'soft', text: ' ↳ HINT     [cost] declare `max_tokens` on `digest` — the cost report becomes a hard ceiling instead of UNBOUNDED' },
  { kind: 'soft', text: ' ↳ HINT     [permits] no `permits:` boundary declared — run `nika check --infer-permits` to generate the tightest one (default-deny once present)' },
  { kind: 'soft', text: ' ↳ HINT     [inputs] required input(s) with no default · pass at run time: --var topic=…' },
  { kind: 'ok', text: ' ✔ audited · 5 task(s) · 3 wave(s) · permits none · est ≥$0.0000 · 3 hints' },
]

export const ERROR_JSON = `{
  "code": "NIKA-INFER-001",
  "category": "provider_error",
  "message": "the model call failed",
  "transient": true,
  "details": {
    "provider": "ollama",
    "status_code": 503,
    "retry_after_secs": 30
  },
  "task_id": "research",
  "attempt": 2
}`
