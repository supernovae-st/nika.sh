import { describe, expect, it } from 'vitest'
import { INTEGRATIONS, INTEGRATION_INDEX } from '../content/integrations'
import { INTEGRATION_TABS } from '../content/integrations-tabs'
import { INTEGRATION_PATHS, PATHS } from '../../site.config'

/* ── the integrations drift gates ─────────────────────────────────────────────
   The register is AUTHORED but README-true (integrations.ts header); these
   gates keep its structure honest: the id set IS the path set, every entry
   carries an install ritual and a source repo, every internal door lands
   on a prerendered route (never a dead chip), and the client lanes keep
   their both-at-once pairing pointing at a real room. */

describe('/integrations · the register matches its paths and its laws', () => {
  it('INTEGRATION_PATHS is exactly the hub + one room per entry, in order', () => {
    expect(INTEGRATION_PATHS).toEqual([
      '/integrations',
      ...INTEGRATIONS.map((e) => `/integrations/${e.id}`),
    ])
    for (const p of INTEGRATION_PATHS) {
      expect(PATHS).toContain(p)
    }
  })

  it('ids are unique and the index mirrors the list', () => {
    expect(new Set(INTEGRATIONS.map((e) => e.id)).size).toBe(INTEGRATIONS.length)
    for (const e of INTEGRATIONS) {
      expect(INTEGRATION_INDEX[e.id]).toBe(e)
    }
  })

  it('the chrome-lean TABS mirror the register, row for row (register-diet law)', () => {
    expect(INTEGRATION_TABS).toEqual(
      INTEGRATIONS.map((e) => ({ id: e.id, name: e.name, kind: e.kind })),
    )
  })

  it('every entry carries its ritual, its source and its teaching', () => {
    for (const e of INTEGRATIONS) {
      expect(e.install.length, e.id).toBeGreaterThanOrEqual(1)
      expect(e.repo, e.id).toMatch(/^https:\/\/github\.com\/supernovae-st\//)
      expect(e.what, e.id).toBeTruthy()
      expect(e.how, e.id).toBeTruthy()
      expect(e.title, e.id).toBeTruthy()
      expect(e.license, e.id).toBeTruthy()
    }
  })

  it('every kit oracle tool owns its room (the mcp chips never dangle)', () => {
    const routeSet = new Set(PATHS)
    for (const e of INTEGRATIONS) {
      for (const t of e.kit?.mcpTools ?? []) {
        expect(routeSet.has(`/mcp/${t}`), `${e.id} kit → /mcp/${t}`).toBe(true)
      }
    }
  })

  it('every internal door lands on a prerendered route (never a dead chip)', () => {
    const routeSet = new Set(PATHS)
    for (const e of INTEGRATIONS) {
      for (const d of e.doors) {
        expect(routeSet.has(d.href.split('#')[0]), `${e.id} → ${d.href}`).toBe(true)
      }
      if (e.also) {
        expect(routeSet.has(e.also.href), `${e.id} also → ${e.also.href}`).toBe(true)
      }
      for (const x of e.external ?? []) {
        expect(x.href, `${e.id} external`).toMatch(/^https:\/\//)
      }
    }
  })
})
