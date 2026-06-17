import { describe, it, expect } from 'vitest'
import {
  resolveOutcome,
  deniedCliRow,
  DEFAULT_PERMITS,
  PERMITS,
  PLAN,
  WRITE_NODE,
  SEC_004,
  HITL_DAG,
  type PermitState,
} from './hitl-model'

/* the pure heart of FIG 4.0 · the toggles → outcome mapping is wired to the REAL
   run-model, so these assertions also pin the engine semantics (NIKA-SEC-004
   denial path) the section depends on. */

describe('hitl-model · plan + permits shape', () => {
  it('the plan maps every step to a real DAG node', () => {
    const ids = new Set(HITL_DAG.tasks.map((t) => t.id))
    for (const step of PLAN) expect(ids.has(step.node)).toBe(true)
  })

  it('the write node exists in the DAG and is the terminal write', () => {
    const node = HITL_DAG.tasks.find((t) => t.id === WRITE_NODE)
    expect(node).toBeDefined()
    expect(node?.verb).toBe('invoke')
  })

  it('exposes exactly the four reviewer-controlled permits', () => {
    expect(PERMITS.map((p) => p.key)).toEqual(['read', 'write', 'net', 'exec'])
  })

  it('the declared defaults match the file (read+write on, net+exec off)', () => {
    expect(DEFAULT_PERMITS).toEqual({ read: true, write: true, net: false, exec: false })
    // and the PermitDef.declared agrees with DEFAULT_PERMITS
    for (const p of PERMITS) expect(p.declared).toBe(DEFAULT_PERMITS[p.key])
  })
})

describe('hitl-model · resolveOutcome (the aha)', () => {
  it('default permits → a within-bounds success run', () => {
    const o = resolveOutcome(DEFAULT_PERMITS)
    expect(o.kind).toBe('within')
    expect(o.run.exitCode).toBe(0)
    // the shortlist write actually succeeded (the save node is a success)
    expect(o.run.nodes[WRITE_NODE].status).toBe('success')
  })

  it('write OFF → the write is DENIED with a real NIKA-SEC-004 (before it ran)', () => {
    const permits: PermitState = { ...DEFAULT_PERMITS, write: false }
    const o = resolveOutcome(permits)
    expect(o.kind).toBe('denied')
    expect(o.deniedCode).toBe('NIKA-SEC-004')
    expect(o.deniedNode).toBe(WRITE_NODE)
    // the run-model surfaces the real typed error on the save node
    expect(o.run.nodes[WRITE_NODE].status).toBe('failure')
    expect(o.run.nodes[WRITE_NODE].error?.code).toBe('NIKA-SEC-004')
    expect(o.run.nodes[WRITE_NODE].error?.category).toBe('security_error')
    expect(o.run.exitCode).toBe(1)
  })

  it('the denied CLI row is engine-true (pulled from the real run, not faked)', () => {
    const permits: PermitState = { ...DEFAULT_PERMITS, write: false }
    const o = resolveOutcome(permits)
    const row = deniedCliRow(o.run, o.deniedCode!, o.deniedNode!)
    expect(row).toContain('NIKA-SEC-004')
    expect(row).toContain(WRITE_NODE)
    expect(row.startsWith('✗')).toBe(true)
  })

  it('read OFF → the read step is denied (also NIKA-SEC-004, on its own node)', () => {
    const permits: PermitState = { ...DEFAULT_PERMITS, read: false }
    const o = resolveOutcome(permits)
    expect(o.kind).toBe('denied')
    expect(o.deniedNode).toBe('cvs')
    expect(o.run.nodes['cvs'].status).toBe('failure')
    expect(o.run.nodes['cvs'].error?.code).toBe('NIKA-SEC-004')
  })

  it('net ON → exposed (a legible consequence, NOT a fabricated exfil run)', () => {
    const permits: PermitState = { ...DEFAULT_PERMITS, net: true }
    const o = resolveOutcome(permits)
    expect(o.kind).toBe('exposed')
    // the underlying run is still the happy within-bounds run (no fake failure)
    expect(o.run.exitCode).toBe(0)
    expect(o.run.nodes[WRITE_NODE].status).toBe('success')
  })

  it('write OFF wins over net ON (denial is the higher-priority verdict)', () => {
    const permits: PermitState = { ...DEFAULT_PERMITS, write: false, net: true }
    const o = resolveOutcome(permits)
    expect(o.kind).toBe('denied')
  })

  it('is deterministic · same permits → deep-equal outcome', () => {
    const a = resolveOutcome({ ...DEFAULT_PERMITS, write: false })
    const b = resolveOutcome({ ...DEFAULT_PERMITS, write: false })
    expect(a).toEqual(b)
  })

  it('SEC_004 is the real catalog row (security_error · non-transient)', () => {
    expect(SEC_004.code).toBe('NIKA-SEC-004')
    expect(SEC_004.category).toBe('security_error')
    expect(SEC_004.transient).toBe(false)
  })
})
