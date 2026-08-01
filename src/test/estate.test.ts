// estate.test.ts — the local reader of the estate manifest.
//
// The site joined the estate dance 2026-08-01 (E1): scripts/estate.py is the
// SHARED canonical tool (byte-identical mirror of supernovae-st/nika-estate
// at the rev in ESTATE_PIN — the CI `mirror` job blocks on any divergence),
// scripts/estate_rules.py is the site's own DATA, estate.yaml the render.
// The pre-reconciliation fork and its sha half (estate-sync.mjs) are dead —
// this test pins that RAMS structurally. What stays local is the READER:
// the manifest's face must parse, its six classes must be the law verbatim,
// and every per-file pin must match the tree. The fix for a red row is never
// to edit the hex by hand — stage the change, then
// `python3 scripts/estate.py --write` (the tool hashes the INDEX, so stage
// first, generate second).
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../..')
const text = readFileSync(join(ROOT, 'estate.yaml'), 'utf8')

const fileRows = [
  ...text.matchAll(/- path: "([^"]+)"\n {2}class: ([\w-]+)\n {2}sha256: ([0-9a-f]{64})/g),
].map((m) => ({ path: m[1], cls: m[2], pinned: m[3] }))

const patternRows = [
  ...text.matchAll(/- glob: "([^"]+)"\n {2}class: ([\w-]+)\n {2}match_count: (\d+)\n {2}aggregate_sha256: ([0-9a-f]{64})/g),
].map((m) => ({ glob: m[1], cls: m[2], count: Number(m[3]) }))

// The six classes ARE the law (nika-estate/SCHEMA.md) — a repo that re-words
// or drops one has forked the law without saying so.
const LAW_CLASSES = ['authored', 'authored-pin', 'generated', 'pinned-copy', 'testimonial', 'foreign']

describe('estate · the manifest tells the truth about the tree', () => {
  it('registers a real population (the regex face of the file holds)', () => {
    // a silent parse regression would make the suite below judge nothing
    expect(fileRows.length).toBeGreaterThan(90)
    expect(patternRows.length).toBeGreaterThan(15)
  })

  it('carries the canonical schema and the six-class law verbatim', () => {
    expect(text).toContain('estate_schema: 2')
    expect(text).toContain('repo: supernovae-st/nika.sh')
    for (const cls of LAW_CLASSES) {
      expect(text, `classes: block must declare '${cls}'`).toMatch(new RegExp(`^ {2}${cls}: `, 'm'))
    }
  })

  it('the dance is joined: ESTATE_PIN names a rev, the fork and its sha half are dead', () => {
    const pin = readFileSync(join(ROOT, 'ESTATE_PIN'), 'utf8')
    const rev = pin
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.trim())[0]
    expect(rev, 'ESTATE_PIN must name a full 40-hex nika-estate rev').toMatch(/^[0-9a-f]{40}$/)
    // the RAMS ratchet: ONE tool — the node sha-half died with the fork
    expect(existsSync(join(ROOT, 'scripts/estate-sync.mjs'))).toBe(false)
    expect(existsSync(join(ROOT, 'scripts/estate_rules.py'))).toBe(true)
  })

  it('every pinned path exists', () => {
    const gone = fileRows.filter((r) => !existsSync(join(ROOT, r.path))).map((r) => r.path)
    expect(gone, `pinned paths missing from the tree:\n${gone.join('\n')}`).toEqual([])
  })

  it('every sha pin matches the tree (fix: stage, then python3 scripts/estate.py --write)', () => {
    const stale = fileRows
      .filter((r) => existsSync(join(ROOT, r.path)))
      .filter(
        (r) => createHash('sha256').update(readFileSync(join(ROOT, r.path))).digest('hex') !== r.pinned,
      )
      .map((r) => r.path)
    expect(stale, `estate drift (${stale.length} rows):\n${stale.join('\n')}`).toEqual([])
  })
})
