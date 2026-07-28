#!/usr/bin/env node
/* estate-sync.mjs — the sha256 half of estate.yaml is DERIVED, never authored.
 *
 *   node scripts/estate-sync.mjs          # rewrite stale pins, list them
 *   node scripts/estate-sync.mjs --check  # exit 5 on drift (the judge's twin)
 *
 * The registry's prose (class · evidence · derivation) stays authored — it
 * says WHY a file exists and which ritual regenerates it. The sha says WHAT
 * the tree holds right now, and that is a computation, not a claim: 47 of 96
 * rows had rotted by 2026-07-29 because the pin was maintained by hand with
 * no judge (src/test/estate.test.ts is the judge this script pairs with —
 * the engine's estate.py --write/--check model, in this repo's idiom).
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(ROOT, 'estate.yaml')
const check = process.argv.includes('--check')

const text = readFileSync(FILE, 'utf8')
const row = /(- path: "([^"]+)"\n {2}class: \w+\n {2}sha256: )([0-9a-f]{64})/g

let out = ''
let last = 0
const stale = []
const missing = []
for (const m of text.matchAll(row)) {
  const [, head, path, pinned] = m
  const abs = join(ROOT, path)
  if (!existsSync(abs)) {
    missing.push(path)
    continue
  }
  const actual = createHash('sha256').update(readFileSync(abs)).digest('hex')
  if (actual !== pinned) {
    stale.push(path)
    out += text.slice(last, m.index) + head + actual
    last = m.index + m[0].length
  }
}
out += text.slice(last)

if (missing.length) {
  console.error(`✗ ${missing.length} pinned path(s) missing from the tree:`)
  for (const p of missing) console.error(`  ${p}`)
  process.exit(2)
}
if (check) {
  if (stale.length) {
    console.error(`✗ estate drift · ${stale.length} sha pin(s) diverge — run scripts/estate-sync.mjs`)
    for (const p of stale) console.error(`  ${p}`)
    process.exit(5)
  }
  console.log('✓ estate.yaml sha pins in sync with the tree')
} else {
  if (stale.length) {
    writeFileSync(FILE, out)
    console.log(`✓ ${stale.length} pin(s) re-projected:`)
    for (const p of stale) console.log(`  ${p}`)
  } else {
    console.log('✓ nothing stale')
  }
}
