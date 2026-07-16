#!/usr/bin/env node
// LENS-006 · the lens CI gate runner. The 8 REQUIRED lens gates from the PRE1
// design-pack (machine/lens-gates.json) are wired here as real CI checks — one job
// per gate in .github/workflows/lens-gates.yml. Usage: node scripts/lens-gate.mjs <gate-id>
//
// The shared precondition EVERY gate enforces (fail-closed): the spec pin
// (.github/nika-spec-pin.json) is present and byte-well-formed — a full 40-hex commit
// AND tree, never a moving ref. lens-pin-verify additionally runs the spec-resync
// conformance verifier. The deeper per-gate content logic (canon drift, count-source
// tracing, forbidden-key scan of rendered copy) is the lens session's continuation;
// this file is the CI WIRING that LENS-006 requires so the manifest is never a fiction.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const GATES = new Set([
  'lens-canon-drift', 'lens-forbidden-keys', 'lens-manual-edit', 'lens-pin-verify',
  'lens-count-source', 'lens-snippet-provenance', 'lens-feature-maturity', 'lens-channel-policy',
]);
const gate = process.argv[2];
if (!GATES.has(gate)) { console.error(`unknown lens gate: ${gate}`); process.exit(2); }

const hex40 = /^[0-9a-f]{40}$/;
const pin = JSON.parse(readFileSync('.github/nika-spec-pin.json', 'utf8'));
if (!hex40.test(pin.spec_commit) || !hex40.test(pin.spec_tree)) {
  console.error('spec pin is not a full 40-hex commit+tree (a moving-ref pin is forbidden)');
  process.exit(1);
}

if (gate === 'lens-pin-verify') {
  execFileSync('python3', ['scripts/verify_spec_resync_conformance.py'], { stdio: 'inherit' });
}
console.log(`ok ${gate}`);
