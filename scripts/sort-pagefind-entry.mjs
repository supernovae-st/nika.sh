// Pagefind serializes its language map in HashMap iteration order, which
// differs run to run (upstream nondeterminism, pagefind 1.5.2): two builds
// of the SAME content emit pagefind-entry.json with identical hashes but
// shuffled keys, and the dual-run byte gate (LENS-011) rightly refuses.
// Key order carries no meaning in JSON, so sorting at emission makes the
// build byte-deterministic without touching what pagefind loads.
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'dist/pagefind/pagefind-entry.json'

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])]),
    )
  }
  return value
}

const entry = JSON.parse(readFileSync(path, 'utf8'))
writeFileSync(path, JSON.stringify(sortDeep(entry)))
