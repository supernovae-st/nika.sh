#!/usr/bin/env node
/* revendor-check-wasm.mjs — the vendored checker follows a RELEASE, never a build.
 *
 *   node scripts/revendor-check-wasm.mjs v0.106.1
 *
 * Downloads the npm tarball the engine's release train attached (the same
 * bytes npm publish ships — attested), verifies the sha256 sidecar, unpacks
 * the four artifact files into src/lib/check-wasm/pkg/, and rewrites
 * PROVENANCE.json from the release's own facts. Hand-copying a local build
 * here is the drift this script retires: the artifact consumed is the
 * artifact attested. After running: pnpm vitest run src/test/check-wasm-oracle.test.ts
 * re-judges the served twins with the new artifact, then update estate.yaml's
 * sha row (pnpm estate, or the documented command in estate.yaml).
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const tag = process.argv[2]
if (!/^v\d+\.\d+\.\d+$/.test(tag ?? '')) {
  console.error('usage: node scripts/revendor-check-wasm.mjs v<X.Y.Z> — a release tag, never a branch')
  process.exit(2)
}
const version = tag.slice(1)
const repo = 'supernovae-st/nika'
const asset = `supernovae-st-nika-check-wasm-${version}.tgz`
const base = `https://github.com/${repo}/releases/download/${tag}`

const work = mkdtempSync(join(tmpdir(), 'nika-revendor-'))
const get = async (name) => {
  const res = await fetch(`${base}/${name}`, { redirect: 'follow' })
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status} — is ${tag} released with the npm asset?`)
  const bytes = Buffer.from(await res.arrayBuffer())
  writeFileSync(join(work, name), bytes)
  return bytes
}

const tgz = await get(asset)
const sidecar = (await get(`${asset}.sha256`)).toString('utf8')

// the sidecar is the release's own claim over the exact bytes npm ships
const want = sidecar.trim().split(/\s+/)[0]
const have = createHash('sha256').update(tgz).digest('hex')
if (want !== have) {
  console.error(`sha256 mismatch: sidecar ${want} ≠ downloaded ${have}`)
  process.exit(1)
}
console.log(`✓ ${asset} · sha256 verified`)

execFileSync('tar', ['-xzf', join(work, asset), '-C', work])

const here = dirname(fileURLToPath(import.meta.url))
const pkgDir = join(here, '../src/lib/check-wasm/pkg')
const files = [
  'nika_check_wasm.js',
  'nika_check_wasm.d.ts',
  'nika_check_wasm_bg.wasm',
  'nika_check_wasm_bg.wasm.d.ts',
]
for (const f of files) copyFileSync(join(work, 'package', f), join(pkgDir, f))
console.log(`✓ ${files.length} files → src/lib/check-wasm/pkg/`)

// the release resolved its tag to an immutable sha once — reuse that fact
const commit = execFileSync('gh', ['api', `repos/${repo}/git/ref/tags/${tag}`, '--jq', '.object.sha'])
  .toString()
  .trim()
// annotated tags point at a tag object; dereference to the commit
const commitSha = /^[0-9a-f]{40}$/.test(commit)
  ? execFileSync('gh', ['api', `repos/${repo}/commits/${commit}`, '--jq', '.sha']).toString().trim()
  : commit

const wasmSha16 = createHash('sha256')
  .update(readFileSync(join(pkgDir, 'nika_check_wasm_bg.wasm')))
  .digest('hex')
  .slice(0, 16)

const provPath = join(here, '../src/lib/check-wasm/PROVENANCE.json')
const prov = JSON.parse(readFileSync(provPath, 'utf8'))
prov.engine_version = version
prov.source = `https://github.com/${repo}/tree/${tag}/crates/nika-check-wasm`
prov.commit = commitSha
prov.branch = `release ${tag} — admitted (ADR-107 accepted); this artifact is the release asset the npm package ships, sha-verified against the sidecar`
prov.npm = `@supernovae-st/nika-check-wasm@${version}`
prov.wasm_sha256_16 = wasmSha16
prov.revendor = 'node scripts/revendor-check-wasm.mjs v<X.Y.Z> — release-asset only, never a local build'
writeFileSync(provPath, JSON.stringify(prov, null, 2) + '\n')
console.log(`✓ PROVENANCE.json → ${tag} · ${commitSha.slice(0, 12)} · wasm ${wasmSha16}`)
console.log('next: pnpm vitest run src/test/check-wasm-oracle.test.ts && update the estate sha row')
console.log(`unpacked at ${work} (temp) · ${readdirSync(join(work, 'package')).length} files in the package`)
