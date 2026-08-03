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
//   9 no cul-de-sac            (every served page owes one door onward,
//                                judged outside the chrome)
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

/* 7 · rss carries exactly the blog POSTS · a doorway stub under /blog is a
   redirect, never a post (the parent-cover rows for /blog/tags and
   /blog/series landed as rendered stubs and this counter read them as two
   phantom posts · 2026-08-03 — the structural filter is the stub's own
   generator marker, so any future doorway stays excluded) */
const rssItems = (readFileSync(join(DIST, 'rss.xml'), 'utf8').match(/<item>/g) ?? []).length
const blogPages = Object.entries(html).filter(
  ([r, h]) => /^\/blog\/[^/]+$/.test(r) && !h.includes('nika-lens-doorway'),
).length
if (rssItems !== blogPages) fails.push(`rss ${rssItems} != blog ${blogPages}`)

/* 8 · waiver liquidation (G.12): anchors_exist:false while the served page
   already carries the member's anchor — the waiver is stale, flip it to
   true. Members come from the SERVED TWIN (dist/ontology/language.json):
   the sweep's own review caught the first version reading only inline
   descriptor rows, which every derived-member set lacks — the check was
   silently inert for exactly the five sets it existed to watch. */
const descriptor = readFileSync(join(ROOT, 'scripts/lens/graph/sets.yaml'), 'utf8')
const twin = JSON.parse(readFileSync(join(DIST, 'ontology/language.json'), 'utf8'))
const anchorsBySet = new Map()
for (const node of twin.nodes) {
  if (node.kind !== 'member' || !node.set || !node.anchor) continue
  const bucket = anchorsBySet.get(node.set) ?? []
  bucket.push({ anchor: node.anchor, page: (node.url ?? '').split('#')[0] })
  anchorsBySet.set(node.set, bucket)
}
for (const block of descriptor.split(/\n(?=  - id: )/)) {
  if (!/anchors_exist:\s*false/.test(block)) continue
  const setId = block.match(/- id:\s*(\S+)/)?.[1]
  for (const m of anchorsBySet.get(setId) ?? []) {
    if (m.page && ids[m.page]?.has(m.anchor)) {
      fails.push(`waiver-périmé ${setId}: #${m.anchor} served on ${m.page} — flip anchors_exist: true`)
    }
  }
}

/* 9 · no served page is a CUL-DE-SAC (the topology ratchet, 2026-07-26).
   Check 1 proves every link RESOLVES; nothing proved a page had any. Three
   routes had zero outbound page links in their body — /brand and /convert
   (real pages a reader entered and could only leave by the chrome) and the
   /install cluster's seven translations, which the head announced and the
   page never walked to. A graph whose leaves are dead ends is a hub, not a
   graph: every page owes at least one door onward.

   Judged on the BODY (the site header/footer carry chrome links on every
   page — chrome is not editorial interconnection, and counting it would
   make this check inert by construction). The redirect stubs are exempt by
   what they ARE: a noindex meta-refresh shell is a doorway, not a room. */
const CHROME = [/<header[\s\S]*?<\/header>/gi, /<footer[\s\S]*?<\/footer>/gi]
for (const [r, h] of Object.entries(html)) {
  if (/http-equiv="refresh"/i.test(h)) continue // a redirect stub is a doorway
  const body = CHROME.reduce((s, re) => s.replace(re, ''), h)
  const onward = new Set(
    [...body.matchAll(/href="(\/[^"#?]*)/g)]
      .map((m) => m[1].replace(/\/$/, '') || '/')
      .filter((p) => !/\.[a-z0-9]+$/i.test(p) && !p.startsWith('/assets/') && p !== r),
  )
  if (!onward.size) fails.push(`cul-de-sac ${r}: no outbound page link outside the chrome`)
}

/* 10 · an announced cluster is a WALKABLE cluster (the topology ratchet's
   sister). /install carried a seven-language hreflang cluster in its head
   and not one link to it on the page: crawlers were told, readers were not,
   and the seven translations sat body-orphaned behind ⌘K and /map. If a
   page announces siblings, its body walks to every one of them.

   Derived from the SERVED BYTES — the page's own hreflang block, not the
   registry: whatever a page claims to a crawler, it owes to a reader. */
for (const [r, h] of Object.entries(html)) {
  const siblings = [...h.matchAll(/<link[^>]+rel="alternate"[^>]*>/gi)]
    .filter((m) => /hreflang="(?!x-default)/i.test(m[0]))
    .map((m) => m[0].match(/href="([^"]+)"/)?.[1])
    .map((href) => (href ? href.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/' : null))
    .filter((p) => p && p !== r)
  if (!siblings.length) continue
  const body = CHROME.reduce((s, re) => s.replace(re, ''), h)
  const missing = [...new Set(siblings)].filter((p) => !body.includes(`href="${p}"`))
  if (missing.length) {
    fails.push(`cluster-muet ${r}: announces ${missing.join(' ')} to crawlers, links none to readers`)
  }
}

console.log(`integrity-sweep: ${pages.length} pages · ${sitemap.size} in sitemap · ${fails.length} fail(s)`)
for (const f of fails) console.log(`  ✗ ${f}`)
process.exit(fails.length ? 1 : 0)
