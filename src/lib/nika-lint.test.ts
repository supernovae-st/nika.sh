import { describe, expect, it } from 'vitest'
import { lintNika } from './nika-lint'

/* ── the browser lint · the SHIPPED grammar (0.104 · W2), pinned ─────────────
   The playground teaches with the engine's own vocabulary; this suite pins
   the classes the linter must speak in the shipped world: the scalar
   envelope + tasks sequence, declarative depends_on (a tasks.X read without
   the declared edge is DAG-003 — the engine refuses it), after: is dead
   (PARSE-024), tasks.* is boundary-only (VAR-021 · on_finally reads its
   parent only), duplicate ids exist now that tasks are a list (DAG-001),
   and cycles are judged over the DECLARED graph (DAG-001). */

const codes = (src: string) => lintNika(src).map((d) => d.code)

const W2_CLEAN = `nika: v1
workflow: flow-clean
tasks:
  - id: fetch
    invoke: { tool: "nika:read", args: { path: ./in.md } }
  - id: digest
    depends_on: [fetch]
    with:
      notes: \${{ tasks.fetch.output }}
    when: \${{ with.notes != "" }}
    infer: { prompt: "Summarize \${{ with.notes }}" }
  - id: report
    depends_on: [digest]
    with:
      outcome: \${{ tasks.digest.status }}
    exec: { command: ["echo", "\${{ with.outcome }}"] }
`

describe('nika-lint · the shipped W2 grammar', () => {
  it('passes a clean declarative workflow', () => {
    expect(lintNika(W2_CLEAN)).toEqual([])
  })

  it('refuses the W1 envelope (workflow must be the scalar id)', () => {
    const out = lintNika(`nika: v1
workflow:
  id: old-form
tasks:
  - id: a
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-PARSE')
    expect(out.find((d) => d.code === 'NIKA-PARSE')?.message).toMatch(/scalar/)
  })

  it('refuses the W1 tasks map (tasks must be a sequence)', () => {
    expect(
      codes(`nika: v1
workflow: old-map
tasks:
  a:
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-PARSE')
  })

  it('refuses after: (PARSE-024 · dead since 0.104)', () => {
    const out = lintNika(`nika: v1
workflow: dead-form
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: b
    after: { a: succeeded }
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-PARSE-024')
    expect(out.find((d) => d.code === 'NIKA-PARSE-024')?.fix).toMatch(/depends_on/)
  })

  it('demands the declared edge for a tasks.* read (DAG-003)', () => {
    const out = lintNika(`nika: v1
workflow: undeclared-read
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: b
    with:
      x: \${{ tasks.a.output }}
    exec: { command: ["echo", "\${{ with.x }}"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-DAG-003')
    expect(out.find((d) => d.code === 'NIKA-DAG-003')?.fix).toMatch(/depends_on: \[a\]/)
  })

  it('refuses a tasks.* read in a verb body or when: (VAR-021 · hoist into with:)', () => {
    expect(
      codes(`nika: v1
workflow: body-read
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: b
    depends_on: [a]
    infer: { prompt: "x \${{ tasks.a.output }}" }
`),
    ).toContain('NIKA-VAR-021')
    expect(
      codes(`nika: v1
workflow: when-read
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: b
    depends_on: [a]
    when: \${{ tasks.a.output != "" }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-VAR-021')
  })

  it('on_finally may read its PARENT only (VAR-021 on a sibling read)', () => {
    const src = (target: string) => `nika: v1
workflow: finally-read
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: b
    exec: { command: ["ls"] }
    on_finally:
      - invoke:
          tool: "nika:emit"
          args: { event: done, status: "\${{ tasks.${target}.status }}" }
`
    expect(codes(src('a'))).toContain('NIKA-VAR-021')
    expect(codes(src('b'))).not.toContain('NIKA-VAR-021')
  })

  it('checks declared targets (DAG-002 on depends_on and with: ghosts)', () => {
    expect(
      codes(`nika: v1
workflow: bad-dep
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: b
    depends_on: [ghost]
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-002')
    expect(
      codes(`nika: v1
workflow: bad-with
tasks:
  - id: b
    with:
      x: \${{ tasks.ghost.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-002')
  })

  it('refuses a duplicate id — a sequence can repeat one (DAG-001)', () => {
    expect(
      codes(`nika: v1
workflow: twin-ids
tasks:
  - id: a
    exec: { command: ["ls"] }
  - id: a
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-001')
  })

  it('finds a cycle over the declared graph (DAG-001)', () => {
    expect(
      codes(`nika: v1
workflow: cross-cycle
tasks:
  - id: a
    depends_on: [b]
    exec: { command: ["ls"] }
  - id: b
    depends_on: [a]
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-001')
  })

  it('keeps the recovery-deadlock guard (DAG-004 · recover reads downstream)', () => {
    expect(
      codes(`nika: v1
workflow: recover-deadlock
tasks:
  - id: a
    exec: { command: ["ls"] }
    on_error:
      recover: \${{ tasks.b.output }}
  - id: b
    depends_on: [a]
    with:
      x: \${{ tasks.a.output }}
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-DAG-004')
  })
})
