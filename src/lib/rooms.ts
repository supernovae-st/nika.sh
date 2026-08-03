import { ROOM_BASES } from '../content/lens-bases.generated'

/* ─── rooms · one href builder per roomed family ─────────────────────────────
   The site linked its own word rooms at /language/<word> for a week after
   they moved to /language/words/<word>. Eight files carried the old base as
   a literal, the doorways kept every link technically alive, and the 63
   destination rooms read as unreachable to anything that counts links.

   A base that lives in eight literals moves in seven of them. These builders
   read the descriptor's projection (lens-bases.generated), so a family that
   moves takes its links with it — the same discipline the compiler and the
   graph extractor already follow on their side. */

const base = (family: string, fallback: string) => ROOM_BASES[family] ?? fallback

/** a key a .nika.yaml can carry · /language/words/<word> */
export const wordRoom = (word: string) => `${base('words', '/language/words')}/${word}`

/** one of the four verbs · /language/verbs/<name> */
export const verbRoom = (name: string) => `${base('verbs', '/language/verbs')}/${name}`

/** a nika: builtin · /language/stdlib/<bare> */
export const builtinRoom = (bare: string) => `${base('builtins', '/language/stdlib')}/${bare}`

/** an error code · /language/errors/<CODE> */
export const errorRoom = (code: string) => `${base('error-codes', '/language/errors')}/${code}`

/** a skeleton · /workflows/skeletons/<name> */
export const skeletonRoom = (name: string) => `${base('templates', '/workflows/skeletons')}/${name}`

/** a real job · /workflows/jobs/<slug> */
export const jobRoom = (slug: string) => `${base('showcases', '/workflows/jobs')}/${slug}`
