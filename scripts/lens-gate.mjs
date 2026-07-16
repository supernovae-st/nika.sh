#!/usr/bin/env node
// LENS-006 · eight fail-closed presentation semantics, one runner.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  ROOT,
  loadContract as loadResyncContract,
  sha256Bytes,
  sha256File,
  verifyGeneratorDigests,
  verifyOutputTree,
} from './spec-resync-lib.mjs'

const CONTRACT_ROOT = join(ROOT, 'scripts/lens/contracts')
const FIXTURE_PATH = join(ROOT, 'scripts/lens/fixtures/negative.v1.json')
const FULL_SHA = /^[0-9a-f]{40}$/
const SHA256 = /^[0-9a-f]{64}$/
const WORD_NUMBERS = new Map([
  ['zero', 0], ['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5],
  ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10],
  ['eleven', 11], ['twelve', 12],
])

function fail(message) {
  throw new Error(`LENS-006: ${message}`)
}

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function contract(name) {
  const value = json(join(CONTRACT_ROOT, name))
  if (value.contract_version !== 1) fail(`${name} has an unsupported contract version`)
  return value
}

function parseCanon() {
  const source = readFileSync(join(ROOT, 'src/canon.generated.ts'), 'utf8')
  const number = (key) => {
    const match = source.match(new RegExp(`\\b${key}: (\\d+)`))
    if (!match) fail(`canon field missing: ${key}`)
    return Number(match[1])
  }
  return {
    verbs: number('verbs'),
    builtins: number('builtins'),
    providers: number('providers'),
    extractModes: number('extractModes'),
  }
}

function sourceFiles(root) {
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...sourceFiles(path))
    else if (/\.(?:ts|tsx|md|mdx)$/.test(entry.name)
      && !entry.name.includes('.generated.') && !entry.name.includes('.test.')) files.push(path)
  }
  return files
}

function claimValue(raw) {
  return /^\d+$/.test(raw) ? Number(raw) : WORD_NUMBERS.get(raw.toLowerCase())
}

function validateCountText(text, label, canon, { adjacent = false } = {}) {
  const count = '(\\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)'
  const noun = '(verbs?|builtins?|providers?|extract\\s+modes?)'
  const claims = new RegExp(adjacent ? `\\bNika\\s+(?:has|uses|ships with|locks at)\\s+${count}\\s+${noun}\\b` : `\\b${count}\\s+${noun}\\b`, 'gi')
  for (const match of text.matchAll(claims)) {
    // Indefinite singular prose (`one builtin, nine shapes`) does not claim
    // the vocabulary's total; explicit `Nika has one ...` remains covered by
    // the adjacent-claim form above.
    if (!adjacent && match[1].toLowerCase() === 'one' && !match[2].endsWith('s')) continue
    // Figure labels such as `S.1 verbs` are coordinates, not count claims.
    if (/\b[A-Za-z]\.$/.test(text.slice(Math.max(0, match.index - 3), match.index))) continue
    const countIndex = adjacent ? 1 : 1
    const nounIndex = adjacent ? 2 : 2
    const claimedNoun = match[nounIndex].toLowerCase()
    const field = claimedNoun.startsWith('verb') ? 'verbs'
      : claimedNoun.startsWith('builtin') ? 'builtins'
        : claimedNoun.startsWith('provider') ? 'providers' : 'extractModes'
    const got = claimValue(match[countIndex])
    if (got !== canon[field]) fail(`${label} says ${match[0]}, canon says ${canon[field]} ${claimedNoun}`)
  }
}

function gateCanonDrift(fixture) {
  const resync = loadResyncContract()
  if (fixture) {
    const got = sha256File(join(ROOT, fixture.path))
    if (got !== fixture.sha256) fail(`canon drift fixture: ${got} != ${fixture.sha256}`)
    return
  }
  verifyGeneratorDigests(ROOT, ROOT, {
    ...resync,
    generators: resync.generators.filter((generator) => generator.root === 'website'),
  })
  verifyOutputTree(ROOT, resync)
}

function gateForbiddenKeys(fixture) {
  const rules = contract('presentation.v1.json')
  const canon = parseCanon()
  const inspect = (text, label, { keys = true } = {}) => {
    if (keys) {
      for (const key of rules.forbidden_keys) {
        const pattern = new RegExp(`(?:^|[\\s{,])${key}\\s*:`, 'm')
        if (pattern.test(text)) fail(`${label} carries forbidden key ${key}:`)
      }
    }
    validateCountText(text, label, canon, { adjacent: true })
  }
  if (fixture) return inspect(fixture.text, 'negative fixture')
  for (const path of rules.forbidden_key_carriers) inspect(readFileSync(join(ROOT, path), 'utf8'), path)
  for (const root of rules.adjacent_claim_roots) {
    for (const path of sourceFiles(join(ROOT, root))) inspect(readFileSync(path, 'utf8'), path.slice(ROOT.length + 1), { keys: false })
  }
}

function gateManualEdit(fixture) {
  const resync = loadResyncContract()
  if (fixture) {
    const expected = resync.outputs.find((output) => output.path === fixture.path)?.sha256
    if (!expected) fail(`manual-edit fixture path is not declared: ${fixture.path}`)
    const got = sha256Bytes(Buffer.from(fixture.bytes))
    if (got !== expected) fail(`manual edit fixture changes ${fixture.path}`)
    return
  }
  verifyOutputTree(ROOT, resync)
  for (const output of resync.outputs.filter((entry) => entry.path.endsWith('.ts'))) {
    const text = readFileSync(join(ROOT, output.path), 'utf8').slice(0, 500)
    if (!/GENERATED/.test(text) || !/DO NOT EDIT|regenerate/i.test(text)) {
      fail(`generated TypeScript output lacks a manual-edit warning: ${output.path}`)
    }
  }
}

function validatePin(pin, resync) {
  if (!FULL_SHA.test(pin.spec_commit ?? '') || !FULL_SHA.test(pin.spec_tree ?? '')) {
    fail('spec pin is not a full commit+tree identity')
  }
  if (pin.spec_commit !== resync.spec.commit || pin.spec_tree !== resync.spec.tree
    || pin.repository !== resync.spec.repository) fail('spec pin differs from resync contract')
}

function gatePinVerify(fixture) {
  const resync = loadResyncContract()
  const pin = fixture ?? json(join(ROOT, '.github/nika-spec-pin.json'))
  validatePin(pin, resync)
  if (!fixture) execFileSync('python3', ['scripts/verify_spec_resync_conformance.py'], { cwd: ROOT, stdio: 'ignore' })
}

function gateCountSource(fixture) {
  const canon = parseCanon()
  if (fixture) return validateCountText(fixture.text, 'negative fixture', canon)
  const rules = contract('presentation.v1.json')
  for (const path of rules.count_sources) validateCountText(readFileSync(join(ROOT, path), 'utf8'), path, canon)
}

function gateSnippetProvenance(fixture) {
  const snippets = contract('snippets.v1.json').snippets
  const entries = fixture ? [fixture] : snippets
  const ids = new Set()
  for (const entry of entries) {
    if (entry.id && ids.has(entry.id)) fail(`duplicate snippet id: ${entry.id}`)
    if (entry.id) ids.add(entry.id)
    if (!SHA256.test(entry.sha256 ?? '')) fail(`bad snippet digest: ${entry.path}`)
    if (!fixture && (!FULL_SHA.test(entry.source_commit ?? '') || !entry.source_repository)) {
      fail(`snippet provenance is not commit-bound: ${entry.path}`)
    }
    const got = sha256File(join(ROOT, entry.path))
    if (got !== entry.sha256) fail(`snippet provenance mismatch: ${entry.path}`)
  }
}

function validateFeature(feature, rules) {
  if (!feature.id || !rules.allowed_maturity.includes(feature.maturity)) {
    fail(`feature ${feature.id ?? '<missing>'} has invalid maturity ${feature.maturity}`)
  }
  if (['operational', 'gated'].includes(feature.maturity) && !(feature.evidence?.length > 0)) {
    fail(`feature ${feature.id} has no evidence`)
  }
  for (const path of feature.evidence ?? []) if (!existsSync(join(ROOT, path))) fail(`feature evidence missing: ${path}`)
  if (feature.presentation) {
    const text = readFileSync(join(ROOT, feature.presentation), 'utf8')
    if (!text.includes(feature.token)) fail(`feature presentation lacks evidence token: ${feature.id}`)
  }
}

function gateFeatureMaturity(fixture) {
  const rules = contract('features.v1.json')
  const features = fixture ? [fixture] : rules.features
  const ids = new Set()
  for (const feature of features) {
    if (ids.has(feature.id)) fail(`duplicate feature id: ${feature.id}`)
    ids.add(feature.id)
    validateFeature(feature, rules)
  }
}

function validateChannelPolicy(rules, inspectManifest) {
  if (rules.production?.host !== 'nika.sh' || rules.production.branch !== 'main'
    || rules.production.deploy_on_push !== true || rules.production.release_closed !== true) {
    fail('production channel is not main-bound, deploy-on-push, and release-closed')
  }
  if (rules.preview?.release_closed !== false || rules.preview?.banner !== 'preview') {
    fail('preview channel is not visibly open')
  }
  if (inspectManifest) {
    const manifest = readFileSync(join(ROOT, rules.deployment_manifest), 'utf8')
    for (const token of ['domain: nika.sh', 'branch: main', 'deploy_on_push: true']) {
      if (!manifest.includes(token)) fail(`deployment manifest lacks channel token: ${token}`)
    }
  }
}

function gateChannelPolicy(fixture) {
  const rules = contract('channels.v1.json')
  if (fixture) return validateChannelPolicy({ ...rules, ...fixture }, false)
  validateChannelPolicy(rules, true)
}

const handlers = new Map([
  ['lens-canon-drift', gateCanonDrift],
  ['lens-forbidden-keys', gateForbiddenKeys],
  ['lens-manual-edit', gateManualEdit],
  ['lens-pin-verify', gatePinVerify],
  ['lens-count-source', gateCountSource],
  ['lens-snippet-provenance', gateSnippetProvenance],
  ['lens-feature-maturity', gateFeatureMaturity],
  ['lens-channel-policy', gateChannelPolicy],
])

const gate = process.argv[2]
const fixtureMode = process.argv[3] === '--fixture' ? process.argv[4] : undefined
if (!handlers.has(gate)) {
  console.error(`unknown lens gate: ${gate}`)
  process.exit(2)
}

try {
  const fixture = fixtureMode ? json(FIXTURE_PATH).fixtures[fixtureMode] : undefined
  if (fixtureMode && !fixture) fail(`unknown negative fixture: ${fixtureMode}`)
  handlers.get(gate)(fixture)
  console.log(`ok ${gate} · semantic contract verified`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
