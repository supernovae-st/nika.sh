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
  | 'set'

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
  s: 'set',
  set: 'set',
}

/** parse a raw palette query into an optional kind scope + the needle.
    `>` scopes to ACTIONS (the VS Code precedent · round-2B) — a special
    kind outside the register grammar. */
export function parseQuery(raw: string): { kind?: PaletteKind | 'action'; needle: string } {
  if (raw.startsWith('>')) return { kind: 'action', needle: raw.slice(1).trimStart() }
  const m = raw.match(/^([a-z]{1,8}):(.*)$/i)
  if (m) {
    const kind = KIND_PREFIX[m[1].toLowerCase()]
    if (kind) return { kind, needle: m[2].trimStart() }
  }
  return { needle: raw }
}

/* ── stage 2 · full-text rows (the pagefind merge · WO-12 pack) ──────────────
   The register stage answers instantly from the compiled corpus; past two
   characters the palette ALSO asks the page index (built from the SSG dist,
   the rendered truth) and appends « in pages » rows: deduped against the
   register hits by normalized url, marks stripped, capped. Pure function —
   the unit gate proves dedup, stripping and the cap. */

export interface PageTextHit {
  kind: 'pagetext'
  label: string
  href: string
  hint: string
}

export function normalizePagePath(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/index\.html$/, '').replace(/\.html$/, '')
  const clean = path.replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

export function mergePageHits(
  taken: ReadonlySet<string>,
  results: { url: string; title: string; excerpt: string }[],
  cap = 8,
): PageTextHit[] {
  const out: PageTextHit[] = []
  const seen = new Set<string>()
  for (const r of results) {
    const href = normalizePagePath(r.url)
    if (taken.has(href) || seen.has(href)) continue
    seen.add(href)
    out.push({
      kind: 'pagetext',
      label: r.title,
      href,
      hint: r.excerpt.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 110),
    })
    if (out.length >= cap) break
  }
  return out
}
