/* check-record-links · the record's law, executable (ported from the
   exitchatcontrol link-rot harness · same tolerance model).
   Probes every https source in src/content/manifesto-record.ts:
   404 / DNS failure / 5xx = FAIL (exit 1) · 403/429/401 bot-walls = WARN
   (tolerated: the source exists, it just dislikes robots).
   Run: node scripts/check-record-links.mjs */
import { readFileSync } from 'node:fs'

const src = readFileSync('src/content/manifesto-record.ts', 'utf8')
const urls = [...new Set([...src.matchAll(/https:\/\/[^\s'"]+/g)].map((m) => m[0]))]
const UA = 'Mozilla/5.0 (Macintosh) nika-record-link-check'

let fail = 0
let warn = 0
const probe = async (url) => {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': UA, accept: 'text/html,*/*' },
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) return { s: 'ok', code: res.status }
      if ([401, 403, 429].includes(res.status)) return { s: 'warn', code: res.status }
      if (method === 'GET') return { s: 'fail', code: res.status }
    } catch (e) {
      if (method === 'GET') return { s: 'fail', code: e.name === 'TimeoutError' ? 'timeout' : 'network' }
    }
  }
  return { s: 'fail', code: '?' }
}

for (const url of urls) {
  const r = await probe(url)
  if (r.s === 'fail') {
    fail++
    console.log(`✗ FAIL ${r.code} · ${url}`)
  } else if (r.s === 'warn') {
    warn++
    console.log(`△ warn ${r.code} · ${url} (bot wall · tolerated)`)
  } else {
    console.log(`✓ ${r.code} · ${url}`)
  }
}
console.log(`\nrecord links · ${urls.length} probed · ${fail} fail · ${warn} bot-walled`)
process.exit(fail ? 1 : 0)
