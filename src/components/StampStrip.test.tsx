import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StampStrip } from './StampStrip'

/* jsdom ships no matchMedia — CountUp reads it on mount (reduced-motion
   gate). Reduced=true keeps the figures static: the SSG truth under test. */
beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

/* ── StampStrip · the register band's contract ────────────────────────────────
   The band lived as two drifted css copies + three pasted markups before the
   promotion (arc 13g). These pin what made the drift possible:
   · numbers roll (CountUp), strings render VERBATIM in the mono variant
   · the fig numbering is positional (00…)
   · every page renders the same classes — and NO page re-declares them
     (the no-copies guard: the primitive's classes live in shell.css only). */

describe('StampStrip · the register band', () => {
  const items = [
    { n: 22, label: 'workflows', sub: 'spec-valid' },
    { n: '07·11', label: 'latest', sub: 'site' },
  ]

  it('renders one cell per item with positional figs', () => {
    const { container } = render(<StampStrip items={items} />)
    const cells = container.querySelectorAll('.v4stamp-cell')
    expect(cells.length).toBe(2)
    const figs = [...container.querySelectorAll('.v4stamp-fig')].map((f) => f.textContent)
    expect(figs).toEqual(['00', '01'])
  })

  it('numbers take the display face · strings take the mono variant, verbatim', () => {
    const { container } = render(<StampStrip items={items} />)
    const ns = [...container.querySelectorAll('.v4stamp-n')]
    expect(ns[0].classList.contains('v4stamp-n--mono')).toBe(false)
    expect(ns[1].classList.contains('v4stamp-n--mono')).toBe(true)
    /* the string is the SSG truth — rendered as-is, never rolled */
    expect(ns[1].textContent).toBe('07·11')
    /* the number initial state IS the final value (CountUp's SSG law) */
    expect(ns[0].textContent).toBe('22')
  })

  it('labels and subs land in their registers', () => {
    const { container } = render(<StampStrip items={items} />)
    expect([...container.querySelectorAll('.v4stamp-label')].map((l) => l.textContent)).toEqual([
      'workflows',
      'latest',
    ])
    expect([...container.querySelectorAll('.v4stamp-sub')].map((l) => l.textContent)).toEqual([
      'spec-valid',
      'site',
    ])
  })
})

/* ── the no-copies guards · the primitive owns its surface ────────────────────
   The drift the promotions killed must not regrow: the stamp classes exist in
   shell.css ONLY (no page re-declares them), and the arrow cue's motion values
   exist in shell.css ONLY (the four per-register copies stay dead). */
describe('the shared-primitive surface · pinned against regrowth', () => {
  const SRC = join(__dirname, '..')
  const shell = readFileSync(join(SRC, 'shell/shell.css'), 'utf8')

  it('shell.css serves the stamp band and the arrow cue', () => {
    expect(shell).toContain('.v4stamp {')
    expect(shell).toContain('.acue {')
    for (const dir of ['--r', '--l', '--d', '--ext']) {
      expect(shell, `.acue${dir} must be served`).toContain(`.acue${dir}`)
    }
    /* the cue is gated: sticky-hover touch + reduced motion get NO motion */
    expect(shell).toContain('@media (hover: hover) and (prefers-reduced-motion: no-preference)')
  })

  it('no page css re-declares the stamp or re-copies the cue motion', () => {
    const pages = [
      'pages/usecases-page.css',
      'pages/changelog-page.css',
      'pages/errors-page.css',
      'pages/blog-page.css',
      'pages/blog-post.css',
      'sections/hero.css',
    ]
    for (const rel of pages) {
      const css = readFileSync(join(SRC, rel), 'utf8')
      expect(css.includes('.v4stamp'), `${rel} must not re-declare the stamp`).toBe(false)
      expect(/\.acue[^-\w]*\{/.test(css), `${rel} must not re-declare the cue`).toBe(false)
      /* the cue's exact motion values must not regrow as local copies on
         hover rules (translateY(3px) legitimately exists in NON-hover
         contexts elsewhere — the pin is hover+translateX, the cue's core) */
      expect(
        /:hover[^{]*\{[^}]*translateX\(3px\)/s.test(css),
        `${rel} must not re-copy the cue motion`,
      ).toBe(false)
    }
  })
})
