#!/usr/bin/env node
// LENS-006 · eight fail-closed presentation semantics, one runner.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import {
  ROOT,
  loadContract as loadResyncContract,
  sha256Bytes,
  sha256File,
  verifyGeneratorDigests,
  verifyOutputTree,
} from './spec-resync-lib.mjs'
import {
  carrierSetSha256,
  discoverCountClaims,
  discoverCountClaimsInText,
  discoverPrerenderClaims,
  discoverRouteClaims,
  discoverSnippetCarriers,
  flattenSnippetBlocks,
  gitBlobId,
  renderedCarriers,
} from './lens-semantics-lib.mjs'

const CONTRACT_ROOT = join(ROOT, 'scripts/lens/contracts')
const FIXTURE_PATH = join(ROOT, 'scripts/lens/fixtures/negative.v1.json')
const require = createRequire(import.meta.url)
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
    templates: number('templates'),
    mcpTools: number('mcpTools'),
    errorCodes: number('errorCodes'),
    errorNamespaces: number('errorNamespaces'),
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
  const noun = '(verbs?|builtins?|providers?|extract(?:ion)?\\s+modes?|templates?|MCP\\s+tools?|error\\s+codes?|error\\s+namespaces?)'
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
    const resolvedField = claimedNoun.startsWith('template') ? 'templates'
      : claimedNoun.startsWith('mcp') ? 'mcpTools'
        : claimedNoun.startsWith('error code') ? 'errorCodes'
          : claimedNoun.startsWith('error namespace') ? 'errorNamespaces' : field
    const got = claimValue(match[countIndex])
    if (got !== canon[resolvedField]) fail(`${label} says ${match[0]}, canon says ${canon[resolvedField]} ${claimedNoun}`)
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

function validateReleaseAttestation(pin) {
  if (pin.channel !== 'stable' || pin.release_closed !== true) {
    fail('committed deployment pin is not stable and release-closed')
  }
  if (typeof pin.release_attestation !== 'string' || !SHA256.test(pin.release_attestation_sha256 ?? '')) {
    fail('release attestation reference or digest is absent')
  }
  const attestationPath = join(ROOT, pin.release_attestation)
  const got = sha256File(attestationPath)
  if (got !== pin.release_attestation_sha256) fail('release attestation digest differs from pin')
  const attestation = json(attestationPath)
  for (const [field, expected] of Object.entries({
    repository: pin.repository,
    spec_commit: pin.spec_commit,
    spec_tree: pin.spec_tree,
    channel: pin.channel,
    release_closed: pin.release_closed,
  })) {
    if (attestation[field] !== expected) fail(`release attestation differs at ${field}`)
  }
  if (attestation.contract_version !== 1 || attestation.attestation_type !== 'nika-release-closure') {
    fail('release attestation has the wrong type/version')
  }
}

function validateServedPin(sourcePath, servedPath) {
  const source = readFileSync(sourcePath)
  const served = readFileSync(servedPath)
  if (!source.equals(served)) fail('served /.well-known spec pin is not byte-identical to its committed source')
}

function gatePinVerify(fixture) {
  const resync = loadResyncContract()
  const pin = fixture ?? json(join(ROOT, '.github/nika-spec-pin.json'))
  validatePin(pin, resync)
  if (!fixture) {
    validateReleaseAttestation(pin)
    validateServedPin(
      join(ROOT, '.github/nika-spec-pin.json'),
      join(ROOT, 'public/.well-known/nika-spec-pin.json'),
    )
    execFileSync('python3', ['scripts/verify_spec_resync_conformance.py'], { cwd: ROOT, stdio: 'ignore' })
  }
}

function gateCountSource(fixture) {
  const canon = parseCanon()
  if (fixture?.text) {
    const claims = discoverCountClaimsInText('negative fixture', fixture.text)
    if (claims.length === 0) fail('negative count fixture did not parse a quantitative claim')
    for (const claim of claims) {
      if (claim.expression_field === claim.field) continue
      if (!claim.ordinal && claim.value === canon[claim.field]) continue
      fail(`unregistered literal count says ${claim.text}, CANON.${claim.field} is ${canon[claim.field]}`)
    }
    return
  }
  if (fixture?.case === 'unregistered-carrier') {
    if (!renderedCarriers(ROOT).includes(fixture.path)) fail(`unregistered rendered carrier: ${fixture.path}`)
    return
  }
  const rules = contract('count-source.v1.json')
  const carriers = renderedCarriers(ROOT)
  if (rules.carrier_census?.count !== carriers.length) {
    fail(`rendered-carrier census count differs: ${carriers.length} != ${rules.carrier_census?.count}`)
  }
  const censusDigest = carrierSetSha256(carriers)
  if (rules.carrier_census?.set_sha256 !== censusDigest) {
    fail(`rendered-carrier census set differs: ${censusDigest}`)
  }
  if (JSON.stringify(rules.canon_fields) !== JSON.stringify(Object.keys(canon))) {
    fail('CanonCount field registry differs from the generated canon')
  }
  const discovered = discoverCountClaims(ROOT, carriers)
  if (rules.claim_count !== discovered.length || rules.bindings.length !== discovered.length) {
    fail(`count-claim census differs: ${discovered.length} discovered`)
  }
  const bySelector = new Map()
  for (const binding of rules.bindings) {
    if (bySelector.has(binding.selector)) fail(`duplicate count binding: ${binding.selector}`)
    bySelector.set(binding.selector, binding)
  }
  const allowedRelations = new Set([
    'canon-expression', 'canon-count', 'registry-member', 'ordinal-member',
    'workflow-subset', 'section-coordinate', 'registry-partition',
  ])
  for (const claim of discovered) {
    const binding = bySelector.get(claim.selector)
    if (!binding) fail(`literal count has no CanonCount binding: ${claim.selector}`)
    for (const field of ['path', 'line', 'text', 'source', 'field', 'value', 'ordinal']) {
      if (binding[field] !== claim[field]) fail(`count binding drift at ${claim.selector}.${field}`)
    }
    if (!allowedRelations.has(binding.relation) || typeof binding.reason !== 'string' || !binding.reason) {
      fail(`count binding is not structural: ${claim.selector}`)
    }
    if (binding.relation === 'canon-expression') {
      if (claim.expression_field !== claim.field || binding.expression_field !== claim.field) {
        fail(`count expression does not read CANON.${claim.field}: ${claim.selector}`)
      }
    } else if (binding.relation === 'canon-count') {
      if (claim.value !== canon[claim.field]) fail(`literal count differs from CANON.${claim.field}: ${claim.selector}`)
    } else if (binding.relation === 'registry-member') {
      if (!claim.singular || claim.value !== 1) fail(`registry-member binding is not singular: ${claim.selector}`)
    } else if (binding.relation === 'ordinal-member') {
      if (!claim.ordinal) fail(`ordinal-member binding is not ordinal: ${claim.selector}`)
    }
  }
}

function gitBlobBytes(blob, label) {
  if (!FULL_SHA.test(blob ?? '')) fail(`bad Git blob identity: ${label}`)
  try {
    execFileSync('git', ['cat-file', '-e', blob], { cwd: ROOT, stdio: 'ignore' })
    return execFileSync('git', ['cat-file', 'blob', blob], { cwd: ROOT, encoding: 'buffer' })
  } catch {
    fail(`snippet source Git object is not live: ${label}`)
  }
}

function gateSnippetProvenance(fixture) {
  const rules = contract('snippets.v1.json')
  if (fixture?.case === 'floating-code') {
    const selectors = new Set(flattenSnippetBlocks(rules.carriers).map((block) => block.selector))
    if (!selectors.has(fixture.selector)) fail(`floating code block: ${fixture.selector}`)
    return
  }
  if (fixture?.case === 'dead-git-object') {
    gitBlobBytes(fixture.source_blob, fixture.path ?? 'negative fixture')
    return
  }
  const discovered = discoverSnippetCarriers(ROOT)
  const discoveredBlocks = flattenSnippetBlocks(discovered)
  const registeredBlocks = flattenSnippetBlocks(rules.carriers)
  if (rules.registry !== 'SNIPPET_REGISTRY' || !rules.source_repository) fail('snippet registry identity is absent')
  if (rules.census?.carrier_count !== discovered.length || rules.census?.block_count !== discoveredBlocks.length) {
    fail(`code-block census differs: ${discovered.length} carriers / ${discoveredBlocks.length} blocks`)
  }
  if (rules.carriers.length !== discovered.length || registeredBlocks.length !== discoveredBlocks.length) {
    fail('SNIPPET_REGISTRY is not set-equal to the discovered code blocks')
  }
  const registeredByPath = new Map()
  const selectorSet = new Set()
  for (const carrier of rules.carriers) {
    if (registeredByPath.has(carrier.path)) fail(`duplicate snippet carrier: ${carrier.path}`)
    registeredByPath.set(carrier.path, carrier)
    for (const block of carrier.blocks) {
      if (selectorSet.has(block.selector)) fail(`duplicate snippet selector: ${block.selector}`)
      selectorSet.add(block.selector)
      if (!SHA256.test(block.sha256 ?? '')) fail(`bad snippet digest: ${block.selector}`)
    }
  }
  for (const actual of discovered) {
    const registered = registeredByPath.get(actual.path)
    if (!registered) fail(`code-block carrier is unregistered: ${actual.path}`)
    if (registered.source_blob !== actual.source_blob) fail(`snippet carrier blob drift: ${actual.path}`)
    const current = readFileSync(join(ROOT, actual.path))
    if (gitBlobId(current) !== registered.source_blob) fail(`snippet carrier is not bound to its current Git blob: ${actual.path}`)
    const objectBytes = gitBlobBytes(registered.source_blob, actual.path)
    if (!current.equals(objectBytes)) fail(`live Git object differs from snippet carrier: ${actual.path}`)
    if (JSON.stringify(registered.blocks) !== JSON.stringify(actual.blocks)) {
      fail(`code-block selector set drift: ${actual.path}`)
    }
  }
}

function validateFeatureClaim(claim, features, rules) {
  const feature = features.get(claim.feature)
  if (!feature) fail(`presentation claim references an unregistered feature: ${claim.feature}`)
  if (!rules.presentable_status.includes(claim.presented_as)) {
    fail(`presentation claim has invalid advertised status: ${claim.feature}/${claim.presented_as}`)
  }
  if (!rules.presentable_status.includes(feature.status)) {
    fail(`presentation presents ${feature.status} feature as ${claim.presented_as}: ${claim.feature}`)
  }
}

function gateFeatureMaturity(fixture) {
  const rules = contract('features.v1.json')
  const features = new Map()
  for (const feature of rules.features) {
    if (!feature.id || features.has(feature.id)) fail(`duplicate feature id: ${feature.id}`)
    if (!rules.allowed_status.includes(feature.status)) fail(`feature ${feature.id} has invalid status ${feature.status}`)
    features.set(feature.id, feature)
    if (rules.presentable_status.includes(feature.status) && !(feature.evidence?.length > 0)) {
      fail(`presentable feature has no evidence: ${feature.id}`)
    }
    for (const path of feature.evidence ?? []) if (!existsSync(join(ROOT, path))) fail(`feature evidence missing: ${path}`)
  }
  if (fixture?.claim) return validateFeatureClaim(fixture.claim, features, rules)
  if (fixture?.page) {
    if (!rules.claims.some((claim) => claim.path === fixture.page.path)) {
      fail(`prerendered page has no FEATURE_REGISTRY claim: ${fixture.page.path}`)
    }
    return
  }
  const routes = discoverRouteClaims(ROOT)
  const discovered = discoverPrerenderClaims(ROOT)
  const prerenderConsumer = readFileSync(join(ROOT, rules.prerender_consumer), 'utf8')
  for (const token of ["from './site.config'", 'paths: PATHS', 'routes,']) {
    if (!prerenderConsumer.includes(token)) fail(`prerender consumer is detached from the page census: ${token}`)
  }
  if (rules.route_definition_count !== routes.length) {
    fail(`feature route-definition census differs: ${routes.length} routes`)
  }
  if (rules.page_claim_count !== discovered.length || rules.claims.length !== discovered.length) {
    fail(`feature prerender-page census differs: ${discovered.length} pages`)
  }
  const claims = new Map()
  for (const claim of rules.claims) {
    if (claims.has(claim.selector)) fail(`duplicate presentation claim: ${claim.selector}`)
    claims.set(claim.selector, claim)
  }
  for (const route of discovered) {
    const claim = claims.get(route.selector)
    if (!claim) fail(`prerendered page lacks a feature-maturity claim: ${route.selector}`)
    for (const field of ['path', 'route_selector', 'component']) {
      if (claim[field] !== route[field]) fail(`feature claim drift at ${route.selector}.${field}`)
    }
    validateFeatureClaim(claim, features, rules)
  }
  for (const route of routes.filter((entry) => entry.path !== '/*')) {
    if (!discovered.some((page) => page.route_selector === route.selector)) {
      fail(`public route has no prerendered page claim: ${route.path}`)
    }
  }
}

function hostMatches(host, rule) {
  if (rule.kind === 'exact') return host === rule.value
  if (rule.kind === 'suffix') return host.endsWith(rule.value) && host !== rule.value.slice(1)
  fail(`unknown channel host matcher: ${rule.kind}`)
}

function validateChannelCandidate(rules, candidate) {
  const row = rules.matrix.find((entry) => entry.channel === candidate.channel)
  if (!row) fail(`unknown deployment channel: ${candidate.channel}`)
  if (!row.hosts.some((host) => hostMatches(candidate.host, host))) {
    fail(`${candidate.pin_channel} pin is not allowed on ${candidate.channel} host ${candidate.host}`)
  }
  if (!row.paths.includes(candidate.path)) fail(`channel path is not allowed: ${candidate.channel}${candidate.path}`)
  if (!row.pin_channels.includes(candidate.pin_channel)) {
    fail(`${candidate.pin_channel} pin is not allowed on ${candidate.channel}`)
  }
  if (row.banner.mode === 'required' && candidate.banner !== row.banner.value) {
    fail(`${candidate.channel} channel is missing its ${row.banner.value} banner`)
  }
  if (row.banner.mode === 'forbidden' && candidate.banner != null) {
    fail(`${candidate.channel} channel must not carry a non-stable banner`)
  }
  if (row.release_closed.mode === 'required' && candidate.release_closed !== row.release_closed.value) {
    fail(`${candidate.channel} channel requires release_closed=${row.release_closed.value}`)
  }
}

function validateDeploymentManifest(rules, source) {
  let manifest
  try {
    manifest = require('yaml').parse(source)
  } catch (error) {
    fail(`deployment manifest is not valid YAML: ${error.message}`)
  }
  const expected = rules.deployment.expected
  if (JSON.stringify(manifest?.domains) !== JSON.stringify(expected.domains)) {
    fail('deployment domain structure differs from the channel matrix')
  }
  const sites = manifest?.static_sites
  if (!Array.isArray(sites) || sites.length !== 1) fail('deployment must contain exactly one static site')
  const site = sites[0]
  for (const [field, value] of Object.entries({
    name: expected.component_name,
    source_dir: expected.source_dir,
    output_dir: expected.output_dir,
  })) {
    if (site?.[field] !== value) fail(`deployment static-site ${field} differs from the channel matrix`)
  }
  for (const [field, value] of Object.entries({
    repo: expected.repository,
    branch: expected.branch,
    deploy_on_push: expected.deploy_on_push,
  })) {
    if (site?.github?.[field] !== value) fail(`deployment GitHub ${field} differs from the channel matrix`)
  }
  const ingress = manifest?.ingress?.rules
  if (!Array.isArray(ingress) || ingress.length !== 1) fail('deployment must contain exactly one ingress rule')
  if (ingress[0]?.component?.name !== expected.component_name
    || ingress[0]?.match?.path?.prefix !== expected.ingress_path_prefix
    || ingress[0]?.match?.authority?.exact !== '') {
    fail('deployment ingress component/host/path structure differs from the channel matrix')
  }
}

function gateChannelPolicy(fixture) {
  const rules = contract('channels.v1.json')
  if (fixture?.candidate) return validateChannelCandidate(rules, fixture.candidate)
  if (fixture?.manifest) return validateDeploymentManifest(rules, fixture.manifest)
  const channels = rules.matrix.map((row) => row.channel)
  if (JSON.stringify(channels) !== JSON.stringify(['stable', 'preview', 'nightly'])) {
    fail('channel matrix must contain stable, preview, and nightly exactly once')
  }
  const expectedNegatives = [
    'nightly-pin-on-stable-host', 'missing-preview-banner', 'missing-nightly-banner',
    'unclosed-stable-release', 'wrong-channel-path',
  ]
  if (JSON.stringify(rules.named_negative_cases) !== JSON.stringify(expectedNegatives)) {
    fail('named channel negative-case registry is incomplete')
  }
  const pin = json(join(ROOT, rules.pin_source))
  validatePin(pin, loadResyncContract())
  validateReleaseAttestation(pin)
  validateServedPin(join(ROOT, rules.pin_source), join(ROOT, rules.served_pin))
  if (pin.release_attestation !== rules.release_attestation) fail('channel contract points at a different release attestation')
  const candidate = {
    ...rules.deployment.candidate,
    pin_channel: pin.channel,
    release_closed: pin.release_closed,
  }
  validateChannelCandidate(rules, candidate)
  const manifest = readFileSync(join(ROOT, rules.deployment.manifest), 'utf8')
  validateDeploymentManifest(rules, manifest)
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
