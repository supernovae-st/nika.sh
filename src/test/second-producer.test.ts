import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── the second-producer gate ─────────────────────────────────────────────────
   THE CLASS: two places computing the same thing. It never breaks on the day
   the copy is made — both copies are identical then. It breaks on the day one
   of them grows a clause. This codebase has now been bitten four times:

     · the locale rail   — /manifesto hand-listed its languages while the
                           registry knew them; /install got none at all
     · the clock list    — /map read ['builtins','providers'] and printed
                           « the two clocks agree » while `grammar` disagreed
                           and /sources said so on the same build
     · the 3D gate       — VerbGlyphTile copied wide+motion+WebGL and never
                           grew prefersLiteData, so Save-Data visitors pulled
                           three.js on the home page
     · fmtTokens         — /providers and /providers/:id formatted the same
                           numbers through two private copies

   The first two were hand-written LISTS shadowing derived data; the last two
   were duplicated FUNCTIONS. This gate catches the function half mechanically:
   a name defined in two or more non-test, non-generated modules must be on
   the allowlist below, with its reason written down. A new duplicate is a
   decision, not an accident.

   The allowlist is not a hall of shame — most entries are legitimately local.
   It exists so the cost of adding one is reading this list and justifying
   yourself in it. */

const ROOT = join(__dirname, '../..')

/** duplicate definitions that are DELIBERATE, each with the reason it stands */
const ALLOWED: Record<string, string> = {
  Shell:
    'a scene-local mount shell, one per scene file (drum sphere · part viewer · tool drum) — same role, different scene, never shared',
  hexRgb: 'three lines of pure colour splitting, local to two scene model files',
  mulberry32: 'a three-line seeded PRNG; sharing it would couple fx/ to fx/dotmatrix for nothing',
  quatFromBasis: 'small pure quaternion math, local to two scene model files',
  inline:
    'a name collision, not a duplicate: blog-render interpolates markdown, i18n-inline interpolates locale copy',
  SectionHead:
    'a name collision, not a duplicate: components/SectionHead is the v4sec masthead, ToolPage has a local cl-year-head row',
}

const files: string[] = []
;(function walk(dir: string) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name)
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel)
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) && !/\.generated\./.test(name)) {
      files.push(rel)
    }
  }
})('src')

/** function declarations per file, comments stripped so prose never counts */
function declared(file: string): string[] {
  const src = readFileSync(join(ROOT, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
  return [...src.matchAll(/^\s*(?:export\s+)?function\s+(\w+)\s*\(/gm)].map((m) => m[1])
}

/* `Component` in src/pages is the ROUTE CONTRACT, not a duplicate: routes.tsx
   references every page through it, and the prerenderer needs it synchronous.
   Excluded structurally rather than allowlisted — forty page files are not a
   decision anyone should have to re-justify. */
const isRouteContract = (name: string, file: string) =>
  name === 'Component' && file.startsWith('src/pages/')

const homes = new Map<string, Set<string>>()
for (const f of files) {
  for (const name of declared(f)) {
    if (isRouteContract(name, f)) continue
    if (!homes.has(name)) homes.set(name, new Set())
    homes.get(name)!.add(f)
  }
}

describe('second producer · one thing computed in one place', () => {
  it('sees the module graph at all (a gate over nothing is not a gate)', () => {
    expect(files.length).toBeGreaterThan(50)
    expect(homes.size).toBeGreaterThan(50)
  })

  it('no undeclared duplicate definition', () => {
    const strays = [...homes]
      .filter(([name, where]) => where.size > 1 && !(name in ALLOWED))
      .map(([name, where]) => `${name} · ${[...where].join(' + ')}`)
    expect(
      strays,
      `a second producer appeared. Share it, or add it to ALLOWED with the reason it stands:\n${strays.join('\n')}`,
    ).toEqual([])
  })

  it('the allowlist stays honest (an entry that no longer duplicates is deleted)', () => {
    const stale = Object.keys(ALLOWED).filter((name) => (homes.get(name)?.size ?? 0) < 2)
    expect(stale, `ALLOWED entries that no longer duplicate — delete them: ${stale.join(', ')}`).toEqual([])
  })
})
