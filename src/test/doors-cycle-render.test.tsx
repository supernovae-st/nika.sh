import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/* jsdom has no matchMedia; the cycle asks it once on mount. The stub answers
   « reduced » so the component renders its settled prerender state — the
   FIRST door, fully typed: exactly what no-JS and reduced-motion visitors
   get, and what the prerendered HTML carries. */
vi.stubGlobal(
  'matchMedia',
  (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList,
)

import { DoorsCycle } from '../components/DoorsCycle'
import { doorCycleLines } from '../components/doors-cycle-lines'
import { CLIENTS } from '../content/catalog.generated'

describe('<DoorsCycle /> · the settled prerender state', () => {
  it('renders the first door fully typed, named, and copyable whole', () => {
    const { container, getByRole } = render(<DoorsCycle doors={CLIENTS} />)
    const first = doorCycleLines(CLIENTS)[0]
    const well = getByRole('group', { name: `${first.name} install` })
    expect(well.textContent).toContain(first.cmd)
    expect(container.querySelector('.dc-head')?.textContent).toContain('pick your door')
    expect(getByRole('button', { name: `Copy ${first.name} install command` })).toBeTruthy()
  })
})
