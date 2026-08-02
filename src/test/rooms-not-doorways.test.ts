import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS } from '../../site.config'
import { ROOM_BASES } from '../content/lens-bases.generated'
import { wordRoom, verbRoom, builtinRoom, errorRoom, skeletonRoom, jobRoom } from '../lib/rooms'

const ROOT = join(__dirname, '../..')

/* ─── a link lands on a ROOM, never on a doorway ────────────────────────────
   The words moved to /language/words/<word> and eight files kept building
   /language/<word>. Every link still worked — the doorways caught them — so
   nothing went red, and 63 rooms read as unreachable to anything that counts
   links. A doorway is a promise to a crawler that remembers an old URL, not
   an address the site should hand its own readers.

   These laws hold the repair:
     1 · every builder produces a SERVED path, not a retired one
     2 · no page builds a family's href from a literal base
     3 · the projected bases match what the site actually serves */

describe('the room builders', () => {
  it('produce served paths, never doorways', () => {
    const served = new Set(PATHS)
    const retired = new Set(
      (
        JSON.parse(readFileSync(join(ROOT, 'public/redirects.json'), 'utf8')) as {
          redirects: { from: string }[]
        }
      ).redirects.map((r) => r.from),
    )
    const samples = [
      wordRoom('after'),
      verbRoom('infer'),
      builtinRoom('fetch'),
      errorRoom('NIKA-PARSE-001'),
      skeletonRoom('chain'),
      jobRoom('price-watch'),
    ]
    for (const href of samples) {
      expect(retired.has(href), `${href} is a doorway, not a room`).toBe(false)
      expect(served.has(href), `${href} is not served`).toBe(true)
    }
  })

  /* THE RATCHET (the voice-test pattern). 42 hand-written family bases were
     already in the tree when the words broke; converting all of them in one
     pass at the end of a long day is how a mechanical refactor ships a
     regression. The population is pinned instead: it may shrink, never grow.
     The WORD base — the one that actually broke — is held at zero below. */
  const CEILING = 42

  it('never grows the population of hand-written family bases', () => {
    const offenders: string[] = []
    const bases = Object.values(ROOM_BASES)
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (/\.tsx?$/.test(e.name) && !full.endsWith('lib/rooms.ts')) {
          const src = readFileSync(full, 'utf8')
          for (const b of bases) {
            /* `${base}/${x}` written by hand · the template form is what a
               link builder produces, so only interpolated literals count */
            const re = new RegExp(`['"\`]${b}/\\$\\{`)
            if (re.test(src)) offenders.push(`${full.slice(ROOT.length + 1)} → ${b}/\${…}`)
          }
        }
      }
    }
    walk(join(ROOT, 'src'))
    expect(
      offenders.length,
      `hand-written family bases grew to ${offenders.length}:\n  ${offenders.join('\n  ')}`,
    ).toBeLessThanOrEqual(CEILING)
  })

  it('holds the WORD base at zero · the one that shipped 63 doorway links', () => {
    const offenders: string[] = []
    const wordBase = ROOM_BASES.words
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (/\.tsx?$/.test(e.name) && !full.endsWith('lib/rooms.ts')) {
          const src = readFileSync(full, 'utf8')
          /* both spellings: the base it moved TO, and the base it moved FROM
             (a page that still writes /language/${w} is the original bug) */
          if (new RegExp(`['"\`]${wordBase}/\\$\\{`).test(src)) offenders.push(full.slice(ROOT.length + 1))
          if (/['"`]\/language\/\$\{/.test(src)) offenders.push(`${full.slice(ROOT.length + 1)} (the RETIRED base)`)
        }
      }
    }
    walk(join(ROOT, 'src'))
    expect(offenders).toEqual([])
  })

  it('project bases the site actually serves', () => {
    const served = new Set(PATHS)
    for (const [family, base] of Object.entries(ROOM_BASES)) {
      const anyRoom = [...served].some((p) => p.startsWith(`${base}/`))
      expect(anyRoom, `${family} projects ${base} and nothing is served under it`).toBe(true)
    }
  })
})
