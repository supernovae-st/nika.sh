import { describe, expect, it } from 'vitest'
import { parsePlan } from './parse-plan'

const FLAGSHIP_LIKE = `nika: v1
workflow:
  id: daily-brief
tasks:
  notes: { invoke: { tool: "nika:read", args: { path: ./notes/today.md } } }
  inbox: { invoke: { tool: "nika:read", args: { path: ./notes/inbox.md } } }
  triage:
    depends_on: [inbox]
    infer: { prompt: "Flag urgent: \${{ tasks.inbox.output }}" }
  draft:
    depends_on: [notes, triage]
    infer:
      prompt: "Write the brief"
      model: ollama/llama3.2:3b
  save:
    depends_on: [draft]
    when: \${{ tasks.draft.output != "" }}
    invoke: { tool: "nika:write", args: { path: ./brief.md, content: "x" } }
`

describe('parsePlan', () => {
  it('extracts the declared boundary (permits) · null when absent', () => {
    const withP = parsePlan(`permits:
  fs: { read: [ ./notes/* ], write: [ ./brief.md ] }
  tools: [ "nika:read", "nika:write" ]
  exec: [ git ]
  net: { http: [ api.github.com ] }
tasks:
  a:
    exec: { command: ["git", "log"] }
`)
    expect(withP!.permits).toEqual({
      fsRead: ['./notes/*'],
      fsWrite: ['./brief.md'],
      tools: ['nika:read', 'nika:write'],
      exec: ['git'],
      hosts: ['api.github.com'],
    })
    const noP = parsePlan('tasks:\n  a:\n    infer: { prompt: "x" }')
    expect(noP!.permits).toBeNull()
  })

  it('layers a real flagship-shaped file into waves', () => {
    const plan = parsePlan(FLAGSHIP_LIKE)
    expect(plan).not.toBeNull()
    expect(plan!.cyclic).toBe(false)
    expect(plan!.tasks.map((t) => t.id)).toEqual(['notes', 'inbox', 'triage', 'draft', 'save'])
    /* waves · [notes+inbox] → [triage] → [draft] → [save] */
    expect(plan!.waves.map((w) => w.map((t) => t.id).sort())).toEqual([
      ['inbox', 'notes'],
      ['triage'],
      ['draft'],
      ['save'],
    ])
    expect(plan!.edges).toContainEqual({ from: 'draft', to: 'save' })
    const save = plan!.tasks.find((t) => t.id === 'save')!
    expect(save.verb).toBe('invoke')
    expect(save.target).toBe('nika:write')
    expect(save.gated).toBe(true)
    const draft = plan!.tasks.find((t) => t.id === 'draft')!
    expect(draft.target).toBe('ollama/llama3.2:3b')
  })

  it('returns null on mid-edit broken yaml (caller keeps the last plan)', () => {
    expect(parsePlan('tasks:\n  a:\n    invoke: {')).toBeNull()
    expect(parsePlan('')).toBeNull()
    expect(parsePlan('just a string')).toBeNull()
    expect(parsePlan('nika: v1\nworkflow: x')).toBeNull() /* no tasks yet */
  })

  it('survives a cycle · cyclic flag + file-order fallback keeps every task visible', () => {
    const plan = parsePlan(`tasks:
  a:
    depends_on: [b]
    exec: { command: ["ls"] }
  b:
    depends_on: [a]
    exec: { command: ["git", "log"] }
`)
    expect(plan).not.toBeNull()
    expect(plan!.cyclic).toBe(true)
    expect(plan!.waves.flat().map((t) => t.id)).toEqual(['a', 'b'])
    expect(plan!.tasks.find((t) => t.id === 'b')!.target).toBe('git')
  })

  it('drops unknown/self deps from edges (the linter speaks, the map stays sane)', () => {
    const plan = parsePlan(`tasks:
  a:
    depends_on: [ghost, a]
    infer: { prompt: "x" }
  b:
    depends_on: [a]
`)
    expect(plan).not.toBeNull()
    expect(plan!.edges).toEqual([{ from: 'a', to: 'b' }])
    /* b has no verb yet (mid-authoring) · verb null renders as a shell card */
    expect(plan!.tasks.find((t) => t.id === 'b')!.verb).toBeNull()
    expect(plan!.waves.length).toBe(2)
  })

  it('skips duplicate ids and non-mapping tasks without dying', () => {
    // W1: duplicate keys cannot coexist in a MAP (the loader keeps the
    // last — the engine refuses them); a non-mapping BODY is the robust
    // case the client must skip without dying.
    const plan = parsePlan(`tasks:
  a:
    exec: { command: ["ls"] }
  b: 42
  c:
    depends_on: [a]
    agent: { model: mistral/mistral-small }
`)
    expect(plan).not.toBeNull()
    expect(plan!.tasks.map((t) => t.id)).toEqual(['a', 'c'])
    expect(plan!.tasks[1].target).toBe('mistral/mistral-small')
  })
})
