import { describe, expect, it } from 'vitest'
import { lintNika } from './nika-lint'

/* ── the browser lint · the W2 flow rules, pinned ─────────────────────────────
   The playground teaches with the engine's own vocabulary; this suite pins
   the W2 « the flow » classes the linter must speak: depends_on is dead
   (PARSE-024), the two doors derive the edges (DAG-002/DAG-005 on their
   targets/predicates), tasks.* is boundary-only (VAR-021 · on_finally reads
   its parent only), and cycles are judged over G_p = E_d ∪ E_c (DAG-001). */

const codes = (src: string) => lintNika(src).map((d) => d.code)

const W2_CLEAN = `nika: v1
workflow:
  id: flow-clean
tasks:
  fetch:
    invoke: { tool: "nika:read", args: { path: ./in.md } }
  digest:
    with:
      notes: \${{ tasks.fetch.output }}
    when: \${{ with.notes != "" }}
    infer: { prompt: "Summarize \${{ with.notes }}" }
  report:
    after: { digest: terminal }
    with:
      outcome: \${{ tasks.digest.status }}
    exec: { command: ["echo", "\${{ with.outcome }}"] }
`

describe('nika-lint · W2 the flow', () => {
  it('passes a clean two-door workflow', () => {
    expect(lintNika(W2_CLEAN)).toEqual([])
  })

  it('refuses depends_on (PARSE-024 · dead since W2)', () => {
    const out = lintNika(`nika: v1
workflow:
  id: dead-form
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    depends_on: [a]
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-PARSE-024')
    expect(out.find((d) => d.code === 'NIKA-PARSE-024')?.fix).toMatch(/with: bindings/)
  })

  it('refuses a tasks.* read in a verb body or when: (VAR-021 · hoist into with:)', () => {
    expect(
      codes(`nika: v1
workflow:
  id: body-read
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    infer: { prompt: "x \${{ tasks.a.output }}" }
`),
    ).toContain('NIKA-VAR-021')
    expect(
      codes(`nika: v1
workflow:
  id: when-read
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    when: \${{ tasks.a.output != "" }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-VAR-021')
  })

  it('on_finally may read its PARENT only (VAR-021 on a sibling read)', () => {
    const src = (target: string) => `nika: v1
workflow:
  id: finally-read
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    exec: { command: ["ls"] }
    on_finally:
      - invoke:
          tool: "nika:emit"
          args: { event: done, status: "\${{ tasks.${target}.status }}" }
`
    expect(codes(src('a'))).toContain('NIKA-VAR-021')
    expect(codes(src('b'))).not.toContain('NIKA-VAR-021')
  })

  it('checks the two doors (DAG-002 unknown target · DAG-005 unknown predicate)', () => {
    expect(
      codes(`nika: v1
workflow:
  id: bad-after
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    after: { ghost: succeeded }
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-002')
    expect(
      codes(`nika: v1
workflow:
  id: bad-with
tasks:
  b:
    with:
      x: \${{ tasks.ghost.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-002')
    expect(
      codes(`nika: v1
workflow:
  id: bad-pred
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    after: { a: whenever }
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-005')
  })

  it('finds a cycle across BOTH doors (DAG-001 over G_p = data ∪ control)', () => {
    expect(
      codes(`nika: v1
workflow:
  id: cross-cycle
tasks:
  a:
    after: { b: succeeded }
    exec: { command: ["ls"] }
  b:
    with:
      prev: \${{ tasks.a.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-001')
  })

  it('keeps the recovery-deadlock guard on G_p (DAG-004 · recover reads downstream)', () => {
    expect(
      codes(`nika: v1
workflow:
  id: recover-deadlock
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
})
