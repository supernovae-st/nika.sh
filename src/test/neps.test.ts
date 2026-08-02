import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
/* the judge reads the heavy modules directly · the diet law is about the
   BUNDLE, and a test never ships (the catalog.test exemption) */
import { NEPS, NEPS_PIN, NEP_STATUS_COUNTS } from '../content/neps.generated'
import { NEP_SLUGS } from '../content/nep-ids.generated'
import { PATHS } from '../../site.config'

const ROOT = join(__dirname, '../..')

/* ─── governance · the process the site projects, never decides ─────────────
   18 proposals shipped inside the spec pack and the site rendered none of
   them while the specification cited them by number. These laws hold the
   projection honest:

     1 · it recompiles byte-identical from the pinned pack
     2 · every proposal is served, and the strip agrees with the register
     3 · the STATUS is the document's own word, counted not typed
     4 · the register cannot drag the corpus into the entry bundle */

describe('the governance record', () => {
  it('recompiles byte-identical from the spec pin', () => {
    expect(() =>
      execFileSync('node', ['scripts/build-neps.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' }),
    ).not.toThrow()
  })

  it('serves every proposal it carries, and the strip agrees', () => {
    const served = new Set(PATHS)
    expect(NEP_SLUGS).toEqual(NEPS.map((n) => n.slug))
    expect(served.has('/language/governance')).toBe(true)
    for (const n of NEPS) {
      expect(served.has(`/language/governance/${n.slug}`), `NEP-${n.n} has no room`).toBe(true)
    }
  })

  it('reads the status from the document, and counts it', () => {
    const counted: Record<string, number> = {}
    for (const n of NEPS) counted[n.status] = (counted[n.status] ?? 0) + 1
    expect(NEP_STATUS_COUNTS).toEqual(counted)
    /* the site never invents a status · every one came out of a header block */
    for (const n of NEPS) expect(n.status).not.toBe('unstated')
    expect(Object.values(NEP_STATUS_COUNTS).reduce((a, b) => a + b, 0)).toBe(NEPS.length)
  })

  it('names the pin it was read at', () => {
    const pin = JSON.parse(readFileSync(join(ROOT, '.github/nika-spec-pin.json'), 'utf8')) as {
      spec_commit: string
    }
    expect(NEPS_PIN.spec_commit).toBe(pin.spec_commit)
  })

  it('register-diet holds: only neps-access (and this judge) import the corpus', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(e.name)) {
          const runtime = readFileSync(full, 'utf8')
            .split('\n')
            .filter((l) => /from '.*neps(-body)?\.generated'/.test(l) && !/^\s*import type/.test(l))
          if (runtime.length && !full.endsWith('lib/neps-access.ts') && !full.endsWith('test/neps.test.ts')) {
            offenders.push(full.slice(ROOT.length + 1))
          }
        }
      }
    }
    walk(join(ROOT, 'src'))
    expect(offenders).toEqual([])
  })
})
