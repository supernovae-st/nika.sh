import { describe, expect, it } from 'vitest'
import { parsePlan } from './parse-plan'

const FLAGSHIP_LIKE = `nika: v1
workflow: daily-brief
tasks:
  notes: { invoke: { tool: "nika:read", args: { path: ./notes/today.md } } }
  inbox: { invoke: { tool: "nika:read", args: { path: ./notes/inbox.md } } }
  triage:
    after:
      inbox: succeeded
    with:
      inbox: \${{ tasks.inbox.output }}
    infer: { prompt: "Flag urgent: \${{ with.inbox }}" }
  draft:
    after:
      notes: succeeded
      triage: succeeded
    with:
      notes: \${{ tasks.notes.output }}
      triage: \${{ tasks.triage.output }}
    infer:
      prompt: "Write the brief"
      model: ollama/llama3.2:3b
  save:
    after:
      draft: succeeded
    with:
      draft: \${{ tasks.draft.output }}
    when: \${{ with.draft != "" }}
    invoke: { tool: "nika:write", args: { path: ./brief.md, content: "x" } }`

describe('parsePlan', () => {
  it('extracts the declared boundary (permits) · null when absent', () => {
    const withP = parsePlan(`permits:
  fs: { read: [ ./notes/* ], write: [ ./brief.md ] }
  tools: [ "nika:read", "nika:write" ]
  exec: [ git ]
  net: { http: [ api.github.com ] }
tasks:
  a:
    exec: { command: ["git", "log"] }`)
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

  it('survives a cycle across BOTH doors · cyclic flag + file-order fallback', () => {
    /* a waits on b through after: (control) · b binds a through with: (data)
       — the precedence graph is E_d ∪ E_c, so this IS a cycle */
    const plan = parsePlan(`tasks:
  a:
    after:
      b: succeeded
    exec: { command: ["ls"] }
  b:
    after:
      a: succeeded
    with:
      prev: \${{ tasks.a.output }}
    exec: { command: ["git", "log"] }`)
    expect(plan).not.toBeNull()
    expect(plan!.cyclic).toBe(true)
    expect(plan!.waves.flat().map((t) => t.id)).toEqual(['a', 'b'])
    expect(plan!.tasks.find((t) => t.id === 'b')!.target).toBe('git')
  })

  it('drops unknown/self targets from edges (the linter speaks, the map stays sane)', () => {
    const plan = parsePlan(`tasks:
  a:
    after:
      ghost: succeeded
    with:
      g: \${{ tasks.ghost.output }}
      me: \${{ tasks.a.output }}
    infer: { prompt: "x" }
  b:
    after:
      a: succeeded`)
    expect(plan).not.toBeNull()
    expect(plan!.edges).toEqual([{ from: 'a', to: 'b' }])
    /* b has no verb yet (mid-authoring) · verb null renders as a shell card */
    expect(plan!.tasks.find((t) => t.id === 'b')!.verb).toBeNull()
    expect(plan!.waves.length).toBe(2)
  })

  it('skips non-mapping task values without dying', () => {
    // 0.105: tasks are a MAP — duplicate ids died with the list (map keys
    // are unique by construction); a non-mapping VALUE is the robust case
    // the client must skip without dying (the engine refuses it upstream).
    const plan = parsePlan(`tasks:
  a:
    exec: { command: ["ls"] }
  b: 42
  c:
    after:
      a: succeeded
    agent: { model: mistral/mistral-small }`)
    expect(plan).not.toBeNull()
    expect(plan!.tasks.map((t) => t.id)).toEqual(['a', 'c'])
    expect(plan!.tasks[1].target).toBe('mistral/mistral-small')
  })
})
