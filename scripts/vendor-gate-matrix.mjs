/* ─── vendor-gate-matrix · the 40-cell gate-v2 observation matrix (I1) ───────
   The spec's gate matrix is FIXTURE truth: 4 producer states × 10 consumer
   edge forms · 35 cells run against the reference model (expected-run.json
   authors the consumer's verdict) · 5 are statically dead (NIKA-DAG-006 ·
   they live in tests/deep). The /flow#gate explorable (mounts at WO-4)
   REPLAYS this module — legal form (a): precomputed engine/model truth,
   zero local semantics. Spec-time clock; the resync cron re-vendors.

   Run: node scripts/vendor-gate-matrix.mjs
   Default read: the PINNED spec commit (git ls-tree for the fixture list ·
   git show for each file) against the sibling checkout, so a moving sibling
   HEAD can never leak into the matrix. NIKA_SPEC_ROOT stays the EXPLICIT
   live-read override (pre-release rehearsal) · neither reachable: die loudly. */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GATES_REL = 'conformance/tests/runtime/gates'

/* ── pin-read resolution (the build-templates pin-read discipline · 2026-08-03) ──
   readdirSync + readFileSync against the LIVING sibling let an unreleased spec
   HEAD silently re-vendor the committed matrix on the monorepo machine; the
   default now lists and reads AT the pin, and only an explicit env reads live. */
const SPEC_PIN = JSON.parse(readFileSync(join(ROOT, '.github/nika-spec-pin.json'), 'utf8'))
const liveRoot = process.env.NIKA_SPEC_ROOT
const siblingGitRoot = [join(ROOT, '..', 'spec', 'repo'), join(ROOT, '..', '..', 'spec', 'repo')].find(
  (p) => {
    if (!existsSync(join(p, '.git'))) return false
    try {
      execFileSync('git', ['-C', p, 'cat-file', '-e', SPEC_PIN.spec_commit], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  },
)
/* the TWO readers: NIKA_SPEC_ROOT (explicit) reads the live tree; the sibling
   default reads the PINNED tree via git · a moving HEAD cannot leak.
   ls-tree with a trailing slash lists the directory's entries (full paths
   from the repo root, hence the basename strip). */
const readSpec = liveRoot
  ? (rel) => readFileSync(join(liveRoot, rel), 'utf8')
  : (rel) =>
      execFileSync('git', ['-C', siblingGitRoot, 'show', `${SPEC_PIN.spec_commit}:${rel}`], {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      })
const listSpecDir = liveRoot
  ? (rel) => readdirSync(join(liveRoot, rel))
  : (rel) =>
      execFileSync(
        'git',
        ['-C', siblingGitRoot, 'ls-tree', '--name-only', SPEC_PIN.spec_commit, '--', `${rel}/`],
        { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
      )
        .split('\n')
        .filter(Boolean)
        .map((line) => line.split('/').pop())
const specReachable = liveRoot ? existsSync(join(liveRoot, GATES_REL)) : Boolean(siblingGitRoot)
if (!specReachable) {
  console.error(
    'vendor-gate-matrix: no readable spec · neither a sibling carrying the pinned commit nor a usable NIKA_SPEC_ROOT · cannot read the gate fixtures',
  )
  process.exit(1)
}

const PRODUCERS = ['success', 'failure', 'skipped', 'cancelled']
const FORMS = [
  'with-value',
  'with-status',
  'with-error',
  'after-success',
  'after-failure',
  'after-skipped',
  'after-terminal',
  'when-true',
  'when-false',
  'no-edge',
]

/* the five statically-dead cells (NIKA-DAG-006 · MATRIX.md) — the explorable
   renders them as refusals, witnessed by the deep corpus */
const DEAD = new Set([
  'success/after-skipped',
  'failure/after-skipped',
  'skipped/after-success',
  'skipped/after-failure',
  'cancelled/after-skipped',
])

const dirs = listSpecDir(GATES_REL).filter((d) => /^\d{3}-/.test(d))
const byKey = new Map()
for (const d of dirs) {
  const m = /^\d{3}-([a-z]+)-x-([a-z-]+)$/.exec(d)
  if (!m) continue
  byKey.set(`${m[1]}/${m[2]}`, d)
}

const cells = []
for (const producer of PRODUCERS) {
  for (const form of FORMS) {
    const key = `${producer}/${form}`
    if (DEAD.has(key)) {
      cells.push({
        producer,
        form,
        dead: true,
        verdict: 'refused',
        code: 'NIKA-DAG-006',
        fixture: null,
        yaml: null,
        note: 'statically dead: the spec refuses the edge at parse (deep corpus witnesses)',
      })
      continue
    }
    const dir = byKey.get(key)
    if (!dir) throw new Error(`gate matrix: missing runnable cell ${key}`)
    const expected = JSON.parse(readSpec(`${GATES_REL}/${dir}/expected-run.json`))
    const yaml = readSpec(`${GATES_REL}/${dir}/input.nika.yaml`)
    const consumer = expected.tasks?.c
    if (!consumer?.status) throw new Error(`gate matrix: ${dir} has no consumer verdict`)
    cells.push({
      producer,
      form,
      dead: false,
      verdict: consumer.status,
      code: null,
      fixture: `${GATES_REL}/${dir}`,
      yaml,
      note: expected.note ?? null,
    })
  }
}

if (cells.length !== 40) throw new Error(`gate matrix: expected 40 cells, got ${cells.length}`)

const body = `// gate-matrix.generated.ts — AUTO-GENERATED by
// scripts/vendor-gate-matrix.mjs from the nika-spec gate-v2 matrix
// (conformance/tests/runtime/gates · verdicts authored by the reference
// model · engine-proven upstream via gen-gate-matrix --prove).
// DO NOT EDIT · regenerate: node scripts/vendor-gate-matrix.mjs
// The /flow#gate explorable REPLAYS these cells (one-truth form (a):
// zero local semantics). The resync cron re-vendors.

export interface GateCell {
  producer: '${PRODUCERS.join("' | '")}'
  form: string
  /** statically dead: the spec refuses the edge at parse */
  dead: boolean
  /** the consumer's fate ('refused' on dead cells) */
  verdict: string
  /** the refusal code on dead cells */
  code: string | null
  /** the fixture path in nika-spec (the witness link) */
  fixture: string | null
  yaml: string | null
  note: string | null
}

export const GATE_PRODUCERS = ${JSON.stringify(PRODUCERS)} as const
export const GATE_FORMS = ${JSON.stringify(FORMS)} as const

export const GATE_MATRIX: GateCell[] = ${JSON.stringify(cells, null, 2)}
`
writeFileSync(join(ROOT, 'src/content/gate-matrix.generated.ts'), body)
console.log(
  `wrote src/content/gate-matrix.generated.ts (40 cells · ${cells.filter((c) => c.dead).length} dead · ${cells.filter((c) => !c.dead).length} runnable)`,
)
