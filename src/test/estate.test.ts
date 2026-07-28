// estate.test.ts — the judge the registry never had.
//
// estate.yaml pins a sha256 for every file it registers; 47 of 96 pins had
// rotted by 2026-07-29 because nothing ever recomputed them (a registry
// without a reader is a draft). This test IS the reader: every pinned path
// must exist and hash to its pin. The fix for a red row is never to edit the
// hex by hand — run `node scripts/estate-sync.mjs` (the write half) after
// the file's own ritual, so the pin stays a computation, not a claim.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../..')
const text = readFileSync(join(ROOT, 'estate.yaml'), 'utf8')
const rows = [...text.matchAll(/- path: "([^"]+)"\n {2}class: \w+\n {2}sha256: ([0-9a-f]{64})/g)].map(
  (m) => ({ path: m[1], pinned: m[2] }),
)

describe('estate · the registry tells the truth about the tree', () => {
  it('registers a real population (the regex face of the file holds)', () => {
    // a silent parse regression would make the suite below judge nothing
    expect(rows.length).toBeGreaterThan(90)
  })

  it('every pinned path exists', () => {
    const gone = rows.filter((r) => !existsSync(join(ROOT, r.path))).map((r) => r.path)
    expect(gone, `pinned paths missing from the tree:\n${gone.join('\n')}`).toEqual([])
  })

  it('every sha pin matches the tree (fix: node scripts/estate-sync.mjs, never the hex by hand)', () => {
    const stale = rows
      .filter((r) => existsSync(join(ROOT, r.path)))
      .filter(
        (r) => createHash('sha256').update(readFileSync(join(ROOT, r.path))).digest('hex') !== r.pinned,
      )
      .map((r) => r.path)
    expect(stale, `estate drift (${stale.length} rows):\n${stale.join('\n')}`).toEqual([])
  })
})
