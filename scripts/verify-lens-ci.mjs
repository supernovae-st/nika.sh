#!/usr/bin/env node
// LENS-006 · prove that the eight named CI jobs still execute their real
// semantics, then replay one deterministic negative per gate.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, sha256File } from './spec-resync-lib.mjs'

const CONTRACT_ROOT = join(ROOT, 'scripts/lens/contracts')
const workflowPath = join(ROOT, '.github/workflows/lens-gates.yml')

function fail(message) {
  throw new Error(`LENS-006 integrity: ${message}`)
}

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function workflowJobs(text) {
  const jobs = new Map()
  const lines = text.slice(text.indexOf('\njobs:\n') + 7).split('\n')
  let name
  let body = []
  const flush = () => {
    if (!name) return
    if (jobs.has(name)) fail(`duplicate workflow job: ${name}`)
    jobs.set(name, body.join('\n'))
  }
  for (const line of lines) {
    const match = line.match(/^  ([a-z0-9-]+):\s*$/)
    if (match) {
      flush()
      name = match[1]
      body = []
    } else if (name) body.push(line)
  }
  flush()
  return jobs
}

function rejectNoOps(job, body) {
  if (/continue-on-error:\s*true/i.test(body)) fail(`${job} uses continue-on-error`)
  if (/\brun:\s*(?:true|:|echo(?:\s|$))/im.test(body)) fail(`${job} contains a true/echo no-op`)
  if (/\|\|\s*true\b/.test(body)) fail(`${job} swallows failure with || true`)
  if (/\bif:\s*(?:false|\$\{\{\s*false\s*\}\})/i.test(body)) fail(`${job} is always-false`)
  if (/\bif:\s*\$\{\{\s*always\(\)\s*\}\}/i.test(body)) fail(`${job} bypasses normal success semantics with always()`)
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

  for (const artifact of integrity.artifacts) {
    const got = sha256File(join(ROOT, artifact.path))
    if (got !== artifact.sha256) fail(`bad digest for ${artifact.path}: ${got} != ${artifact.sha256}`)
  }

  const workflow = readFileSync(workflowPath, 'utf8')
  const jobs = workflowJobs(workflow)
  const expectedJobs = new Set([...declaredJobs, gateContract.integrity_job])
  const actualJobs = new Set(jobs.keys())
  const absent = [...expectedJobs].filter((job) => !actualJobs.has(job))
  const renamedOrExtra = [...actualJobs].filter((job) => !expectedJobs.has(job))
  if (absent.length) fail(`absent/renamed workflow job(s): ${absent.join(', ')}`)
  if (renamedOrExtra.length) fail(`unexpected/renamed workflow job(s): ${renamedOrExtra.join(', ')}`)

  for (const gate of gateContract.gates) {
    const body = jobs.get(gate.job)
    rejectNoOps(gate.job, body)
    const occurrences = body.split(gate.command).length - 1
    if (occurrences !== 1) fail(`${gate.job} must run exact command once, got ${occurrences}`)
  }
  const integrityBody = jobs.get(gateContract.integrity_job)
  rejectNoOps(gateContract.integrity_job, integrityBody)
  if ((integrityBody.split(gateContract.integrity_command).length - 1) !== 1) {
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

  console.log('LENS-006 integrity: 8/8 jobs exact · digests pinned · 8/8 positive and negative replays verified')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
