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

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
}

function removeJob(text, job) {
  const start = text.indexOf(`  ${job}:\n`)
  if (start < 0) throw new Error(`job missing in fixture: ${job}`)
  const rest = text.slice(start + 2)
  const next = rest.slice(rest.indexOf('\n') + 1).search(/^  [a-z0-9-]+:\s*$/m)
  return next < 0 ? text.slice(0, start) : text.slice(0, start) + rest.slice(rest.indexOf('\n') + 1 + next)
}

function expectRejected(name, mutate, expectedFragment) {
  const root = clone(name)
  mutate(root)
  const result = spawnSync(process.execPath, ['scripts/verify-lens-ci.mjs'], { cwd: root, encoding: 'utf8' })
  if (result.status === 0) throw new Error(`integrity adversary accepted: ${name}`)
  const evidence = `${result.stdout}\n${result.stderr}`
  if (expectedFragment && !evidence.includes(expectedFragment)) {
    throw new Error(`integrity adversary ${name} failed for the wrong reason: ${evidence.trim()}`)
  }
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
  expectRejected('wrong workflow trigger', (root) => mutateWorkflow(
    root,
    (text) => text.replace('branches: [main]', 'branches: [development]'),
  ))
  expectRejected('wrong required runner', (root) => mutateWorkflow(
    root,
    (text) => text.replace('runs-on: ubuntu-latest', 'runs-on: macos-latest'),
  ))
  expectRejected('extra gate step', (root) => mutateWorkflow(
    root,
    (text) => text.replace(command, `${command}\n      - run: node --version`),
  ))
  expectRejected('integrity install omitted', (root) => mutateWorkflow(
    root,
    (text) => text.replace(
      '      - run: corepack enable\n      - run: pnpm install --frozen-lockfile\n      - run: pip install pyyaml==6.0.3',
      '      - run: corepack enable\n      - run: pip install pyyaml==6.0.3',
    ),
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
  expectRejected('dependency authority omitted', (root) => {
    const path = join(root, integrityPath)
    const integrity = JSON.parse(readFileSync(path, 'utf8'))
    integrity.artifacts = integrity.artifacts.filter((artifact) => artifact.path !== '.npmrc')
    writeFileSync(path, `${JSON.stringify(integrity, null, 2)}\n`)
  })
  expectRejected('build configuration tamper', (root) => {
    const path = join(root, 'vite.config.ts')
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n// unpinned build authority\n`)
  })
  expectRejected('deployment post-build overwrite with repinned integrity', (root) => {
    const path = '.do/app.yaml'
    const manifest = join(root, path)
    writeFileSync(manifest, readFileSync(manifest, 'utf8').replace(
      'corepack enable && pnpm install --frozen-lockfile && pnpm build',
      'corepack enable && pnpm install --frozen-lockfile && pnpm build && rm -rf dist && cp -R public dist',
    ))
    pinMutation(root, path)
  }, 'deployment manifest SHA-256 matches current bytes')
  expectRejected('deployment output-directory swap with repinned integrity', (root) => {
    const path = '.do/app.yaml'
    const manifest = join(root, path)
    writeFileSync(manifest, readFileSync(manifest, 'utf8').replace('output_dir: dist', 'output_dir: public'))
    pinMutation(root, path)
  }, 'deployment manifest SHA-256 matches current bytes')
  expectRejected('deployment build-time environment expansion with repinned integrity', (root) => {
    const path = '.do/app.yaml'
    const manifest = join(root, path)
    writeFileSync(manifest, readFileSync(manifest, 'utf8').replace(
      '        scope: BUILD_TIME\n',
      '        scope: BUILD_TIME\n      - key: LOT11_UNDECLARED\n        value: injected\n        scope: BUILD_TIME\n',
    ))
    pinMutation(root, path)
  }, 'deployment manifest SHA-256 matches current bytes')
  expectRejected('coordinated deployment build-command authority drift', (root) => {
    const manifestPath = '.do/app.yaml'
    const channelsPath = 'scripts/lens/contracts/channels.v1.json'
    const resyncPath = 'scripts/spec-resync.contract.json'
    const safe = 'corepack enable && pnpm install --frozen-lockfile && pnpm build'
    const unsafe = `${safe} && rm -rf dist && cp -R public dist`
    const manifest = join(root, manifestPath)
    writeFileSync(manifest, readFileSync(manifest, 'utf8').replace(safe, unsafe))

    const channels = JSON.parse(readFileSync(join(root, channelsPath), 'utf8'))
    channels.deployment.expected.build_command = unsafe
    writeFileSync(join(root, channelsPath), `${JSON.stringify(channels, null, 2)}\n`)

    const resync = JSON.parse(readFileSync(join(root, resyncPath), 'utf8'))
    resync.publish_input_contract.build_steps[2] = 'pnpm build && rm -rf dist && cp -R public dist'
    resync.publish_input_contract.build_command = unsafe
    resync.publish_input_contract.manifest.git_blob = git(root, ['hash-object', manifestPath])
    resync.publish_input_contract.manifest.sha256 = sha(readFileSync(manifest))
    writeFileSync(join(root, resyncPath), `${JSON.stringify(resync, null, 2)}\n`)

    for (const path of [manifestPath, channelsPath, resyncPath]) pinMutation(root, path)
    git(root, ['add', '--', manifestPath, channelsPath, resyncPath, integrityPath])
    git(root, [
      '-c', 'user.name=Nika', '-c', 'user.email=nika@supernovae.studio',
      'commit', '--quiet', '-m', 'test: coordinate publish authority drift',
    ])
  }, 'publish-input build_command differs from the closed contract')
  expectRejected('visible CSS count claim', (root) => {
    const path = join(root, 'src/pages/home.css')
    const target = existsSync(path) ? path : join(root, 'src/index.css')
    writeFileSync(target, `${readFileSync(target, 'utf8')}\n.lot11-count-smuggle::after { content: 'five verbs'; }\n`)
  })
  for (const [name, path] of [
    ['RSS mirror text drift', 'public/rss.xml'],
    ['llms-full mirror text drift', 'public/llms-full.txt'],
    ['blog metadata mirror text drift', 'src/content/blog.generated.ts'],
    ['blog body mirror text drift', 'src/content/blog-bodies.generated.ts'],
  ]) {
    expectRejected(name, (root) => {
      const target = join(root, path)
      writeFileSync(target, `${readFileSync(target, 'utf8')}\n<!-- lot11 mirror drift -->\n`)
    })
  }
  expectRejected('missing generated mirror', (root) => {
    rmSync(join(root, 'public/rss.xml'))
  })
  expectRejected('extra generated mirror declaration', (root) => {
    const path = join(root, 'scripts/build-blog.mjs')
    const source = readFileSync(path, 'utf8')
    const changed = source.replace(
      "  'src/content/blog.generated.ts',\n]",
      "  'src/content/blog.generated.ts',\n  'public/extra-blog-mirror.txt',\n]",
    )
    if (changed === source) throw new Error('extra generated mirror fixture did not alter the generator path set')
    writeFileSync(path, changed)
    pinMutation(root, 'scripts/build-blog.mjs')
  })
  expectRejected('coordinated semantic carrier omission', (root) => {
    const omitted = 'src/pages/Home.tsx'
    const home = join(root, omitted)
    writeFileSync(home, `${readFileSync(home, 'utf8')}\n/* Nika has five verbs */\n`)

    const semanticsPath = 'scripts/lens-semantics-lib.mjs'
    const semantics = join(root, semanticsPath)
    const original = readFileSync(semantics, 'utf8')
    const changed = original.replace(
      'return [...new Set([...source, ...posts, ...publicText, ...PROJECTION_SOURCES])].sort()',
      "return [...new Set([...source, ...posts, ...publicText, ...PROJECTION_SOURCES])].filter((path) => path !== 'src/pages/Home.tsx').sort()",
    )
    if (changed === original) throw new Error('semantic omission fixture did not alter carrier discovery')
    writeFileSync(semantics, changed)
    pinMutation(root, semanticsPath)

    const universe = JSON.parse(readFileSync(join(root, 'scripts/lens/contracts/carrier-universe.v1.json'), 'utf8'))
    const countPath = 'scripts/lens/contracts/count-source.v1.json'
    const count = JSON.parse(readFileSync(join(root, countPath), 'utf8'))
    const shrunk = universe.normative_sources.filter((path) => path !== omitted)
    count.carrier_census.count = shrunk.length
    count.carrier_census.set_sha256 = sha(Buffer.from(`${shrunk.join('\n')}\n`))
    count.bindings = count.bindings.filter((binding) => binding.path !== omitted)
    count.claim_count = count.bindings.length
    writeFileSync(join(root, countPath), `${JSON.stringify(count, null, 2)}\n`)
    pinMutation(root, countPath)
  })
  console.log('LENS-006 integrity adversarial harness: 31/31 counterexamples rejected')
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
