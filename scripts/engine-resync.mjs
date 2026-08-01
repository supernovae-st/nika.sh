#!/usr/bin/env node
// engine-resync.mjs — the engine@release vendoring lane (D1 · the second pin).
//
// The website's /catalog world derives from the RELEASED engine, never from
// engine HEAD. .github/nika-engine-pin.json names the exact release identity
// (full commit + tree, the LENS-011 trust model applied to the engine repo);
// this lane vendors the catalog data files + the ADR index from THAT commit
// into public/engine/, with a digest receipt.
//
//   --write   fetch the pinned commit BY SHA (never a ref) · verify commit
//             AND tree digests BEFORE any copy · vendor the surfaces ·
//             write public/engine/PROVENANCE.json (sorted digests · zero
//             timestamps — same pins, same bytes)
//   --check   OFFLINE integrity gate: every vendored file re-hashes to its
//             PROVENANCE.json digest and the receipt matches the pin.
//             Divergence exits 5 (the estate/ssot convention) — fail-closed,
//             never a silent fallback to stale-or-HEAD.
//
// The vendored files are class `pinned-copy` in estate.yaml; this receipt is
// class `generated`; the pin itself is class `authored-pin` — the §J.1
// transition table of the estate spine, applied to the catalog seam.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PIN_PATH = join(ROOT, '.github/nika-engine-pin.json')
const OUT_DIR = join(ROOT, 'public/engine')
const RECEIPT = join(OUT_DIR, 'PROVENANCE.json')

// The vendored surface set: engine-repo path → public/engine path.
const SURFACES = [
  ['crates/nika-catalog/data/llm-providers.toml', 'catalog/llm-providers.toml'],
  ['crates/nika-catalog/data/mcp-servers.toml', 'catalog/mcp-servers.toml'],
  ['crates/nika-catalog/data/model-pricing.toml', 'catalog/model-pricing.toml'],
  ['crates/nika-catalog/data/model-capabilities.toml', 'catalog/model-capabilities.toml'],
  ['crates/nika-catalog/data/embeddings.toml', 'catalog/embeddings.toml'],
  ['docs/adr/index.json', 'adr/index.json'],
]

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const pin = JSON.parse(readFileSync(PIN_PATH, 'utf8'))

function receiptBody(files) {
  // Deterministic: sorted keys · sorted files · no timestamps. The identity
  // is the pin, not the wall clock — same pins must yield the same bytes.
  return `${JSON.stringify(
    {
      engine_resync_format: 1,
      law: 'vendored from the pinned engine release — fetched BY SHA, commit+tree digest-verified before any copy; --check re-verifies these digests offline (exit 5 on drift)',
      source: `${pin.repository}@${pin.engine_commit}`,
      release_tag: pin.release_tag,
      engine_tree: pin.engine_tree,
      tool: 'scripts/engine-resync.mjs',
      files: files.sort((a, b) => (a.path < b.path ? -1 : 1)),
    },
    null,
    1,
  )}\n`
}

function check() {
  let receipt
  try {
    receipt = JSON.parse(readFileSync(RECEIPT, 'utf8'))
  } catch {
    console.error(`✗ engine-resync: ${RECEIPT} missing or unreadable — run --write from the pin`)
    return 5
  }
  const bad = []
  if (receipt.source !== `${pin.repository}@${pin.engine_commit}`)
    bad.push(`receipt source ${receipt.source} != pin ${pin.repository}@${pin.engine_commit}`)
  if (receipt.engine_tree !== pin.engine_tree)
    bad.push(`receipt tree ${receipt.engine_tree} != pin ${pin.engine_tree}`)
  if (receipt.release_tag !== pin.release_tag)
    bad.push(`receipt release_tag ${receipt.release_tag} != pin ${pin.release_tag}`)
  const expected = SURFACES.map(([, out]) => out).sort()
  const listed = (receipt.files ?? []).map((f) => f.path).sort()
  if (JSON.stringify(expected) !== JSON.stringify(listed))
    bad.push(`receipt file set [${listed}] != declared surfaces [${expected}]`)
  const upstreamOf = new Map(SURFACES.map(([src, out]) => [out, src]))
  for (const f of receipt.files ?? []) {
    // every receipt field is VERIFIED, none decorative (refuter finding
    // 2026-08-01: an unchecked field is a claim the gate lets lie)
    if (f.upstream !== upstreamOf.get(f.path))
      bad.push(`${f.path}: receipt upstream '${f.upstream}' != declared surface '${upstreamOf.get(f.path)}'`)
    let digest
    try {
      digest = sha256(readFileSync(join(OUT_DIR, f.path)))
    } catch {
      bad.push(`${f.path}: vendored file missing`)
      continue
    }
    if (digest !== f.sha256) bad.push(`${f.path}: sha256 ${digest} != receipt ${f.sha256}`)
  }
  if (bad.length) {
    console.error('✗ engine-resync drift (the vendored bytes diverge from their receipt/pin):')
    for (const b of bad) console.error(`  - ${b}`)
    return 5
  }
  console.log(`✓ public/engine in sync with ${pin.repository}@${pin.engine_commit.slice(0, 9)} (${pin.release_tag})`)
  return 0
}

function write() {
  const tmp = mkdtempSync(join(tmpdir(), 'engine-resync-'))
  try {
    const git = (...args) => execFileSync('git', ['-C', tmp, ...args], { stdio: ['ignore', 'pipe', 'inherit'] })
    git('init', '-q')
    // fetch the EXACT pinned commit — never a branch, never a tag, never HEAD
    git('fetch', '-q', '--depth', '1', `https://github.com/${pin.repository}`, pin.engine_commit)
    git('checkout', '-q', 'FETCH_HEAD')
    const got = git('rev-parse', 'HEAD').toString().trim()
    const gotTree = git('rev-parse', 'HEAD^{tree}').toString().trim()
    if (got !== pin.engine_commit) {
      console.error(`✗ fetched commit ${got} != pinned ${pin.engine_commit}`)
      return 1
    }
    if (gotTree !== pin.engine_tree) {
      console.error(`✗ fetched TREE (content digest) ${gotTree} != pinned ${pin.engine_tree}`)
      return 1
    }
    const files = []
    for (const [src, out] of SURFACES) {
      const body = readFileSync(join(tmp, src))
      const dest = join(OUT_DIR, out)
      mkdirSync(dirname(dest), { recursive: true })
      writeFileSync(dest, body)
      files.push({ path: out, upstream: src, sha256: sha256(body) })
    }
    writeFileSync(RECEIPT, receiptBody(files))
    console.log(`✓ vendored ${files.length} surfaces from ${pin.repository}@${pin.engine_commit.slice(0, 9)} (${pin.release_tag})`)
    return 0
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

const mode = process.argv[2] ?? '--check'
if (mode !== '--write' && mode !== '--check') {
  console.error(`engine-resync: unknown mode ${mode} (--write | --check)`)
  process.exit(2)
}
process.exit(mode === '--write' ? write() : check())
