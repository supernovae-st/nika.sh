import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { STEPS, ERROR_JSON, FULL_FILE } from '../content/learn'

/* W2 · a task's producers are its two doors: tasks.X refs in with: values
   (data edges) + after: keys (control edges) — the same rule the engine,
   the browser lint and the flagship derivation apply. */
const TASK_REF = /\btasks\.([a-z][a-z0-9_]*)\b/g
function producersOf(t: { with?: Record<string, unknown>; after?: Record<string, string> }): string[] {
  const out: string[] = []
  const push = (id: string) => {
    if (!out.includes(id)) out.push(id)
  }
  for (const v of Object.values(t.with ?? {}))
    if (typeof v === 'string') for (const m of v.matchAll(TASK_REF)) push(m[1])
  for (const k of Object.keys(t.after ?? {})) push(k)
  return out
}

/* ── /learn fragment validity · every code block on the page parses ──────────
   The walkthrough shows YAML fragments (not always full workflows), but each
   one MUST at least parse as a standalone YAML document — a reader who copies
   a block into an editor should never meet a syntax error. The typed-error
   example must be real JSON. Full-workflow validity is the spec projector's
   job (usecases) — this suite guards the hand-authored teaching fragments. */

describe('/learn · every teaching fragment parses', () => {
  it('ships the nine-step walk with museum-plate numbers', () => {
    expect(STEPS.length).toBe(9)
    STEPS.forEach((s, i) => {
      expect(s.n).toBe(String(i + 1).padStart(2, '0'))
      expect(s.topic.length).toBeGreaterThan(0)
    })
  })

  it('the mini-DAG step (06 · the waves) matches the drawn plan exactly', () => {
    const dagSteps = STEPS.filter((s) => s.dag)
    expect(dagSteps.length).toBe(1)
    const step = dagSteps[0]
    expect(step.n).toBe('06')
    interface Task {
      id: string
      with?: Record<string, unknown>
      after?: Record<string, string>
    }
    const doc = parse(step.yaml) as { tasks: Record<string, Task> }
    // the drawn plan: 5 tasks · 3 sources with no wires in · digest waits for
    // all three · save waits for digest (the SVG in Learn.tsx draws THIS)
    const entries = Object.entries(doc.tasks)
    expect(entries.length).toBe(5)
    const deps = Object.fromEntries(entries.map(([id, t]) => [id, producersOf(t)]))
    expect(deps.fetch_news).toEqual([])
    expect(deps.repo_log).toEqual([])
    expect(deps.read_notes).toEqual([])
    expect(deps.digest).toEqual(['fetch_news', 'repo_log', 'read_notes'])
    expect(deps.save).toEqual(['digest'])
  })

  it.each(STEPS.map((s) => [`${s.n} · ${s.topic}`, s.yaml] as const))(
    'step %s is valid standalone YAML',
    (_label, yaml) => {
      expect(() => parse(yaml)).not.toThrow()
      expect(parse(yaml)).not.toBeNull()
    },
  )

  it('step 01 carries the frozen envelope', () => {
    const doc = parse(STEPS[0].yaml) as Record<string, unknown>
    expect(doc.nika).toBe('v1')
    expect(typeof (doc.workflow as { id?: unknown })?.id).toBe('string')
  })

  it('the typed-error example is real JSON with the load-bearing fields', () => {
    const err = JSON.parse(ERROR_JSON) as Record<string, unknown>
    expect(typeof err.code).toBe('string')
    expect(err.code).toMatch(/^NIKA-[A-Z]+-\d{3}$/)
    expect(typeof err.transient).toBe('boolean')
    expect(err.details).toBeTypeOf('object')
  })
it('the assembled whole file composes every taught idea and stays coherent', () => {
    interface Task {
      id: string
      with?: Record<string, unknown>
      after?: Record<string, string>
    }
    const doc = parse(FULL_FILE) as {
      nika: string
      workflow: string
      vars: Record<string, unknown>
      model: string
      tasks: Task[]
      outputs: Record<string, unknown>
    }
    /* the envelope (01) · the inputs (02) · the model (03) */
    expect(doc.nika).toBe('v1')
    expect((doc.workflow as { id?: unknown }).id).toBe('weekly-radar')
    expect(Object.keys(doc.vars)).toEqual(['output_dir', 'topic'])
    expect(doc.model).toBe('ollama/llama3.2:3b')
    /* the plan (05/06) · same five tasks, same wave shape as the drawn DAG */
    const whole = Object.entries(doc.tasks as unknown as Record<string, Task>)
    expect(whole.map(([id]) => id)).toEqual([
      'fetch_news',
      'repo_log',
      'read_notes',
      'digest',
      'save',
    ])
    const deps = Object.fromEntries(whole.map(([id, t]) => [id, producersOf(t)]))
    expect(deps.digest).toEqual(['fetch_news', 'repo_log', 'read_notes'])
    expect(deps.save).toEqual(['digest'])
    /* the failure policy (08) rides the digest · the outputs (09) are named */
    const digest = (doc.tasks as unknown as Record<string, Task>).digest as Task & {
      retry?: { max_attempts: number }
    }
    expect(digest.retry?.max_attempts).toBe(3)
    expect(Object.keys(doc.outputs)).toEqual(['brief'])
  })
})
