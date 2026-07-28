import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/* jsdom has no matchMedia; useRevealOnce (motion-safe reveal) asks it once.
   The stub answers « reduced » so the section renders in its settled state. */
vi.stubGlobal(
  'matchMedia',
  (query: string) =>
    ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList,
)

import TheReading from './TheReading'
import {
  HERO_FINDINGS,
  HERO_REPAIRS,
  HERO_BROKEN_FILE,
  HERO_FIXED_FILE,
} from '../content/hero-check.generated'

/* ── the reading ladder · reader-driven, captured, captioned ─────────────────
   The section renders CAPTURED findings through the Diagnostic atom, so the
   gates here are about the LADDER's own promises: every stop has a human
   caption, one finding is held at a time, the repair stop shows the captured
   diff and the served twins, and the whole thing works from the keyboard. */

describe('the reading · the ladder over the captured findings', () => {
  it('gives every captured code a human caption (a silent stop is a red one)', () => {
    /* keyed by code: a re-capture that surfaces a NEW code must fail here
       until someone writes its caption — never render a caption-less stop */
    const { container, getByRole } = render(<TheReading />)
    for (let i = 0; i < HERO_FINDINGS.length; i++) {
      fireEvent.click(getByRole('tab', { name: new RegExp(HERO_FINDINGS[i].gate) }))
      expect(
        container.querySelector('.rd-caption')?.textContent,
        `no caption while ${HERO_FINDINGS[i].code} is shown`,
      ).toBeTruthy()
    }
  })

  it('holds exactly ONE finding still at a time', () => {
    const { container } = render(<TheReading />)
    expect(container.querySelectorAll('.dg').length).toBe(1)
  })

  it('renders the first finding with its span, source line and caret', () => {
    const { container } = render(<TheReading />)
    const src = container.querySelector('.dg-src .dg-code-line')?.textContent
    expect(src).toBe(HERO_FINDINGS[0].sourceLine)
    expect(container.querySelector('.dg-caret')).toBeTruthy()
  })

  it('says the law out loud: two keystrokes, three findings', () => {
    const { container } = render(<TheReading />)
    expect(container.querySelector('.rd-counter')?.textContent).toContain('two keystrokes')
    expect(container.querySelector('.rd-counter')?.textContent).toContain(
      `${HERO_FINDINGS.length} findings`,
    )
  })

  it('the repair stop shows every captured line pair and links both served twins', () => {
    const { container, getByRole } = render(<TheReading />)
    fireEvent.click(getByRole('tab', { name: /the repair/i }))
    const befores = [...container.querySelectorAll('.rd-diff-row--before .rd-diff-code')].map(
      (n) => n.textContent,
    )
    const afters = [...container.querySelectorAll('.rd-diff-row--after .rd-diff-code')].map(
      (n) => n.textContent,
    )
    expect(befores).toEqual(HERO_REPAIRS.map((r) => r.before))
    expect(afters).toEqual(HERO_REPAIRS.map((r) => r.after))
    const hrefs = [...container.querySelectorAll('.rd-twins a')].map((a) =>
      a.getAttribute('href'),
    )
    expect(hrefs).toEqual([HERO_BROKEN_FILE, HERO_FIXED_FILE])
  })

  it('walks the stops from the keyboard (the tablist contract)', () => {
    const { getByRole } = render(<TheReading />)
    const first = getByRole('tab', { name: new RegExp(HERO_FINDINGS[0].gate) })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(getByRole('tab', { selected: true }).textContent).toContain(HERO_FINDINGS[1].gate)
    fireEvent.keyDown(getByRole('tab', { selected: true }), { key: 'End' })
    expect(getByRole('tab', { selected: true }).textContent).toContain('the repair')
  })
})
