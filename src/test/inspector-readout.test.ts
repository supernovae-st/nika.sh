import { describe, expect, it } from 'vitest'
import { readoutFor, nodeIdForHref } from '../shell/inspector-readout'
import { ATLAS_NODES, ATLAS_EDGES, ATLAS_INDEX } from '../content/atlas.generated'

/* ── the readout gate (round-1) ──────────────────────────────────────────────
   One node of EVERY set through the per-set render table: the STRUCTURE is
   judged (labels present · every link resolvable in the graph · door only
   when the node serves a page) — never pixels. The hover cards (round-3)
   will truncate THIS renderer; the anti-fork gate starts here. */

const graph = { ATLAS_INDEX, ATLAS_EDGES }

describe('inspector · the per-set readout stays lawful', () => {
  const sets = [...new Set(ATLAS_NODES.filter((n) => n.kind === 'member' && n.set).map((n) => n.set!))].sort()

  it('covers one member of every set with a titled, structured readout', () => {
    expect(sets.length).toBeGreaterThan(10)
    for (const set of sets) {
      const node = ATLAS_NODES.find((n) => n.kind === 'member' && n.set === set)!
      const r = readoutFor(node.id, graph)!
      expect(r, node.id).toBeTruthy()
      expect(r.title.length, node.id).toBeGreaterThan(0)
      expect(['ratified', 'shipped', 'both']).toContain(r.status)
      expect(r.rows.some((row) => row.label === 'set'), `${node.id} names its set`).toBe(true)
    }
  })

  it('every readout link resolves to a node the graph serves', () => {
    for (const set of sets) {
      const node = ATLAS_NODES.find((n) => n.kind === 'member' && n.set === set)!
      const r = readoutFor(node.id, graph)!
      for (const row of r.rows) {
        for (const l of row.links ?? []) {
          expect(l.href.startsWith('/'), `${node.id} · ${row.label} · ${l.href}`).toBe(true)
          expect(l.href.includes(':'), `${node.id} pattern leaked: ${l.href}`).toBe(false)
        }
      }
    }
  })

  it('set nodes read out too (the map chips speak sets first)', () => {
    const r = readoutFor('set:error-codes', graph)!
    expect(r.title).toBe('The error codes')
    expect(r.rows.some((row) => row.label.startsWith('member-of')), 'members appear as edges').toBe(true)
  })

  it('per-set member meta renders its named fields', () => {
    const code = ATLAS_NODES.find((n) => n.set === 'error-codes' && n.kind === 'member')!
    const r = readoutFor(code.id, graph)!
    expect(r.rows.some((row) => row.label === 'category')).toBe(true)
    expect(r.rows.some((row) => row.label === 'transient')).toBe(true)
  })

  it('an unknown id is an honest null, never a throw', () => {
    expect(readoutFor('ghost:nope', graph)).toBeNull()
  })
})

describe('inspector · the star href resolves to its node (the constellation door)', () => {
  it('resolves room urls and anchored urls, and misses honestly', () => {
    const code = ATLAS_NODES.find((n) => n.set === 'error-codes' && n.kind === 'member')!
    expect(nodeIdForHref(code.url!, graph)).toBe(code.id)
    const anchored = ATLAS_NODES.find((n) => n.kind === 'member' && n.anchor)!
    expect(nodeIdForHref(`${anchored.url}#${anchored.anchor}`, graph)).toBe(anchored.id)
    expect(nodeIdForHref('/nowhere#ghost', graph)).toBeNull()
  })
})
