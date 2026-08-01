// graph-artifact.test.ts — the mégagraphe's own judge.
//
// Three laws proven here that the doctor cannot prove alone:
//   1. DETERMINISM is the contract (§J.4): two derivations are byte-identical,
//      and the COMMITTED artifact equals both — same pins, same bytes.
//   2. The PATHS join: a node claiming a url must name a route the prerender
//      actually serves (the real site.config import — the doctor only sees
//      the compiler's own census; this test closes the loop on the source).
//   3. The doctor itself exits 0 — typed (§J.1), inverted, evidenced.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the compiler is plain ESM (scripts/, untyped by design)
import { buildGraph } from '../../scripts/graph/build.mjs'
import { PATHS } from '../../site.config'

const ROOT = join(__dirname, '../..')

describe('nika-graph · the artifact keeps its contract', () => {
  const first = buildGraph() as string
  const doc = JSON.parse(first)

  it('same pins ⇒ same bytes (two derivations byte-identical, committed matches)', () => {
    expect(buildGraph()).toBe(first)
    expect(readFileSync(join(ROOT, 'public/nika-graph.json'), 'utf8')).toBe(first)
  })

  it('speaks graph_schema 1 and names its pins', () => {
    expect(doc.graph_schema).toBe(1)
    expect(doc.built_from.nika_spec).toMatch(/^supernovae-st\/nika-spec@[0-9a-f]{40}$/)
    expect(doc.built_from.nika_engine).toMatch(/^supernovae-st\/nika@[0-9a-f]{40} \(v[\d.]+\)$/)
    expect(doc.built_from.nika_estate).toMatch(/^supernovae-st\/nika-estate@[0-9a-f]{40}$/)
  })

  it('every url the graph claims is a route the prerender serves (the real PATHS)', () => {
    const routes = new Set(PATHS)
    const liars = (doc.nodes as { id: string; url: string | null; served?: boolean }[])
      .filter((n) => n.url !== null)
      .filter((n) => !routes.has(n.url as string) || n.served !== true)
      .map((n) => `${n.id} → ${n.url}`)
    expect(liars, `urls claimed but not served:\n${liars.join('\n')}`).toEqual([])
  })

  it('every family has members and an honest count (never typed, always derived)', () => {
    for (const f of doc.families as { family: string; count: number }[]) {
      const members = (doc.nodes as { family: string }[]).filter((n) => n.family === f.family)
      expect(members.length, `family ${f.family}`).toBeGreaterThan(0)
      expect(f.count, `family ${f.family} count`).toBe(members.length)
    }
  })

  it('the doctor exits 0 (typed §J.1 · inverted · evidenced)', () => {
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/graph/doctor.mjs')], { encoding: 'utf8' })
    expect(r.status, `doctor said:\n${r.stdout}\n${r.stderr}`).toBe(0)
  })
})
