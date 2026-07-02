/* ─── /learn content · the eight-step walkthrough data ───────────────────────
   Data lives OUTSIDE the page component (react-refresh: pages export only
   components) so the fragment-validity test suite can import it directly.
   Every YAML fragment is spec-correct (nika-spec 01-envelope · 03-dag ·
   05-errors) AND parses as standalone YAML · guarded by
   src/test/learn-fragments.test.ts. */

export interface Step {
  n: string
  topic: string
  title: string
  plain: string
  yaml: string
  file: string
  note?: string
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
  depends_on: [fetch_news, repo_log]   # waits for BOTH
  infer:
    prompt: "Cross-reference news with our work…"`,
    note: 'fetch_news and repo_log run at the same time. digest waits for both.',
  },
  {
    n: '06',
    topic: 'the branch',
    title: 'Branch like an adult',
    plain:
      'when: makes a task conditional, a yes/no test over what already happened. Waiting for success is free (depends_on already does it); when: is for conditions beyond it, like a value check.',
    file: 'when',
    yaml: `- id: alert
  depends_on: [check]
  when: \${{ tasks.check.output.errors > 0 }}
  invoke:
    tool: "nika:notify"`,
  },
  {
    n: '07',
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
    n: '08',
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
