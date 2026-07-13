import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import Ajv2020 from 'ajv/dist/2020'
import { TOOL_USAGE } from '../content/tool-usage.generated'
import { TOOL_USAGE_REFS } from '../content/tool-usage-refs.generated'
import { TOOLS } from '../content/tools.generated'
import { TEMPLATE_INDEX } from '../content/templates.generated'
import { ERROR_CODES } from '../content/errors.generated'

/* ── the builtin-room drift gates ─────────────────────────────────────────────
   Every /tools/<name> room shows the tool inside a real file
   (tool-usage.generated.ts). Three laws hold it honest:

   1 · REGEN — the compiled module is exactly what the compiler emits from
       today's inputs (catalog + skeleton pack + crafted files) — bumping any
       source without `node scripts/build-tool-usage.mjs` goes red here.
   2 · FIDELITY — a template excerpt is a VERBATIM slice of its donor
       skeleton at the line it claims (CodeFile firstLine law: the same
       body, partially shown, never a second version of the file); a
       crafted room's yaml is byte-identical to its checked-in source file.
   3 · TRUTH — every crafted file is a complete workflow that validates
       against the live contract (public/schema/workflow.json — the
       onpage-yaml recipe); every cross-ref points at a registered template
       or error code. */

const ROOT = join(__dirname, '../..')

const schema = JSON.parse(
  readFileSync(join(ROOT, 'public/schema/workflow.json'), 'utf8'),
) as Record<string, unknown>
/* structural validation only — `format:` annotations are prose contracts */
const ajv = new Ajv2020({ strict: false, validateFormats: false, allowUnionTypes: true })
const validate = ajv.compile(schema)

const errorCodeSet = new Set(ERROR_CODES.map((e) => e.code))

describe('/tools/:name · the usage projection matches its sources', () => {
  it('tool-usage.generated.ts (and its refs twin) is exactly what the compiler emits today', () => {
    const path = join(ROOT, 'src/content/tool-usage.generated.ts')
    const refsPath = join(ROOT, 'src/content/tool-usage-refs.generated.ts')
    const committed = readFileSync(path, 'utf8')
    const committedRefs = readFileSync(refsPath, 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-tool-usage.mjs')])
    expect(readFileSync(path, 'utf8')).toBe(committed)
    expect(readFileSync(refsPath, 'utf8')).toBe(committedRefs)
  })

  it('the refs twin IS the registry projected (graph.ts inverts the twin)', () => {
    expect(TOOL_USAGE_REFS).toEqual(
      Object.fromEntries(
        Object.entries(TOOL_USAGE).map(([k, e]) => [
          k,
          { templates: e.templates, errorCodes: e.errorCodes },
        ]),
      ),
    )
  })

  it('every builtin owns a room (exact-set match, no orphan either way)', () => {
    expect(new Set(Object.keys(TOOL_USAGE))).toEqual(new Set(TOOLS.map((t) => t.bare)))
  })

  it('template excerpts are verbatim slices of their donor skeleton', () => {
    for (const entry of Object.values(TOOL_USAGE)) {
      if (entry.source.kind !== 'template') continue
      const donor = TEMPLATE_INDEX[entry.source.template]
      expect(donor, `${entry.bare} cites skeleton "${entry.source.template}"`).toBeDefined()
      expect(donor.file, entry.bare).toBe(entry.source.file)
      const lines = entry.yaml.split('\n')
      const slice = donor.yaml
        .split('\n')
        .slice(entry.source.firstLine - 1, entry.source.firstLine - 1 + lines.length)
        .join('\n')
      expect(slice, `${entry.bare} excerpt drifted from ${donor.file}`).toBe(entry.yaml)
    }
  })

  it('crafted rooms are byte-identical to their checked-in file', () => {
    for (const entry of Object.values(TOOL_USAGE)) {
      if (entry.source.kind !== 'crafted') continue
      const disk = readFileSync(join(ROOT, 'content/tool-usage', entry.source.file), 'utf8')
      expect(disk.replace(/\n$/, ''), entry.source.file).toBe(entry.yaml)
    }
  })

  it('every crafted file is a complete workflow, schema-true', () => {
    for (const entry of Object.values(TOOL_USAGE)) {
      if (entry.source.kind !== 'crafted') continue
      const doc = parse(entry.yaml) as unknown
      expect(doc, `${entry.source.file} must parse to a mapping`).toBeTypeOf('object')
      const ok = validate(doc)
      const errors = (validate.errors ?? [])
        .map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`)
        .join('\n')
      expect(ok, `${entry.source.file} violates workflow.json:\n${errors}`).toBe(true)
    }
  })

  it('every usage panel actually shows its tool', () => {
    for (const entry of Object.values(TOOL_USAGE)) {
      expect(entry.yaml, entry.bare).toContain(`nika:${entry.bare}`)
    }
  })

  it('cross-refs point at registered templates and error codes only', () => {
    for (const entry of Object.values(TOOL_USAGE)) {
      for (const t of entry.templates) {
        expect(TEMPLATE_INDEX[t], `${entry.bare} → template ${t}`).toBeDefined()
      }
      expect(entry.errorCodes[0], entry.bare).toBe('NIKA-BUILTIN-001')
      for (const c of entry.errorCodes) {
        expect(errorCodeSet.has(c), `${entry.bare} → ${c}`).toBe(true)
      }
    }
  })
})
