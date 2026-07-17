#!/usr/bin/env node
// prod-smoke.mjs — the live-site e2e: replay the sitemap (every URL → 200),
// replay the doorway stubs (redirects.json → served stub carrying the exact
// refresh target + canonical — a static host redirects client-side, the
// /docs pattern), and parse every machine twin. Honest per-failure output,
// exit 1 on any red.
//
//   node scripts/lens/prod-smoke.mjs                 # against https://nika.sh
//   node scripts/lens/prod-smoke.mjs http://localhost:4173   # against a preview
const BASE = process.argv[2] ?? 'https://nika.sh'
const fails = []

const get = (url, init = {}) => fetch(url, { signal: AbortSignal.timeout(15000), ...init })

/* 1 · sitemap replay — every published URL answers 200 */
const sitemap = await (await get(`${BASE}/sitemap.xml`)).text()
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://nika.sh', BASE))
let live = 0
for (let i = 0; i < urls.length; i += 12) {
  const batch = urls.slice(i, i + 12)
  const codes = await Promise.all(batch.map(async (u) => {
    try {
      return (await get(u)).status
    } catch {
      return 0
    }
  }))
  codes.forEach((code, j) => {
    if (code === 200) live += 1
    else fails.push(`sitemap ${batch[j]} → ${code}`)
  })
}
console.log(`sitemap: ${live}/${urls.length} × 200`)

/* 2 · doorway replay — every moved path serves its stub: 200 + an instant
   refresh naming the target + a canonical (the SPA cannot 301 on a static
   host; redirects.json is the moved→target data the compiler emits) */
const moves = await (await get(`${BASE}/redirects.json`)).json()
const entries = Array.isArray(moves) ? moves : moves.redirects ?? []
let doors = 0
for (const entry of entries) {
  const from = entry.from ?? entry.source ?? entry[0]
  const to = entry.to ?? entry.target ?? entry[1]
  try {
    const res = await get(`${BASE}${from}`)
    const html = await res.text()
    const refresh = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/)?.[1]
    const canonical = html.includes('rel="canonical"')
    if (res.status === 200 && refresh === to && canonical) doors += 1
    else fails.push(`doorway ${from} → status=${res.status} refresh=${refresh ?? '∅'} (attendu ${to})`)
  } catch (err) {
    fails.push(`doorway ${from} → ${err.message}`)
  }
}
console.log(`doorways: ${doors}/${entries.length} stubs conformes`)

/* 3 · machine twins — every agent-facing surface parses */
const MACHINE = [
  ['/errors/catalog.json', 'json'],
  ['/tools/catalog.json', 'json'],
  ['/providers/catalog.json', 'json'],
  ['/templates/catalog.json', 'json'],
  ['/ontology/language.json', 'json'],
  ['/.well-known/nika-spec-pin.json', 'json'],
  ['/schema/workflow.json', 'json'],
  ['/redirects.json', 'json'],
  ['/rss.xml', 'text'],
  ['/llms.txt', 'text'],
  ['/llms-full.txt', 'text'],
  ['/blog/intent-as-code.md', 'text'],
  ['/pagefind/pagefind.js', 'text'],
]
let twins = 0
for (const [path, kind] of MACHINE) {
  try {
    const res = await get(`${BASE}${path}`)
    if (res.status !== 200) throw new Error(`status ${res.status}`)
    const body = await res.text()
    if (kind === 'json') JSON.parse(body)
    twins += 1
  } catch (err) {
    fails.push(`machine ${path} → ${err.message}`)
  }
}
console.log(`machine twins: ${twins}/${MACHINE.length}`)

for (const f of fails) console.log(`  ✗ ${f}`)
console.log(fails.length ? `PROD SMOKE: ${fails.length} fail(s)` : 'PROD SMOKE: GREEN')
process.exit(fails.length ? 1 : 0)
