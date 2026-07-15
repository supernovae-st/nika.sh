/* the census smoke gate — WO-1 of the language-atlas plan.
   Asserts STRUCTURE, never counts (counts move with the clocks; the
   census's job is to report them, this gate's job is to guarantee the
   report itself cannot rot: every declared set present, members sorted,
   the clock diff computed, the canon parse alive). */
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../..')

describe('atlas census · the world dump holds its shape', () => {
  const out = execFileSync('node', [join(ROOT, 'scripts/atlas/census.mjs'), '--json'], {
    encoding: 'utf8',
  })
  const world = JSON.parse(out)

  it('names its provenance (engine version · canon schema)', () => {
    expect(world.engine_version).toBeTruthy()
    expect(world.canon_schema_version).toBe(1)
  })

  it('carries every declared set, each on exactly one clock', () => {
    const ids = world.sets.map((s: { id: string }) => s.id)
    for (const id of [
      'verbs',
      'namespaces',
      'words.task',
      'words.envelope',
      'builtins.ratified',
      'builtins.shipped',
      'errors.codes',
      'errors.namespaces',
      'errors.categories',
      'templates',
      'providers.shipped',
      'extract-modes',
      'mcp.tools',
    ])
      expect(ids).toContain(id)
    for (const s of world.sets) {
      expect(['spec', 'release']).toContain(s.clock)
      expect(s.count).toBe(s.members.length)
      expect(s.count).toBeGreaterThan(0)
    }
  })

  it('keeps canon order where the order IS data, sorts the derived sets', () => {
    for (const s of world.sets) {
      if (s.order === 'sorted') expect(s.members).toEqual([...s.members].sort())
      else expect(s.order).toBe('canon')
    }
    const verbs = world.sets.find((s: { id: string }) => s.id === 'verbs')
    expect(verbs.members).toEqual(['infer', 'exec', 'invoke', 'agent'])
  })

  it('computes the two-clocks diff as arrays', () => {
    expect(Array.isArray(world.clock_diff.ratified_not_shipped)).toBe(true)
    expect(Array.isArray(world.clock_diff.shipped_not_ratified)).toBe(true)
  })
})
