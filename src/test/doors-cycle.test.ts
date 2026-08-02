import { describe, expect, it } from 'vitest'
import { doorCycleLines } from '../components/doors-cycle-lines'
import { CLIENTS, type ClientDoor } from '../content/catalog.generated'

/* the doors cycle DERIVES from the matrix (clients.yaml → catalog projection)
   — never hand-typed. Half fixture (the filter's edges), half live truth
   (the real matrix yields real doors, whole and unique). */

const door = (over: Partial<ClientDoor>): ClientDoor => ({
  id: 'x',
  name: 'X',
  class: 'A',
  status: 'proven',
  install: null,
  wire: null,
  components: {},
  gaps: [],
  class_gap: null,
  ...over,
})

describe('doorCycleLines', () => {
  it('keeps proven marketplace doors only, annotations cut at the first paren', () => {
    const lines = doorCycleLines([
      door({ name: 'A', install: 'a plugin add x (note about caches)' }),
      door({ name: 'B', status: 'wired', install: 'b plugin add x' }),
      door({ name: 'C', install: 'nika init  (AGENTS.md carries the teaching)' }),
      door({ name: 'D', install: null }),
    ])
    expect(lines).toEqual([{ name: 'A', cmd: 'a plugin add x' }])
  })

  it('the live matrix yields at least three doors, whole and unique', () => {
    const lines = doorCycleLines(CLIENTS)
    expect(lines.length).toBeGreaterThanOrEqual(3)
    const cmds = lines.map((l) => l.cmd)
    expect(new Set(cmds).size).toBe(cmds.length)
    for (const cmd of cmds) {
      expect(cmd).toMatch(/^(?:[a-z]+ plugin |npx skills )/)
      expect(cmd).not.toContain('(')
    }
    expect(cmds.some((c) => c.startsWith('claude plugin '))).toBe(true)
  })
})
