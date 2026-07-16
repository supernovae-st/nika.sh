#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ROOT } from './spec-resync-lib.mjs'

const scratch = mkdtempSync(join(tmpdir(), 'lens-integrity-adversarial-'))
const workflowPath = '.github/workflows/lens-gates.yml'
const gatesPath = 'scripts/lens/contracts/gates.v1.json'
const integrityPath = 'scripts/lens/contracts/integrity.v1.json'

function sha(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function clone(name) {
  const root = join(scratch, name)
  execFileSync('git', ['clone', '--quiet', '--no-hardlinks', ROOT, root])
  const dependencies = join(ROOT, 'node_modules')
  if (existsSync(dependencies)) symlinkSync(dependencies, join(root, 'node_modules'), 'dir')
  return root
}

function pinMutation(root, path) {
  const integrity = JSON.parse(readFileSync(join(root, integrityPath), 'utf8'))
  const artifact = integrity.artifacts.find((entry) => entry.path === path)
  if (!artifact) throw new Error(`artifact not pinned: ${path}`)
  artifact.sha256 = sha(readFileSync(join(root, path)))
  writeFileSync(join(root, integrityPath), `${JSON.stringify(integrity, null, 2)}\n`)
}

function removeJob(text, job) {
  const start = text.indexOf(`  ${job}:\n`)
  if (start < 0) throw new Error(`job missing in fixture: ${job}`)
  const rest = text.slice(start + 2)
  const next = rest.slice(rest.indexOf('\n') + 1).search(/^  [a-z0-9-]+:\s*$/m)
  return next < 0 ? text.slice(0, start) : text.slice(0, start) + rest.slice(rest.indexOf('\n') + 1 + next)
}

function expectRejected(name, mutate) {
  const root = clone(name)
  mutate(root)
  const result = spawnSync(process.execPath, ['scripts/verify-lens-ci.mjs'], { cwd: root, encoding: 'utf8' })
  if (result.status === 0) throw new Error(`integrity adversary accepted: ${name}`)
  console.log(`ok · ${name} rejected`)
}

function mutateWorkflow(root, replace) {
  const path = join(root, workflowPath)
  writeFileSync(path, replace(readFileSync(path, 'utf8')))
  pinMutation(root, workflowPath)
}

try {
  const command = '- run: node scripts/lens-gate.mjs lens-canon-drift'
  expectRejected('true no-op', (root) => mutateWorkflow(root, (text) => text.replace(command, '- run: true')))
  expectRejected('echo no-op', (root) => mutateWorkflow(root, (text) => text.replace(command, '- run: echo ok')))
  expectRejected('continue-on-error', (root) => mutateWorkflow(root, (text) => text.replace(command, `${command}\n        continue-on-error: true`)))
  expectRejected('job-level continue-on-error', (root) => mutateWorkflow(
    root,
    (text) => text.replace(
      '  lens-gate-canon-drift:\n',
      '  lens-gate-canon-drift:\n    continue-on-error: true\n',
    ),
  ))
  expectRejected('always-false job', (root) => mutateWorkflow(root, (text) => text.replace(command, `${command}\n        if: false`)))
  expectRejected('statically false step expression', (root) => mutateWorkflow(
    root,
    (text) => text.replace(command, `${command}\n        if: \${{ 0 == 1 }}`),
  ))
  expectRejected('statically false job expression', (root) => mutateWorkflow(
    root,
    (text) => text.replace(
      '  lens-gate-canon-drift:\n',
      "  lens-gate-canon-drift:\n    'if': ${{ 0 == 1 }}\n",
    ),
  ))
  expectRejected('flow-form false expression', (root) => mutateWorkflow(
    root,
    (text) => text.replace(command, "- {run: node scripts/lens-gate.mjs lens-canon-drift, if: '${{ 0 == 1 }}'}"),
  ))
  expectRejected('absent job', (root) => mutateWorkflow(root, (text) => removeJob(text, 'lens-gate-canon-drift')))
  expectRejected('renamed job', (root) => mutateWorkflow(root, (text) => text.replace('  lens-gate-canon-drift:', '  lens-gate-canon-drift-renamed:')))
  expectRejected('duplicate workflow job', (root) => mutateWorkflow(root, (text) => `${text}\n  lens-gate-canon-drift:\n    runs-on: ubuntu-latest\n    steps:\n      ${command}\n`))
  expectRejected('bad digest', (root) => {
    const path = join(root, 'scripts/lens-gate.mjs')
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n// digest tamper\n`)
  })
  expectRejected('duplicate gate id', (root) => {
    const path = join(root, gatesPath)
    const gates = JSON.parse(readFileSync(path, 'utf8'))
    gates.gates.push({ ...gates.gates[0], job: 'lens-gate-duplicate' })
    writeFileSync(path, `${JSON.stringify(gates, null, 2)}\n`)
    pinMutation(root, gatesPath)
  })
  expectRejected('coordinated semantic carrier omission', (root) => {
    const omitted = 'src/pages/Home.tsx'
    const home = join(root, omitted)
    writeFileSync(home, `${readFileSync(home, 'utf8')}\n/* Nika has five verbs */\n`)

    const semanticsPath = 'scripts/lens-semantics-lib.mjs'
    const semantics = join(root, semanticsPath)
    const original = readFileSync(semantics, 'utf8')
    const changed = original.replace(
      "return [...source, ...posts, 'public/llms.txt'].sort()",
      "return [...source, ...posts, 'public/llms.txt'].filter((path) => path !== 'src/pages/Home.tsx').sort()",
    )
    if (changed === original) throw new Error('semantic omission fixture did not alter carrier discovery')
    writeFileSync(semantics, changed)
    pinMutation(root, semanticsPath)

    const universe = JSON.parse(readFileSync(join(root, 'scripts/lens/contracts/carrier-universe.v1.json'), 'utf8'))
    const countPath = 'scripts/lens/contracts/count-source.v1.json'
    const count = JSON.parse(readFileSync(join(root, countPath), 'utf8'))
    const shrunk = universe.carriers.filter((path) => path !== omitted)
    count.carrier_census.count = shrunk.length
    count.carrier_census.set_sha256 = sha(Buffer.from(`${shrunk.join('\n')}\n`))
    count.bindings = count.bindings.filter((binding) => binding.path !== omitted)
    count.claim_count = count.bindings.length
    writeFileSync(join(root, countPath), `${JSON.stringify(count, null, 2)}\n`)
    pinMutation(root, countPath)
  })
  console.log('LENS-006 integrity adversarial harness: 14/14 counterexamples rejected')
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
