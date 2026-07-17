import { describe, expect, it } from 'vitest'
import { readoutFor, cardSlice } from '../shell/inspector-readout'
import { ATLAS_NODES, ATLAS_EDGES, ATLAS_INDEX } from '../content/atlas.generated'

/* ── the anti-fork gate (round-3) ────────────────────────────────────────────
   The hover card renders from the SAME per-set table as the Inspector —
   cardSlice consumes readoutFor's own output, so every field is provably a
   truncation of the readout (title identical · first line a prefix of the
   opener · the set label the readout's own set link). One renderer, ever. */

const graph = { ATLAS_INDEX, ATLAS_EDGES }

describe('hover card · a truncation of the readout, never a fork', () => {
  const sets = [...new Set(ATLAS_NODES.filter((n) => n.kind === 'member' && n.set).map((n) => n.set!))].sort()

  it('every set: the card IS the readout, truncated', () => {
    for (const set of sets) {
      const node = ATLAS_NODES.find((n) => n.kind === 'member' && n.set === set)!
      const readout = readoutFor(node.id, graph)!
      const card = cardSlice(readout)
      expect(card.title, node.id).toBe(readout.title)
      expect(card.kindGlyph).toBe(readout.kindGlyph)
      expect(card.status).toBe(readout.status)
      if (card.firstLine) {
        expect(readout.opener!.startsWith(card.firstLine.slice(0, -1)), `${node.id} first line is a prefix`).toBe(true)
      }
      const setLabel = readout.rows.find((r) => r.label === 'set')?.links?.[0]?.label ?? null
      expect(card.set).toBe(setLabel)
    }
  })

  it('a nodeless readout never reaches the card (the layer guards)', () => {
    expect(readoutFor('ghost:none', graph)).toBeNull()
  })
})
