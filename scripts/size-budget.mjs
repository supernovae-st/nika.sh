/* ─── size-budget · the initial-JS ceiling (W12 · D2) ─────────────────────────
   Sums the GZIPPED weight of the JS that loads with the home document — the
   entry script plus every modulepreload in dist/index.html — and fails when
   it crosses the budget. Lazy chunks (three-stack, editor, galaxy egg) are
   NOT counted: keeping them lazy is the point, and route-level code split is
   asserted by the second check (no three.js in the entry graph).

   Budget: 350 KB gz (the W12 master plan's ceiling).
   Run: pnpm build && node scripts/size-budget.mjs */
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const BUDGET_KB = 350

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const entry = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
const unique = [...new Set(entry)]

let total = 0
let fail = false
for (const path of unique) {
  const raw = readFileSync(join(DIST, path))
  const gz = gzipSync(raw, { level: 9 }).length
  total += gz
  const src = raw.toString()
  /* the three-stack must never ride the entry graph */
  const leaked = /three\.module|WebGLRenderer|@react-three/.test(src) && /createRoot|hydrateRoot/.test(html)
  if (/WebGLRenderer/.test(src)) {
    console.error(`✗ three.js leaked into the entry graph: ${path}`)
    fail = true
  }
  console.log(`  ${(gz / 1024).toFixed(1).padStart(7)} KB gz  ${path}${leaked ? '  ← LEAK' : ''}`)
}

const totalKb = total / 1024
const verdict = totalKb <= BUDGET_KB && !fail
console.log(`${verdict ? '✓' : '✗'} initial JS: ${totalKb.toFixed(1)} KB gz · budget ${BUDGET_KB} KB · ${unique.length} files`)
process.exit(verdict ? 0 : 1)
