/* ─── palette-query · the ⌘K prefix grammar (WO-12) ───────────────────────────
   `e:timeout` scopes the search to error codes, `t:` to tools, and so on —
   one register at a time when the mixed ranking is noise. Pure parse (unit
   gated); CommandK filters the corpus BEFORE fuzzy-scoring the remainder.
   Unknown prefixes are NOT filters: `re:try` searches the full corpus
   verbatim (a colon in a real query must never silently narrow it). The
   kind names come from the palette corpus; the aliases are typing-speed. */

export type PaletteKind =
  | 'page'
  | 'post'
  | 'error'
  | 'tool'
  | 'provider'
  | 'template'
  | 'verb'
  | 'word'
  | 'usecase'

/* one short + one full alias per kind (p is pages · posts ride b for blog) */
export const KIND_PREFIX: Record<string, PaletteKind> = {
  p: 'page',
  page: 'page',
  b: 'post',
  post: 'post',
  blog: 'post',
  e: 'error',
  err: 'error',
  error: 'error',
  t: 'tool',
  tool: 'tool',
  pr: 'provider',
  provider: 'provider',
  tpl: 'template',
  template: 'template',
  v: 'verb',
  verb: 'verb',
  w: 'word',
  word: 'word',
  u: 'usecase',
  uc: 'usecase',
  usecase: 'usecase',
}

/** parse a raw palette query into an optional kind scope + the needle */
export function parseQuery(raw: string): { kind?: PaletteKind; needle: string } {
  const m = raw.match(/^([a-z]{1,8}):(.*)$/i)
  if (m) {
    const kind = KIND_PREFIX[m[1].toLowerCase()]
    if (kind) return { kind, needle: m[2].trimStart() }
  }
  return { needle: raw }
}
