import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — the compiler is the untyped build script itself (the
// palette gate's pattern: same code path, recompile and diff)
import { readBlogSourceSnapshot, applyCanonMarkers, canonValues } from '../../scripts/build-blog.mjs'
import { BLOG_POSTS } from '../content/blog.generated'

/* ── the markdown-twin drift gate (§2c) ──────────────────────────────────────
   Every post serves its source beside the page: /blog/<slug>.md is the
   frontmatter-kept, canon-RESOLVED projection of content/blog/<file>.md.
   A post edited without `node scripts/build-blog.mjs` goes red here — the
   twin can never silently lag the page it mirrors. */

const ROOT = join(__dirname, '../..')

describe('/blog/<slug>.md · the served twins are the resolved sources', () => {
  const canon = canonValues()
  const sources = readBlogSourceSnapshot() as Array<{ file: string; raw: string }>

  it('every post has its twin, byte-exact', () => {
    expect(sources.length).toBe(BLOG_POSTS.length)
    for (const { file, raw } of sources) {
      const slug = raw.match(/^---\n[\s\S]*?\bslug:\s*"?([a-z0-9-]+)"?/)?.[1] ?? file.replace(/\.md$/, '')
      const twin = join(ROOT, `public/blog/${slug}.md`)
      expect(existsSync(twin), `${slug}.md served`).toBe(true)
      expect(readFileSync(twin, 'utf8'), `${slug}.md byte-exact`).toBe(applyCanonMarkers(raw, canon, file))
    }
  })

  it('every twin belongs to a live post (no orphan twin survives a rename)', () => {
    const slugs = new Set(BLOG_POSTS.map((p) => p.slug))
    for (const f of readdirSync(join(ROOT, 'public/blog'))) {
      expect(slugs.has(f.replace(/\.md$/, '')), `orphan twin: ${f}`).toBe(true)
    }
  })
})
