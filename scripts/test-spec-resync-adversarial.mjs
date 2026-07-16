#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
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
  sha256File,
  verifyChangedSet,
  verifyConsumers,
  verifyGeneratorDigests,
  verifyIndex,
  verifyOutputTree,
  verifySpecIdentity,
} from './spec-resync-lib.mjs'

const scratch = mkdtempSync(join(tmpdir(), 'spec-resync-adversarial-'))
const base = join(scratch, 'base')
const outputPath = 'src/content/templates.generated.ts'
const generatorPath = 'scripts/generate.mjs'

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

try {
  mkdirSync(join(base, 'src/content'), { recursive: true })
  mkdirSync(join(base, 'scripts'), { recursive: true })
  writeFileSync(join(base, outputPath), 'export const VALUE = "verified"\n')
  writeFileSync(join(base, 'src/app.ts'), "import './content/templates.generated'\n")
  writeFileSync(join(base, generatorPath), '// deterministic fixture generator\n')
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
  }

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

  console.log('LENS-011 adversarial harness: 10/10 counterexamples rejected')
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
