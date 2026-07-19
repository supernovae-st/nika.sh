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

/* a minimal CompletionContext stand-in: a doc of lines + a cursor */
function ctx(text: string, explicit = false) {
  const lines = text.split('\n')
  const pos = text.length
  const lineStart = text.lastIndexOf('\n') + 1
  return {
    pos,
    explicit,
    state: {
      doc: {
        lineAt: () => ({ from: lineStart, text: lines[lines.length - 1] }),
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
})
