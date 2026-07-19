import type { AtlasNode, AtlasEdge } from '../content/atlas.generated'

/* ─── inspector-readout · the per-set render table (round-1) ─────────────────
   ONE pure function from a node + the graph to a structured readout — the
   render table per set, never an if-soup, and the SAME table the hover
   cards will truncate at round-3 (the anti-fork gate holds both to it).
   Zero new facts: every row is a projection of what the graph already
   carries; the vitest gate snapshots the STRUCTURE for one node of every
   set. */

export interface ReadoutLink {
  label: string
  href: string
}
export interface ReadoutRow {
  label: string
  value?: string
  links?: ReadoutLink[]
}
export interface Readout {
  title: string
  kindGlyph: string
  kind: AtlasKind | null
  status: string
  opener: string | null
  rows: ReadoutRow[]
  door: ReadoutLink | null
}

import { KIND_GLYPH, KIND_OF_SET, type AtlasKind } from '../content/design.generated'

/* NODE-CLASS glyphs (the twin's structural axis: set/layer/chapter…) —
   distinct from the design graph's FAMILY signatures above (nomenclature:
   node class ≠ kind; the two collided under one name until fenêtre C+) */
const NODE_GLYPH: Record<string, string> = {
  set: '≡',
  member: '·',
  layer: '◇',
  chapter: '§',
  surface: '▸',
}

/* member meta, per set (the design's table: errors category+transient ·
   providers kind+dialect · builtins family · words scopes+verb) */
const MEMBER_META: Record<string, (meta: Record<string, unknown>) => ReadoutRow[]> = {
  'error-codes': (m) => [
    { label: 'category', value: String(m.category ?? '') },
    { label: 'transient', value: m.transient ? 'yes · retry can help' : 'no' },
  ],
  providers: (m) => [
    { label: 'kind', value: String(m.kind ?? '') },
    ...(m.dialect ? [{ label: 'dialect', value: String(m.dialect) }] : []),
  ],
  builtins: (m) => (m.family ? [{ label: 'family', value: String(m.family) }] : []),
  words: (m) => [
    ...(Array.isArray(m.scopes) ? [{ label: 'scopes', value: (m.scopes as string[]).join(' · ') }] : []),
    ...(m.verb ? [{ label: 'verb', value: 'yes' }] : []),
  ],
}

const EDGE_CAP = 8

function nodeHref(n: AtlasNode): string | null {
  if (!n.url || n.url.includes(':')) return null
  // a roomed member OWNS its page — its door is the room, never a fragment
  // (own_page · rooms universelles; the anchor stays for the register view)
  return n.anchor && !n.own_page ? `${n.url}#${n.anchor}` : n.url
}

/* the hover card's slice (round-3): the SAME readout, truncated — one
   renderer, never a fork (the gate holds the card to readoutFor's output) */
export function cardSlice(readout: Readout): {
  title: string
  kindGlyph: string
  kind: AtlasKind | null
  status: string
  firstLine: string | null
  set: string | null
} {
  const opener = readout.opener
  return {
    title: readout.title,
    kindGlyph: readout.kindGlyph,
    kind: readout.kind,
    status: readout.status,
    firstLine: opener ? (opener.match(/^[^.!?]*[.!?]?/)?.[0].trim() ?? opener) : null,
    set: readout.rows.find((r) => r.label === 'set')?.links?.[0]?.label ?? null,
  }
}

/* a star's href resolves to its node (url or url#anchor — derived reverse
   lookup, never a second table) */
export function nodeIdForHref(
  href: string,
  graph: { ATLAS_INDEX: Record<string, AtlasNode> },
): string | null {
  const [path, frag] = href.split('#')
  for (const [id, n] of Object.entries(graph.ATLAS_INDEX)) {
    if (n.url !== path) continue
    if ((n.anchor ?? '') === (frag ?? '')) return id
  }
  return null
}

export function readoutFor(
  id: string,
  graph: { ATLAS_INDEX: Record<string, AtlasNode>; ATLAS_EDGES: AtlasEdge[] },
): Readout | null {
  const n = graph.ATLAS_INDEX[id]
  if (!n) return null
  const rows: ReadoutRow[] = []

  if (n.set) {
    const set = graph.ATLAS_INDEX[`set:${n.set}`]
    if (set) {
      const href = nodeHref(set)
      rows.push({ label: 'set', links: [{ label: set.title, href: href ?? `/map#${n.set}` }] })
    }
    const meta = (n.meta ?? {}) as Record<string, unknown>
    rows.push(...(MEMBER_META[n.set]?.(meta) ?? []))
  }
  if (n.layer) rows.push({ label: 'layer', value: n.layer })

  /* THE unique value: the edges, grouped by kind, every target a link */
  const byKind = new Map<string, ReadoutLink[]>()
  for (const e of graph.ATLAS_EDGES) {
    const [dir, otherId] = e.from === id ? ['→', e.to] : e.to === id ? ['←', e.from] : [null, '']
    if (!dir) continue
    const other = graph.ATLAS_INDEX[otherId]
    if (!other) continue
    const href = nodeHref(other)
    if (!href) continue
    const key = `${e.kind} ${dir}`
    const bucket = byKind.get(key) ?? []
    if (bucket.length < EDGE_CAP) bucket.push({ label: other.title, href })
    byKind.set(key, bucket)
  }
  for (const [kind, links] of [...byKind.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    rows.push({ label: kind, links })
  }

  const door = nodeHref(n)
  return {
    title: n.title,
    kindGlyph:
      (n.kind === 'member' && n.set && KIND_OF_SET[n.set] && KIND_GLYPH[KIND_OF_SET[n.set]]) ||
      (NODE_GLYPH[n.kind] ?? '·'),
    kind: (n.kind === 'member' && n.set && KIND_OF_SET[n.set]) || null,
    status: n.status,
    opener: n.opener ?? null,
    rows,
    door: door ? { label: 'open the page', href: door } : null,
  }
}
