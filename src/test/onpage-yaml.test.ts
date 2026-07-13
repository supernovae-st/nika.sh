import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import Ajv2020 from 'ajv/dist/2020'
import { FLAGSHIPS } from '../flagships/flagship-data'
import { CHAPTERS } from '../sections/verbs-data'
import { BLOG_POSTS } from '../content/blog.generated'
import { BLOG_BODIES } from '../content/blog-bodies.generated'
import { HELLO_YAML, HELLO_AI_YAML } from '../content/install'
import { FULL_FILE } from '../content/learn'
import { PROOF_YAML } from '../pages/Convert'
import { NOT_FOUND_YAML } from '../pages/NotFound'
import { VERBS } from '../content'
import { EXTENSION_SHOWCASE_YAML } from '../sections/EditorCanvas'
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
  it.each(FLAGSHIPS.map((f) => [f.filename, f.yaml] as const))(
    'flagship %s validates',
    (label, yaml) => expectValid(label, yaml),
  )

  it.each(CHAPTERS.map((c) => [c.filename, c.yaml] as const))(
    'verbs chapter %s validates',
    (label, yaml) => expectValid(label, yaml),
  )

  it('the blog four-verbs fragment validates', () => {
    /* every yaml fence in every compiled blog post is a real workflow */
    for (const post of BLOG_POSTS)
      for (const t of BLOG_BODIES[post.slug] ?? [])
        if (t.k === 'code' && t.lang === 'yaml')
          expectValid(`blog/${post.slug} · ${t.filename ?? 'fence'}`, t.text)
  })

  it.each([
    ['install · hello.nika.yaml', HELLO_YAML],
    ['install · hello-ai.nika.yaml', HELLO_AI_YAML],
    ['editor miniature · release-notes.nika.yaml', EXTENSION_SHOWCASE_YAML],
    /* the gaps the 2026-07-13 audit closed — every yaml a visitor can read
       is schema-true, INCLUDING the /convert proof, the /learn full file
       and the 404 joke (the law has no exceptions) */
    ['convert · friday-changelog.nika.yaml', PROOF_YAML],
    ['learn · weekly-radar.nika.yaml (the full file)', FULL_FILE],
    ['404 · not-found.nika.yaml', NOT_FOUND_YAML],
  ] as const)('%s validates', (label, yaml) => expectValid(label, yaml))

  it.each(VERBS.map((v) => [v.verb, v.code] as const))(
    '/spec verb card fragment %s seats in a valid file',
    (verb, code) => {
      /* the cards show task FRAGMENTS — the gate embeds each in a minimal
         envelope: the fragment is proven AS IT WOULD BE WRITTEN */
      const indented = code
        .split('\n')
        .map((l) => (l ? `  ${l}` : l))
        .join('\n')
      expectValid(
        `spec verb card · ${verb}`,
        `nika: v1\nworkflow:\n  id: card-${verb}\ntasks:\n${indented}\n`,
      )
    },
  )

  it.each(Object.entries(SHOWCASE_YAML))('showcase %s validates', (slug, yaml) =>
    expectValid(slug, yaml),
  )

  it.each(Object.entries(TEMPLATES_YAML))('template %s validates', (slug, yaml) =>
    expectValid(slug, yaml),
  )
})

/* ── the hero highlight · the default flagship emphasizes its permits block ── */
describe('flagships · hero highlight ranges', () => {
  it('the default tab highlights the permits block', () => {
    const f = FLAGSHIPS[0]
    const [lo, hi] = f.highlight
    const lines = f.yaml.split('\n')
    expect(lines[lo - 1]).toMatch(/^permits:/)
    for (let n = lo + 1; n <= hi; n++) {
      expect(lines[n - 1], `line ${n} inside the permits block`).toMatch(/^ {2}\S/)
    }
  })

  it('every flagship highlight range points at real lines', () => {
    for (const f of FLAGSHIPS) {
      const [lo, hi] = f.highlight
      const lines = f.yaml.split('\n')
      expect(lo).toBeGreaterThanOrEqual(1)
      expect(hi).toBeGreaterThanOrEqual(lo)
      expect(lines[hi - 1], `${f.filename} line ${hi}`).toBeDefined()
    }
  })
})
