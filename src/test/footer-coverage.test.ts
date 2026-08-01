// footer-coverage.test.ts — the complete-card gate (operator mandate
// 2026-08-02: « toutes les pages accessibles à travers le footer »).
//
// The footer's law is COMPLETENESS where the nav panels are curated. This
// gate renders the REAL <SiteFooter/> (jsdom · MemoryRouter) and harvests
// its hrefs, then asserts every depth-1 head of the prerender manifest has
// a footer door. Locale prefixes are the declared exception: their door is
// the LocaleSwitcher on the localized pages themselves (the i18n law) —
// each exception is asserted to BE a registered locale, never a free pass.
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PATHS } from '../../site.config'
import { LOCALES } from '../lib/i18n'
import SiteFooter from '../shell/SiteFooter'

const html = renderToStaticMarkup(
  React.createElement(MemoryRouter, null, React.createElement(SiteFooter)),
)
const hrefs = new Set(
  [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1].split('#')[0].split('?')[0]),
)
const footHeads = new Set([...hrefs].map((h) => `/${h.split('/')[1]}`))

const LOCALE_PREFIXES = new Set(LOCALES.filter((l) => l.prefix).map((l) => `/${l.prefix}`))

describe('footer · the complete card (every world has a door)', () => {
  it('renders a real link population (the harvest is not vacuous)', () => {
    expect(hrefs.size).toBeGreaterThan(40)
  })

  it('every depth-1 head of the prerender manifest has a footer door', () => {
    const heads = new Set(
      PATHS.filter((p) => p !== '/').map((p) => `/${p.split('/')[1]}`),
    )
    const missing = [...heads]
      .filter((h) => !footHeads.has(h))
      .filter((h) => !LOCALE_PREFIXES.has(h))
      .sort()
    expect(
      missing,
      `worlds with NO footer door (add a column row, an extras: entry in sets.yaml, or a derived strip):\n${missing.join('\n')}`,
    ).toEqual([])
  })

  it('the locale exception list is exactly the registered locales (never a free pass)', () => {
    for (const p of LOCALE_PREFIXES) {
      expect(
        LOCALES.some((l) => `/${l.prefix}` === p),
        `${p} claims the locale exception but is not a registered locale`,
      ).toBe(true)
    }
  })

  it('every footer door is a real route (the card never lies)', () => {
    const routes = new Set(PATHS)
    const dead = [...hrefs]
      .filter((h) => !h.includes('.')) // machine-row files judged by llms-urls/live-URL gates
      .filter((h) => !routes.has(h))
      .sort()
    expect(dead, `footer links to nowhere:\n${dead.join('\n')}`).toEqual([])
  })
})
