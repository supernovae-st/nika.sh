// repin-carrier-universe.mjs — re-pin carrier-universe.v1.json after the tree
// gains or loses rendered carriers (new pages, components, emissions).
//
// Only NEW paths are classified (by the rule below); pinned paths keep the
// class a human gave them. Counts, set digests and the closed CSS literal
// policy are recomputed from the tree. The companion re-pin for the derived
// contracts stays `build-lens-semantic-contracts.mjs --write` — run it right
// after this script.
//
//   node scripts/lens/repin-carrier-universe.mjs          # dry-run (report)
//   node scripts/lens/repin-carrier-universe.mjs --write

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  carrierSetSha256,
  cssContentInventory,
  renderedCarriers,
} from '../lens-semantics-lib.mjs'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CONTRACT = fileURLToPath(
  new URL('./contracts/carrier-universe.v1.json', import.meta.url),
)

// Classification rule for paths the pin has never seen. Machine emissions and
// styling never carry authored count claims; hand-written src prose does.
function classify(path) {
  if (/\.generated\.(?:ts|tsx)$/.test(path)) return 'machine_or_presentational'
  if (path.endsWith('.css')) return 'machine_or_presentational'
  if (path.startsWith('public/')) return 'machine_or_presentational'
  if (/\.(?:ts|tsx)$/.test(path)) return 'normative_sources'
  if (path.startsWith('content/blog/')) return 'normative_sources'
  throw new Error(`no classification rule for new carrier: ${path}`)
}

const write = process.argv.includes('--write')
const universe = JSON.parse(readFileSync(CONTRACT, 'utf8'))
const discovered = renderedCarriers(ROOT)
const pinned = new Set(universe.carriers)
const seen = new Set(discovered)

const extra = discovered.filter((path) => !pinned.has(path))
const missing = universe.carriers.filter((path) => !seen.has(path))

for (const path of missing) {
  for (const key of ['normative_sources', 'generated_mirrors', 'machine_or_presentational']) {
    universe[key] = universe[key].filter((entry) => entry !== path)
  }
  console.log(`  - ${path}`)
}
for (const path of extra) {
  const key = classify(path)
  universe[key] = [...universe[key], path].sort()
  console.log(`  + ${path} → ${key}`)
}

universe.carriers = discovered
universe.carrier_count = discovered.length
universe.set_sha256 = carrierSetSha256(discovered)
universe.normative_source_count = universe.normative_sources.length
universe.normative_source_sha256 = carrierSetSha256(universe.normative_sources)

const css = cssContentInventory(ROOT, discovered.filter((path) => path.endsWith('.css')))
if (css.count_claims.length > 0) {
  throw new Error(`CSS content carries a forbidden count claim: ${css.count_claims[0].selector}`)
}
universe.css_content_policy.allowed_literals = css.literals
universe.css_content_policy.allowed_dynamic_expressions = css.dynamic_expressions

console.log(
  `carrier universe: ${universe.carrier_count} carriers · +${extra.length} −${missing.length} · normative ${universe.normative_source_count}`,
)
if (write) {
  writeFileSync(CONTRACT, `${JSON.stringify(universe, null, 2)}\n`)
  console.log(`pinned → ${CONTRACT}`)
} else {
  console.log('(dry-run — pass --write to pin)')
}
