import { NIKA_ROLE_WORDS, NIKA_ROLE_MARK, type NikaRoleName } from '../design-tokens.generated'

/* ─── word-role · the ONE reader of the language's semantic roles ─────────────
   The spec classifies every declared word into at most one semantic role
   (nika-spec design/tokens.yaml · derived by its projector from
   workflow.schema.json, never listed by hand). The code panel has coloured by
   that classification since the semantic-yaml wave — `permits` reads as the
   boundary, `with` as the wiring, `jitter` as failure grammar — but the
   REGISTER never said it. A reader could stand on /language/jitter, see the
   panel tint the word, and never learn which family it belongs to.

   So the role becomes a stated fact here, from the same projection the panel
   reads. One producer: the panel, the register and the room all resolve the
   role through this module, so none of them can name a different family than
   the others. */

const ROLE_NAMES = Object.keys(NIKA_ROLE_WORDS) as NikaRoleName[]

const MEMBERS: ReadonlyArray<readonly [NikaRoleName, ReadonlySet<string>]> = ROLE_NAMES.map(
  (role) => [role, new Set(NIKA_ROLE_WORDS[role].split(' '))] as const,
)

export interface WordRole {
  /** the role's canonical name (boundary · wire · fail) */
  role: NikaRoleName
  /** the family as a reader meets it, not as the tokenizer spells it */
  label: string
  /** why this word is in that family — the classification, in one clause */
  says: string
  /** the mark the SSOT binds to this role (glyph · ref-ink · danger) */
  mark: string
}

/* the reader-facing half. The spec carries `means:` for each role, but that
   sentence is written for an implementer ("the declarations that bound what a
   plan may touch"); these are the same fact in the anyone register, which is
   the voice every other tip on this site speaks. */
const VOICE: Record<string, { label: string; says: string }> = {
  boundary: {
    label: 'the boundary',
    says: 'one of the two declarations that fence what a plan may touch · a reader can see the blast radius without reading the tasks',
  },
  wire: {
    label: 'the wiring',
    says: 'this key DECLARES an edge, so it wears the same ink as the reference it introduces · the binding and the arrow are one fact',
  },
  fail: {
    label: 'the failure grammar',
    says: 'this word only ever speaks inside the recovery block, so meeting it means you are reading what happens when something breaks',
  },
}

/** the word's role, or null when it carries none (most words do not) */
export function roleOf(word: string): WordRole | null {
  for (const [role, members] of MEMBERS) {
    if (!members.has(word)) continue
    const voice = VOICE[role]
    if (!voice) return null
    return { role, label: voice.label, says: voice.says, mark: NIKA_ROLE_MARK[role] }
  }
  return null
}

/** every role, with its members — the register's grouping */
export const ROLE_FAMILIES = MEMBERS.map(([role, members]) => ({
  role,
  label: VOICE[role]?.label ?? role,
  words: [...members].sort(),
}))
