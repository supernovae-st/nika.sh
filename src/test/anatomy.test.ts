import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ANATOMY, ANATOMY_ENGINE } from '../content/anatomy.generated'
import { SHOWCASE_DAG } from '../content/showcase-dag.generated'
import { CANON } from '../canon.generated'

/* ── anatomy · the vendored engine reading, held to its sources (WO-14) ──────
   The rooms render the ENGINE's own graph (`nika inspect` · vendored by
   build-anatomy.mjs — the tests never probe the binary; the vendored-catalog
   law). What CAN drift is coverage and coherence, and these gates hold it:

   · every showcase room and every served flagship has its graph;
   · a showcase graph names EXACTLY the projected plan's task ids (two
     independent derivations of the same file — the projector's DAG model
     and the engine's inspect — must see the same tasks);
   · every edge references known nodes · every verb is canon vocabulary;
   · the provenance stamp matches the tools/providers catalogs (the THREE
     vendored surfaces move together or the clocks lie);
   · the module reaches the client only through the access door (the
     register diet — one static import anywhere re-pins ~60K to the entry). */

const ROOT = join(__dirname, '../..')

describe('anatomy · coverage', () => {
  it('every showcase room has its engine graph', () => {
    for (const slug of Object.keys(SHOWCASE_DAG)) {
      expect(ANATOMY[slug], `${slug} missing from the vendored anatomy`).toBeDefined()
    }
  })

  it('every served flagship has its engine graph', () => {
    const served = readdirSync(join(ROOT, 'public/library'))
      .filter((f) => f.endsWith('.nika.yaml'))
      .map((f) => f.replace(/\.nika\.yaml$/, ''))
    expect(served.length).toBeGreaterThanOrEqual(7)
    for (const slug of served) {
      expect(ANATOMY[slug], `${slug} missing from the vendored anatomy`).toBeDefined()
    }
  })
})

describe('anatomy · coherence with the projected plan', () => {
  it.each(Object.keys(SHOWCASE_DAG).map((s) => [s] as const))(
    '%s · the engine and the projector see the same task set',
    (slug) => {
      const engine = new Set(ANATOMY[slug].nodes.map((n) => n.id))
      const projector = new Set(SHOWCASE_DAG[slug].tasks.map((t) => t.id))
      expect([...engine].sort()).toEqual([...projector].sort())
    },
  )

  it('every edge references known nodes · every verb is canon vocabulary', () => {
    const verbs = new Set<string>(CANON.verbNames)
    for (const [slug, a] of Object.entries(ANATOMY)) {
      const ids = new Set(a.nodes.map((n) => n.id))
      for (const n of a.nodes) expect(verbs.has(n.verb), `${slug}/${n.id}: verb ${n.verb}`).toBe(true)
      for (const e of a.edges) {
        expect(ids.has(e.from), `${slug}: edge from ${e.from}`).toBe(true)
        expect(ids.has(e.to), `${slug}: edge to ${e.to}`).toBe(true)
      }
    }
  })
})

describe('anatomy · provenance', () => {
  it('the engine stamp matches the vendored catalogs (three surfaces, one release)', () => {
    const tools = JSON.parse(readFileSync(join(ROOT, 'public/tools/catalog.json'), 'utf8')) as {
      version: string
    }
    const providers = JSON.parse(
      readFileSync(join(ROOT, 'public/providers/catalog.json'), 'utf8'),
    ) as { version: string }
    expect(ANATOMY_ENGINE).toBe(tools.version)
    expect(ANATOMY_ENGINE).toBe(providers.version)
  })

  it('graphs are format-stamped (the WO-14 oracle gate reads this)', () => {
    for (const [slug, a] of Object.entries(ANATOMY)) {
      expect(a.graph_format, slug).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('anatomy · the register diet holds', () => {
  it('no static import of anatomy.generated outside the access door', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`
        if (e.isDirectory()) {
          walk(rel)
          continue
        }
        if (!/\.(ts|tsx)$/.test(e.name) || /\.test\./.test(e.name)) continue
        if (rel.endsWith('src/lib/anatomy-access.ts')) continue
        const src = readFileSync(join(ROOT, rel), 'utf8')
        // type-only imports erase at compile time — allowed (the atlas.test law)
        const staticImport = /^import (?!type\b).*from '[^']*anatomy\.generated'$/m
        if (staticImport.test(src)) offenders.push(rel)
      }
    }
    walk('src')
    expect(offenders).toEqual([])
  })
})
