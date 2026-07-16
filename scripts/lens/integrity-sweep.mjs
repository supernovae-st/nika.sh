#!/usr/bin/env node
// integrity-sweep.mjs — the post-build integrity gate (G.11 + G.12).
// Judges the RENDERED dist the way a reader meets it: every internal link
// resolves, every anchor exists, JSON-LD parses, indexing state is coherent,
// and stale descriptor waivers self-liquidate. Born as the freeze sweep that
// caught the pt-br title dup and the half-declared /ontology/design page.
//
//   node scripts/lens/integrity-sweep.mjs          (after pnpm build)
//
// Checks:
//   1 dead internal links      2 anchors (same-page + cross-page)
//   3 duplicate ids            4 JSON-LD parses
//   5 noindex ∩ sitemap = ∅    6 title uniqueness across the sitemap
//   7 rss items == blog pages  8 waiver liquidation (anchors_exist:false
//                                but the member id is served on its page —
//                                the descriptor must flip to true)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DIST = join(ROOT, 'dist')
if (!existsSync(DIST)) {
  console.error('integrity-sweep: no dist/ — run pnpm build first')
  process.exit(2)
}

const pages = []
;(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path)
    else if (entry === 'index.html') pages.push(path)
  }
})(DIST)

const route = (path) => path.slice(DIST.length).replace(/\/index\.html$/, '') || '/'
const html = Object.fromEntries(pages.map((p) => [route(p), readFileSync(p, 'utf8')]))
const ids = Object.fromEntries(
  Object.entries(html).map(([r, h]) => [r, new Set([...h.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))]),
)
const fails = []

/* 1+2 · internal links + anchors (query strings are not part of the path) */
for (const [r, h] of Object.entries(html)) {
  for (const m of h.matchAll(/href="([^"]+)"/g)) {
    let url = m[1]
    if (/^(mailto:|data:|#|http(?!s:\/\/nika\.sh)|\/\/)/.test(url)) {
      if (url.startsWith('#') && url.length > 1 && !ids[r].has(url.slice(1))) {
        fails.push(`anchor ${r} → ${url}`)
      }
      continue
    }
    url = url.replace('https://nika.sh', '') || '/'
    if (!url.startsWith('/')) continue
    const [pathAndQuery, fragment] = url.split('#')
    const base = pathAndQuery.split('?')[0]
    const clean = base.replace(/\/$/, '') || '/'
    if (!(clean in html) && !existsSync(join(DIST, base.replace(/^\//, '')))) {
      fails.push(`dead ${r} → ${url}`)
    } else if (fragment && clean in ids && !ids[clean].has(fragment)) {
      fails.push(`anchor ${r} → ${url}`)
    }
  }
}

/* 3 · duplicate ids within a page */
for (const [r, h] of Object.entries(html)) {
  const seen = new Map()
  for (const m of h.matchAll(/\bid="([^"]+)"/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1)
  for (const [id, n] of seen) if (n > 1) fails.push(`dup-id ${r} #${id} ×${n}`)
}

/* 4 · every JSON-LD block parses */
for (const [r, h] of Object.entries(html)) {
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1])
    } catch {
      fails.push(`jsonld ${r}`)
    }
  }
}

/* 5 · a sitemap page never carries noindex */
const sitemap = new Set(
  [...readFileSync(join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace('https://nika.sh', '') || '/'),
)
for (const r of sitemap) {
  if (html[r]?.includes('name="robots" content="noindex"')) fails.push(`noindex-in-sitemap ${r}`)
}

/* 6 · titles are unique across the sitemap */
const titles = new Map()
for (const r of sitemap) {
  const t = html[r]?.match(/<title>([^<]*)<\/title>/)?.[1]
  if (t) titles.set(t, [...(titles.get(t) ?? []), r])
}
for (const [t, routes] of titles) if (routes.length > 1) fails.push(`title-dup "${t}" ← ${routes.join(' ')}`)

/* 7 · rss carries exactly the blog pages */
const rssItems = (readFileSync(join(DIST, 'rss.xml'), 'utf8').match(/<item>/g) ?? []).length
const blogPages = Object.keys(html).filter((r) => /^\/blog\/[^/]+$/.test(r)).length
if (rssItems !== blogPages) fails.push(`rss ${rssItems} != blog ${blogPages}`)

/* 8 · waiver liquidation (G.12): anchors_exist:false while the served page
   already carries the member's id — the waiver is stale, flip it to true */
const descriptor = readFileSync(join(ROOT, 'scripts/atlas/sets.yaml'), 'utf8')
for (const block of descriptor.split(/\n(?=  - id: )/)) {
  if (!/anchors_exist:\s*false/.test(block)) continue
  const setId = block.match(/- id:\s*(\S+)/)?.[1]
  const page = block.match(/anchor_page:\s*(\S+)/)?.[1]
  if (!page || !(page in html)) continue
  for (const m of block.matchAll(/^\s+- \{ id:\s*([^,}\s]+)/gm)) {
    if (ids[page]?.has(m[1])) {
      fails.push(`waiver-périmé ${setId}: #${m[1]} served on ${page} — flip anchors_exist: true`)
    }
  }
}

console.log(`integrity-sweep: ${pages.length} pages · ${sitemap.size} in sitemap · ${fails.length} fail(s)`)
for (const f of fails) console.log(`  ✗ ${f}`)
process.exit(fails.length ? 1 : 0)
