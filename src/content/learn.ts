/* ─── /learn content · the nine-step walkthrough data ─────────────────────────
   Data lives OUTSIDE the page component (react-refresh: pages export only
   components) so the fragment-validity test suite can import it directly.
   Every YAML fragment is spec-correct (nika-spec 01-envelope · 03-dag ·
   05-errors) AND parses as standalone YAML · guarded by
   src/test/learn-fragments.test.ts. */

import { VERB_WORDS, WITH_WORDS, AFTER_WORDS, WHEN_WORDS, PERMITS_WORDS } from '../sections/morph/plain-words'
import type { TermLine } from '../components/TermFrame'

/* ── the plain-words dictionary · one line per key, anyone-register ───────────
   The hover/focus glossary for every YAML panel on /learn (Learn.tsx wraps
   CodeFile in LearnFile — the component defaults stay untouched). The four
   verbs + with + after + when + permits REUSE the site-wide plain-words module
   (the morph 3D tooltips read the same strings — the two surfaces can never
   explain the same key differently). Keys are the token texts the CodeFile
   tokenizer emits (no trailing colon). */
export const DICT: Record<string, string> = {
  nika: 'the mark and the name · says « this is a nika file » and what you call it',
  model: 'which brain to ask · local or any cloud, one line to swap',
  inputs: 'the caller’s parameters · typed, validated, passed from the command line',
  const: 'the file’s wiring · fixed values baked in, edit the file to change them',
  permits: PERMITS_WORDS,
  tasks: 'the to-do list · each item does exactly one thing',
  with: WITH_WORDS,
  after: AFTER_WORDS,
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
  extract: 'picks pieces of this step’s result and names them',
  outputs: 'what the whole workflow hands back, by name',
  prompt: 'the question sent to the model',
  tool: 'which tool to use · always named, never guessed',
  shell: 'the shell command to run · captured, with its exit code',
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
  /** the inline check (I7 · WO-11) — at most ONE per step, only where a
      misread is likely; the answer explains itself; no streaks, no
      points, no badges (the Rust-Book quiz pattern minus the game). */
  check?: LearnCheck
}

export interface LearnCheck {
  q: string
  options: string[]
  /** index into options */
  answer: number
  /** the explanation shown after ANY pick — the teaching, not a reward */
  why: string
}

export const STEPS: Step[] = [
  {
    n: '01',
    topic: 'the file',
    title: 'A workflow is a file you can read',
    plain:
      'The whole thing is one plain-text file. One line makes it real: the mark that says « this is a nika file » is also its name. That header is the whole ceremony: no project setup, no boilerplate, no version marker.',
    file: 'weekly-radar.nika.yaml',
    yaml: `# a weekly radar · gate → gather → one synthesis → save
nika: weekly-radar`,
    note: 'nika: carries the file’s name (kebab-case). A description is a comment above it. There is no version key to get wrong: the binary that runs the file is the version.',
  },
  {
    n: '02',
    topic: 'the inputs',
    title: 'Declare what can change',
    plain:
      'Every value states its role. inputs: are the parameters a caller supplies: typed, documented, validated before anything runs. const: is the wiring baked into the file; changing it means editing the file, on purpose.',
    file: 'inputs · const',
    yaml: `inputs:
  topic:
    type: string
    default: "local-first AI tooling"
    description: "Subject to research · --var topic=… overrides"

const:
  output_dir: "./radar"`,
    note: 'Use it anywhere as ${{ inputs.topic }}. A default makes the file runnable bare; --var overrides it per run.',
    check: {
      q: 'Next week the topic changes. What do you edit?',
      options: ['The file, then re-save it', 'Nothing: pass the new value on the command line', 'A separate config file'],
      answer: 1,
      why: 'inputs are the declared parameters: nika run weekly-radar.nika.yaml --var topic="new subject". The file stays the contract; the inputs move per run.',
    },
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
  digest:
    infer:
      prompt: "One weekly radar on \${{ inputs.topic }}, five bullets"
      max_tokens: 1024`,
    note: 'infer thinks · exec runs a command · invoke uses a tool · agent delegates.',
  },
  {
    n: '05',
    topic: 'the plan',
    title: 'The wiring is the plan. The plan is free.',
    plain:
      'with: names what a task takes in, and each wire IS an edge of the plan. Tasks that don’t feed each other run in parallel automatically. You never schedule anything. The plan (which tasks wait on which) falls out of the file.',
    file: 'with',
    yaml: `fetch_news:
  invoke:
    tool: "nika:fetch"

repo_log:
  exec:
    command: ["git", "log", "--since=1 week"]

digest:
  with:
    news: \${{ tasks.fetch_news.output }}   # each wire in
    log: \${{ tasks.repo_log.output }}      # is one edge
  infer:
    prompt: "Cross-reference \${{ with.news }} with \${{ with.log }}…"`,
    note: 'fetch_news and repo_log run at the same time. digest waits for both. The binding IS the data edge. Order with no data gets its own line: after: { fetch_news: success }.',
    check: {
      q: 'digest reads ${{ tasks.fetch_news.output }} in with:. What did that line just do?',
      options: ['Copied a value once, at parse time', 'Created an edge: digest now waits for fetch_news', 'Nothing until you also declare the dependency'],
      answer: 1,
      why: 'The binding IS the edge. There is no separate dependency list to maintain: reading a task\u2019s output is what makes you wait for it.',
    },
  },
  {
    n: '06',
    topic: 'the waves',
    title: 'Steps that wait, steps that run together',
    plain:
      'A workflow is a to-do list where some steps wait for others. Steps that wait on nothing all start at the same time, automatically; you never schedule anything. Before anything runs, the runtime reads every with: wire and draws the plan: here, three sources start together, the digest waits for all three, and the save waits for the digest.',
    file: 'tasks · the whole plan',
    yaml: `tasks:
  approve:
    invoke:
      tool: "nika:prompt"    # one human question opens the run
  fetch_news:
    with:
      go: "\${{ tasks.approve.output }}"
    when: \${{ with.go == true }}
    invoke:
      tool: "nika:fetch"
  repo_log:
    with:
      go: "\${{ tasks.approve.output }}"
    when: \${{ with.go == true }}
    exec:
      command: ["git", "log", "--since=1 week"]
  read_notes:
    with:
      go: "\${{ tasks.approve.output }}"
    when: \${{ with.go == true }}
    invoke:
      tool: "nika:read"
  digest:
    with:
      news: \${{ tasks.fetch_news.output }}
      log: \${{ tasks.repo_log.output }}
      notes: \${{ tasks.read_notes.output }}
    infer:
      prompt: "One weekly radar, five bullets"
  save:
    with:
      brief: \${{ tasks.digest.output }}
    invoke:
      tool: "nika:write"`,
    note: 'Nothing in this file says parallel. One human question opens the run · each source binds the answer and runs only on yes (a gate you merely order after would fire on « no »). The picture below is the plan drawn from these six steps: follow the arrows, not the line order.',
    dag: true,
  },
  {
    n: '07',
    topic: 'the branch',
    title: 'Branch like an adult',
    plain:
      'when: makes a task conditional, a yes/no test over what it imports. The wiring already orders it; when: decides whether an admitted step runs, and it reads the step’s own bindings, never the graph. The radar’s human gate is exactly this: bind the answer, run on true.',
    file: 'when',
    yaml: `alert:
  with:
    errors: \${{ tasks.check.output.errors }}
  when: \${{ with.errors > 0 }}
  invoke:
    tool: "nika:notify"`,
    check: {
      q: 'check failed outright. What happens to alert and its when: test?',
      options: ['when: is evaluated anyway, on empty data', 'alert never reaches its when: · the missing value settles it first', 'alert runs, because when: only reads bindings'],
      answer: 1,
      why: 'when: is business logic AFTER the wiring admits the task. A value that can never exist settles the reader before any condition runs.',
    },
  },
  {
    n: '08',
    topic: 'the failure',
    title: 'When things fail, you get data',
    plain:
      'Errors come back typed: a stable code, a category, and whether retrying could help. Tasks declare their own retry policy and a fallback. No stack-trace archaeology.',
    file: 'retry · on_error',
    yaml: `research:
  retry:
    max_attempts: 3
    backoff_ms: 1000
  on_error:
    recover: \${{ tasks.cache.output }}
  infer:
    prompt: "…"`,
    note: 'A failed call retries with backoff; if it still fails, the cached result steps in.',
    check: {
      q: 'The error says transient: false. What does retrying buy you?',
      options: ['A fresh chance: every error deserves three tries', 'Nothing: the contract is broken, the same input fails the same way', 'It depends on the provider'],
      answer: 1,
      why: 'transient marks the retry candidates (network, 503, rate limits). A validation refusal is deterministic: fix the file, not the schedule.',
    },
  },
  {
    n: '09',
    topic: 'the outputs',
    title: 'Name what comes out',
    plain:
      'extract: binds pieces of a task result to names; the workflow declares what it returns. Downstream tasks (and you) read clean names, not raw API responses.',
    file: 'extract · outputs',
    yaml: `tasks:
  digest:
    infer:
      prompt: "…"
    extract:
      result: ".choices[0].message.content"

outputs:
  brief: \${{ tasks.digest.result }}`,
  },
]

/* ── the whole file · the nine fragments, assembled ───────────────────────────
   THE REGISTERED BYTES · nika-spec examples/snippets/weekly-radar.nika.yaml
   minus its comment header · one source, this panel is a reading of it.
   The file declares its authority (`permits:` · default-deny once present),
   and because it reads private notes, ingests an untrusted feed AND writes
   a file, a blocking human gate opens the run · one that actually GATES:
   each effect binds the answer and runs only on true. `after: approve:
   success` alone would fire on « no » (a refused confirm settles success
   with value false · NIKA-SEC-014), and giving the gate a `default:` wakes
   NIKA-SEC-009 instead · a gate with a default is not a gate; its one
   [headless-prompt] hint is the price of a real one. This exact text passes
   `nika check` on the shipping binary — the transcript below is that run,
   VERBATIM (captured 2026-08-19 from a bare directory holding just this
   file, exactly like a reader's first copy · nika 0.111.0). The honesty law:
   re-capture when the CLI's voice changes, never hand-edit. */
export const FULL_FILE = `nika: weekly-radar
inputs:
  topic:
    type: string
    default: "local-first AI tooling"
    description: "Subject to research · --var topic=… overrides"
  notes_path:
    type: string
    default: "examples/fixtures/notes.md"
    description: "Your own notes file · the permits below grant the default"
const:
  output_dir: "./radar"

model: ollama/llama3.2:3b

permits:
  exec: ["git"]
  tools: ["nika:fetch", "nika:read", "nika:write", "nika:prompt"]
  net: { http: ["hnrss.org"] }
  fs:
    read: ["examples/fixtures/notes.md"]
    write: ["./radar/*"]

tasks:
  approve:
    invoke:
      # blocking · no \`default:\` · a gate with a default is not a gate · the
      # checker enforces both directions: \`default: false\` here turns this
      # file RED with NIKA-SEC-009, because a defaulted prompt dominates
      # nothing. Blocking costs one [headless-prompt] hint instead · that
      # hint is the price of a real gate, not a defect to paper over.
      # Unattended the run pauses (exit 4) · answer and resume with
      #   nika run <file> --resume <trace> --answer approve=true
      tool: "nika:prompt"
      args:
        mode: confirm
        message: "Run the weekly radar? It fetches hnrss.org, reads the notes file and writes ./radar/."

  fetch_news:
    with:
      go: "\${{ tasks.approve.output }}"
    when: \${{ with.go == true }}
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://hnrss.org/frontpage"

  repo_log:
    with:
      go: "\${{ tasks.approve.output }}"
    when: \${{ with.go == true }}
    exec:
      command: ["git", "log", "--since=1 week"]

  read_notes:
    with:
      go: "\${{ tasks.approve.output }}"
    when: \${{ with.go == true }}
    invoke:
      tool: "nika:read"
      args:
        path: "\${{ inputs.notes_path }}"

  digest:
    with:
      news: \${{ tasks.fetch_news.output }}
      log: \${{ tasks.repo_log.output }}
      notes: \${{ tasks.read_notes.output }}
    retry:
      max_attempts: 3
      backoff_ms: 1000
    infer:
      prompt: "One weekly radar on \${{ inputs.topic }}, five bullets: \${{ with.news }} \${{ with.log }} \${{ with.notes }}"
      max_tokens: 1024

  save:
    with:
      brief: \${{ tasks.digest.output }}
    invoke:
      tool: "nika:write"
      args:
        path: "\${{ const.output_dir }}/radar.md"
        content: "\${{ with.brief }}"

outputs:
  brief: \${{ tasks.digest.output }}`

export const FULL_FILE_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: "nika check weekly-radar.nika.yaml" },
  { kind: 'out', text: "nika check · weekly-radar.nika.yaml" },
  { kind: 'ok', text: " ✔ PLAN     4 waves · 6 tasks · max parallelism 3" },
  { kind: 'dim', text: "      wave 1 approve (invoke · nika:prompt)" },
  { kind: 'dim', text: "      wave 2 fetch_news (invoke · nika:fetch) · repo_log (exec · git) · read_notes (invoke · nika:read)" },
  { kind: 'dim', text: "      wave 3 digest (infer · ollama/llama3.2:3b)" },
  { kind: 'dim', text: "      wave 4 save (invoke · nika:write)" },
  { kind: 'ok', text: " ✔ MODELS   1 model resolves in this binary · local servers not probed (nika doctor --ping)" },
  { kind: 'warn', text: " ⚠  COST     bounded portion $0.0000 no total ceiling · 1 unpriced task · prompts, exec + mcp unpriced · prices 2026-07-28" },
  { kind: 'out', text: "   digest  ollama/llama3.2:3b  UNBOUNDED — no catalog price (local/unknown model)" },
  { kind: 'soft', text: " ○ ENERGY   unpriced — no sourced Wh figure for any task model · a local model draws your watts · never 0 Wh (NEP-0018)" },
  { kind: 'ok', text: " ✔ SECRETS  no declared secret reaches an effect · model echo untracked" },
  { kind: 'ok', text: " ✔ TYPES    deep references fit the shapes tasks declare · builtin output has none" },
  { kind: 'ok', text: " ✔ TOOLS    every named nika: tool is canonical · globs + mcp: not checked" },
  { kind: 'ok', text: " ✔ ARGS     every builtin invoke arg key is declared + required args present" },
  { kind: 'ok', text: " ✔ SCHEMA   no known-unsatisfiable form in an authored schema: · $ref opaque" },
  { kind: 'ok', text: " ✔ GATES    no task proven dead · status literals in vocabulary" },
  { kind: 'ok', text: " ✔ WRITES   no two unordered tasks write the same static path · computed paths at run" },
  { kind: 'ok', text: " ✔ EXEC     no literal argv the exec floor refuses at run · a templated argv is the RUN's verdict" },
  { kind: 'ok', text: " ✔ PERMITS  literal + const: args fit the boundary · computed paths + symlinks are the RUN's verdict · exec outside the fs bounds" },
  { kind: 'ok', text: " ✔ TRIFECTA no lethal trifecta over the declared permits: without a human gate" },
  { kind: 'ok', text: " ✔ JOURNEY internal · 0 sources · 2 destinations · 6 model endpoints · no secret reaches a cloud destination" },
  { kind: 'soft', text: " ↳ HINT     [headless-prompt] `nika:prompt` on `approve` declares no `default:` — unattended (CI, or an agent handing it over) the run pauses at this gate awaiting a human (exit 4 · the resume line taught on the frame); at a terminal it asks directly. Answer it in one pass with `nika run <file> --answer approve=<value>`, or declare the `default:` the unattended path should take" },
  { kind: 'soft', text: " ↳ HINT     [inputs] `read_notes` reads `examples/fixtures/notes.md` which does not exist here — create it (or point its var elsewhere) · the run would fail at that wave" },
  { kind: 'warn', text: " ⚠ audited · 6 tasks · 4 waves · permits declared · est unbounded · 1 unpriced task · 2 hints · risk unbounded — no dollar meter for a local/unknown model · cap a cloud seat on the run: `nika run <file> --max-cost-usd <usd>`" },
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
