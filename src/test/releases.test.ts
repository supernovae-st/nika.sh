import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RELEASES } from '../content/releases.generated'
import { RELEASE_TAGS } from '../content/release-tags.generated'
import { RELEASE_PATHS, PATHS } from '../../site.config'
import { CHANGELOG } from '../content/changelog'
import { ENGINE_VERSION } from '../content'

/* ─── /releases · the record cannot drift from its sources ───────────────────
   public/releases/catalog.json is vendored DELIBERATELY from the public
   GitHub releases record (train cadence); releases.generated.ts is its
   compiled projection; RELEASE_PATHS derives the rooms. The build-releases
   --check half lives in pnpm check; these gates pin the cross-register
   truths a byte-diff cannot see. */

const ROOT = join(__dirname, '../..')
const ENGINE = /^v(\d+\.\d+\.\d+) · /

describe('/releases · the record and its rooms', () => {
  it('the projection matches the vendored catalog (count · tags · order)', () => {
    const doc = JSON.parse(readFileSync(join(ROOT, 'public/releases/catalog.json'), 'utf8')) as {
      count: number
      releases: { tag: string }[]
    }
    expect(doc.count).toBe(doc.releases.length)
    expect(RELEASES.length).toBe(doc.count)
    expect(RELEASE_TAGS).toEqual(doc.releases.map((r) => r.tag))
  })

  it('every tag is a published semver, once', () => {
    for (const t of RELEASE_TAGS) expect(t, `${t} is not a vN.N.N tag`).toMatch(/^v\d+\.\d+\.\d+$/)
    expect(new Set(RELEASE_TAGS).size).toBe(RELEASE_TAGS.length)
  })

  it('every release has its room in PATHS (and the hub prerenders)', () => {
    expect(PATHS).toContain('/releases')
    expect(RELEASE_PATHS).toEqual(RELEASE_TAGS.map((t) => `/releases/${t}`))
    for (const p of RELEASE_PATHS) expect(PATHS, `${p} not prerendered`).toContain(p)
  })

  it('the pinned release has a room (the catalog names its source)', () => {
    expect(RELEASE_TAGS, `${ENGINE_VERSION} has no room`).toContain(ENGINE_VERSION)
  })

  it('every ship-log engine entry has its room (the two registers agree)', () => {
    for (const e of CHANGELOG) {
      const hit = e.title.match(ENGINE)
      if (!hit) continue
      expect(RELEASE_TAGS, `ship log names v${hit[1]} but the record has no room`).toContain(
        `v${hit[1]}`,
      )
    }
  })

  it('the newest room is the newest ship-log engine entry (one truth, two voices)', () => {
    const newestLog = CHANGELOG.map((e) => e.title.match(ENGINE)).find(Boolean)!
    expect(RELEASE_TAGS[0]).toBe(`v${newestLog[1]}`)
  })

  it('the record stays behind its door (bundle safety · the adrs-access law)', () => {
    /* releases.generated reaches the client as an async chunk through
       releases-access only; site.config imports the tree-shaken tag list.
       A static import anywhere else puts the record in the entry bundle. */
    /* sitemap.ts (the /map census) and this judge import the tree-shaken
       RELEASE_TAGS names only — the record itself never rides with them */
    const allowed = new Set([
      'src/lib/releases-access.ts',
      'src/test/releases.test.ts',
      'src/content/sitemap.ts',
    ])
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const rel = `${dir}/${name}`
        const full = join(ROOT, rel)
        if (statSync(full).isDirectory()) walk(rel)
        else if (/\.(ts|tsx)$/.test(name) && !allowed.has(rel)) {
          const src = readFileSync(full, 'utf8')
          /* `import type` erases at compile time — only VALUE imports weigh */
          if (/^import (?!type\b)[^;\n]*from '[^']*content\/releases\.generated'/m.test(src))
            offenders.push(rel)
        }
      }
    }
    walk('src')
    expect(offenders, `static import of releases.generated outside its door`).toEqual([])
  })
})
