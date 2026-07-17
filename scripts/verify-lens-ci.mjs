#!/usr/bin/env node
// LENS-006 · prove that the eight named CI jobs still execute their real
// semantics, then replay one deterministic negative per gate.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, sha256File } from './spec-resync-lib.mjs'
import { BLOG_GENERATED_MIRRORS } from './build-blog.mjs'
import {
  cssContentInventory,
  renderedCarriers as semanticRenderedCarriers,
} from './lens-semantics-lib.mjs'

const CONTRACT_ROOT = join(ROOT, 'scripts/lens/contracts')
const workflowPath = join(ROOT, '.github/workflows/lens-gates.yml')
const expectedBlogGeneratedMirrors = [
  'public/llms-full.txt',
  'public/rss.xml',
  'src/content/blog-bodies.generated.ts',
  'src/content/blog.generated.ts',
]
const requiredIntegrityArtifacts = [
  '.npmrc',
  '.do/app.yaml',
  '.github/nika-spec-pin.json',
  '.github/workflows/lens-gates.yml',
  '.github/workflows/spec-resync.yml',
  'index.html',
  'public/.well-known/nika-spec-pin.json',
  'package.json',
  'pnpm-lock.yaml',
  'react-ssg.config.ts',
  'scripts/build-blog.mjs',
  'scripts/build-og-card.mjs',
  'scripts/build-lens-semantic-contracts.mjs',
  'scripts/lens-gate.mjs',
  'scripts/lens-semantics-lib.mjs',
  'scripts/lens/contracts/carrier-universe.v1.json',
  'scripts/lens/contracts/channels.v1.json',
  'scripts/lens/contracts/count-source.v1.json',
  'scripts/lens/contracts/features.v1.json',
  'scripts/lens/contracts/gates.v1.json',
  'scripts/lens/contracts/presentation.v1.json',
  'scripts/lens/contracts/release-attestation.v1.json',
  'scripts/lens/contracts/snippets.v1.json',
  'scripts/lens/fixtures/negative.v1.json',
  'scripts/spec-resync.contract.json',
  'scripts/spec-resync-lib.mjs',
  'scripts/spec-resync-run.mjs',
  'scripts/test-lens-integrity-adversarial.mjs',
  'scripts/test-lens-semantics-adversarial.mjs',
  'scripts/test-spec-resync-adversarial.mjs',
  'scripts/verify_generated_outputs.mjs',
  'scripts/verify-lens-ci.mjs',
  'scripts/verify_spec_resync_conformance.py',
  'site.config.ts',
  'src/routes.tsx',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
]

function fail(message) {
  throw new Error(`LENS-006 integrity: ${message}`)
}

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

const WORKFLOW_PARSER = String.raw`
import json
import sys
import yaml

source = sys.stdin.read()
for event in yaml.parse(source, Loader=yaml.BaseLoader):
    if getattr(event, "anchor", None) is not None:
        raise ValueError("YAML anchors and aliases are forbidden")

class ClosedLoader(yaml.BaseLoader):
    pass

def closed_mapping(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key == "<<":
            raise ValueError("YAML merges are forbidden")
        if key in mapping:
            raise ValueError(f"duplicate YAML key: {key}")
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping

ClosedLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, closed_mapping)
document = yaml.load(source, Loader=ClosedLoader)
json.dump(document, sys.stdout)
`

function parseWorkflow(text) {
  const parsed = spawnSync('python3', ['-c', WORKFLOW_PARSER], {
    cwd: ROOT,
    input: text,
    encoding: 'utf8',
  })
  if (parsed.status !== 0) fail(`workflow YAML is not closed/structural: ${parsed.stderr.trim()}`)
  try {
    return JSON.parse(parsed.stdout)
  } catch (error) {
    fail(`workflow parser returned invalid JSON: ${error.message}`)
  }
}

function rejectConditionalExecution(value, path) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectConditionalExecution(entry, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'if') fail(`${path} declares conditional execution; required jobs and steps must always execute`)
    if (key === 'continue-on-error') fail(`${path} declares continue-on-error; required jobs and steps must fail closed`)
    rejectConditionalExecution(entry, `${path}.${key}`)
  }
}

function rejectNoOps(job, definition) {
  rejectConditionalExecution(definition, job)
  if (!Array.isArray(definition.steps) || definition.steps.length === 0) fail(`${job} has no executable steps`)
  for (const [index, step] of definition.steps.entries()) {
    const run = step?.run
    if (run === true || (typeof run === 'string' && /^(?:true|:|echo(?:\s|$))/i.test(run.trim()))) {
      fail(`${job}.steps[${index}] contains a true/echo no-op`)
    }
    if (typeof run === 'string' && /\|\|\s*true\b/.test(run)) {
      fail(`${job}.steps[${index}] swallows failure with || true`)
    }
  }
}

function exactCommandCount(job, definition, command) {
  const steps = definition.steps.filter((step) => step?.run === command)
  for (const step of steps) {
    if (JSON.stringify(Object.keys(step)) !== JSON.stringify(['run'])) {
      fail(`${job} required command step carries an execution modifier`)
    }
  }
  return steps.length
}

function exactStructure(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} differs from the closed workflow structure`)
  }
}

function gateJob(command) {
  return {
    'runs-on': 'ubuntu-latest',
    'timeout-minutes': '10',
    steps: [
      { uses: 'actions/checkout@v5' },
      { uses: 'actions/setup-node@v5', with: { 'node-version': '22', 'package-manager-cache': 'false' } },
      { run: 'corepack enable' },
      { run: 'pnpm install --frozen-lockfile' },
      { run: command },
    ],
  }
}

function integrityJob(command) {
  return {
    'runs-on': 'ubuntu-latest',
    'timeout-minutes': '10',
    steps: [
      { uses: 'actions/checkout@v5' },
      { uses: 'actions/setup-node@v5', with: { 'node-version': '22', 'package-manager-cache': 'false' } },
      { uses: 'actions/setup-python@v6', with: { 'python-version': '3.12' } },
      { run: 'corepack enable' },
      { run: 'pnpm install --frozen-lockfile' },
      { run: 'pip install pyyaml==6.0.3' },
      { run: command },
    ],
  }
}

function independentCarrierUniverse() {
  const walk = (directory, prefix, accept) => {
    const paths = []
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${prefix}/${entry.name}`
      if (entry.isSymbolicLink()) fail(`carrier universe contains a symlink: ${path}`)
      if (entry.isDirectory()) paths.push(...walk(join(directory, entry.name), path, accept))
      else if (entry.isFile() && accept(path)) paths.push(path)
    }
    return paths
  }
  const source = walk(join(ROOT, 'src'), 'src', (path) => (
    /\.(?:css|ts|tsx)$/.test(path)
    && !path.includes('.test.')
    && !path.startsWith('src/test/')
  ))
  const posts = walk(join(ROOT, 'content/blog'), 'content/blog', (path) => (
    path.endsWith('.md') && path !== 'content/blog/README.md'
  ))
  const publicText = walk(join(ROOT, 'public'), 'public', (path) => (
    /\.(?:css|html|json|md|sh|svg|ttl|txt|webmanifest|xml|ya?ml)$/.test(path)
  ))
  return [...new Set([
    ...source,
    ...posts,
    ...publicText,
    'scripts/build-blog.mjs',
    'scripts/build-og-card.mjs',
  ])].sort()
}

function independentCarrierClassification(carriers) {
  const mirrors = new Set(expectedBlogGeneratedMirrors)
  const normative = carriers.filter((path) => (
    path.startsWith('content/blog/')
    || path === 'scripts/build-blog.mjs'
    || path === 'scripts/build-og-card.mjs'
    || (path.startsWith('src/') && /\.(?:ts|tsx)$/.test(path) && !path.includes('.generated.'))
    || [
      'public/.well-known/security.txt',
      'public/404.html',
      'public/humans.txt',
      'public/install.sh',
      'public/llms.txt',
      'public/manifest.webmanifest',
      'public/robots.txt',
    ].includes(path)
  ) && !mirrors.has(path))
  const generatedMirrors = carriers.filter((path) => mirrors.has(path))
  const normativeSet = new Set(normative)
  const mirrorSet = new Set(generatedMirrors)
  const machineOrPresentational = carriers.filter((path) => !normativeSet.has(path) && !mirrorSet.has(path))
  return { normative, generatedMirrors, machineOrPresentational }
}

function carrierSetSha256(paths) {
  return createHash('sha256').update(`${paths.join('\n')}\n`).digest('hex')
}

function verifyCarrierAuthority() {
  const universe = json(join(CONTRACT_ROOT, 'carrier-universe.v1.json'))
  const carriers = independentCarrierUniverse()
  if (universe.contract_version !== 1 || universe.authority !== 'independent-exhaustive-carrier-universe') {
    fail('carrier universe has the wrong identity/version')
  }
  if (JSON.stringify(universe.carriers) !== JSON.stringify(carriers)) {
    fail('carrier universe differs from independent exhaustive filesystem enumeration')
  }
  if (JSON.stringify(semanticRenderedCarriers(ROOT)) !== JSON.stringify(carriers)) {
    fail('semantic carrier discovery shrank or diverged from independent enumeration')
  }
  if (universe.carrier_count !== carriers.length || universe.set_sha256 !== carrierSetSha256(carriers)) {
    fail('carrier universe count/digest differs from independent enumeration')
  }
  const classified = independentCarrierClassification(carriers)
  exactStructure('normative carrier sources', universe.normative_sources, classified.normative)
  exactStructure('generated carrier mirrors', universe.generated_mirrors, classified.generatedMirrors)
  exactStructure('generated mirror authority path set', expectedBlogGeneratedMirrors, classified.generatedMirrors)
  exactStructure('generated mirror generator path set', BLOG_GENERATED_MIRRORS, expectedBlogGeneratedMirrors)
  exactStructure('machine/presentational carriers', universe.machine_or_presentational, classified.machineOrPresentational)
  if (universe.normative_source_count !== classified.normative.length
    || universe.normative_source_sha256 !== carrierSetSha256(classified.normative)) {
    fail('normative carrier count/digest differs from independent classification')
  }
  const cssPolicy = {
    mode: 'closed-stylistic-literals-v1',
    scope: 'all classified *.css carriers',
    count_claims: 'forbidden',
    allowed_literals: [
      '', ' (', ' · ', ')', '+', 'plain words', '· press ▶ · or keep scrolling ·',
      '“', '”', '›', '→', '→ ', '−', '★ ', '✓ ',
    ],
    allowed_dynamic_expressions: ['attr(href)', 'counter(verify)'],
  }
  exactStructure('CSS content policy', universe.css_content_policy, cssPolicy)
  const css = cssContentInventory(ROOT, carriers.filter((path) => path.endsWith('.css')))
  exactStructure('CSS content literal allowlist', css.literals, cssPolicy.allowed_literals)
  exactStructure('CSS content dynamic-expression allowlist', css.dynamic_expressions, cssPolicy.allowed_dynamic_expressions)
  if (css.count_claims.length > 0) {
    fail(`CSS content carries a forbidden count claim: ${css.count_claims[0].selector}`)
  }
  const count = json(join(CONTRACT_ROOT, 'count-source.v1.json'))
  if (count.carrier_census?.count !== universe.normative_source_count
    || count.carrier_census?.set_sha256 !== universe.normative_source_sha256
    || count.carrier_census?.rendered_count !== universe.carrier_count
    || count.carrier_census?.rendered_set_sha256 !== universe.set_sha256
    || JSON.stringify(count.carrier_census?.roots) !== JSON.stringify(universe.roots)
    || JSON.stringify(count.carrier_census?.exclusions) !== JSON.stringify(universe.exclusions)) {
    fail('generated count census shrank or diverged from independent carrier authority')
  }
  const expectedFeatureSources = ['react-ssg.config.ts', 'site.config.ts', 'src/routes.tsx']
  if (JSON.stringify(universe.feature_sources) !== JSON.stringify(expectedFeatureSources)) {
    fail('feature source universe differs from the closed authority')
  }
}

function verifyGeneratedMirrors() {
  const result = spawnSync(process.execPath, ['scripts/build-blog.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    fail(`generated carrier mirror projection differs: ${(result.stderr || result.stdout).trim()}`)
  }
}

function runGate(id, fixture) {
  const args = ['scripts/lens-gate.mjs', id]
  if (fixture) args.push('--fixture', fixture)
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' })
}

try {
  const gateContract = json(join(CONTRACT_ROOT, 'gates.v1.json'))
  const integrity = json(join(CONTRACT_ROOT, 'integrity.v1.json'))
  if (gateContract.contract_version !== 1 || integrity.contract_version !== 1) fail('unsupported contract version')

  const ids = gateContract.gates.map((gate) => gate.id)
  const declaredJobs = gateContract.gates.map((gate) => gate.job)
  if (new Set(ids).size !== ids.length) fail('duplicate gate ID in contract')
  if (new Set(declaredJobs).size !== declaredJobs.length) fail('duplicate gate job in contract')
  if (ids.length !== 8) fail(`expected eight gate IDs, got ${ids.length}`)

  const integrityPaths = integrity.artifacts.map((artifact) => artifact.path)
  if (JSON.stringify(integrityPaths) !== JSON.stringify(requiredIntegrityArtifacts)) {
    fail('integrity artifact manifest is not set-equal to the required semantic surface')
  }
  for (const artifact of integrity.artifacts) {
    const got = sha256File(join(ROOT, artifact.path))
    if (got !== artifact.sha256) fail(`bad digest for ${artifact.path}: ${got} != ${artifact.sha256}`)
  }
  verifyCarrierAuthority()
  verifyGeneratedMirrors()

  const workflow = readFileSync(workflowPath, 'utf8')
  const workflowDocument = parseWorkflow(workflow)
  exactStructure('workflow root keys', Object.keys(workflowDocument), ['name', 'on', 'jobs'])
  exactStructure('workflow name', workflowDocument.name, 'lens-gates')
  exactStructure('workflow triggers', workflowDocument.on, {
    push: { branches: ['main'] },
    pull_request: '',
  })
  const jobs = workflowDocument?.jobs
  if (!jobs || typeof jobs !== 'object' || Array.isArray(jobs)) fail('workflow jobs mapping is absent')
  const expectedJobs = new Set([...declaredJobs, gateContract.integrity_job])
  const actualJobs = new Set(Object.keys(jobs))
  const absent = [...expectedJobs].filter((job) => !actualJobs.has(job))
  const renamedOrExtra = [...actualJobs].filter((job) => !expectedJobs.has(job))
  if (absent.length) fail(`absent/renamed workflow job(s): ${absent.join(', ')}`)
  if (renamedOrExtra.length) fail(`unexpected/renamed workflow job(s): ${renamedOrExtra.join(', ')}`)

  for (const gate of gateContract.gates) {
    const definition = jobs[gate.job]
    rejectNoOps(gate.job, definition)
    exactStructure(gate.job, definition, gateJob(gate.command))
    const occurrences = exactCommandCount(gate.job, definition, gate.command)
    if (occurrences !== 1) fail(`${gate.job} must run exact command once, got ${occurrences}`)
  }
  const integrityDefinition = jobs[gateContract.integrity_job]
  rejectNoOps(gateContract.integrity_job, integrityDefinition)
  exactStructure(gateContract.integrity_job, integrityDefinition, integrityJob(gateContract.integrity_command))
  if (exactCommandCount(gateContract.integrity_job, integrityDefinition, gateContract.integrity_command) !== 1) {
    fail('integrity job command is absent, renamed, or duplicated')
  }

  for (const gate of gateContract.gates) {
    const positive = runGate(gate.id)
    if (positive.status !== 0) fail(`${gate.id} positive replay failed: ${(positive.stderr || positive.stdout).trim()}`)
    const negative = runGate(gate.id, gate.negative)
    if (negative.status === 0) fail(`${gate.id} accepted its negative fixture`)
    if (!negative.stderr.includes('LENS-006:') && !negative.stderr.includes('LENS-011:')) {
      fail(`${gate.id} negative did not fail through a semantic contract`)
    }
  }

  const semanticAdversarial = spawnSync(process.execPath, ['scripts/test-lens-semantics-adversarial.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (semanticAdversarial.status !== 0) {
    fail(`semantic adversarial suite failed: ${(semanticAdversarial.stderr || semanticAdversarial.stdout).trim()}`)
  }

  console.log('LENS-006 integrity: 8/8 jobs exact · artifact set pinned · 8/8 gate negatives + 17/17 semantic adversaries verified')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
