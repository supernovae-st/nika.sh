import { describe, expect, it } from 'vitest'
import { CANON } from '../canon.generated'
import { SHOWCASE_DAG } from '../sections/usecases-yaml.generated'
import {
  BUILTIN_GROUPS,
  BUILTINS_PER_FAMILY,
  ENVELOPE_KEYS,
  MACHINE_NODES,
  PERMIT_CATS,
  PLAN_TASKS,
  SPEC_SECTIONS,
  TASK_FIELDS,
  nodesFor,
} from './spec-machine-data'

/* ─── spec-machine-data · the strata graph derives, never hand-typed ──────────
   The whole machine (2D schematic + 3D strata + HUD counts) renders from this
   one module. These tests pin the derivation contract: counts ≡ CANON, every
   node anchored to a real /spec section, the family craft map total and never
   dropping a canon entry, the worked DAG mirroring the showcase projection. */

describe('SPEC_SECTIONS · the nine-section spine', () => {
  it('S.0 → S.8 in order · the inbound anchor contract is exact', () => {
    expect(SPEC_SECTIONS.map((s) => s.fig)).toEqual([
      'S.0', 'S.1', 'S.2', 'S.3', 'S.4', 'S.5', 'S.6', 'S.7', 'S.8',
    ])
    /* the anchor ids are a published contract (deep links + TOC) — exact */
    expect(SPEC_SECTIONS.map((s) => s.anchor)).toEqual([
      '#s0', '#s1', '#s2', '#permits', '#s3', '#s4', '#s5', '#s6', '#s7',
    ])
    expect(new Set(SPEC_SECTIONS.map((s) => s.key)).size).toBe(SPEC_SECTIONS.length)
  })

  it('every HUD count derives from the live data, never a literal drift', () => {
    const byKey = Object.fromEntries(SPEC_SECTIONS.map((s) => [s.key, s]))
    expect(byKey.frame.count).toBe(ENVELOPE_KEYS.length)
    expect(byKey.verbs.count).toBe(CANON.verbs)
    expect(byKey.plan.count).toBe(TASK_FIELDS.length)
    expect(byKey.permits.count).toBe(PERMIT_CATS.length)
    expect(byKey.stdlib.count).toBe(CANON.builtins)
    expect(byKey.providers.count).toBe(CANON.providers)
    expect(byKey.extract.count).toBe(CANON.extractModes)
    expect(byKey.errors.count).toBe(CANON.errorNamespaces)
  })
})

describe('BUILTIN_GROUPS · the family craft map', () => {
  it('5 families · the union is EXACTLY the canon set · zero dupes', () => {
    expect(BUILTIN_GROUPS.length).toBe(5)
    const all = BUILTIN_GROUPS.flatMap((f) => f.names)
    expect(all.length).toBe(CANON.builtins)
    expect(new Set(all).size).toBe(CANON.builtins)
    expect(new Set(all)).toEqual(new Set(CANON.builtinNames))
    for (const f of BUILTIN_GROUPS) expect(f.names.length).toBeGreaterThan(0)
  })

  it('chart is Data · image_fx is Media (canon-27 landed after the map)', () => {
    const fam = (n: string) => BUILTIN_GROUPS.find((f) => f.names.includes(n))?.label
    expect(fam('chart')).toBe('Data')
    expect(fam('image_fx')).toBe('Media')
    /* the structural guard still catches a FUTURE canon entry: nothing may
       silently vanish from the rendered chips */
    expect(fam('fetch')).toBe('Web')
  })

  it('the per-family bars sum to the canon count (the honest microchart)', () => {
    expect(BUILTINS_PER_FAMILY.reduce((a, b) => a + b, 0)).toBe(CANON.builtins)
    expect(BUILTINS_PER_FAMILY).toEqual(BUILTIN_GROUPS.map((f) => f.names.length))
  })
})

describe('the fold contract · required rows first, then the optional fold', () => {
  it('envelope · 3 required keys lead, 7 optional follow', () => {
    const req = ENVELOPE_KEYS.filter((k) => k.req)
    expect(req.length).toBe(3)
    expect(ENVELOPE_KEYS.slice(0, req.length).every((k) => k.req)).toBe(true)
    expect(ENVELOPE_KEYS.slice(req.length).every((k) => !k.req)).toBe(true)
  })

  it('task fields · id + the verb lead, the optional controls follow', () => {
    const req = TASK_FIELDS.filter((f) => f.req)
    expect(req.length).toBe(2)
    expect(TASK_FIELDS.slice(0, req.length).every((f) => f.req)).toBe(true)
    expect(TASK_FIELDS.slice(req.length).every((f) => !f.req)).toBe(true)
  })
})

describe('MACHINE_NODES · every stratum node is real and anchored', () => {
  const anchors = new Set(SPEC_SECTIONS.map((s) => s.anchor))
  const keys = new Set(SPEC_SECTIONS.map((s) => s.key))

  it('node counts per kind ≡ the canon projections', () => {
    const by = (k: string) => MACHINE_NODES.filter((n) => n.kind === k)
    expect(by('verb').length).toBe(CANON.verbs)
    expect(by('builtin').length).toBe(CANON.builtins)
    expect(by('provider').length).toBe(CANON.providers)
    expect(by('extract').length).toBe(CANON.extractModes)
    expect(by('errns').length).toBe(CANON.errorNamespaces)
    expect(by('gate').length).toBe(PERMIT_CATS.length)
    expect(by('task').length).toBe(PLAN_TASKS.length)
  })

  it('every node carries a DOM twin anchor + a real stratum · ids unique', () => {
    for (const n of MACHINE_NODES) {
      expect(anchors.has(n.anchor)).toBe(true)
      expect(keys.has(n.stratum)).toBe(true)
    }
    expect(new Set(MACHINE_NODES.map((n) => n.id)).size).toBe(MACHINE_NODES.length)
  })

  it('provider tiers mirror CANON local/cloud/test', () => {
    const p = MACHINE_NODES.filter((n) => n.kind === 'provider')
    expect(p.filter((n) => n.family === 'local').length).toBe(CANON.providersLocal)
    expect(p.filter((n) => n.family === 'cloud').length).toBe(CANON.providersCloud)
    expect(p.filter((n) => n.family === 'test').length).toBe(CANON.providersTest)
  })

  it('the plan ring mirrors the standup-digest showcase DAG', () => {
    const dag = SHOWCASE_DAG['t1-standup-digest']
    expect(dag).toBeDefined()
    expect(PLAN_TASKS.map((t) => t.id)).toEqual(dag.tasks.map((t) => t.id))
    const ids = new Set(PLAN_TASKS.map((t) => t.id))
    for (const t of PLAN_TASKS) {
      expect(CANON.verbNames).toContain(t.verb)
      for (const d of t.deps) expect(ids.has(d)).toBe(true)
    }
    /* the task nodes project 1:1 into the machine's plan stratum */
    const taskNodes = nodesFor('plan')
    expect(taskNodes.map((n) => n.label)).toEqual(dag.tasks.map((t) => t.id))
    for (const n of taskNodes) expect(n.verb).toBeDefined()
  })

  it('builtin nodes carry their family · extract ports hang off fetch', () => {
    for (const n of MACHINE_NODES.filter((x) => x.kind === 'builtin')) {
      expect(BUILTIN_GROUPS.some((f) => f.label === n.family)).toBe(true)
    }
    /* the fetch manifold: every extract node is a port on the fetch builtin */
    expect(MACHINE_NODES.some((n) => n.id === 'builtin:fetch')).toBe(true)
  })
})
