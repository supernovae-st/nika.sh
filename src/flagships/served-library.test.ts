import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FLAGSHIPS } from './flagship-data'
import { LIBRARY } from './library'

/* ── the served library · the recorded seven ARE files (operator 2026-07-13) ──
   Every yaml on the site points at its registered source. The browse wing
   points at the nika-spec pack; the recorded seven point at their own
   SERVED copy under public/library/ — which therefore must be byte-equal
   to the module the site renders, or the « source » link lies. */

const ROOT = join(__dirname, '../..')

describe('public/library · the served copies are the rendered truth', () => {
  it.each(FLAGSHIPS.map((f) => [f.filename, f.yaml] as const))(
    '%s is byte-equal to its served file',
    (filename, yaml) => {
      const served = readFileSync(join(ROOT, 'public/library', filename), 'utf8')
      const want = yaml.endsWith('\n') ? yaml : `${yaml}\n`
      expect(served).toBe(want)
    },
  )

  it('every library item carries its registered source', () => {
    for (const item of LIBRARY) {
      expect(item.sourceUrl, item.id).toBeTruthy()
      if (item.flagship) {
        expect(item.sourceUrl).toBe(`/library/${item.filename}`)
      } else {
        /* browse wing → the spec pack blob, name-for-name */
        expect(item.sourceUrl).toBe(
          `https://github.com/supernovae-st/nika-spec/blob/main/examples/showcase/${item.id}.nika.yaml`,
        )
      }
    }
  })
})
