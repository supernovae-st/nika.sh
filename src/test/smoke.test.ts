import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { CANON } from '../canon.generated'
import { SHOWCASE_DAG } from '../sections/usecases-yaml.generated'
import { UC_TABS } from '../sections/usecases-data'

/* ── smoke · the cheapest possible "does the wiring import + hold shape" gate ──
   Importing the route table + the generated constants exercises their whole
   import graph (pages, sections, the spec-derived constants). If any of those
   modules crashes at import time — a malformed generated file, a circular
   import, a top-level throw — this test fails LOUD before the slower suites and
   the build do. It also pins a couple of load-bearing shapes the site depends
   on (the 4 canonical verbs · the fil-rouge DAG) so a silent regeneration that
   drops them is caught here. */

describe('smoke · module graph imports without throwing', () => {
  it('the route table imports and exposes the root route with children', () => {
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
    const root = routes[0]
    expect(root.path).toBe('/')
    expect(Array.isArray(root.children)).toBe(true)
    expect(root.children!.length).toBeGreaterThan(0)
    // the index (Home) route exists
    expect(root.children!.some((c) => 'index' in c && c.index === true)).toBe(true)
    // the SPA catch-all exists — a client-side navigation to a bad path must
    // render the crafted 404, never React Router's default error boundary
    expect(root.children!.some((c) => c.path === '*')).toBe(true)
  })

  it('CANON (spec-derived) imports with the 4 canonical verbs', () => {
    expect(CANON.verbs).toBe(4)
    expect(CANON.verbNames).toEqual(['infer', 'exec', 'invoke', 'agent'])
    expect(CANON.builtins).toBeGreaterThan(0)
    expect(CANON.builtinNames.length).toBe(CANON.builtins)
  })

  it('the fil-rouge showcase DAG (t3-resume-screener) imports with a non-empty, well-formed shape', () => {
    const dag = SHOWCASE_DAG['t3-resume-screener']
    expect(dag).toBeTruthy()
    expect(dag.tasks.length).toBeGreaterThan(0)
    expect(dag.waves).toBeGreaterThan(0)
    expect(dag.outputs).toContain('shortlist')
    // every task references a valid wave + its declared verb
    for (const task of dag.tasks) {
      expect(typeof task.id).toBe('string')
      expect(task.id.length).toBeGreaterThan(0)
      expect(task.wave).toBeGreaterThanOrEqual(0)
      expect(task.wave).toBeLessThan(dag.waves)
      expect(CANON.verbNames as readonly string[]).toContain(task.verb)
    }
  })

  it('every gallery showcase carries its projected DAG (the room renders whole, never half-true)', () => {
    for (const t of UC_TABS) {
      for (const uc of t.cases) {
        expect(SHOWCASE_DAG[uc.slug], `${uc.slug} has no DAG projection`).toBeTruthy()
      }
    }
  })
})
