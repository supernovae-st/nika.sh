import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHANGELOG } from '../content/changelog'
import { ENGINE_VERSION } from '../content'

/* ── the ship-log truth gate ──────────────────────────────────────────────────
   The changelog's laws lived in a comment and held by discipline alone:
   newest-first order, DATE HONESTY (no entry claims a day that hasn't
   happened), and release entries carrying their real GitHub notes. The
   riskiest step was the release ritual itself — the entry's gh link is
   hand-written BEFORE the tag exists (one typo = a dead link shipped on
   the home preview), and nothing tied the entry to the version bump in
   package.json. This gate makes the ritual structural: the release PR
   goes red unless the newest site entry and the bump move together, every
   versioned title agrees with the tag its link points at, and the log
   stays sorted and honest. */

const SITE = /^nika\.sh v(\d+\.\d+)(?:\.\d+)? · .+/
const ENGINE = /^v(\d+\.\d+\.\d+) · .+/

describe('changelog · the ship log tells the truth', () => {
  it('is newest-first (dates never increase down the register)', () => {
    for (let i = 1; i < CHANGELOG.length; i++) {
      expect(
        CHANGELOG[i].date <= CHANGELOG[i - 1].date,
        `entry ${i} ("${CHANGELOG[i].title}") is dated after the one above it`,
      ).toBe(true)
    }
  })

  it('every date is real ISO and never in the future (date honesty)', () => {
    // +36h grace: an entry dated "today" must survive any CI timezone.
    const horizon = Date.now() + 36 * 3600 * 1000
    for (const e of CHANGELOG) {
      expect(e.date, `"${e.title}" has a malformed date`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const t = Date.parse(e.date)
      expect(Number.isNaN(t), `"${e.title}" date does not parse`).toBe(false)
      expect(t < horizon, `"${e.title}" claims a future date (${e.date})`).toBe(true)
    }
  })

  it('every gh link points at a supernovae-st release tag', () => {
    // the tag segment stays free-form: v3-playground is a REAL historical
    // tag (verified on GitHub) — the gate accepts reality, it never
    // rewrites it. The title↔tag AGREEMENT tests below stay strict.
    for (const e of CHANGELOG) {
      if (!e.gh) continue
      expect(e.gh).toMatch(/^https:\/\/github\.com\/supernovae-st\/(nika|nika\.sh)\/releases\/tag\/[\w.-]+$/)
    }
  })

  it('a site-release title and its tag agree (nika.sh vX.Y ↔ …/nika.sh/…/vX.Y.0)', () => {
    for (const e of CHANGELOG) {
      const m = e.title.match(SITE)
      if (!m) continue
      expect(e.gh, `site release "${e.title}" carries no gh link`).toBeTruthy()
      expect(
        e.gh,
        `"${e.title}" links a tag that disagrees with its own title`,
      ).toBe(`https://github.com/supernovae-st/nika.sh/releases/tag/v${m[1]}.0`)
    }
  })

  it('an engine-release title and its tag agree (vX.Y.Z ↔ …/nika/…/vX.Y.Z)', () => {
    for (const e of CHANGELOG) {
      if (e.tag !== 'release') continue
      const m = e.title.match(ENGINE)
      expect(m, `release entry "${e.title}" does not open with its version`).toBeTruthy()
      expect(e.gh, `engine release "${e.title}" carries no gh link`).toBeTruthy()
      expect(
        e.gh,
        `"${e.title}" links a tag that disagrees with its own title`,
      ).toBe(`https://github.com/supernovae-st/nika/releases/tag/v${m![1]}`)
    }
  })

  it('the ship log never lags the engine pin (the catch-up ratchet)', () => {
    /* the 0.100-0.105 gap shipped because nothing guarded it: the site
       said PROD v0.105.0 while the exhaustive ship log stopped at 0.99.
       Structural fix (stress-to-ratchet): when the ENGINE_VERSION pin
       bumps, this goes red until the new release has its entry. */
    const newest = CHANGELOG.map((e) => e.title.match(ENGINE)).find(Boolean)
    expect(newest, 'no engine release entry found in the register').toBeTruthy()
    expect(
      `v${newest![1]}`,
      `the pin says ${ENGINE_VERSION} but the newest ship-log engine entry is v${newest![1]} — write the entry with the bump, never after`,
    ).toBe(ENGINE_VERSION)
  })

  it('the newest site entry and package.json bump together (the release ritual gate)', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as {
      version: string
    }
    const newest = CHANGELOG.map((e) => e.title.match(SITE)).find(Boolean)
    expect(newest, 'no site release entry found in the register').toBeTruthy()
    const [maj, min] = pkg.version.split('.')
    expect(
      newest![1],
      `package.json says ${pkg.version} but the newest ship-log site entry says v${newest![1]} — the release ritual is entry+bump in ONE PR`,
    ).toBe(`${maj}.${min}`)
  })
})
