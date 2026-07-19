/* ─── render-constellation · geometry → the standalone SVG (§5) ──────────────
   Static, crawlable, zero-JS: member stars are REAL <a> anchors (href for
   crawlers · tabindex=-1 so the page's list stays the one keyboard path —
   the list is the truth, the drawing is a lens). Hover/focus live in the
   embedded style; reduced-motion turns the transitions off. Colors are
   design-token VALUES baked at compile (the tokens module is the SSOT). */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

/** layer → token hue (semantic mapping · commented in the descriptor's order):
    shape=markIce (the file's words) · flow=infer (the graph) · acts=agent ·
    reach=invoke · boundary=exec (blast radius) · refusals=fail · proof=ok */
export const LAYER_HUE = {
  shape: 'markIce',
  flow: 'infer',
  acts: 'agent',
  reach: 'invoke',
  boundary: 'exec',
  refusals: 'fail',
  proof: 'ok',
}

const arcBand = (cx, cy, r0, r1, a0, a1) => {
  const large = a1 - a0 > Math.PI ? 1 : 0
  const p = (r, a) => `${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`
}

export function renderConstellation(geo, tokens, paper) {
  const { size, center: C, ring } = geo
  const hue = (layer) => tokens[LAYER_HUE[layer]]

  const style = `
  .cst { font-family: ui-monospace, 'SF Mono', Menlo, monospace; }
  .cst-sector { fill-opacity: .05; stroke-opacity: .22; stroke-width: 1; transition: fill-opacity .18s ease; }
  .cst-sector:hover { fill-opacity: .12; }
  .cst-laylab { font-size: 15px; letter-spacing: .08em; text-transform: lowercase; fill-opacity: .85; }
  .cst-setdot { stroke-opacity: .85; fill-opacity: .28; }
  .cst-setlab { font-size: 10.5px; fill: ${paper.lab}; fill-opacity: .75; }
  .cst-star a { transform-box: fill-box; transform-origin: center; transition: transform .15s ease; }
  .cst-star a:hover, .cst-star a:focus-visible { transform: scale(1.8); }
  .cst-star a:focus-visible circle { stroke: #fff; stroke-width: 1.2; }
  .cst-star--soon { opacity: .45; }
  .cst-agg { font-size: 10px; fill: ${paper.agg}; }
  .cst-agg a:hover text, .cst-agg a:focus-visible text { fill: ${paper.bright}; }
  .cst-lk { fill: none; stroke: ${paper.wire}; stroke-opacity: .10; }
  .cst-core { fill: ${paper.bright}; font-size: 17px; letter-spacing: .04em; }
  .cst-corering { fill: none; stroke: ${paper.wire}; stroke-opacity: .25; }
  @media (prefers-reduced-motion: reduce) { .cst-sector, .cst-star a { transition: none; } }
  `

  const parts = []
  /* aria-hidden: the drawing is a LENS — the anatomy list is the assistive
     truth (axe: role=img must not contain interactive descendants, and the
     stars ARE crawlable <a>). aria-hidden + tabindex=-1 anchors is clean
     (not tabbable → no aria-hidden-focus) and crawlers ignore aria-hidden
     entirely — the seo purpose survives whole. */
  parts.push(`<svg class="cst" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`)
  parts.push(`<style>${style}</style>`)

  /* ring 1 · layer sectors + labels */
  for (const l of geo.layers) {
    parts.push(
      `<path class="cst-sector" data-layer="${l.id}" d="${arcBand(C, C, ring.layers - 46, ring.layers, l.a0 + 0.012, l.a1 - 0.012)}" fill="${hue(l.id)}" stroke="${hue(l.id)}"/>`,
    )
    const lx = C + Math.cos(l.mid) * ring.labels
    const ly = C + Math.sin(l.mid) * ring.labels
    const anchorSide = Math.cos(l.mid) > 0.35 ? 'start' : Math.cos(l.mid) < -0.35 ? 'end' : 'middle'
    parts.push(
      `<text class="cst-laylab" x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" text-anchor="${anchorSide}" fill="${hue(l.id)}">${esc(l.title.toLowerCase())}</text>`,
    )
  }

  /* links under the dots */
  for (const lk of geo.links) {
    parts.push(`<path class="cst-lk" data-kind="${lk.kind}" d="${lk.path}" stroke-width="${lk.w}"/>`)
  }

  /* ring 2 · set dots + labels */
  for (const s of geo.sets) {
    parts.push(
      `<circle class="cst-setdot" data-set="${s.id}" cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${hue(s.layer)}" stroke="${hue(s.layer)}"/>`,
    )
    const off = s.r + 7
    const tx = s.x + Math.cos(s.angle) * off
    const ty = s.y + Math.sin(s.angle) * off
    const anchorSide = Math.cos(s.angle) > 0.3 ? 'start' : Math.cos(s.angle) < -0.3 ? 'end' : 'middle'
    parts.push(
      `<text class="cst-setlab" x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" text-anchor="${anchorSide}">${esc(s.id)}</text>`,
    )
  }

  /* ring 3 · member stars — real crawlable anchors when the page is served
     (out of tab order · the list is the keyboard path); a landing-later
     hub's stars render as plain points with their title (never a 404) */
  for (const m of geo.members) {
    if (!m.url) continue
    const fill = m.hollow ? 'none' : hue(m.layer)
    const stroke = hue(m.layer)
    /* both-clocks members wear the ring: ratified AND shipped, visibly */
    const ring = m.ringed
      ? `<circle cx="${m.x}" cy="${m.y}" r="5" fill="none" stroke="${stroke}" stroke-opacity=".5" stroke-width=".9"/>`
      : ''
    const dot = `${ring}<circle cx="${m.x}" cy="${m.y}" r="3.1" fill="${fill}" stroke="${stroke}" stroke-width="${m.hollow ? 1.3 : 0}"/><title>${esc(m.title)}</title>`
    if (m.linkable) {
      /* a roomed member OWNS its page — link the room, never a fragment
         (the anchor stays for the register view; own_page is the twin's
         additive marker · verdict 2026-07-18) */
      const href = m.anchor && !m.own_page ? `${m.url}#${m.anchor}` : m.url
      parts.push(`<g class="cst-star"><a href="${esc(href)}" tabindex="-1">${dot}</a></g>`)
    } else {
      parts.push(`<g class="cst-star cst-star--soon">${dot}</g>`)
    }
  }
  for (const a of geo.aggregates) {
    if (!a.url || !a.linkable) continue
    parts.push(
      `<g class="cst-agg"><a href="${esc(a.url)}" tabindex="-1"><text x="${a.x}" y="${a.y}" text-anchor="middle">+${a.count}</text><title>+${a.count} more · open the register</title></a></g>`,
    )
  }

  /* the core */
  parts.push(`<circle class="cst-corering" cx="${C}" cy="${C}" r="64"/>`)
  parts.push(`<text class="cst-core" x="${C}" y="${C + 5}" text-anchor="middle">nika: v1</text>`)
  parts.push('</svg>')
  const out = parts.join('\n') + '\n'
  /* the island guard: /map carries these bytes inside a <script type=
     text/plain> island (hydration byte-parity) — a closing-script sequence
     would end that island early. Structural refusal, not an escape. */
  if (/<\/script/i.test(out)) throw new Error('constellation: closing-script sequence would break the island')
  return out
}
