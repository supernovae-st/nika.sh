import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
/* the judge reads the heavy module directly · the register-diet law is about
   the BUNDLE, and a test never ships (the same exemption catalog.test takes) */
import { ADRS, ADRS_PIN, ADR_STATUS_COUNTS } from '../content/adrs.generated'
import { PATHS } from '../../site.config'

const ROOT = join(__dirname, '../..')

/* ─── the decision record · the register cannot drift from the pin ──────────
   44KB of ADR index rode every deploy with no consumer, behind an estate
   evidence string naming a world that did not exist. /city/decisions is the
   consumer now, and these laws are what keep it honest:

     1 · the projection recompiles byte-identical from the vendored input
     2 · every status the record carries is COUNTED, never typed
     3 · a supersede chain points at a decision that exists
     4 · the register is served */

describe('the decision record', () => {
  it('recompiles byte-identical from the vendored index', () => {
    /* the generator is the gate: --check exits 5 on any drift between
       public/engine/adr/index.json and the typed projection */
    expect(() =>
      execFileSync('node', ['scripts/build-adrs.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' }),
    ).not.toThrow()
  })

  it('carries every decision the vendored index carries', () => {
    const raw = JSON.parse(readFileSync(join(ROOT, 'public/engine/adr/index.json'), 'utf8')) as {
      adrs: { id: string }[]
    }
    expect(ADRS.length).toBe(raw.adrs.length)
    expect(new Set(ADRS.map((a) => a.id)).size).toBe(ADRS.length)
  })

  it('counts its statuses instead of asserting them', () => {
    const counted: Record<string, number> = {}
    for (const a of ADRS) counted[a.status] = (counted[a.status] ?? 0) + 1
    expect(ADR_STATUS_COUNTS).toEqual(counted)
    /* the sum is the whole record: a status the page does not render would
       otherwise vanish silently from the register */
    expect(Object.values(ADR_STATUS_COUNTS).reduce((a, b) => a + b, 0)).toBe(ADRS.length)
  })

  it('never points a supersede chain at a decision it does not carry', () => {
    const known = new Set(ADRS.map((a) => a.id))
    for (const a of ADRS) {
      for (const to of [...a.supersedes, ...a.superseded_by]) {
        expect(known.has(to), `${a.id} names ${to}, which the record does not carry`).toBe(true)
      }
    }
  })

  it('register-diet holds: only adrs-access (and this judge) import the heavy module', () => {
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (/\.(ts|tsx)$/.test(e.name)) {
          const src = readFileSync(full, 'utf8')
          /* a TYPE-only import costs no bytes · `import type` and `typeof import`
             both erase, and there is no runtime form of either */
          const runtime = src
            .split('\n')
            .filter((l) => /from '.*adrs\.generated'/.test(l) && !/^\s*import type/.test(l))
          if (runtime.length && !full.endsWith('lib/adrs-access.ts') && !full.endsWith('test/adrs.test.ts')) {
            offenders.push(full.slice(ROOT.length + 1))
          }
        }
      }
    }
    walk(join(ROOT, 'src'))
    expect(offenders).toEqual([])
  })

  it('is reachable, and names the pin it was read at', () => {
    expect(new Set(PATHS).has('/city/decisions')).toBe(true)
    expect(ADRS_PIN.release_tag).toMatch(/^v\d+\.\d+\.\d+/)
    const pin = JSON.parse(readFileSync(join(ROOT, '.github/nika-engine-pin.json'), 'utf8')) as {
      release_tag: string
    }
    expect(ADRS_PIN.release_tag).toBe(pin.release_tag)
  })
})
