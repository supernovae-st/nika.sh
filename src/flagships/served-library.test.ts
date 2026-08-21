import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { FLAGSHIPS } from './flagship-data'
import { buildLibrary } from './library'
import { SHOWCASE_YAML } from '../sections/usecases-yaml.generated'

const LIBRARY = buildLibrary(SHOWCASE_YAML)

/* ── the served library · the recorded seven ARE files (operator 2026-07-13) ──
   Every yaml on the site points at its registered source. The browse wing
   points at the nika-spec pack; the recorded seven point at their own
   SERVED copy under public/library/ — which therefore must be byte-equal
   to the module the site renders, or the « source » link lies.
   The served copy alone carries the SPDX preamble (G.17): the licence
   travels with the downloadable file; the rendered hero stays the bare
   workflow. Exactly that two-line comment header is the tolerated delta. */

const ROOT = join(__dirname, '../..')

const SPDX_PREAMBLE
  = '# SPDX-License-Identifier: Apache-2.0\n# © SuperNovae Studio · nika.sh/library\n'

interface DailyBriefTask {
  infer?: { max_tokens?: number }
  invoke?: { tool?: string, args?: { condition?: string } }
  after?: Record<string, string>
}

interface DailyBriefDoc {
  permits?: { tools?: string[] }
  tasks?: Record<string, DailyBriefTask>
}

describe('public/library · the served copies are the rendered truth', () => {
  it.each(FLAGSHIPS.map((f) => [f.filename, f.yaml] as const))(
    '%s is byte-equal to its served file',
    (filename, yaml) => {
      const served = readFileSync(join(ROOT, 'public/library', filename), 'utf8')
      expect(served.startsWith(SPDX_PREAMBLE), `${filename} carries the SPDX preamble`).toBe(true)
      const want = yaml.endsWith('\n') ? yaml : `${yaml}\n`
      expect(served.slice(SPDX_PREAMBLE.length)).toBe(want)
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
          `https://github.com/supernovae-st/nika-spec/blob/main/examples/${item.id}.nika.yaml`,
        )
      }
    }
  })

  it('daily-brief cannot persist a reasoning-starved empty answer', () => {
    const flagship = FLAGSHIPS.find((item) => item.id === 'daily_brief')
    expect(flagship).toBeDefined()
    const doc = parse(flagship?.yaml ?? '') as DailyBriefDoc
    const tasks = doc.tasks ?? {}

    expect(doc.permits?.tools).toContain('nika:assert')
    expect([
      tasks.triage?.infer?.max_tokens,
      tasks.agenda?.infer?.max_tokens,
      tasks.draft?.infer?.max_tokens,
    ]).toEqual([2048, 2048, 2048])
    expect(tasks.verify?.invoke?.tool).toBe('nika:assert')
    expect(tasks.verify?.invoke?.args?.condition).toBe('${{ size(with.draft) > 0 }}')
    expect(tasks.save?.after).toEqual({ verify: 'success' })
  })
})
