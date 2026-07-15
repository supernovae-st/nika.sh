#!/usr/bin/env node
// repin-spec-resync-contract.mjs — recompute the pinned digests in
// scripts/spec-resync.contract.json after a website-side generator or output
// legitimately changes (the contract pins every generator file and emitted
// output by sha256; any intentional edit needs this re-pin or LENS-011 goes
// red).
//
//   node scripts/lens/repin-spec-resync-contract.mjs                # dry-run
//   node scripts/lens/repin-spec-resync-contract.mjs --write
//   node scripts/lens/repin-spec-resync-contract.mjs --spec-root P  # also re-pin
//                                                                    spec-side generators
//
// Without --spec-root, generators rooted in the spec checkout keep their
// pinned digest (the spec pin only moves at resync time, with the checkout
// present).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CONTRACT = join(ROOT, 'scripts/spec-resync.contract.json')

const args = process.argv.slice(2)
const write = args.includes('--write')
const specIdx = args.indexOf('--spec-root')
const SPEC = specIdx === -1 ? null : args[specIdx + 1]

const contract = JSON.parse(readFileSync(CONTRACT, 'utf8'))
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
let changed = 0
let skipped = 0

for (const generator of contract.generators) {
  const base = generator.root === 'spec' ? SPEC : ROOT
  if (generator.root === 'spec' && !SPEC) {
    skipped += 1
    continue
  }
  const path = join(base, generator.path)
  if (!existsSync(path)) throw new Error(`generator file missing: ${path}`)
  const now = sha(path)
  if (now !== generator.sha256) {
    console.log(`generator ${generator.id}: ${generator.sha256.slice(0, 8)} → ${now.slice(0, 8)}`)
    generator.sha256 = now
    changed += 1
  }
}
for (const output of contract.outputs) {
  const path = join(ROOT, output.path)
  if (!existsSync(path)) throw new Error(`output file missing: ${path}`)
  const now = sha(path)
  if (now !== output.sha256) {
    console.log(`output ${output.path}: ${output.sha256.slice(0, 8)} → ${now.slice(0, 8)}`)
    output.sha256 = now
    changed += 1
  }
}

console.log(
  `${changed} digest(s) re-pinned · ${contract.generators.length} generators + ${contract.outputs.length} outputs scanned`
  + (skipped ? ` · ${skipped} spec-side kept (no --spec-root)` : ''),
)
if (write && changed) {
  writeFileSync(CONTRACT, `${JSON.stringify(contract, null, 1)}\n`)
  console.log(`pinned → ${CONTRACT}`)
} else if (!write) {
  console.log('(dry-run — pass --write to pin)')
}
