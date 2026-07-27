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
  exec: 'the second verb: run a command, captured and typed; its room: /verbs/exec',
  infer: 'the first verb: call a model; its room: /verbs/infer',
  invoke: 'the third verb: call a tool (nika: builtin or mcp: server); its room: /verbs/invoke',
  max_tokens: 'per-call output token cap',
  max_turns: 'the agent’s loop bound; the worst case is finite',
  on_error: 'the catch side: recover with a value, skip, or fail loudly, per error code',
  prompt: 'the model job, in words: interpolate ${{ }} references, never paste secrets',
}
