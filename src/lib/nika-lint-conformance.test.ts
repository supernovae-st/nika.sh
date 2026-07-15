import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lintNika, LINT_COVERAGE } from './nika-lint'
import { LINT_FIXTURES } from './lint-fixtures.generated'
import { ERROR_PATHS } from '../../site.config'

/* ── the port's conformance replay (WO-11 · U2 · ratchet 8(b) VERBATIM) ───────
   nika-lint.ts is a pinned port of a SUBSET of the engine's static checks.
   Until now its only gate was hand-written cases — the port could drift
   from the spec in silence. This replays the spec's own core corpus
   (vendored · spec-time clock · the resync re-vendors) against lintNika:

     1 · an invalid fixture expecting a code the port COVERS must make the
         port emit exactly that code (the port's claims are corpus-proven);
     2 · a VALID fixture must produce zero diagnostics — the whole valid
         corpus is the false-positive floor;
     3 · outside its coverage the port stays silent about covered codes
         (it never mislabels someone else's failure as one of its own).

   At I8 the wasm oracle inherits THIS corpus as its parity gate (the
   port's retirement gate is already written). */

const ROOT = join(__dirname, '../..')
const coverage = new Set<string>(LINT_COVERAGE)

describe('nika-lint · the corpus is vendored and byte-stable', () => {
  /* the re-vendor leg needs the spec source (the sibling clone locally ·
     NIKA_SPEC_ROOT on the resync cron). Plain CI has neither — the replay
     below still judges the COMMITTED corpus; only the freshness re-derive
     skips (the resync cron is the surface that catches vendor drift). */
  const specCore =
    process.env.NIKA_SPEC_ROOT != null
      ? join(process.env.NIKA_SPEC_ROOT, 'conformance/tests/core')
      : [
          join(ROOT, '../spec/repo/conformance/tests/core'),
          join(ROOT, '../../../../..', 'ventures/nika/02-engineering/repos/spec/repo/conformance/tests/core'),
        ].find((p) => existsSync(p)) ?? ''
  it.skipIf(!existsSync(specCore))(
    'lint-fixtures.generated.ts is exactly what the vendor emits today',
    () => {
      const committed = readFileSync(join(ROOT, 'src/lib/lint-fixtures.generated.ts'), 'utf8')
      execFileSync('node', [join(ROOT, 'scripts/vendor-lint-fixtures.mjs')], {
        env: { ...process.env },
      })
      const fresh = readFileSync(join(ROOT, 'src/lib/lint-fixtures.generated.ts'), 'utf8')
      expect(fresh).toBe(committed)
    },
  )

  it('the corpus is real: dozens of cases on both sides of the verdict', () => {
    expect(LINT_FIXTURES.length).toBeGreaterThanOrEqual(80)
    expect(LINT_FIXTURES.filter((f) => f.valid).length).toBeGreaterThanOrEqual(20)
    expect(LINT_FIXTURES.filter((f) => !f.valid).length).toBeGreaterThanOrEqual(50)
  })
})

describe('nika-lint · replay: covered codes are corpus-proven', () => {
  const covered = LINT_FIXTURES.filter(
    (f) => !f.valid && f.codes.some((c) => coverage.has(c)),
  )

  it('the covered slice is non-trivial (the port claims real ground)', () => {
    expect(covered.length).toBeGreaterThanOrEqual(8)
  })

  it.each(covered.map((f) => [f.id, f] as const))(
    '%s → the port emits the expected code',
    (_id, f) => {
      const got = new Set(lintNika(f.yaml).map((d) => d.code))
      for (const want of f.codes.filter((c) => coverage.has(c))) {
        expect(got.has(want), `expected ${want} · got [${[...got].join(', ')}]`).toBe(true)
      }
    },
  )
})

describe('nika-lint · replay: the valid corpus is the false-positive floor', () => {
  const valid = LINT_FIXTURES.filter((f) => f.valid)
  it.each(valid.map((f) => [f.id, f] as const))('%s → zero diagnostics', (_id, f) => {
    const got = lintNika(f.yaml)
    expect(
      got.length,
      `false positives: ${got.map((d) => `${d.code}@${d.line}`).join(' · ')}`,
    ).toBe(0)
  })
})

describe('nika-lint · replay: no mislabeling outside the coverage', () => {
  /* an invalid fixture whose expectation names NO covered code and NO bare
     namespace latitude: the port may stay silent (subset), but it must not
     claim one of ITS codes on someone else's failure class. The bare
     'NIKA-PARSE' envelope catch-all is exempt (spec latitude · the port
     legitimately flags malformed envelopes it can see). */
  const outside = LINT_FIXTURES.filter(
    (f) =>
      !f.valid &&
      f.codes.length > 0 &&
      !f.codes.some((c) => coverage.has(c)) &&
      f.namespaces.length === 0,
  )
  it.each(outside.map((f) => [f.id, f] as const))(
    '%s → the port claims none of its own codes',
    (_id, f) => {
      const got = lintNika(f.yaml).map((d) => d.code)
      const mislabeled = got.filter((c) => coverage.has(c) && c !== 'NIKA-PARSE')
      expect(
        mislabeled,
        `port claimed [${mislabeled.join(', ')}] on a ${f.codes.join('/')} failure`,
      ).toEqual([])
    },
  )
})

describe('nika-lint · every suffixed code opens a real room (the U1 door law)', () => {
  /* Play links a diagnostic's code to /errors/<code> whenever it carries a
     numeric suffix (bare namespaces are spec-latitude catch-alls, text
     only). This gate holds that claim against the served routes: a lint
     code with a suffix but no room would ship a dead door. */
  it('suffixed LINT_COVERAGE ⊆ ERROR_PATHS', () => {
    for (const code of LINT_COVERAGE) {
      if (!/\d{3}$/.test(code)) continue
      expect(ERROR_PATHS, `${code} has no room`).toContain(`/errors/${code}`)
    }
  })
})
