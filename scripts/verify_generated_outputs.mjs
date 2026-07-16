#!/usr/bin/env node
// LENS-011 · the post-generation OUTPUT guard for the spec-resync pipeline.
//
// The resync workflow re-derives every spec-fed surface then proposed a PR. The
// conformance verifier proved the INPUT (the spec pin) but nothing proved the OUTPUTS:
// `git add -A` swept WHATEVER was in the tree, so an arbitrary file written after the
// generators (the LENS-011 counterexample: `printf … >> src/__codex_unverified_generated.txt`)
// rode into the proposal, byte-unverified.
//
// This guard runs AFTER the generators and BEFORE `git add`. It refuses the run (exit 1,
// so no commit / push / PR) if the working tree carries ANY change outside the DECLARED
// generated-output contract. The generated surface is the house `.generated.` convention
// (every such file carries a "DO NOT EDIT" banner) plus the templates catalog. A non-
// generated path in the diff is an undeclared output — refused.
//
// Usage: node scripts/verify_generated_outputs.mjs   (run from the website repo root)
import { execFileSync } from 'node:child_process';

// A changed path is a LAWFUL generated output iff it matches this contract.
const ALLOW = [
  /^src\/.*\.generated\.[a-z0-9]+$/,      // src/**/*.generated.{ts,json,…} — the banner'd surface
  /^public\/templates\/catalog\.json$/,   // the templates catalog (build-templates.mjs)
];

function porcelain() {
  const out = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'],
                           { encoding: 'utf8' });
  // each line: "XY path" (rename "orig -> new"); take the post-arrow path when present
  return out.split('\n').filter(Boolean).map((line) => {
    const p = line.slice(3);
    const arrow = p.indexOf(' -> ');
    return arrow >= 0 ? p.slice(arrow + 4) : p;
  });
}

const changed = porcelain();
const undeclared = changed.filter((p) => !ALLOW.some((re) => re.test(p)));

if (undeclared.length) {
  console.error('LENS-011: undeclared output(s) in the working tree — refusing the resync '
    + '(no commit, no push, no PR):');
  for (const p of undeclared) console.error(`  ✗ ${p}`);
  console.error('Only declared generated surfaces (src/**/*.generated.* · public/templates/'
    + 'catalog.json) may be proposed by the resync.');
  process.exit(1);
}
console.log(`LENS-011: ${changed.length} changed path(s), all declared generated outputs — ok`);
