import { describe, expect, it } from 'vitest'
import { lintNika } from './nika-lint'

/* ── the browser lint · the SHIPPED grammar (0.105 · the map), pinned ────────
   The playground teaches with the engine's own vocabulary; this suite pins
   the classes the linter must speak in the shipped world: the map envelope
   (workflow: {id} · PARSE-020 on the dead scalar) + tasks map, the binding
   IS the edge (a ghost target is DAG-002), depends_on is dead (PARSE-024),
   after: carries control edges with a CLOSED predicate set (DAG-005),
   tasks.* is boundary-only (VAR-021 · on_finally reads its parent only),
   and cycles are judged over the after:+binding graph (DAG-001). */

const codes = (src: string) => lintNika(src).map((d) => d.code)

const W105_CLEAN = `nika: v1
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
    after:
      digest: terminal
    with:
      outcome: \${{ tasks.digest.status }}
    exec: { command: ["echo", "\${{ with.outcome }}"] }
`

describe('nika-lint · the shipped map grammar', () => {
  it('passes a clean workflow (bindings are the edges)', () => {
    expect(lintNika(W105_CLEAN)).toEqual([])
  })

  it('refuses the dead scalar envelope (PARSE-020 · workflow is a map)', () => {
    const out = lintNika(`nika: v1
workflow: old-form
tasks:
  a:
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-PARSE-020')
    expect(out.find((d) => d.code === 'NIKA-PARSE-020')?.message).toMatch(/map/)
  })

  it('refuses the dead tasks sequence (tasks must be a map)', () => {
    expect(
      codes(`nika: v1
workflow:
  id: old-list
tasks:
  - id: a
    exec: { command: ["ls"] }
`),
    ).toContain('NIKA-PARSE')
  })

  it('refuses depends_on (PARSE-024 · dead since 0.105)', () => {
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
    expect(out.find((d) => d.code === 'NIKA-PARSE-024')?.fix).toMatch(/after:/)
  })

  it('refuses a predicate outside the closed set (DAG-005)', () => {
    const out = lintNika(`nika: v1
workflow:
  id: bad-predicate
tasks:
  a:
    exec: { command: ["ls"] }
  b:
    after: { a: success }
    exec: { command: ["ls"] }
`)
    expect(out.map((d) => d.code)).toContain('NIKA-DAG-005')
    expect(out.find((d) => d.code === 'NIKA-DAG-005')?.fix).toMatch(/succeeded/)
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

  it('checks edge targets (DAG-002 on after: and with: ghosts)', () => {
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
  })

  it('finds a cycle over the binding graph (DAG-001)', () => {
    expect(
      codes(`nika: v1
workflow:
  id: cross-cycle
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
  })

  it('keeps the recovery-deadlock guard (DAG-004 · recover reads downstream)', () => {
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
