import { WORD_USAGE } from './language-usage.generated'
import { TOOL_USAGE } from './tool-usage.generated'

/* ─── graph · the cross-reference graph, CLOSED ───────────────────────────────
   The rooms already point forward: a word names its check gates and the
   skeletons that carry it; a tool names its gates and skeletons. This
   module derives the INVERSES — which words and tools a code gates, which
   words and tools a skeleton carries — so /errors and /templates can point
   BACK. Pure inversion of the generated usage modules at module-eval time:
   no new compiler, no new drift surface — the graph cannot disagree with
   the rooms because it IS the rooms' data, read backward. The gate
   (graph.test.ts) pins exact bidirectionality anyway (trust, then verify). */

export interface BackRefs {
  /** language words that reference this key (register order of derivation) */
  words: string[]
  /** builtins that reference this key */
  tools: string[]
}

function invert(
  pick: (refs: { codes?: string[]; templates?: string[] }) => string[] | undefined,
): Record<string, BackRefs> {
  const out: Record<string, BackRefs> = {}
  const at = (k: string) => (out[k] ??= { words: [], tools: [] })
  for (const [word, u] of Object.entries(WORD_USAGE)) {
    for (const k of pick(u) ?? []) at(k).words.push(word)
  }
  for (const [tool, u] of Object.entries(TOOL_USAGE)) {
    for (const k of pick({ codes: u.errorCodes, templates: u.templates }) ?? []) {
      at(k).tools.push(tool)
    }
  }
  return out
}

/** error code → the words/tools whose pages name it */
export const CODE_REFS: Record<string, BackRefs> = invert((u) => u.codes)

/** template name → the words/tools its skeleton carries */
export const TEMPLATE_REFS: Record<string, BackRefs> = invert((u) => u.templates)
