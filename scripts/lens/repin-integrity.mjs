#!/usr/bin/env node
// repin-integrity.mjs — recompute the sha256 pins in integrity.v1.json after
// an intentional edit to a pinned infra artifact (verify-lens-ci judges the
// working tree against these pins; without a re-pin every legitimate change
// reads as a manual-edit violation).
//
//   node scripts/lens/repin-integrity.mjs          # dry-run (report drift)
//   node scripts/lens/repin-integrity.mjs --write
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CONTRACT = fileURLToPath(new URL('./contracts/integrity.v1.json', import.meta.url))

const write = process.argv.includes('--write')
const contract = JSON.parse(readFileSync(CONTRACT, 'utf8'))
let changed = 0
for (const artifact of contract.artifacts) {
  const now = createHash('sha256').update(readFileSync(join(ROOT, artifact.path))).digest('hex')
  if (now !== artifact.sha256) {
    console.log(`artifact ${artifact.path}: ${artifact.sha256.slice(0, 8)} → ${now.slice(0, 8)}`)
    artifact.sha256 = now
    changed += 1
  }
}
console.log(`${changed} pin(s) re-computed · ${contract.artifacts.length} artifacts scanned`)
if (write && changed) {
  writeFileSync(CONTRACT, `${JSON.stringify(contract, null, 1)}\n`)
  console.log(`pinned → ${CONTRACT}`)
} else if (!write) {
  console.log('(dry-run — pass --write to pin)')
}
