import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHECK_VERDICTS, VERDICT_ENGINE } from '../content/check-verdicts.generated'

/* ── the receipt's gates ──────────────────────────────────────────────────────
   The panel shows what the BINARY said about a file. That is only worth
   anything if the capture cannot drift from the binary, and if the thing we
   render is a property of the FILE rather than of the machine that ran check.

   The re-capture gate skips where `nika` is absent (a fresh CI checkout has no
   engine on PATH) — the same skipIf shape gate-matrix uses for its spec
   sibling. It is the developer's machine and the release runner that hold the
   binary, and that is where drift is caught. */

const ROOT = join(__dirname, '../..')
const hasNika = (() => {
  try {
    execFileSync('nika', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe('check verdicts · the receipt cannot drift from the binary', () => {
  it('every hero flagship joins a captured verdict by its served filename', async () => {
    /* the hero's verdict strip joins CHECK_VERDICTS on the flagship's served
       filename (minus extension), because flagship ids are snake_case while
       verdicts key on the workflow id parsed from the yaml. The first draft
       joined on the id, matched nothing, and rendered for nobody — silently.
       This pins the join: a renamed library file or a diverging workflow id
       goes red here instead of quietly blanking the hero. */
    const { FLAGSHIP_ENTRIES } = await import('../flagships')
    for (const f of FLAGSHIP_ENTRIES) {
      const key = f.filename.replace('.nika.yaml', '')
      expect(CHECK_VERDICTS[key], `no captured verdict for ${f.filename}`).toBeDefined()
    }
  })

  it('every shipped library workflow has a captured verdict', () => {
    const ids: string[] = []
    for (const name of readdirSync(join(ROOT, 'public/library'))) {
      if (!name.endsWith('.nika.yaml')) continue
      const yaml = readFileSync(join(ROOT, 'public/library', name), 'utf8')
      const id = /^workflow:\s*\n\s+id:\s*(\S+)/m.exec(yaml)?.[1]
      expect(id, `${name} has no workflow id`).toBeTruthy()
      ids.push(id!)
    }
    expect(ids.length).toBeGreaterThan(4)
    for (const id of ids) expect(CHECK_VERDICTS[id], `no verdict for ${id}`).toBeDefined()
  })

  it('a verdict states real dimensions (a receipt for nothing is not a receipt)', () => {
    for (const [id, v] of Object.entries(CHECK_VERDICTS)) {
      expect(v.tasks, `${id} tasks`).toBeGreaterThan(0)
      expect(v.waves, `${id} waves`).toBeGreaterThan(0)
      expect(v.waves, `${id}: waves cannot exceed tasks`).toBeLessThanOrEqual(v.tasks)
      expect(v.hints, `${id} hints`).toBeGreaterThanOrEqual(0)
    }
    expect(VERDICT_ENGINE).toMatch(/^\d+\.\d+\.\d+$/)
  })

  /* THE HONESTY GATE. `daily-brief` emits three [inputs] hints that say a path
     "does not exist HERE" — true of the machine check ran on, false of the
     file, and meaningless to a reader on the website. If those were ever
     captured, the site would show a receipt for a claim about somebody else's
     filesystem. daily-brief must therefore read ZERO hints. */
  it('environmental hints never reach the page', () => {
    expect(CHECK_VERDICTS['daily-brief']?.hints).toBe(0)
  })

  it.skipIf(!hasNika)('the capture is exactly what the binary emits today', () => {
    const before = readFileSync(join(ROOT, 'src/content/check-verdicts.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-check-verdicts.mjs')], { stdio: 'pipe' })
    const after = readFileSync(join(ROOT, 'src/content/check-verdicts.generated.ts'), 'utf8')
    expect(after).toBe(before)
  })

  it.skipIf(!hasNika)('the pinned engine is the engine on PATH', () => {
    const live = execFileSync('nika', ['--version'], { encoding: 'utf8' }).trim().split(/\s+/).pop()
    expect(VERDICT_ENGINE).toBe(live)
  })
})
