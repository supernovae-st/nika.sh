/* ─── radial-layout · the constellation's pure geometry (§5) ─────────────────
   twin in → placed rings out. PURE and seedless-deterministic: angles come
   from counts and reading order, radii from log(membership), every figure
   rounded to 2 decimals — the same twin bytes always produce the same
   geometry bytes (the mini-dag-layout golden discipline, applied radially).

   Rings: 1 the seven layers (sectors · span ∝ √members · reading order
   from -90° clockwise) · 2 the sets (dot radius ∝ log2 members) · 3 the
   top-N members per set as real anchors (+K more aggregates the tail
   toward the hub) · links: inter-set edges aggregated by kind with weight
   (the anti-hairball verdict: set-level bundles at v1, member-level is R2). */

const TAU = Math.PI * 2
const r2 = (n) => Math.round(n * 100) / 100

export const RING = { layers: 210, sets: 330, members: 470, labels: 545 }
export const SIZE = 1200
export const CENTER = SIZE / 2

/** kinds drawn between sets (teaching structure · member-of implied by rings) */
export const LINK_KINDS = ['names', 'grants', 'accepts', 'carries']

export function layoutConstellation(twin, { topN = 12 } = {}) {
  /* the twin's nodes sort alphabetically · the anatomy reads in book order
     (the layer nodes carry it as `order`) */
  const layers = twin.nodes.filter((n) => n.kind === 'layer').sort((a, b) => a.order - b.order)
  const sets = twin.nodes.filter((n) => n.kind === 'set')
  const members = twin.nodes.filter((n) => n.kind === 'member')
  const bySet = new Map()
  for (const m of members) {
    if (!bySet.has(m.set)) bySet.set(m.set, [])
    bySet.get(m.set).push(m)
  }

  /* ring 1 · layer sectors — span ∝ √(layer member count) with a floor so
     small layers stay legible · reading order, top, clockwise */
  const layerCounts = layers.map((l) => ({
    id: l.id.slice(6),
    title: l.title,
    url: l.url,
    exists: l.exists !== false,
    n: members.filter((m) => m.layer === l.id.slice(6)).length,
  }))
  const weights = layerCounts.map((l) => Math.sqrt(Math.max(l.n, 4)))
  const total = weights.reduce((a, b) => a + b, 0)
  let angle = -TAU / 4
  const layerSectors = layerCounts.map((l, i) => {
    const span = (weights[i] / total) * TAU
    const s = { ...l, a0: r2(angle), a1: r2(angle + span), mid: r2(angle + span / 2) }
    angle += span
    return s
  })
  const sectorOf = Object.fromEntries(layerSectors.map((s) => [s.id, s]))

  /* ring 2 · set dots along their layer's span (padded · reading order =
     descriptor order, which the twin preserves through stable node sort by
     id — so re-derive descriptor order from set list order per layer) */
  const setDots = []
  const byLayer = new Map()
  for (const s of sets) {
    const layer = s.layer
    if (!byLayer.has(layer)) byLayer.set(layer, [])
    byLayer.get(layer).push(s)
  }
  for (const [layerId, ss] of [...byLayer.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sec = sectorOf[layerId]
    if (!sec) continue
    const sorted = [...ss].sort((a, b) => a.id.localeCompare(b.id))
    const pad = (sec.a1 - sec.a0) * 0.12
    sorted.forEach((s, i) => {
      const t = sorted.length === 1 ? 0.5 : i / (sorted.length - 1)
      const a = sec.a0 + pad + t * (sec.a1 - sec.a0 - pad * 2)
      const count = (bySet.get(s.id.slice(4)) ?? []).length
      setDots.push({
        id: s.id.slice(4),
        title: s.title,
        url: s.url,
        layer: layerId,
        surface: s.surface,
        page_exists: s.page_exists !== false,
        count,
        angle: r2(a),
        x: r2(CENTER + Math.cos(a) * RING.sets),
        y: r2(CENTER + Math.sin(a) * RING.sets),
        r: r2(4 + Math.log2(count + 1) * 2.2),
      })
    })
  }
  const dotOf = Object.fromEntries(setDots.map((d) => [d.id, d]))

  /* ring 3 · top-N members per set along the set's local arc + one
     aggregate for the tail (links the hub — the honest "+K more") */
  const memberStars = []
  const aggregates = []
  for (const d of setDots) {
    const ms = (bySet.get(d.id) ?? []).slice().sort((a, b) => a.id.localeCompare(b.id))
    const shown = ms.slice(0, topN)
    const rest = ms.length - shown.length
    const span = Math.min(0.5, 0.05 * Math.max(shown.length, 1))
    shown.forEach((m, i) => {
      const t = shown.length === 1 ? 0.5 : i / (shown.length - 1)
      const a = d.angle - span / 2 + t * span
      memberStars.push({
        id: m.id,
        title: m.title,
        url: m.url,
        anchor: m.anchor ?? null,
        set: d.id,
        layer: d.layer,
        hollow: m.status === 'ratified' && sets.find((s) => s.id === `set:${d.id}`)?.clock === 'both',
        x: r2(CENTER + Math.cos(a) * RING.members),
        y: r2(CENTER + Math.sin(a) * RING.members),
      })
    })
    if (rest > 0) {
      const a = d.angle + span / 2 + 0.035
      aggregates.push({
        set: d.id,
        count: rest,
        url: d.surface === 'rooms' ? d.url?.split('/:')[0] ?? d.url : d.url,
        x: r2(CENTER + Math.cos(a) * RING.members),
        y: r2(CENTER + Math.sin(a) * RING.members),
      })
    }
  }

  /* links · inter-set aggregation of the teaching kinds · weight = count ·
     bundled through a control point pulled toward the center */
  const agg = new Map()
  const setOfMember = new Map(members.map((m) => [m.id, m.set]))
  for (const e of twin.edges) {
    if (!LINK_KINDS.includes(e.kind)) continue
    const a = setOfMember.get(e.from)
    const b = setOfMember.get(e.to)
    if (!a || !b || a === b) continue
    const key = `${e.kind} ${a} ${b}`
    agg.set(key, (agg.get(key) ?? 0) + 1)
  }
  const links = [...agg.entries()]
    .map(([key, weight]) => {
      const [kind, a, b] = key.split(' ')
      const A = dotOf[a]
      const B = dotOf[b]
      if (!A || !B) return null
      const mx = (A.x + B.x) / 2
      const my = (A.y + B.y) / 2
      const cx = r2(CENTER + (mx - CENTER) * 0.3)
      const cy = r2(CENTER + (my - CENTER) * 0.3)
      return { kind, from: a, to: b, weight, w: r2(0.6 + Math.log2(weight + 1) * 0.5), path: `M ${A.x} ${A.y} Q ${cx} ${cy} ${B.x} ${B.y}` }
    })
    .filter(Boolean)
    .sort((a, b) => (a.kind + a.from + a.to).localeCompare(b.kind + b.from + b.to))

  return { size: SIZE, center: CENTER, ring: RING, layers: layerSectors, sets: setDots, members: memberStars, aggregates, links }
}
