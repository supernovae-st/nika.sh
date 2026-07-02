import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import Ajv2020 from 'ajv/dist/2020'
import { HERO_FILES } from '../sections/hero-files'
import { CHAPTERS } from '../sections/verbs-data'
import { DAG, FILENAME, YAML as LIVING_YAML } from '../sections/living/living-data'
import { FOUR_VERBS_YAML } from '../pages/Blog'
import { SHOWCASE_YAML, TEMPLATES_YAML } from '../sections/usecases-yaml.generated'

/* ── on-page YAML · every full workflow shown on the site is SCHEMA-TRUE ─────
   The repo rule is "Spec-correct YAML only" (AGENTS.md #1), yet until this
   suite only the /learn fragments were tested — the flagship hero/Living File
   daily-brief shipped schema-INVALID (`needs:`, string-shorthand verbs,
   non-namespaced tools). This suite closes that class forever: every
   hand-authored full workflow on the site (hero tabs · Living File · Verbs
   chapters · the blog fragment) AND the projected showcase/templates validate
   against the live contract at public/schema/workflow.json.

   It ALSO pins the Living File choreography to its file: the hand-built DAG's
   line0/line1 must point at the exact YAML line carrying each task, and its
   deps/waves must be exactly the file's depends_on topology — so the scroll
   story can never drift from the text it animates. */

const schema = JSON.parse(
  readFileSync(join(__dirname, '../../public/schema/workflow.json'), 'utf8'),
) as Record<string, unknown>

/* the schema carries informative `format: cel-expression` / `format: jq`
   annotations — structural validation only here (formats are prose contracts) */
const ajv = new Ajv2020({ strict: false, validateFormats: false, allowUnionTypes: true })
const validate = ajv.compile(schema)

function expectValid(label: string, yaml: string) {
  const doc = parse(yaml) as unknown
  expect(doc, `${label} must parse to a mapping`).toBeTypeOf('object')
  const ok = validate(doc)
  const errors = (validate.errors ?? [])
    .map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`)
    .join('\n')
  expect(ok, `${label} violates workflow.json:\n${errors}`).toBe(true)
}

describe('on-page YAML · schema-true against public/schema/workflow.json', () => {
  it.each(HERO_FILES.map((f) => [f.filename, f.yaml] as const))(
    'hero tab %s validates',
    (label, yaml) => expectValid(label, yaml),
  )

  it('the Living File flagship validates', () => {
    expectValid(FILENAME, LIVING_YAML)
  })

  it.each(CHAPTERS.map((c) => [c.filename, c.yaml] as const))(
    'verbs chapter %s validates',
    (label, yaml) => expectValid(label, yaml),
  )

  it('the blog four-verbs fragment validates', () => {
    expectValid('blog · morning-brief', FOUR_VERBS_YAML)
  })

  it.each(Object.entries(SHOWCASE_YAML))('showcase %s validates', (slug, yaml) =>
    expectValid(slug, yaml),
  )

  it.each(Object.entries(TEMPLATES_YAML))('template %s validates', (slug, yaml) =>
    expectValid(slug, yaml),
  )
})

/* ── the Living File line map · the choreography is pinned to the file ─────── */
interface TaskDoc {
  id: string
  depends_on?: string[]
}

describe('Living File · DAG ↔ YAML line map', () => {
  const lines = LIVING_YAML.split('\n')
  const doc = parse(LIVING_YAML) as { tasks: TaskDoc[]; outputs?: Record<string, string> }
  const byId = new Map(doc.tasks.map((t) => [t.id, t]))

  it('the hero default tab and the Living File are the same object', () => {
    expect(HERO_FILES[0].filename).toBe(FILENAME)
    const heroDoc = parse(HERO_FILES[0].yaml) as { workflow: string; tasks: TaskDoc[] }
    expect(heroDoc.workflow).toBe('daily-brief')
    // every hero task id exists in the full Living File plan
    for (const t of heroDoc.tasks) expect(byId.has(t.id)).toBe(true)
  })

  it('every DAG task maps to the exact YAML line carrying its id', () => {
    for (const task of DAG.tasks) {
      const line = lines[task.line0 - 1] ?? ''
      expect(line, `${task.id} · line ${task.line0}`).toMatch(
        new RegExp(`- (\\{ )?id: ${task.id}\\b`),
      )
      // flow tasks are one line; a block task spans line0..line1 (still in-file)
      expect(task.line1).toBeGreaterThanOrEqual(task.line0)
      expect(lines[task.line1 - 1], `${task.id} · line1 ${task.line1}`).toBeDefined()
    }
  })

  it('DAG deps are exactly the file’s depends_on topology', () => {
    expect(DAG.tasks.map((t) => t.id).sort()).toEqual([...byId.keys()].sort())
    for (const task of DAG.tasks) {
      const declared = byId.get(task.id)?.depends_on ?? []
      expect([...task.deps].sort(), task.id).toEqual([...declared].sort())
    }
  })

  it('waves are a valid topological layering of the deps', () => {
    const waveOf = new Map(DAG.tasks.map((t) => [t.id, t.wave]))
    for (const task of DAG.tasks) {
      for (const dep of task.deps) {
        expect(waveOf.get(dep)!, `${task.id} after ${dep}`).toBeLessThan(task.wave)
      }
    }
    expect(Math.max(...DAG.tasks.map((t) => t.wave)) + 1).toBe(DAG.waves)
  })

  it('DAG outputs mirror the file’s outputs block', () => {
    expect(Object.keys(doc.outputs ?? {}).sort()).toEqual([...DAG.outputs].sort())
  })

  it('the highlighted hero lines are the permits block', () => {
    const [lo, hi] = HERO_FILES[0].highlight
    const heroLines = HERO_FILES[0].yaml.split('\n')
    expect(heroLines[lo - 1]).toMatch(/^permits:/)
    for (let n = lo + 1; n <= hi; n++) {
      expect(heroLines[n - 1], `line ${n} inside the permits block`).toMatch(/^ {2}\S/)
    }
  })
})
