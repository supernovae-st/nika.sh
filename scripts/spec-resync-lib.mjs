import { execFileSync, spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { basename, dirname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const CONTRACT_PATH = join(ROOT, 'scripts/spec-resync.contract.json')

const FULL_SHA = /^[0-9a-f]{40}$/
const SHA256 = /^[0-9a-f]{64}$/

export function fail(message) {
  throw new Error(`LENS-011: ${message}`)
}

export function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function sha256File(path) {
  if (!existsSync(path) || !lstatSync(path).isFile()) fail(`missing file: ${path}`)
  return sha256Bytes(readFileSync(path))
}

export function loadContract(path = CONTRACT_PATH) {
  const contract = JSON.parse(readFileSync(path, 'utf8'))
  validateContract(contract)
  return contract
}

export function validateContract(contract) {
  if (contract.contract_version !== 1) fail('unsupported spec-resync contract version')
  if (!FULL_SHA.test(contract.spec?.commit ?? '')) fail('contract spec commit is not 40-hex')
  if (!FULL_SHA.test(contract.spec?.tree ?? '')) fail('contract spec tree is not 40-hex')
  const generatorIds = new Set()
  const generated = new Set()
  for (const generator of contract.generators ?? []) {
    if (!generator.id || generatorIds.has(generator.id)) fail(`duplicate generator id: ${generator.id}`)
    generatorIds.add(generator.id)
    if (!['spec', 'website'].includes(generator.root)) fail(`bad generator root: ${generator.id}`)
    if (!['python3', 'node', 'copy'].includes(generator.runtime)) fail(`bad runtime: ${generator.id}`)
    assertRelativePath(generator.path, `generator path for ${generator.id}`)
    if (!SHA256.test(generator.sha256 ?? '')) fail(`bad generator digest: ${generator.id}`)
    for (const dependency of generator.depends_on ?? []) {
      if (!generatorIds.has(dependency)) fail(`generator DAG is not topological: ${generator.id} -> ${dependency}`)
    }
    for (const path of generator.outputs ?? []) {
      assertRelativePath(path, `generator output for ${generator.id}`)
      if (generated.has(path)) fail(`output has multiple producers: ${path}`)
      generated.add(path)
    }
  }
  const declared = new Set()
  for (const output of contract.outputs ?? []) {
    assertRelativePath(output.path, 'contract output')
    if (output.dist) assertRelativePath(output.dist, `dist path for ${output.path}`)
    for (const consumer of output.consumers ?? []) assertRelativePath(consumer, `consumer for ${output.path}`)
    if (!output.path || declared.has(output.path)) fail(`duplicate output path: ${output.path}`)
    if (!SHA256.test(output.sha256 ?? '')) fail(`bad output digest: ${output.path}`)
    declared.add(output.path)
  }
  if (generated.size !== declared.size || [...generated].some((path) => !declared.has(path))) {
    fail('generator output union differs from the literal output contract')
  }
  if (!Array.isArray(contract.build?.command) || contract.build.command.length < 2) {
    fail('sealed build command is absent')
  }
  for (const tool of ['node', 'pnpm', 'python', 'pyyaml']) {
    if (typeof contract.toolchain?.[tool] !== 'string' || !contract.toolchain[tool]) {
      fail(`fixed toolchain version is absent: ${tool}`)
    }
  }
}

export function assertRelativePath(path, label = 'path') {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\0')) {
    fail(`${label} is not a confined relative path: ${String(path)}`)
  }
  const normalized = normalize(path)
  if (normalized !== path || normalized === '..' || normalized.startsWith(`..${sep}`)) {
    fail(`${label} escapes or is not normalized: ${path}`)
  }
}

export function confinedPath(root, path, label = 'path') {
  assertRelativePath(path, label)
  const base = resolve(root)
  const target = resolve(base, path)
  const rel = relative(base, target)
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail(`${label} escapes root: ${path}`)
  }
  return target
}

function runGit(root, args, options = {}) {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: options.encoding ?? 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    const stderr = error?.stderr?.toString().trim()
    fail(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`)
  }
}

export function gitHead(root) {
  return runGit(root, ['rev-parse', 'HEAD']).trim()
}

export function gitTree(root) {
  return runGit(root, ['rev-parse', 'HEAD^{tree}']).trim()
}

export function verifySpecIdentity(specRoot, contract) {
  const commit = gitHead(specRoot)
  const tree = runGit(specRoot, ['rev-parse', 'HEAD^{tree}']).trim()
  if (commit !== contract.spec.commit) fail(`spec commit mismatch: ${commit} != ${contract.spec.commit}`)
  if (tree !== contract.spec.tree) fail(`spec tree mismatch: ${tree} != ${contract.spec.tree}`)
  return { commit, tree }
}

export function verifyGeneratorDigests(websiteRoot, specRoot, contract) {
  for (const generator of contract.generators) {
    const root = generator.root === 'website' ? websiteRoot : specRoot
    const source = confinedPath(root, generator.path, `generator ${generator.id}`)
    const rootReal = realpathSync(root)
    const sourceReal = realpathSync(source)
    if (sourceReal !== rootReal && !sourceReal.startsWith(`${rootReal}${sep}`)) {
      fail(`generator resolves outside its declared root: ${generator.id}`)
    }
    const got = sha256File(sourceReal)
    if (got !== generator.sha256) {
      fail(`generator digest mismatch for ${generator.id}: ${got} != ${generator.sha256}`)
    }
  }
}

function nulPaths(bytes) {
  return bytes.toString('utf8').split('\0').filter(Boolean)
}

export function changedPaths(root) {
  const tracked = nulPaths(runGit(root, ['diff', '--name-only', '-z', '--no-renames', 'HEAD', '--'], { encoding: 'buffer' }))
  const untracked = nulPaths(runGit(root, ['ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'buffer' }))
  return [...new Set([...tracked, ...untracked])].sort()
}

export function verifyChangedSet(root, contract) {
  const declared = new Set(contract.outputs.map((output) => output.path))
  const changed = changedPaths(root)
  const undeclared = changed.filter((path) => !declared.has(path))
  if (undeclared.length > 0) fail(`undeclared output(s): ${undeclared.join(', ')}`)
  return changed
}

export function verifyOutputTree(root, contract, { checkChanges = false } = {}) {
  if (checkChanges) verifyChangedSet(root, contract)
  const receipt = {}
  for (const output of contract.outputs) {
    const path = confinedPath(root, output.path, `output ${output.path}`)
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) fail(`output is a symlink: ${output.path}`)
    const got = sha256File(path)
    if (got !== output.sha256) {
      fail(`output digest mismatch for ${output.path}: ${got} != ${output.sha256}`)
    }
    receipt[output.path] = got
  }
  return receipt
}

export function clearContractOutputs(root, contract) {
  for (const output of contract.outputs) {
    const path = confinedPath(root, output.path, `output ${output.path}`)
    if (existsSync(path) && lstatSync(path).isSymbolicLink()) fail(`refusing symlink output: ${output.path}`)
    rmSync(path, { force: true })
  }
  const survivors = contract.outputs.filter((output) => existsSync(confinedPath(root, output.path)))
  if (survivors.length) fail(`could not clear expected outputs: ${survivors.map((entry) => entry.path).join(', ')}`)
}

function proveGeneratorOutputs(websiteRoot, generator, contract, produced) {
  const expectedByPath = new Map(contract.outputs.map((output) => [output.path, output]))
  const declared = new Set(generator.outputs)
  const materialized = []
  for (const output of contract.outputs) {
    const path = confinedPath(websiteRoot, output.path, `output ${output.path}`)
    const exists = existsSync(path)
    if (declared.has(output.path)) {
      if (!exists || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
        fail(`producer ${generator.id} did not newly materialize ${output.path}`)
      }
      const got = sha256File(path)
      if (got !== output.sha256) fail(`producer ${generator.id} wrote stale bytes for ${output.path}: ${got} != ${output.sha256}`)
      materialized.push({ path: output.path, sha256: got })
    } else if (!produced.has(output.path) && exists) {
      fail(`producer ${generator.id} materialized another producer's output: ${output.path}`)
    } else if (produced.has(output.path)) {
      if (!exists) fail(`producer ${generator.id} removed prior output ${output.path}`)
      const got = sha256File(path)
      if (got !== expectedByPath.get(output.path).sha256) fail(`producer ${generator.id} mutated prior output ${output.path}`)
    }
  }
  for (const output of generator.outputs) produced.add(output)
  return { id: generator.id, outputs: materialized }
}

export function verifyConsumers(root, contract) {
  for (const output of contract.outputs) {
    if (output.dist) continue
    if (!Array.isArray(output.consumers) || output.consumers.length === 0) {
      fail(`no build/test consumer declared for ${output.path}`)
    }
    const token = basename(output.path).replace(/\.ts$/, '')
    for (const consumer of output.consumers) {
      const consumerPath = join(root, consumer)
      if (!existsSync(consumerPath)) fail(`consumer missing for ${output.path}: ${consumer}`)
      if (!readFileSync(consumerPath, 'utf8').includes(token)) {
        fail(`consumer ${consumer} does not reference ${token}`)
      }
    }
  }
}

export function runGeneratorDag(websiteRoot, specRoot, contract, { verify = true, dependenciesRoot } = {}) {
  verifySpecIdentity(specRoot, contract)
  verifyGeneratorDigests(websiteRoot, specRoot, contract)
  clearContractOutputs(websiteRoot, contract)
  const env = {
    ...process.env,
    ...contract.environment,
    NIKA_SPEC_ROOT: specRoot,
    NIKA_WEBSITE_ROOT: websiteRoot,
    NIKA_WEBSITE_SRC: join(websiteRoot, 'src'),
  }
  const produced = new Set()
  const producerProofs = []
  for (const generator of contract.generators) {
    const sourceRoot = generator.root === 'website' ? websiteRoot : specRoot
    const source = confinedPath(sourceRoot, generator.path, `generator ${generator.id}`)
    if (generator.runtime === 'copy') {
      if (generator.outputs.length !== 1) fail(`copy generator ${generator.id} must have one output`)
      const destination = confinedPath(websiteRoot, generator.outputs[0], `copy output ${generator.id}`)
      mkdirSync(dirname(destination), { recursive: true })
      copyFileSync(source, destination)
      producerProofs.push(proveGeneratorOutputs(websiteRoot, generator, contract, produced))
      verifyChangedSet(websiteRoot, contract)
      continue
    }
    const executable = generator.runtime === 'node' ? process.execPath : 'python3'
    // realpath keeps process.argv[1] equal to import.meta.url on macOS where
    // /var and /private/var name the same file (build-palette's main guard).
    if (generator.runtime === 'node' && dependenciesRoot) linkDependencies(dependenciesRoot, websiteRoot)
    let result
    try {
      result = spawnSync(executable, [realpathSync(source), ...(generator.args ?? [])], {
        cwd: sourceRoot,
        env,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      })
    } finally {
      if (generator.runtime === 'node' && dependenciesRoot) unlinkDependencies(websiteRoot)
    }
    if (result.status !== 0) {
      fail(`generator ${generator.id} failed (${result.status}): ${(result.stderr || result.stdout).trim()}`)
    }
    producerProofs.push(proveGeneratorOutputs(websiteRoot, generator, contract, produced))
    verifyChangedSet(websiteRoot, contract)
  }
  if (produced.size !== contract.outputs.length) fail('producer proof did not cover the exact output set')
  if (!verify) return { producerProofs }
  verifyChangedSet(websiteRoot, contract)
  verifyConsumers(websiteRoot, contract)
  return { outputs: verifyOutputTree(websiteRoot, contract), producerProofs }
}

export function compareOutputTrees(firstRoot, secondRoot, contract) {
  for (const output of contract.outputs) {
    const first = readFileSync(join(firstRoot, output.path))
    const second = readFileSync(join(secondRoot, output.path))
    if (!first.equals(second)) fail(`dual-run determinism mismatch: ${output.path}`)
  }
}

export function copyContractOutputs(sourceRoot, destinationRoot, contract) {
  for (const output of contract.outputs) {
    const destination = join(destinationRoot, output.path)
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(join(sourceRoot, output.path), destination)
  }
}

export function stageLiteralOutputs(root, contract) {
  verifyChangedSet(root, contract)
  verifyOutputTree(root, contract)
  const stagedBefore = nulPaths(runGit(root, ['diff', '--cached', '--name-only', '-z', 'HEAD', '--'], { encoding: 'buffer' }))
  if (stagedBefore.length > 0) fail(`index was not pristine before literal staging: ${stagedBefore.join(', ')}`)
  const changed = changedPaths(root)
  if (changed.length > 0) runGit(root, ['add', '--', ...changed])
  verifyIndex(root, contract, changed)
  return changed
}

export function verifyIndex(root, contract, expectedPaths) {
  const expected = [...expectedPaths].sort()
  const staged = nulPaths(runGit(root, ['diff', '--cached', '--name-only', '-z', 'HEAD', '--'], { encoding: 'buffer' })).sort()
  if (JSON.stringify(staged) !== JSON.stringify(expected)) {
    fail(`raw index path set mismatch: [${staged.join(', ')}] != [${expected.join(', ')}]`)
  }
  const byPath = new Map(contract.outputs.map((output) => [output.path, output]))
  for (const path of staged) {
    if (!byPath.has(path)) fail(`undeclared path reached the index: ${path}`)
  }
  // The staged diff is only the changed subset, but the judged proposal is
  // the complete Git index. Prove all contract outputs, including unchanged
  // entries inherited from HEAD, against the exact pin-specific byte set.
  for (const output of contract.outputs) {
    const bytes = runGit(root, ['show', `:${output.path}`], { encoding: 'buffer' })
    const got = sha256Bytes(bytes)
    if (got !== output.sha256) fail(`raw index digest mismatch for ${output.path}: ${got} != ${output.sha256}`)
  }
}

export function verifyBuiltPublic(root, contract) {
  const distRoot = join(root, contract.build.output_directory)
  for (const output of contract.outputs.filter((entry) => entry.dist)) {
    const got = sha256File(join(distRoot, output.dist))
    if (got !== output.sha256) fail(`sealed build did not consume exact ${output.path}`)
  }
}

export function runSealedBuild(root, contract) {
  const [command, ...args] = contract.build.command
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...contract.environment },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) {
    fail(`sealed build failed (${result.status}): ${(result.stderr || result.stdout).trim()}`)
  }
  verifyBuiltPublic(root, contract)
  return result.stdout.trim()
}

export function linkDependencies(sourceRoot, cloneRoot) {
  const source = join(sourceRoot, 'node_modules')
  const destination = join(cloneRoot, 'node_modules')
  if (existsSync(source) && !existsSync(destination)) symlinkSync(source, destination, 'dir')
}

export function unlinkDependencies(cloneRoot) {
  const destination = join(cloneRoot, 'node_modules')
  if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) unlinkSync(destination)
}

export function writeReceipt(path, receipt) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`)
}
