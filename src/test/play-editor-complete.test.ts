import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TOP_LEVEL_KEYS, TASK_KEYS, nikaComplete } from '../pages/play-editor-complete'
import { TOOLS } from '../content/tools.generated'
import { PROVIDERS } from '../content/providers.generated'

/* ─── the U6 vocabulary pins ─────────────────────────────────────────────────
   The completion lists are hand-written (a JSON schema is not a TS module) —
   these gates are what keep them honest: both key sets must equal the
   SHIPPED schema's own properties, exactly. A schema move goes red here
   naming the key before any author sees a stale menu. */

const schema = JSON.parse(
  readFileSync(join(__dirname, '../../public/spec/shipped/workflow.schema.json'), 'utf8'),
)

describe('play editor completion · schema pins', () => {
  it('top-level keys are the shipped envelope, exactly', () => {
    expect([...TOP_LEVEL_KEYS].sort()).toEqual(Object.keys(schema.properties).sort())
  })

  it('task keys are the shipped task grammar, exactly (verbs included)', () => {
    expect([...TASK_KEYS].sort()).toEqual(Object.keys(schema.$defs.task.properties).sort())
  })
})

/* a minimal CompletionContext stand-in: a doc of lines + a cursor at the end */
function ctx(text: string, explicit = false) {
  const lines = text.split('\n')
  const pos = text.length
  const lineStart = text.lastIndexOf('\n') + 1
  const starts: number[] = []
  let acc = 0
  for (const l of lines) {
    starts.push(acc)
    acc += l.length + 1
  }
  return {
    pos,
    explicit,
    state: {
      doc: {
        lines: lines.length,
        line: (n: number) => ({ text: lines[n - 1], from: starts[n - 1], number: n }),
        lineAt: () => ({ from: lineStart, text: lines[lines.length - 1], number: lines.length }),
      },
    },
  } as never
}

describe('play editor completion · positions', () => {
  it('tool: value position offers every builtin', () => {
    const r = nikaComplete(ctx('    invoke:\n      tool: "nika:'))
    expect(r).not.toBeNull()
    expect(r!.options.length).toBe(TOOLS.length)
    expect(r!.options.every((o) => String(o.label).startsWith('"nika:'))).toBe(true)
  })

  it('model: value position offers every provider prefix', () => {
    const r = nikaComplete(ctx('model: '))
    expect(r).not.toBeNull()
    expect(r!.options.length).toBe(PROVIDERS.length)
    expect(r!.options.every((o) => String(o.label).endsWith('/'))).toBe(true)
  })

  it('column 0 offers the envelope (explicit or once typing)', () => {
    expect(nikaComplete(ctx('wor'))!.options.length).toBe(TOP_LEVEL_KEYS.length)
    expect(nikaComplete(ctx('', true))!.options.length).toBe(TOP_LEVEL_KEYS.length)
    expect(nikaComplete(ctx(''))).toBeNull()
  })

  it('task positions offer the task grammar', () => {
    expect(nikaComplete(ctx('  - i'))!.options.length).toBe(TASK_KEYS.length)
    expect(nikaComplete(ctx('    dep'))!.options.length).toBe(TASK_KEYS.length)
  })

  it('a plain value position offers nothing', () => {
    expect(nikaComplete(ctx('workflow: my flow'))).toBeNull()
  })

  it('depends_on offers the doc task ids, never the task itself', () => {
    const doc = [
      'tasks:',
      '  - id: gather',
      '    invoke:',
      '  - id: check',
      '    exec:',
      '  - id: write',
      '    depends_on: [',
    ].join('\n')
    const r = nikaComplete(ctx(doc))
    expect(r).not.toBeNull()
    expect(r!.options.map((o) => o.label).sort()).toEqual(['check', 'gather'])
  })

  it('depends_on keeps completing after a comma', () => {
    const doc = ['tasks:', '  - id: gather', '  - id: check', '  - id: write', '    depends_on: [gather, ch'].join('\n')
    const r = nikaComplete(ctx(doc))
    expect(r).not.toBeNull()
    expect(r!.options.map((o) => o.label)).toContain('check')
    expect(r!.options.map((o) => o.label)).not.toContain('write')
  })

  it('depends_on with no other task offers nothing', () => {
    const doc = ['tasks:', '  - id: only', '    depends_on: ['].join('\n')
    expect(nikaComplete(ctx(doc))).toBeNull()
  })

  it('interp roots speak the LINT vocabulary, loop locals gated on for_each', () => {
    const plain = ['tasks:', '  - id: a', '    infer:', '      prompt: "x ${{ '].join('\n')
    const r = nikaComplete(ctx(plain))
    expect(r).not.toBeNull()
    expect(r!.options.map((o) => o.label).sort()).toEqual([
      'env.',
      'secrets.',
      'tasks.',
      'vars.',
      'with.',
    ])
    const looped = ['tasks:', '  - id: a', '    for_each: ${{ vars.list }}', '    exec:', '      command: ["x", "${{ '].join('\n')
    const r2 = nikaComplete(ctx(looped))
    expect(r2!.options.map((o) => o.label)).toContain('item')
    expect(r2!.options.map((o) => o.label)).toContain('index')
  })

  it('tasks. offers the other tasks as .output refs', () => {
    const doc = ['tasks:', '  - id: gather', '  - id: write', '    with:', '      notes: ${{ tasks.'].join('\n')
    const r = nikaComplete(ctx(doc))
    expect(r!.options.map((o) => o.label)).toEqual(['tasks.gather.output'])
  })

  it('vars. offers the envelope block keys · with. offers the current item keys', () => {
    const doc = [
      'vars:',
      '  region: eu',
      '  bucket: b1',
      'tasks:',
      '  - id: a',
      '    with:',
      '      notes: hello',
      '    infer:',
      '      prompt: "${{ vars.',
    ].join('\n')
    const r = nikaComplete(ctx(doc))
    expect(r!.options.map((o) => o.label).sort()).toEqual(['vars.bucket', 'vars.region'])
    const doc2 = doc.replace('${{ vars.', '${{ with.')
    const r2 = nikaComplete(ctx(doc2))
    expect(r2!.options.map((o) => o.label)).toEqual(['with.notes'])
  })

  it('an unknown root offers nothing', () => {
    const doc = ['tasks:', '  - id: a', '    infer:', '      prompt: "${{ nope.'].join('\n')
    expect(nikaComplete(ctx(doc))).toBeNull()
  })
})
