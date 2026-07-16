#!/usr/bin/env node
// LENS-011 · exact, dual-run spec resync proof.
//
// Generation happens twice in disposable clones. Both runs must match the
// versioned output digests and each other byte-for-byte. Only then may the
// verified bytes replace the checkout, enter the index through literal paths,
// and build from the first sealed clone.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import {
  ROOT,
  CONTRACT_PATH,
  changedPaths,
  compareOutputTrees,
  copyContractOutputs,
  gitHead,
  gitTree,
  linkDependencies,
  loadContract,
  runGeneratorDag,
  runSealedBuild,
  sha256File,
  stageLiteralOutputs,
  unlinkDependencies,
  verifyChangedSet,
  verifyConsumers,
  verifyOutputTree,
  writeReceipt,
} from './spec-resync-lib.mjs'

function usage() {
  console.error('usage: node scripts/spec-resync-run.mjs --spec-root PATH [--dependencies-root PATH] [--apply --stage] [--build] [--receipt PATH] [--keep-temp] [--allow-toolchain-mismatch]')
  process.exit(2)
}

function parseArgs(argv) {
  const options = { apply: false, stage: false, build: false, keepTemp: false, allowToolchainMismatch: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--spec-root') options.specRoot = resolve(argv[++i] ?? '')
    else if (arg === '--dependencies-root') options.dependenciesRoot = resolve(argv[++i] ?? '')
    else if (arg === '--receipt') options.receipt = resolve(argv[++i] ?? '')
    else if (arg === '--apply') options.apply = true
    else if (arg === '--stage') options.stage = true
    else if (arg === '--build') options.build = true
    else if (arg === '--keep-temp') options.keepTemp = true
    else if (arg === '--allow-toolchain-mismatch') options.allowToolchainMismatch = true
    else usage()
  }
  if (!options.specRoot || (options.stage && !options.apply)) usage()
  options.dependenciesRoot ??= ROOT
  return options
}

function cloneAt(source, destination, revision) {
  execFileSync('git', ['clone', '--quiet', '--no-checkout', '--no-hardlinks', source, destination], {
    stdio: 'inherit',
  })
  execFileSync('git', ['-C', destination, 'checkout', '--quiet', '--detach', revision], {
    stdio: 'inherit',
  })
}

function generateRun(parent, name, sourceHead, specSource, dependenciesRoot, contract) {
  const website = join(parent, `${name}-website`)
  const spec = join(parent, `${name}-spec`)
  cloneAt(ROOT, website, sourceHead)
  cloneAt(specSource, spec, contract.spec.commit)
  linkDependencies(dependenciesRoot, website)
  let outputs
  try {
    runGeneratorDag(website, spec, contract, { verify: false })
  } finally {
    unlinkDependencies(website)
  }
  verifyChangedSet(website, contract)
  verifyConsumers(website, contract)
  outputs = verifyOutputTree(website, contract)
  return { website, spec, outputs }
}

const options = parseArgs(process.argv.slice(2))
const contract = loadContract()
const sourceHead = gitHead(ROOT)
const sourceTree = gitTree(ROOT)

const toolVersions = {
  node: process.versions.node,
  pnpm: execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim(),
  python: execFileSync('python3', ['--version'], { encoding: 'utf8' }).trim().replace(/^Python /, ''),
  pyyaml: execFileSync('python3', ['-c', 'import yaml; print(yaml.__version__)'], { encoding: 'utf8' }).trim(),
}
const toolchainConformant =
  toolVersions.node.split('.')[0] === contract.toolchain.node
  && toolVersions.pnpm === contract.toolchain.pnpm
  && toolVersions.python.startsWith(`${contract.toolchain.python}.`)
  && toolVersions.pyyaml === contract.toolchain.pyyaml
if (!toolchainConformant && !options.allowToolchainMismatch) {
  throw new Error(`LENS-011: toolchain mismatch: ${JSON.stringify(toolVersions)} != ${JSON.stringify(contract.toolchain)}`)
}
const scratch = mkdtempSync(join(tmpdir(), 'nika-spec-resync-'))

try {
  const first = generateRun(scratch, 'first', sourceHead, options.specRoot, options.dependenciesRoot, contract)
  const second = generateRun(scratch, 'second', sourceHead, options.specRoot, options.dependenciesRoot, contract)
  compareOutputTrees(first.website, second.website, contract)

  let buildOutput = ''
  if (options.build) {
    linkDependencies(options.dependenciesRoot, first.website)
    try {
      buildOutput = runSealedBuild(first.website, contract)
    } finally {
      unlinkDependencies(first.website)
    }
  }

  let staged = []
  let indexVerifiedOutputs = []
  if (options.apply) {
    // Dirty declared outputs are overwritten by the independently generated
    // bytes; any other dirty path makes the proposal non-reproducible.
    verifyChangedSet(ROOT, contract)
    copyContractOutputs(first.website, ROOT, contract)
    verifyOutputTree(ROOT, contract, { checkChanges: true })
    if (options.stage) {
      staged = stageLiteralOutputs(ROOT, contract)
      indexVerifiedOutputs = contract.outputs.map((output) => output.path)
    }
  }

  const receipt = {
    contract_version: contract.contract_version,
    contract_sha256: sha256File(CONTRACT_PATH),
    website_commit: sourceHead,
    website_tree: sourceTree,
    spec_commit: contract.spec.commit,
    spec_tree: contract.spec.tree,
    generators: contract.generators.map(({ id, path, sha256 }) => ({ id, path, sha256 })),
    fixed_environment: contract.environment,
    expected_toolchain: contract.toolchain,
    actual_tool_versions: toolVersions,
    toolchain_conformant: toolchainConformant,
    dual_run: true,
    outputs: first.outputs,
    staged_changes: staged,
    index_verified_outputs: indexVerifiedOutputs,
    build_input_verified_outputs: options.build ? contract.outputs.map((output) => output.path) : [],
    build_command: contract.build.command,
    build_output_directory: contract.build.output_directory,
    sealed_build: options.build,
  }
  if (options.receipt) writeReceipt(options.receipt, receipt)
  console.log(`LENS-011: ${contract.outputs.length} exact outputs · dual-run deterministic · digests verified`)
  if (options.build) console.log(`LENS-011: sealed snapshot build verified${buildOutput ? ' · build command green' : ''}`)
  if (options.stage) console.log(`LENS-011: ${staged.length} literal path(s) staged · raw index bytes verified`)
} finally {
  if (options.keepTemp) console.error(`LENS-011: retained ${scratch}`)
  else rmSync(scratch, { recursive: true, force: true })
}
