import { describe, expect, it } from 'vitest'
import { lintNika, NAMESPACES } from './nika-lint'
import { CANON } from '../canon.generated'

/* ── the browser lint · the SHIPPED grammar (0.109 · the nine keys), pinned ─
   The playground teaches with the engine's own vocabulary; this suite pins
   the classes the linter must speak in the shipped world: the nine-key
   envelope (`nika:` carries the NAME · the dead keys refuse PARSE-005 with
   the engine's own teaching), the tasks map, the binding IS the edge (a
   ghost target is DAG-002), depends_on is dead (PARSE-024), after: carries
   control edges with a CLOSED predicate set (DAG-005 · unwind is IN it),
   tasks.* is boundary-only (VAR-021 · an unwind task reads its producer
   only), the group fold (DAG-008 · DAG-009 · a self-fold is DAG-001) and
   cycles judged over the after:+binding graph (DAG-001 · unwind edges never
   enter it). */

const codes = (src: string) => lintNika(src).map((d) => d.code)
const find = (src: string, code: string) => lintNika(src).find((d) => d.code === code)

const NINE_KEY_CLEAN = `# a clean nine-key file · the bindings are the edges
nika: flow-clean
tasks:
  fetch:
    invoke: { tool: "nika:read", args: { path: ./in.md } }
  digest:
    with:
      notes: \${{ tasks.fetch.output }}
    when: \${{ with.notes != "" }}
    infer: { prompt: "Summarize \${{ with.notes }}" }
  report:
    after:
      digest: terminal
    with:
      outcome: \${{ tasks.digest.status }}
    exec: { command: ["echo", "\${{ with.outcome }}"] }
  cleanup:
    after: { report: unwind }
    exec: { command: ["echo", "done \${{ tasks.report.status }}"] }
`

describe('nika-lint · the nine-key envelope', () => {
  it('passes a clean workflow (bindings are the edges · unwind is a predicate)', () => {
    expect(lintNika(NINE_KEY_CLEAN)).toEqual([])
  })

  it('the value namespaces are the canon set (inputs · const · secrets · with · tasks) · config is gone', () => {
    expect([...NAMESPACES].sort()).toEqual([...CANON.namespaceNames].sort())
    expect(NAMESPACES.has('config')).toBe(false)
  })

  it('refuses `nika: v1` · the mark carries the file NAME now (PARSE-005)', () => {
    const out = lintNika(`nika: v1
tasks:
  a:
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-PARSE-005')
    expect(find(`nika: v1
tasks:
  a:
    exec: { command: ["ls"] }
`, 'NIKA-PARSE-005')?.fix).toMatch(/kebab-case/)
  })

  it('refuses the dead workflow: block, whatever its shape (PARSE-005 · the identity moved onto nika:)', () => {
    for (const block of ['workflow: old-form', 'workflow:\n  id: old-map\n  description: "prose"']) {
      const out = lintNika(`nika: v1
${block}
tasks:
  a:
    exec: { command: ["ls"] }
`)
      const hit = out.find((d) => d.code === 'NIKA-PARSE-005' && /workflow/.test(d.message))
      expect(hit, block).toBeDefined()
      expect(hit?.fix).toMatch(/nika:/)
    }
  })

  it('refuses every dead envelope key with the engine\'s teaching (PARSE-005)', () => {
    const dead: Array<[string, RegExp]> = [
      ['config:\n  x: { type: string, default: a }', /inputs:/],
      ['policy:\n  require: { human_gate_before: [exec] }', /permits:/],
      ['types:\n  Summary: { object: { title: string } }', /returns:|inline/],
      ['vars:\n  x: 1', /inputs:|const:/],
      ['description: "prose at the top"', /#/],
      ['assert:\n  - true', /trace verify/],
    ]
    for (const [block, fix] of dead) {
      const out = lintNika(`nika: dead-key
${block}
tasks:
  a:
    exec: { command: ["ls"] }
`)
      const hit = out.find((d) => d.code === 'NIKA-PARSE-005')
      expect(hit, block).toBeDefined()
      expect(hit?.fix, block).toMatch(fix)
    }
  })

  it('refuses an unknown top-level key too (strict envelope · the nine keys)', () => {
    const hit = find(`nika: strict
foo: bar
tasks:
  a:
    exec: { command: ["ls"] }
`, 'NIKA-PARSE-005')
    expect(hit).toBeDefined()
    expect(hit?.message).toMatch(/foo/)
    expect(hit?.fix).toMatch(/nika · model · inputs · const · secrets · permits · run · tasks · outputs/)
  })

  it('refuses a name that is not kebab-case (the envelope catch-all)', () => {
    expect(codes(`nika: Bad_Id
tasks:
  a:
    exec: { command: ["ls"] }
`)).toContain('NIKA-PARSE')
  })

  it('refuses the dead tasks sequence (tasks must be a map)', () => {
    expect(
      codes(`nika: old-list
tasks:
  - id: a
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-PARSE')
  })
})

describe('nika-lint · the dead task-level forms', () => {
  it('refuses depends_on (PARSE-024 · dead since 0.105)', () => {
    const out = lintNika(`nika: dead-form
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    depends_on: [a]
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-PARSE-024')
    expect(out.find((d) => d.code === 'NIKA-PARSE-024')?.fix).toMatch(/after:/)
  })

  it('refuses output: (PARSE-005 · renamed extract:)', () => {
    const hit = find(`nika: old-output
tasks:
  a:
    exec: { command: ["ls"] }
    output:
      first: .[0]
`, 'NIKA-PARSE-005')
    expect(hit).toBeDefined()
    expect(hit?.fix).toMatch(/extract:/)
  })

  it('refuses task-level max_parallel / fail_fast (PARSE-005 · they live inside for_each: now)', () => {
    for (const knob of ['max_parallel: 2', 'fail_fast: false']) {
      const hit = find(`nika: old-knobs
tasks:
  a:
    for_each: { items: ["x", "y"] }
    ${knob}
    exec: { command: ["echo", "\${{ item }}"] }
`, 'NIKA-PARSE-005')
      expect(hit, knob).toBeDefined()
      expect(hit?.fix, knob).toMatch(/for_each: \{/)
    }
  })

  it('accepts the for_each block with its knobs inside', () => {
    expect(lintNika(`nika: fan-out
tasks:
  a:
    for_each: { items: ["x", "y"], max_parallel: 2, fail_fast: false }
    exec: { command: ["echo", "\${{ item }}"] }
`)).toEqual([])
  })

  it('refuses on_error.fail_workflow (PARSE-005 · failing loudly is the default)', () => {
    const hit = find(`nika: old-fail
tasks:
  a:
    exec: { command: ["ls"] }
    on_error: { fail_workflow: true }
`, 'NIKA-PARSE-005')
    expect(hit).toBeDefined()
    expect(hit?.fix).toMatch(/recover|skip/)
  })

  it('refuses on_finally (PARSE-005 · cleanup is a task on an unwind edge)', () => {
    const hit = find(`nika: old-finally
tasks:
  a:
    exec: { command: ["ls"] }
    on_finally:
      - invoke: { tool: "nika:emit", args: { event: done } }
`, 'NIKA-PARSE-005')
    expect(hit).toBeDefined()
    expect(hit?.fix).toMatch(/unwind/)
  })

  it('refuses declassify: / inert: (PARSE-005 · merged into lift:)', () => {
    for (const door of ['declassify: [x]', 'inert: true']) {
      const hit = find(`nika: old-doors
tasks:
  a:
    exec: { command: ["ls"] }
    ${door}
`, 'NIKA-PARSE-005')
      expect(hit, door).toBeDefined()
      expect(hit?.fix, door).toMatch(/lift:/)
    }
  })

  it('extract: bindings are pure jq · no ${{ }} inside (VAR-005)', () => {
    expect(codes(`nika: jq-only
tasks:
  a:
    exec: { command: ["ls"] }
    extract:
      first: "\${{ with.x }}"
`)).toContain('NIKA-VAR-005')
  })
})

describe('nika-lint · edges, predicates and reads', () => {
  it('refuses a predicate outside the closed set (DAG-005) and accepts unwind', () => {
    const out = lintNika(`nika: bad-predicate
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    after: { a: succeeded }
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-DAG-005')
    expect(out.find((d) => d.code === 'NIKA-DAG-005')?.fix).toMatch(/success/)
    expect(codes(`nika: unwind-ok
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    after: { a: unwind }
    exec: { command: ["ls"] }
`)).not.toContain('NIKA-DAG-005')
  })

  it('refuses a tasks.* read in a verb body or when: (VAR-021 · hoist into with:)', () => {
    expect(
      codes(`nika: body-read
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    infer: { prompt: "x \${{ tasks.a.output }}" }
`),
    ).toContain('NIKA-VAR-021')
    expect(
      codes(`nika: when-read
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    when: \${{ tasks.a.output != "" }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-VAR-021')
  })

  it('an unwind task may read its PRODUCER only (VAR-021 on a sibling read)', () => {
    const src = (target: string) => `nika: unwind-read
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    exec: { command: ["ls"] }
  cleanup:
    after: { b: unwind }
    exec: { command: ["echo", "\${{ tasks.${target}.status }}"] }
`
    expect(codes(src('a'))).toContain('NIKA-VAR-021')
    expect(codes(src('b'))).not.toContain('NIKA-VAR-021')
  })

  it('checks edge targets (DAG-002 on after: and with: ghosts)', () => {
    expect(
      codes(`nika: bad-after
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    after: { ghost: success }
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-002')
    expect(
      codes(`nika: bad-with
tasks:
  b:
    with:
      x: \${{ tasks.ghost.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-002')
  })

  it('finds a cycle over the binding graph (DAG-001) · unwind edges never enter it', () => {
    expect(
      codes(`nika: cross-cycle
tasks:
  a:
    with:
      x: \${{ tasks.b.output }}
    exec: { command: ["ls"] }
  b:
    with:
      x: \${{ tasks.a.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-001')
    expect(
      codes(`nika: unwind-chain
tasks:
  a:
    with:
      x: \${{ tasks.b.status }}
    exec: { command: ["ls"] }
  b:
    after: { a: unwind }
    exec: { command: ["ls"] }
`),
    ).not.toContain('NIKA-DAG-001')
  })

  it('keeps the recovery-deadlock guard (DAG-004 · recover reads downstream)', () => {
    expect(
      codes(`nika: recover-deadlock
tasks:
  a:
    exec: { command: ["ls"] }
    on_error:
      recover: \${{ tasks.b.output }}
  b:
    with:
      x: \${{ tasks.a.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-004')
  })

  it('a config.* read has no namespace any more (VAR-001 · the three value authorities)', () => {
    const hit = find(`nika: no-config
tasks:
  a:
    exec: { command: ["echo", "\${{ config.level }}"] }
`, 'NIKA-VAR-001')
    expect(hit).toBeDefined()
    expect(hit?.fix).toMatch(/inputs/)
    expect(hit?.fix).not.toMatch(/config/)
  })
})

describe('nika-lint · the group fold', () => {
  const ledger = (reader: string) => `nika: ledger
permits:
  exec: ["./lint.sh", "./audit.sh", "./report.sh"]
tasks:
  leg_lint:
    group: probes
    exec: { command: ["./lint.sh"] }
  leg_audit:
    group: probes
    exec: { command: ["./audit.sh"] }
${reader}`

  it('folds a declared group in with: (clean)', () => {
    expect(lintNika(ledger(`  summary:
    with:
      legs: \${{ group.probes }}
    exec: { command: ["./report.sh"] }
`))).toEqual([])
  })

  it('a group no task declares is a ghost (DAG-008)', () => {
    expect(codes(ledger(`  summary:
    with:
      legs: \${{ group.probe }}
    exec: { command: ["./report.sh"] }
`))).toContain('NIKA-DAG-008')
  })

  it('an unwind task may not join a group (DAG-009)', () => {
    expect(codes(ledger(`  cleanup:
    group: probes
    after: { leg_lint: unwind }
    exec: { command: ["./report.sh"] }
  summary:
    with:
      legs: \${{ group.probes }}
    exec: { command: ["./report.sh"] }
`))).toContain('NIKA-DAG-009')
  })

  it('a member folding its own group is a cycle (DAG-001)', () => {
    expect(codes(ledger(`  summary:
    group: probes
    with:
      legs: \${{ group.probes }}
    exec: { command: ["./report.sh"] }
`))).toContain('NIKA-DAG-001')
  })

  it('a group fold outside with: is a boundary read (VAR-021)', () => {
    expect(codes(ledger(`  summary:
    when: \${{ size(group.probes) > 0 }}
    exec: { command: ["./report.sh"] }
`))).toContain('NIKA-VAR-021')
  })
})
