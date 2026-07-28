import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── the private-path gate ────────────────────────────────────────────────────
   This repo is PUBLIC. The workspace it is developed inside is not, and on
   2026-07-28 two agent-written design docs were committed and pushed carrying
   its grammar: a private doctrine file cited by path AND quoted verbatim, a
   private strategy-pole path, and seven absolute /Users/... paths that mapped
   the private monorepo's layout. Review caught it hours later; review is not
   a gate. This is the gate.

   The patterns are the BANNED grammar, not a blocklist of incidents: absolute
   home paths, the private tooling tree, the private venture poles, and the
   private monorepo root form. The public submodule mount grammar
   (ventures/nika/02-engineering/repos/...) stays allowed — sibling-resolution
   paths in tests legitimately carry it.

   Every pattern is built by concatenation so this file can never flag
   itself, and the walk skips it anyway — belt and braces. */

const ROOT = join(__dirname, '../..')

/* built, never written literally (see above) */
const S = '/'
const BANNED: { re: RegExp; why: string }[] = [
  { re: new RegExp(`${S}Users${S}`), why: 'an absolute home path maps the private machine' },
  {
    re: new RegExp(`(^|[^A-Za-z0-9_])${'d' + 'x'}${S}`, 'm'),
    why: 'the private monorepo tooling tree',
  },
  { re: new RegExp(`0${'1-product'}`), why: 'a private venture pole' },
  { re: new RegExp(`0${'4-identity'}`), why: 'a private venture pole' },
  { re: new RegExp(`0${'8-chronicle'}`), why: 'a private venture pole' },
  { re: new RegExp(`02-engineering${S}${'docs'}(?!\\.)`), why: 'a private venture pole' },
  { re: new RegExp(`02-engineering${S}${'architecture'}`), why: 'a private venture pole' },
  { re: new RegExp(`supernovae${S}${'ventures'}`), why: 'the private monorepo root form' },
]

const SCAN_EXT = /\.(md|ts|tsx|css|mjs|txt|html|yaml)$/
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'golden'])
const SELF = 'no-private-paths.test.ts'

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (SCAN_EXT.test(name) && !name.includes('.generated.') && name !== SELF) yield path
  }
}

describe('the public repo never carries the private grammar', () => {
  it('finds no banned path form in any authored text file', () => {
    const offences: string[] = []
    for (const root of ['docs', 'src', 'scripts', 'content', 'public']) {
      for (const file of walk(join(ROOT, root))) {
        const body = readFileSync(file, 'utf8')
        for (const { re, why } of BANNED) {
          const m = body.match(re)
          if (m) offences.push(`${relative(ROOT, file)} · ${JSON.stringify(m[0])} (${why})`)
        }
      }
    }
    for (const file of readdirSync(ROOT)) {
      if (!SCAN_EXT.test(file)) continue
      const body = readFileSync(join(ROOT, file), 'utf8')
      for (const { re, why } of BANNED) {
        const m = body.match(re)
        if (m) offences.push(`${file} · ${JSON.stringify(m[0])} (${why})`)
      }
    }
    expect(offences, `private grammar in a PUBLIC repo:\n${offences.join('\n')}`).toEqual([])
  })
})
