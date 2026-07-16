#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { ROOT } from './spec-resync-lib.mjs'

const cases = [
  ['literal count drift', 'lens-count-source', 'count-source'],
  ['composed written-number drift', 'lens-count-source', 'count-source-composed-word'],
  ['digit ordinal outside fixed lists', 'lens-count-source', 'count-source-digit-ordinal'],
  ['stale read-only tool count', 'lens-count-source', 'count-source-read-only-tools'],
  ['unregistered rendered carrier', 'lens-count-source', 'count-source-unregistered-carrier'],
  ['floating code block', 'lens-snippet-provenance', 'snippet-provenance'],
  ['dead snippet Git object', 'lens-snippet-provenance', 'snippet-dead-git-object'],
  ['experimental feature presented live', 'lens-feature-maturity', 'feature-maturity'],
  ['deferred feature presented shipped', 'lens-feature-maturity', 'feature-deferred-presented-shipped'],
  ['unregistered feature claim', 'lens-feature-maturity', 'feature-unregistered-claim'],
  ['unregistered prerendered page', 'lens-feature-maturity', 'feature-unregistered-page'],
  ['nightly pin on stable host', 'lens-channel-policy', 'channel-policy'],
  ['missing preview banner', 'lens-channel-policy', 'channel-missing-preview-banner'],
  ['missing nightly banner', 'lens-channel-policy', 'channel-missing-nightly-banner'],
  ['unclosed stable release', 'lens-channel-policy', 'channel-unclosed-stable-release'],
  ['wrong channel path', 'lens-channel-policy', 'channel-wrong-path'],
  ['YAML comment smuggling', 'lens-channel-policy', 'channel-comment-smuggling'],
]

for (const [name, gate, fixture] of cases) {
  const result = spawnSync(process.execPath, ['scripts/lens-gate.mjs', gate, '--fixture', fixture], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (result.status === 0) throw new Error(`LENS-006 semantic adversary accepted: ${name}`)
  if (!result.stderr.includes('LENS-006:')) {
    throw new Error(`LENS-006 semantic adversary escaped the contract: ${name}\n${result.stderr}`)
  }
  console.log(`ok · ${name} rejected`)
}

console.log(`LENS-006 semantic adversarial harness: ${cases.length}/${cases.length} counterexamples rejected`)
