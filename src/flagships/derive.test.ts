import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { FLAGSHIPS } from './flagship-data'
import { deriveWorkflow, type NikaVerb } from './derive'

/* ── derive · the regex derivation must agree with a REAL yaml parse ─────────
   V5 law #1: the plan / replay / boundary all render from deriveWorkflow().
   This suite pins that derivation to the ground truth (the `yaml` library),
   so the rendered plan can never drift from the file the hero shows:
   deps in the YAML == deps in the rendered plan, task for task. */

const VERBS: readonly NikaVerb[] = ['infer', 'exec', 'invoke', 'agent']

interface YamlTask {
  id: string
  depends_on?: string[]
  when?: string
  [k: string]: unknown
}

/* ground-truth producers (0.104 · the shipped W2 grammar): precedence is the
   DECLARED depends_on list, in file order — `nika check` refuses undeclared
   tasks.X references (NIKA-DAG-003), so the declaration IS the topology. */
const producersOf = (t: YamlTask): string[] => t.depends_on ?? []
interface YamlDoc {
  /** W2 envelope: the scalar IS the id */
  workflow: string
  /** absent on a zero-model flagship (price-watch runs no inference) */
  model?: string
  permits: Record<string, unknown>
  /** W2 « the sequence »: id is a field of each item */
  tasks: YamlTask[]
  outputs?: Record<string, string>
}

describe.each(FLAGSHIPS.map((f) => [f.filename, f.yaml] as const))(
  'derive · %s',
  (_filename, yaml) => {
    const truth = parse(yaml) as YamlDoc
    const truthTasks = truth.tasks.map((t) => [t.id, t] as const)
    const plan = deriveWorkflow(yaml)

    it('derives the exact task id set, in file order', () => {
      expect(plan.tasks.map((t) => t.id)).toEqual(truthTasks.map(([id]) => id))
    })

    it('derives every edge from the declaration (depends_on == deps in the plan)', () => {
      for (const [id, t] of truthTasks) {
        const derived = plan.tasks.find((d) => d.id === id)
        expect(derived, `task ${id} missing from the derivation`).toBeDefined()
        expect(derived?.deps, `deps of ${id}`).toEqual(producersOf(t))
      }
    })

    it('derives each task verb exactly as the YAML declares it', () => {
      for (const [id, t] of truthTasks) {
        const declared = VERBS.filter((v) => v in t)
        expect(declared, `task ${id} must declare exactly one verb`).toHaveLength(1)
        const derived = plan.tasks.find((d) => d.id === id)
        expect(derived?.verb).toBe(declared[0])
      }
    })

    it('derives when: gates only where the YAML declares them', () => {
      for (const [id, t] of truthTasks) {
        const derived = plan.tasks.find((d) => d.id === id)
        if (t.when === undefined) expect(derived?.when).toBeUndefined()
        else expect(derived?.when).toBeDefined()
      }
    })

    it('assigns topological waves (every dep strictly earlier)', () => {
      const waveOf = new Map(plan.tasks.map((t) => [t.id, t.wave]))
      for (const t of plan.tasks) {
        for (const d of t.deps) {
          expect(waveOf.get(d)!, `${d} must run before ${t.id}`).toBeLessThan(t.wave)
        }
      }
      // roots at wave 0, and the wave grouping covers every task exactly once
      expect(plan.waves.flat()).toHaveLength(plan.tasks.length)
      expect(Math.min(...plan.tasks.map((t) => t.wave))).toBe(0)
      expect(plan.waveCount).toBe(1 + Math.max(...plan.tasks.map((t) => t.wave)))
    })

    it('derives the permit families verbatim', () => {
      expect(plan.permits.map((p) => p.kind).sort()).toEqual(Object.keys(truth.permits).sort())
      // every permit row points at a real file line carrying that key
      const lines = yaml.split('\n')
      for (const p of plan.permits) {
        expect(lines[p.line - 1]).toContain(`${p.kind}:`)
      }
    })

    it('pins task line anchors to the real file lines', () => {
      const lines = yaml.split('\n')
      for (const t of plan.tasks) {
        expect(lines[t.line0 - 1]).toMatch(new RegExp(`^ {2}- (id: ${t.id}|\\{ id: ${t.id},)`))
        expect(t.line1).toBeGreaterThanOrEqual(t.line0)
      }
    })

    it('derives workflow name, model and outputs', () => {
      expect(plan.workflow).toBe(truth.workflow)
      // a zero-model flagship (price-watch) declares NO model: derive yields ''
      expect(plan.model).toBe(truth.model ?? '')
      expect(plan.outputs).toEqual(Object.keys(truth.outputs ?? {}))
    })
  },
)
