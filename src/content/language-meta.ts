/* ─── the language register's editorial layer · glosses, not contracts ────────
   The /language rows speak the SCHEMA's own descriptions wherever the
   schema carries one (language.generated — the projection law). Some keys
   are self-evident in the contract and carry none; the row still owes the
   reader a sentence. These glosses are EDITORIAL — clearly ours, spec-true
   by review, never claiming to be the binary's voice (the CATEGORY_GLOSS
   precedent). The drift gate (language.test.ts) fails when a word has
   neither a schema description nor a gloss — no naked rows, ever. */

export const WORD_GLOSS: Record<string, string> = {
  agent: 'the fourth verb: a budgeted tool-calling loop; its room: /verbs/agent',
  args: 'the tool call’s arguments, validated against the builtin’s declared contract before anything runs',
  backoff_max_ms: 'ceiling on the computed backoff delay',
  backoff_ms: 'base delay between attempts',
  backoff_strategy: 'how the delay grows between attempts',
  capture: 'which stream becomes the task output',
  cwd: 'working directory for the command',
  depends_on: 'the DAG’s edges: every ${{ tasks.X }} reference requires its id here (NIKA-DAG-003)',
  description: 'one honest sentence about the workflow; it shows in listings and traces',
  exec: 'the second verb: run a command, captured and typed; its room: /verbs/exec',
  fail_workflow: 'escalate: a caught error still fails the run after recovery',
  infer: 'the first verb: call a model; its room: /verbs/infer',
  invoke: 'the third verb: call a tool (nika: builtin or mcp: server); its room: /verbs/invoke',
  jitter: 'randomize delays so retries never stampede in phase',
  max_attempts: 'the retry ceiling, the leash on flake',
  max_tokens: 'per-call output token cap',
  max_tokens_total: 'the agent’s total spend bound across all turns',
  max_turns: 'the agent’s loop bound; the worst case is finite',
  on_error: 'the catch side: recover with a value, skip, or fail loudly, per error code',
  prompt: 'the model job, in words: interpolate ${{ }} references, never paste secrets',
  retry: 'the leash: attempts, backoff, jitter, per-code filters',
  skip: 'treat the failed task as skipped and continue the plan',
  stdin: 'text piped to the command’s standard input',
  system: 'the standing instruction: who the model is for this task',
  tasks: 'the plan itself: every step, one verb each; order comes from depends_on, not position',
  thinking: 'extended-reasoning budget for models that expose it',
  vision: 'image inputs for multimodal models',
}
