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
