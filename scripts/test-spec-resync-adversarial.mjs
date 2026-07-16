#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  compareOutputTrees,
  compareDirectoryTrees,
  runGeneratorDag,
  runSealedBuild,
  sha256File,
  snapshotDirectory,
  verifyChangedSet,
  verifyConsumers,
  verifyGeneratorDigests,
  verifyIndex,
  verifyOutputTree,
  verifyPublishInputContract,
  verifySpecIdentity,
  validateContract,
} from './spec-resync-lib.mjs'

const scratch = mkdtempSync(join(tmpdir(), 'spec-resync-adversarial-'))
const base = join(scratch, 'base')
const outputPath = 'src/content/templates.generated.ts'
const generatorPath = 'scripts/generate.mjs'
const publishManifestPath = '.do/app.yaml'
const publishBuildCommand = 'corepack enable && pnpm install --frozen-lockfile && pnpm build'

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

function clone(name) {
  const destination = join(scratch, name)
  execFileSync('git', ['clone', '--quiet', '--no-hardlinks', base, destination])
  return destination
}

function expectReject(name, operation) {
  try {
    operation()
  } catch (error) {
    if (!String(error.message).includes('LENS-011:')) throw error
    console.log(`ok · ${name} rejected`)
    return
  }
  throw new Error(`adversarial case was accepted: ${name}`)
}

function commitPublishManifest(root, source, contract) {
  writeFileSync(join(root, publishManifestPath), source)
  git(root, ['add', '--', publishManifestPath])
  git(root, [
    '-c', 'user.name=Nika', '-c', 'user.email=nika@supernovae.studio',
    'commit', '--quiet', '-m', 'test: mutate publish manifest',
  ])
  contract.publish_input_contract.manifest = {
    path: publishManifestPath,
    git_blob: git(root, ['rev-parse', `HEAD:${publishManifestPath}`]),
    sha256: sha256File(join(root, publishManifestPath)),
  }
}

try {
  mkdirSync(join(base, 'src/content'), { recursive: true })
  mkdirSync(join(base, 'scripts'), { recursive: true })
  mkdirSync(join(base, '.do'), { recursive: true })
  writeFileSync(join(base, outputPath), 'export const VALUE = "verified"\n')
  writeFileSync(join(base, 'src/app.ts'), "import './content/templates.generated'\n")
  writeFileSync(join(base, generatorPath), '// deterministic fixture generator\n')
  writeFileSync(join(base, publishManifestPath), `features:\n  - buildpack-stack=ubuntu-22\nstatic_sites:\n  - name: nika-landing\n    github:\n      repo: supernovae-st/nika.sh\n      branch: main\n      deploy_on_push: true\n    source_dir: /\n    environment_slug: node-js\n    build_command: ${publishBuildCommand}\n    output_dir: dist\n    envs:\n      - key: NODE_VERSION\n        value: "22"\n        scope: BUILD_TIME\n`)
  execFileSync('git', ['init', '--quiet', base])
  git(base, ['config', 'user.email', 'nika@supernovae.studio'])
  git(base, ['config', 'user.name', 'Nika'])
  git(base, ['add', '--', '.'])
  git(base, ['commit', '--quiet', '-m', 'test: establish exact fixture'])
  const head = git(base, ['rev-parse', 'HEAD'])
  const tree = git(base, ['rev-parse', 'HEAD^{tree}'])
  const contract = {
    contract_version: 1,
    spec: { commit: head, tree },
    environment: {
      LANG: 'C.UTF-8',
      LC_ALL: 'C.UTF-8',
      NIKA_BIN: '/__nika_spec_resync_no_binary__',
      PYTHONHASHSEED: '0',
      SOURCE_DATE_EPOCH: '0',
      TZ: 'UTC',
    },
    environment_policy: {
      inherit: ['PATH'],
      generator_derived: ['NIKA_SPEC_ROOT', 'NIKA_WEBSITE_ROOT', 'NIKA_WEBSITE_SRC'],
    },
    toolchain: { node: '22', pnpm: '10.32.1', python: '3.12', pyyaml: '6.0.3' },
    generators: [{
      id: 'fixture', root: 'website', runtime: 'node', path: generatorPath,
      sha256: sha256File(join(base, generatorPath)), args: [], depends_on: [], outputs: [outputPath],
    }],
    outputs: [{
      path: outputPath,
      sha256: sha256File(join(base, outputPath)),
      consumers: ['src/app.ts'],
    }],
    build: { command: ['pnpm', 'build'], output_directory: 'dist' },
    publish_input_contract: {
      required_receipt_status: 'publish_input_verified',
      manifest: {
        path: publishManifestPath,
        git_blob: git(base, ['rev-parse', `HEAD:${publishManifestPath}`]),
        sha256: sha256File(join(base, publishManifestPath)),
      },
      component: 'nika-landing',
      repository: 'supernovae-st/nika.sh',
      branch: 'main',
      deploy_on_push: true,
      source_directory: '/',
      environment_slug: 'node-js',
      features: ['buildpack-stack=ubuntu-22'],
      build_time_environment: [{ key: 'NODE_VERSION', value: '22', scope: 'BUILD_TIME' }],
      build_steps: ['corepack enable', 'pnpm install --frozen-lockfile', 'pnpm build'],
      build_command: publishBuildCommand,
      output_directory: 'dist',
      exact_file_set: 'complete-recursive-regular-files',
      exact_byte_identity: 'sha256-per-file',
      tree_identity: 'sorted-path-bytes-sha256',
      sealed_build_equality: 'required',
      proof_scope: 'local-deployment-manifest-projection',
    },
  }
  validateContract(contract)
  verifyPublishInputContract(base, contract)
  console.log('ok · valid publish-input contract accepted')

  const badManifestDigest = structuredClone(contract)
  badManifestDigest.publish_input_contract.manifest.sha256 = '0'.repeat(64)
  expectReject('publish manifest digest mismatch', () => verifyPublishInputContract(base, badManifestDigest))

  const postBuild = clone('post-build-publish-overwrite')
  const postBuildContract = structuredClone(contract)
  const unsafeCommand = `${publishBuildCommand} && rm -rf dist && cp -R public dist`
  commitPublishManifest(
    postBuild,
    readFileSync(join(postBuild, publishManifestPath), 'utf8').replace(publishBuildCommand, unsafeCommand),
    postBuildContract,
  )
  postBuildContract.publish_input_contract.build_steps[2] = 'pnpm build && rm -rf dist && cp -R public dist'
  postBuildContract.publish_input_contract.build_command = unsafeCommand
  expectReject('coordinated post-build publish overwrite', () => verifyPublishInputContract(postBuild, postBuildContract))

  const publishDirectory = clone('publish-output-directory-swap')
  const publishDirectoryContract = structuredClone(contract)
  commitPublishManifest(
    publishDirectory,
    readFileSync(join(publishDirectory, publishManifestPath), 'utf8').replace('output_dir: dist', 'output_dir: public'),
    publishDirectoryContract,
  )
  publishDirectoryContract.publish_input_contract.output_directory = 'public'
  publishDirectoryContract.build.output_directory = 'public'
  expectReject('coordinated publish output-directory swap', () => verifyPublishInputContract(publishDirectory, publishDirectoryContract))

  const publishEnvironment = clone('publish-build-time-environment-expansion')
  const publishEnvironmentContract = structuredClone(contract)
  commitPublishManifest(
    publishEnvironment,
    `${readFileSync(join(publishEnvironment, publishManifestPath), 'utf8')}      - key: LOT11_UNDECLARED\n        value: injected\n        scope: BUILD_TIME\n`,
    publishEnvironmentContract,
  )
  publishEnvironmentContract.publish_input_contract.build_time_environment.push({
    key: 'LOT11_UNDECLARED', value: 'injected', scope: 'BUILD_TIME',
  })
  expectReject('coordinated undeclared build-time environment', () => (
    verifyPublishInputContract(publishEnvironment, publishEnvironmentContract)
  ))

  const allowed = clone('allowed-path-tamper')
  appendFileSync(join(allowed, outputPath), '\n// CODEX_LOT10_POST_GENERATOR_TAMPER\n')
  expectReject('supplied allowed-path tamper', () => verifyOutputTree(allowed, contract, { checkChanges: true }))

  const missing = clone('missing')
  rmSync(join(missing, outputPath))
  expectReject('missing output', () => verifyOutputTree(missing, contract, { checkChanges: true }))

  const extra = clone('extra')
  writeFileSync(join(extra, 'src/content/extra.generated.ts'), 'uncontracted\n')
  expectReject('extra output', () => verifyChangedSet(extra, contract))

  const renamed = clone('rename')
  renameSync(join(renamed, outputPath), join(renamed, 'src/content/renamed.generated.ts'))
  expectReject('renamed output', () => verifyOutputTree(renamed, contract, { checkChanges: true }))

  const source = clone('source')
  const badSource = structuredClone(contract)
  badSource.spec.tree = '0'.repeat(40)
  expectReject('source pin/tree mismatch', () => verifySpecIdentity(source, badSource))

  const generator = clone('generator')
  appendFileSync(join(generator, generatorPath), '// tamper\n')
  expectReject('generator digest mismatch', () => verifyGeneratorDigests(generator, generator, contract))

  const newline = clone('newline')
  appendFileSync(join(newline, outputPath), '\n')
  expectReject('newline-only byte drift', () => verifyOutputTree(newline, contract, { checkChanges: true }))

  const index = clone('index')
  verifyOutputTree(index, contract, { checkChanges: true })
  appendFileSync(join(index, outputPath), '// post-verification index mutation\n')
  git(index, ['add', '--', outputPath])
  writeFileSync(join(index, outputPath), readFileSync(join(base, outputPath)))
  expectReject('post-verification raw index mutation', () => verifyIndex(index, contract, [outputPath]))

  const consumer = clone('build-consumer')
  writeFileSync(join(consumer, 'src/app.ts'), '// generated output no longer consumed\n')
  expectReject('missing build/test consumer', () => verifyConsumers(consumer, contract))

  const nondeterministic = clone('nondeterministic')
  appendFileSync(join(nondeterministic, outputPath), '// second run differs\n')
  expectReject('dual-run byte mismatch', () => compareOutputTrees(base, nondeterministic, contract))

  const configureEnvironmentProbe = (root) => {
    writeFileSync(join(root, 'package.json'), `${JSON.stringify({
      type: 'module',
      scripts: { build: 'node scripts/environment-probe-build.mjs' },
    }, null, 2)}\n`)
    writeFileSync(
      join(root, 'scripts/environment-probe-build.mjs'),
      "import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'\n"
      + "mkdirSync('dist', { recursive: true })\n"
      + "copyFileSync('src/content/templates.generated.ts', 'dist/generated.js')\n"
      + "writeFileSync('dist/index.html', `probe=${process.env.LENS_UNDECLARED_BUILD_PROBE ?? 'sealed'}\\n`)\n",
    )
  }
  const buildContract = structuredClone(contract)
  buildContract.outputs[0].dist = 'generated.js'
  const rawA = clone('raw-environment-a')
  const rawB = clone('raw-environment-b')
  configureEnvironmentProbe(rawA)
  configureEnvironmentProbe(rawB)
  for (const [root, value] of [[rawA, 'alpha'], [rawB, 'beta']]) {
    const result = spawnSync('pnpm', ['build'], {
      cwd: root,
      env: { ...process.env, LENS_UNDECLARED_BUILD_PROBE: value },
      encoding: 'utf8',
    })
    if (result.status !== 0) throw new Error(`raw environment probe failed: ${result.stderr}`)
  }
  if (snapshotDirectory(rawA, 'dist').tree_sha256 === snapshotDirectory(rawB, 'dist').tree_sha256) {
    throw new Error('undeclared environment probe is not live')
  }
  const sealedA = clone('sealed-environment-a')
  const sealedB = clone('sealed-environment-b')
  configureEnvironmentProbe(sealedA)
  configureEnvironmentProbe(sealedB)
  const priorProbe = process.env.LENS_UNDECLARED_BUILD_PROBE
  let sealedBuildProof
  try {
    process.env.LENS_UNDECLARED_BUILD_PROBE = 'alpha'
    sealedBuildProof = runSealedBuild(sealedA, buildContract)
    process.env.LENS_UNDECLARED_BUILD_PROBE = 'beta'
    runSealedBuild(sealedB, buildContract)
  } finally {
    if (priorProbe === undefined) delete process.env.LENS_UNDECLARED_BUILD_PROBE
    else process.env.LENS_UNDECLARED_BUILD_PROBE = priorProbe
  }
  compareDirectoryTrees(sealedA, sealedB, 'dist')
  verifyPublishInputContract(sealedB, buildContract, sealedBuildProof)
  console.log('ok · independent publish candidate equals sealed build')
  console.log('ok · undeclared build environment neutralized')
  appendFileSync(join(sealedB, 'dist/index.html'), 'post-build tamper\n')
  expectReject('sealed dist byte mismatch', () => compareDirectoryTrees(sealedA, sealedB, 'dist'))

  const noop = clone('noop-producer')
  expectReject('no-op producer after output clearing', () => runGeneratorDag(noop, noop, contract))

  const stale = clone('stale-producer')
  writeFileSync(
    join(stale, generatorPath),
    "import { mkdirSync, writeFileSync } from 'node:fs'\nmkdirSync('src/content', { recursive: true })\nwriteFileSync('src/content/templates.generated.ts', 'stale producer bytes\\n')\n",
  )
  const staleContract = structuredClone(contract)
  staleContract.generators[0].sha256 = sha256File(join(stale, generatorPath))
  expectReject('stale producer bytes after output clearing', () => runGeneratorDag(stale, stale, staleContract))

  const escaping = structuredClone(contract)
  escaping.generators[0].outputs = ['../escaped.generated.ts']
  escaping.outputs[0].path = '../escaped.generated.ts'
  expectReject('output path confinement escape', () => validateContract(escaping))

  console.log('LENS-011 adversarial harness: 19/19 counterexamples rejected')
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
