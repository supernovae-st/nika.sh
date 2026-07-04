/* ─── plain-words · the anyone-register glossary for the hover layer (H6) ─────
   One line per concept, repeatable by a non-technical person (wave G Q1: the
   3D layer is the inclusion device — so is this vocabulary). Shared by the
   slab tooltips (3D beat) and the YAML line hover (file beat) so the two
   surfaces can never explain the same key differently. */

import type { NikaVerb } from '../../flagships'

export const VERB_WORDS: Record<NikaVerb, string> = {
  infer: 'the step that thinks · it asks the model',
  exec: 'runs a real command on your machine',
  invoke: 'uses a tool the file permits',
  agent: 'delegates to an agent, capped in turns',
}

export const DEPENDS_WORDS = 'waits for these steps'
export const WHEN_WORDS = 'a gate · this step runs only if it’s true'
export const PERMITS_WORDS = 'what the file may touch'

/* the key glossary · the YAML hover layer (wave O) — one line per key a
   curious reader would hover, same anyone-register. Curated, not exhaustive:
   schema plumbing (type · properties · required · args · path) stays silent —
   a tooltip on every token is noise, not teaching. The three constants above
   stay the single source for their keys. */
export const KEY_WORDS: Record<string, string> = {
  nika: 'the envelope · nika: v1, forever',
  workflow: 'this run’s name',
  model: 'the model it runs on · local means nothing leaves',
  permits: PERMITS_WORDS,
  fs: 'file permits · what it may read and write',
  tools: 'the only tools this run may call',
  tasks: 'the plan · one step per task',
  depends_on: DEPENDS_WORDS,
  when: WHEN_WORDS,
  for_each: 'fan-out · one run per item',
  schema: 'the output is a contract · typed and checked',
  prompt: 'what the model is asked',
  max_tokens: 'a hard cap · the runtime enforces it',
  max_turns: 'the agent’s loop cap',
  timeout: 'a hard time cap on this step',
  on_error: 'the fallback · a bad step degrades, the run survives',
  recover: 'the value used if this step fails',
  outputs: 'what the run hands back',
  vars: 'plain data the file reuses',
  command: 'the exact command line that runs',
  tool: 'the tool this step calls',
}

/** the ${{ … }} wiring, in the same register */
export const TREF_WORDS = 'live wiring · one step’s output feeds the next'
