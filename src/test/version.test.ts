import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ENGINE_VERSION } from '../content'
import { VERSION_TRANSCRIPT } from '../content/install'

/* ── the version-truth gate ───────────────────────────────────────────────────
   The stress-to-ratchet close of the day's recurring class: « a served
   surface silently lags the release ». It struck EIGHT times in one day —
   the /spec/v1 schema (one release stale, the exact URL `nika init` wires
   into editors), llms.txt (twice: v0.93.1 then re-drifted to v0.94.0 hours
   after the hand-fix), humans.txt (four releases stale, then re-drifted),
   both install/learn transcripts (2 and 3 releases stale), the engine's
   vendored pack, the docs snapshot. Hand-fixes don't hold: the llms gate
   checks COUNTS, nothing checked VERSIONS.

   ONE source of truth: ENGINE_VERSION in src/content.ts (the release
   cascade already bumps it — hero plate, FAQ, changelog head, /spec
   invariant all interpolate it). This gate makes every other
   version-claiming surface AGREE with it, so the cascade PR that bumps
   ENGINE_VERSION goes red until llms.txt, humans.txt and the transcripts
   move in the same commit — the class can no longer recur silently. */

const bare = ENGINE_VERSION.replace(/^v/, '')
const llms = readFileSync(join(__dirname, '../../public/llms.txt'), 'utf8')
const humans = readFileSync(join(__dirname, '../../public/humans.txt'), 'utf8')
const installTs = readFileSync(join(__dirname, '../content/install.ts'), 'utf8')
const learnTs = readFileSync(join(__dirname, '../content/learn.ts'), 'utf8')

describe('version truth · every served surface agrees with ENGINE_VERSION', () => {
  it(`llms.txt says the current version is ${ENGINE_VERSION}`, () => {
    expect(llms).toContain(`currently ${ENGINE_VERSION}`)
  })

  it(`llms.txt carries no OTHER 0.x version claim in its prose`, () => {
    // "currently vX" and "(vX, real semver …)" are the two claim sites —
    // both must be the live version; any other v0.N in the file is a
    // fossil (release history does not belong in llms.txt).
    const claims = [...llms.matchAll(/v0\.\d+\.\d+/g)].map((m) => m[0])
    for (const c of claims) {
      expect(c, 'a stale version claim survives in llms.txt').toBe(ENGINE_VERSION)
    }
  })

  it(`humans.txt states ${bare}`, () => {
    expect(humans).toContain(bare)
    const others = [...humans.matchAll(/0\.\d+\.\d+/g)].map((m) => m[0]).filter((v) => v !== bare)
    expect(others, 'a stale version survives in humans.txt').toEqual([])
  })

  it(`the install transcript prints nika ${bare} (the honesty law's trigger)`, () => {
    // VERSION_TRANSCRIPT claims what `nika --version` answers TODAY —
    // when ENGINE_VERSION bumps, this line forces the re-capture the
    // honesty law demands (« never hand-edit » still holds: red means
    // re-run the binary, not edit the string).
    const out = VERSION_TRANSCRIPT.map((l) => l.text).join('\n')
    expect(out).toContain(`nika ${bare}`)
  })

  it('both transcript capture labels name the current release', () => {
    // The « Captured YYYY-MM-DD against nika X » labels are honest history,
    // but a label older than the live release means the page SHOWS a dead
    // CLI voice — the exact 2-and-3-releases-stale class of 2026-07-06.
    expect(installTs).toContain(`against nika ${bare}`)
    expect(learnTs).toContain(`nika ${bare})`)
  })

  it('the two served schema snapshots are byte-identical', () => {
    // R29's exact bug: /schema/workflow.json was fresh while
    // /spec/v1/workflow.schema.json (the $id URL `nika init` wires into
    // editors) served a fossil. They are the same document at two URLs —
    // any byte of drift between them is a lie at one of the two.
    const a = readFileSync(join(__dirname, '../../public/schema/workflow.json'))
    const b = readFileSync(join(__dirname, '../../public/spec/v1/workflow.schema.json'))
    expect(a.equals(b), '/schema and /spec/v1 schema snapshots drifted apart').toBe(true)
  })
})
