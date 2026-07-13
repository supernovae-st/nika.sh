#!/usr/bin/env node
// sync-version.mjs — the ONE version-rewrite lane (Rams pass 2026-07-13).
//
// Before this, the carrier set lived TWICE: version.test.ts asserted it,
// release-heal.yml duplicated it as perl one-liners — the exact dual-list
// drift the half-heal proved. Now: the heal (and any hand cascade) runs
// THIS; version.test.ts stays the independent judge.
//
//   node scripts/sync-version.mjs v0.103.0 [--transcript "nika 0.103.0"]
//
// The install VERSION_TRANSCRIPT obeys the honesty law (« re-capture,
// never hand-edit »): pass --transcript with the REAL `nika --version`
// output (the heal downloads the release binary and captures it); the
// script refuses to fabricate that line on its own.
import { readFileSync, writeFileSync } from 'node:fs'

const tag = process.argv[2]
if (!/^v\d+\.\d+\.\d+$/.test(tag ?? '')) {
  console.error('usage: sync-version.mjs vX.Y.Z [--transcript "nika X.Y.Z"]')
  process.exit(2)
}
const bare = tag.slice(1)
const ti = process.argv.indexOf('--transcript')
const transcript = ti > -1 ? process.argv[ti + 1] : null

const edits = [
  ['src/content.ts', (s) => s.replace(/(export const ENGINE_VERSION = ')v[\d.]+(')/, `$1${tag}$2`)],
  ['public/llms.txt', (s) => s.replace(/v0\.\d+\.\d+/g, tag)],
  ['public/humans.txt', (s) => s.replace(/(nika )0\.\d+\.\d+/g, `$1${bare}`)],
  ['src/content/learn.ts', (s) => s.replace(/(nika )0\.\d+\.\d+/g, `$1${bare}`)],
  ['src/content/install.ts', (s) => {
    s = s.replace(/(against nika )0\.\d+\.\d+/g, `$1${bare}`)
      .replace(/(captured \d{4}-\d{2}-\d{2} · nika )0\.\d+\.\d+/g, `$1${bare}`)
    if (transcript) {
      s = s.replace(/(\{ kind: 'out', text: ')nika [\d.]+(' \},?\n\]\s*\n\nexport const FIRST_RUN_TRANSCRIPT)/, `$1${transcript.replace('nika ', 'nika ')}$2`)
      s = s.replace(/(kind: 'out', text: ')nika [\d.]+('\s*\},\s*\n\])/, `$1${transcript}$2`)
    }
    return s
  }],
]
let touched = 0
for (const [path, fn] of edits) {
  const before = readFileSync(path, 'utf8')
  const after = fn(before)
  if (after !== before) { writeFileSync(path, after); touched++; console.log(`~ ${path}`) }
}
if (!transcript) console.log('note: VERSION_TRANSCRIPT untouched (no --transcript · the honesty law)')
console.log(`sync-version: ${touched} carrier(s) → ${tag} — version.test.ts is the judge`)
