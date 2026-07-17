import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { w1ToW2, w1ToW2WithMap } from '../lib/w1-to-w2'
// the node twin — vitest resolves .mjs fine; parity is the whole point
import { w1ToW2 as w1ToW2Node } from '../../scripts/lib/w1-to-w2.mjs'

/* ── w1-to-w2 · the mechanical grammar pass, judged ──────────────────────────
   The 0.104 release ships the W2 grammar (workflow scalar · tasks sequence ·
   declarative depends_on) while the public spec still teaches W1. The doors
   transform on the way out; THIS suite pins the pass itself:
   the three moves, idempotence, the line map, and byte-parity between the
   TS twin (bundle-side) and the .mjs twin (node-side). */

const W1 = `nika: v1
workflow:
  id: radar
  description: "one honest line"

model: mock/echo

tasks:
  fetch:
    invoke:
      tool: "nika:fetch"
      args: { url: "https://example.com" }

  digest:
    with:
      body: \${{ tasks.fetch.output }}
    infer:
      prompt: "sum \${{ with.body }}"

  save:
    after: [digest]
    invoke:
      tool: "nika:write"
      args: { path: "./out.md", content: "\${{ tasks.digest.output }}" }

outputs:
  brief: \${{ tasks.digest.output }}
`

describe('w1-to-w2 · the mechanical grammar pass', () => {
  const w2 = w1ToW2(W1)

  it('moves the envelope: workflow scalar + description promoted', () => {
    expect(w2).toContain('workflow: radar')
    expect(w2).toContain('description: "one honest line"')
    expect(w2).not.toMatch(/^ {2}id: radar/m)
  })

  it('moves tasks to a sequence and declares every edge', () => {
    expect(w2).toContain('  - id: fetch')
    expect(w2).toContain('  - id: digest')
    expect(w2).toContain('    depends_on: [fetch]')
    // `after:` folds into depends_on and dies
    expect(w2).not.toContain('after:')
    expect(w2).toContain('    depends_on: [digest]')
  })

  it('parses as exactly the W2 shape (workflow string · tasks array)', () => {
    const doc = parse(w2) as { workflow: unknown; tasks: unknown }
    expect(typeof doc.workflow).toBe('string')
    expect(Array.isArray(doc.tasks)).toBe(true)
    const tasks = doc.tasks as Array<{ id: string; depends_on?: string[] }>
    expect(tasks.map((t) => t.id)).toEqual(['fetch', 'digest', 'save'])
  })

  it('is idempotent — W2 through the pass is byte-identical', () => {
    expect(w1ToW2(w2)).toBe(w2)
  })

  it('maps old task-head lines to their rendered lines', () => {
    const { text, mapLine } = w1ToW2WithMap(W1)
    const oldLines = W1.split('\n')
    const newLines = text.split('\n')
    for (const id of ['fetch', 'digest', 'save']) {
      const oldIdx = oldLines.findIndex((l) => l === `  ${id}:`)
      expect(newLines[mapLine(oldIdx + 1) - 1]).toBe(`  - id: ${id}`)
    }
  })

  it('the node twin emits byte-identical output (no fork, two runtimes)', () => {
    expect(w1ToW2Node(W1)).toBe(w2)
    // and on the real corpus: every showcase yaml, both twins agree
    const src = readFileSync(
      join(__dirname, '../sections/usecases-yaml.generated.ts'),
      'utf8',
    )
    for (const m of src.matchAll(/'([a-z0-9-]+)': `([\s\S]*?)`,\n/g)) {
      const yaml = m[2].replace(/\\([`$\\])/g, '$1')
      expect(w1ToW2Node(yaml), `twin drift on ${m[1]}`).toBe(w1ToW2(yaml))
    }
  })
})
