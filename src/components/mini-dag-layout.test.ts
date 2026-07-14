import { describe, expect, it } from 'vitest'
import { layoutMiniDag } from './mini-dag-layout'
import { LIBRARY } from '../flagships/library'
import { SHOWCASE_DAG } from '../sections/usecases-yaml.generated'

/* ── mini-dag layout · the generated plan drawing (wave K) ────────────────────
   Pure layout, pinned so every library file gets a correct diagram for free:
   wave alignment IS the topology, every with:/after: edge is drawn, gates and
   fan-outs are marked from the derivation (never hand-typed). */

const by = (id: string) => LIBRARY.find((x) => x.id === id)!

describe('mini-dag layout · structure', () => {
  it('lays out every library file with every task and every dependency', () => {
    for (const item of LIBRARY) {
      for (const o of ['rail', 'band'] as const) {
        const lay = layoutMiniDag(item.plan, o)
        expect(lay.nodes.length, item.id).toBe(item.plan.tasks.length)
        const depCount = item.plan.tasks.reduce((n, t) => n + t.deps.length, 0)
        expect(lay.edges.length, item.id).toBe(depCount)
        const ids = new Set(lay.nodes.map((n) => n.id))
        for (const e of lay.edges) {
          expect(ids.has(e.from), `${item.id} edge from ${e.from}`).toBe(true)
          expect(ids.has(e.to), `${item.id} edge to ${e.to}`).toBe(true)
        }
      }
    }
  })

  it('waves align: same wave shares the time axis, later waves sit strictly later', () => {
    for (const item of LIBRARY) {
      const rail = layoutMiniDag(item.plan, 'rail')
      const band = layoutMiniDag(item.plan, 'band')
      for (const t of item.plan.tasks) {
        const r = rail.nodes.find((n) => n.id === t.id)!
        const b = band.nodes.find((n) => n.id === t.id)!
        expect(r.wave).toBe(t.wave)
        for (const d of t.deps) {
          const rd = rail.nodes.find((n) => n.id === d)!
          const bd = band.nodes.find((n) => n.id === d)!
          expect(rd.y, `${item.id} rail ${d}→${t.id}`).toBeLessThan(r.y)
          expect(bd.x, `${item.id} band ${d}→${t.id}`).toBeLessThan(b.x)
        }
      }
      /* same-wave alignment (the parallel columns read as one start line) */
      for (const wave of item.plan.waves) {
        const ys = new Set(wave.map((t) => rail.nodes.find((n) => n.id === t.id)!.y))
        expect(ys.size, item.id).toBe(1)
        const xs = new Set(wave.map((t) => band.nodes.find((n) => n.id === t.id)!.x))
        expect(xs.size, item.id).toBe(1)
      }
    }
  })

  it('every node sits inside the layout bounds', () => {
    for (const item of LIBRARY) {
      for (const o of ['rail', 'band'] as const) {
        const lay = layoutMiniDag(item.plan, o)
        for (const n of lay.nodes) {
          expect(n.x, `${item.id} ${n.id}`).toBeGreaterThan(0)
          expect(n.x, `${item.id} ${n.id}`).toBeLessThan(lay.w)
          expect(n.y, `${item.id} ${n.id}`).toBeGreaterThan(0)
          expect(n.y, `${item.id} ${n.id}`).toBeLessThan(lay.h)
        }
      }
    }
  })

  it('is deterministic (SSR-identical)', () => {
    const a = layoutMiniDag(by('daily_brief').plan, 'rail')
    const b = layoutMiniDag(by('daily_brief').plan, 'rail')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('mini-dag layout · gates and fan-outs derive from the file', () => {
  it('marks the when-gated tasks of etl-quarantine (good · quarantine · report)', () => {
    const lay = layoutMiniDag(by('etl_quarantine').plan, 'rail')
    const gated = lay.nodes.filter((n) => n.gated).map((n) => n.id)
    expect(gated.sort()).toEqual(['good', 'quarantine', 'report'])
  })

  it('marks price-watch’s alert gate (the zero-model flagship)', () => {
    const lay = layoutMiniDag(by('price_watch').plan, 'rail')
    expect(lay.nodes.find((n) => n.id === 'alert')?.gated).toBe(true)
    expect(lay.nodes.find((n) => n.id === 'price')?.gated).toBe(false)
  })

  it('marks localization-factory’s fan-outs exactly as the spec projector does', () => {
    const lay = layoutMiniDag(by('t3-localization-factory').plan, 'band')
    const mine = lay.nodes
      .filter((n) => n.fanout)
      .map((n) => n.id)
      .sort()
    const spec = SHOWCASE_DAG['t3-localization-factory'].tasks
      .filter((t) => t.flags.some((f) => f.startsWith('fan-out')))
      .map((t) => t.id)
      .sort()
    expect(mine).toEqual(spec)
    expect(mine.length).toBeGreaterThan(0)
  })

  it('no flagship task fans out (for_each never appears in the recorded seven)', () => {
    for (const item of LIBRARY.filter((x) => x.flagship)) {
      const lay = layoutMiniDag(item.plan, 'rail')
      expect(lay.nodes.some((n) => n.fanout), item.id).toBe(false)
    }
  })
})
