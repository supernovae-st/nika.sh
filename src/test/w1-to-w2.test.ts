import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { w1ToW2, w1ToW2WithMap, serveW2 } from '../lib/w1-to-w2'
// the node twin — vitest resolves .mjs fine; parity is the whole point
import { w1ToW2 as w1ToW2Node, serveW2 as serveW2Node } from '../../scripts/lib/w1-to-w2.mjs'

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
      expect(serveW2Node(yaml), `serveW2 twin drift on ${m[1]}`).toBe(serveW2(yaml))
    }
  })
})

/* ── the value axis · wnew -> w2 · the E-split inverse (C2) ──────────────────
   The full door serveW2 = envelope (w1ToW2) + value axis: it folds the C2
   `inputs:` + `const:` split back into one `vars:` block and rewrites the
   root refs, so what a visitor copies still runs on the released 0.104 binary.
   secrets is grammar-stable — untouched. */
const WNEW = `nika: v1
workflow: watch
description: "the E-split, served W2"

inputs:
  city: { type: string, required: true }
const:
  threshold: 899
secrets:
  hook: { source: env, key: HOOK }

tasks:
  - id: check
    with:
      c: \${{ inputs.city }}
      t: \${{ const.threshold }}
    invoke:
      tool: "nika:noop"
`

describe('serveW2 · the value axis', () => {
  const served = serveW2(WNEW)

  it('folds inputs + const into one vars block, secrets untouched', () => {
    expect(served).toContain('vars:')
    expect(served).toMatch(/^ {2}city:/m)
    expect(served).toMatch(/^ {2}threshold: 899/m)
    expect(served).not.toMatch(/^inputs:/m)
    expect(served).not.toMatch(/^const:/m)
    expect(served).toContain('hook: { source: env, key: HOOK }')
  })

  it('rewrites root refs inputs.|const. to vars. (never a nested field)', () => {
    expect(served).toContain('${{ vars.city }}')
    expect(served).toContain('${{ vars.threshold }}')
    expect(served).not.toMatch(/\$\{\{[^}]*\b(inputs|const)\./)
  })

  it('parses to the exact W2 shape (single vars object)', () => {
    const doc = parse(served) as { vars: Record<string, unknown>; inputs?: unknown; const?: unknown }
    expect(doc.inputs).toBeUndefined()
    expect(doc.const).toBeUndefined()
    expect(Object.keys(doc.vars).sort()).toEqual(['city', 'threshold'])
  })

  it('is idempotent on the served form', () => {
    expect(serveW2(served)).toBe(served)
  })

  it('the node twin emits byte-identical serveW2 output', () => {
    expect(serveW2Node(WNEW)).toBe(served)
  })
})
