// zero-404.test.ts — a published URL never dies.
//
// The site's central migration law ("une URL publiée ne 404 jamais") was
// PROSE ONLY until 2026-08-02: it appeared in plans and in estate evidence
// strings, and nothing asserted it. The wave-1 scouts proved the gap —
// lens.test.ts only ever checked stub files under /providers/, and
// providers.test.ts pins that set to EMPTY, so the coverage was exactly
// zero. The one real doorway replay (prod-smoke) runs POST-DEPLOY: a broken
// redirect shipped to production first and was judged second.
//
// This gate judges before the push. Four laws:
//   1. every retired URL has a doorway (a stub file that really exists)
//   2. every doorway LANDS somewhere alive (the target is a served route —
//      prod-smoke never checked this, so a redirect to a dead page shipped)
//   3. no doorway shadows a live route (a served page must never be a stub)
//   4. no chain, no cycle (a doorway pointing at another doorway costs the
//      reader a second hop and eventually loops)
//
// It is the guard rail for the whole 8-worlds migration: every family that
// moves adds rows here, and this test is what makes the move safe.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PATHS } from '../../site.config'

const ROOT = join(__dirname, '../..')
type Row = { from: string; to: string; status: number; live: boolean; applies: string | null }
const manifest = JSON.parse(readFileSync(join(ROOT, 'public/redirects.json'), 'utf8')) as {
  redirects_format: number
  redirects: Row[]
}
const rows = manifest.redirects
const live = rows.filter((r) => r.live)
const routes = new Set<string>(PATHS)
const fromSet = new Set(live.map((r) => r.from))

/** the served target of a path: a prerendered route, or a real public/ file */
const isAlive = (p: string): boolean => {
  const bare = p.split('#')[0].split('?')[0]
  if (routes.has(bare)) return true
  // a file target (llms.txt, catalog.json …) is alive if the file is there
  if (/\.[a-z0-9]+$/i.test(bare)) return existsSync(join(ROOT, 'public', bare.slice(1)))
  return false
}

describe('zero-404 · a published URL never dies', () => {
  it('the manifest is a real population (a gate over nothing is not a gate)', () => {
    expect(manifest.redirects_format).toBe(1)
    expect(live.length).toBeGreaterThan(20)
  })

  it('law 1 · every retired URL has a doorway file on disk', () => {
    const missing = live
      .filter((r) => r.from !== '/sitemap') // the /sitemap stub is hand-authored (the #418 incident)
      .filter((r) => !existsSync(join(ROOT, 'public', r.from.slice(1), 'index.html')))
      .map((r) => r.from)
      .sort()
    expect(
      missing,
      `retired URLs with NO doorway file (run pnpm lens):\n${missing.join('\n')}`,
    ).toEqual([])
  })

  it('law 2 · every doorway LANDS somewhere alive', () => {
    // prod-smoke checks the stub answers 200 and carries the right target —
    // it never checks the TARGET. A doorway onto a dead page is a 404 with
    // an extra hop, which is worse than an honest 404.
    const dead = live
      .filter((r) => !isAlive(r.to))
      .map((r) => `${r.from} → ${r.to}`)
      .sort()
    expect(dead, `doorways landing on nothing:\n${dead.join('\n')}`).toEqual([])
  })

  it('law 3 · no doorway shadows a served route', () => {
    const shadow = live
      .filter((r) => routes.has(r.from))
      .map((r) => r.from)
      .sort()
    expect(
      shadow,
      `a served page is ALSO a doorway (the redirect wins and the page is unreachable):\n${shadow.join('\n')}`,
    ).toEqual([])
  })

  /* laws 2-4 OVERLAP by construction, and that is deliberate: a chained
     doorway is also a doorway onto a non-route, so law 2 fires first on the
     mutation test. Law 4 survives for its MESSAGE — "retarget at the living
     heir" is the actionable sentence; "landing on nothing" is not. */
  it('law 4 · no chain and no cycle (one hop, always)', () => {
    const chained = live
      .filter((r) => fromSet.has(r.to.split('#')[0]))
      .map((r) => `${r.from} → ${r.to} (itself a doorway)`)
      .sort()
    expect(
      chained,
      `chained doorways — retarget them at the LIVING heir:\n${chained.join('\n')}`,
    ).toEqual([])
  })

  it('law 5 · every from is unique (two rows, one door, undefined winner)', () => {
    const seen = new Map<string, number>()
    for (const r of rows) seen.set(r.from, (seen.get(r.from) ?? 0) + 1)
    const dupes = [...seen].filter(([, n]) => n > 1).map(([f]) => f).sort()
    expect(dupes, `duplicate doorway rows:\n${dupes.join('\n')}`).toEqual([])
  })

  it('the manifest is codepoint-sorted (same sources ⇒ same bytes on any machine)', () => {
    // build-lens sorted with localeCompare until 2026-08-02 while lens.test
    // byte-diffs this file: ICU collation varies per machine and Node build.
    const froms = rows.map((r) => r.from)
    expect(froms).toEqual([...froms].sort())
  })
})
