import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PATHS } from '../../site.config'

/* ─── the parent-cover law · a child page proves its whole lineage ───────────
   Operator ruling 2026-08-03: « si y'a des pages, leurs parents slug doivent
   exister — et ça tout le temps ». A URL is an address people TRIM:
   /language/words/config existed while /language/words was a 404 — the exact
   trimmed-URL dead end the /types incident (2026-07-24) fixed for the lens
   families with FamilyRoot, without ever generalizing the law. This gate is
   the generalization: for EVERY served path, every ancestor prefix must be
   COVERED — served itself, or a living redirect (the doorway stubs serve the
   trimmed reader either way). A new family with rooms and no roof goes red
   HERE, with its orphans named, before a visitor ever finds the hole. */

const ROOT = join(__dirname, '../..')

describe('parent-cover · every served page proves its lineage', () => {
  it('every ancestor of every served path is served or redirected', () => {
    const redirects = (
      JSON.parse(readFileSync(join(ROOT, 'public/redirects.json'), 'utf8')) as {
        redirects: { from: string }[]
      }
    ).redirects.map((r) => r.from)
    const covered = new Set<string>([...PATHS, ...redirects])
    const orphans = new Map<string, string[]>()
    for (const p of PATHS) {
      const segs = p.split('/').filter(Boolean)
      for (let depth = 1; depth < segs.length; depth++) {
        const ancestor = `/${segs.slice(0, depth).join('/')}`
        if (!covered.has(ancestor)) {
          const kids = orphans.get(ancestor) ?? []
          if (kids.length < 3) kids.push(p)
          orphans.set(ancestor, kids)
        }
      }
    }
    const report = [...orphans.entries()]
      .map(([a, kids]) => `${a} (child: ${kids[0]})`)
      .sort()
      .join('\n  ')
    expect(
      orphans.size,
      `orphan parents — a trimmed URL 404s over living children; add a parent-cover row (sets.yaml legacy_moves) or a real page:\n  ${report}`,
    ).toBe(0)
  })
})
