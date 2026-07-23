import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import Ajv2020 from 'ajv/dist/2020'
import { PROVIDER_USAGE, PROVIDER_AUDITS } from '../content/provider-usage.generated'
import { PROVIDER_META } from '../content/provider-meta'
import { PROVIDERS } from '../content/providers.generated'

/* ── the provider-room drift gates ────────────────────────────────────────────
   Every /providers/<id> room shows the provider inside a real file
   (provider-usage.generated.ts) plus an authored layer (provider-meta.ts).
   The laws (the tool-usage precedent):

   1 · REGEN — the compiled module is exactly what the compiler emits from
       today's donors, HERMETICALLY (--from-capture reuses the committed
       audit block · the binary is only probed on a deliberate manual run,
       the vendored-catalog law).
   2 · FIDELITY — each room's yaml is byte-identical to its checked-in
       donor at content/provider-usage/<id>.nika.yaml.
   3 · TRUTH — every donor is a complete workflow that validates against
       the live contract (public/schema/workflow.json), and every infer
       model rides `<the room's own provider>/…` — a room never teaches
       with someone else's wire.
   4 · AUTHORED COVERAGE — provider-meta covers the catalog id set exactly:
       a new provider without an angle, a setup ritual and a title goes
       red, never a bare room. */

const ROOT = join(__dirname, '../..')

const schema = JSON.parse(
  readFileSync(join(ROOT, 'public/schema/workflow.json'), 'utf8'),
) as Record<string, unknown>
/* structural validation only — `format:` annotations are prose contracts */
const ajv = new Ajv2020({ strict: false, validateFormats: false, allowUnionTypes: true })
const validate = ajv.compile(schema)

const ids = PROVIDERS.map((p) => p.id)

describe('/providers/:id · the usage projection matches its sources', () => {
  it('provider-usage.generated.ts is exactly what the compiler emits today (hermetic)', () => {
    const path = join(ROOT, 'src/content/provider-usage.generated.ts')
    const committed = readFileSync(path, 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-provider-usage.mjs'), '--from-capture'])
    expect(readFileSync(path, 'utf8')).toBe(committed)
  })

  it('the donor set IS the catalog id set, and every room has its audit', () => {
    expect(new Set(Object.keys(PROVIDER_USAGE))).toEqual(new Set(ids))
    expect(new Set(Object.keys(PROVIDER_AUDITS))).toEqual(new Set(ids))
    for (const id of ids) {
      expect(PROVIDER_AUDITS[id].tasks, id).toBeGreaterThanOrEqual(1)
      expect(PROVIDER_AUDITS[id].waves, id).toBeGreaterThanOrEqual(1)
    }
  })

  it('each yaml is byte-identical to its checked-in donor (fidelity)', () => {
    for (const id of ids) {
      const donor = readFileSync(join(ROOT, 'content/provider-usage', `${id}.nika.yaml`), 'utf8')
      expect(PROVIDER_USAGE[id].yaml, id).toBe(donor.replace(/\n+$/, '\n'))
    }
  })

  it('every donor validates against the served contract (truth)', () => {
    for (const id of ids) {
      const doc = parse(PROVIDER_USAGE[id].yaml) as Record<string, unknown>
      const ok = validate(doc)
      expect(ok, `${id}: ${JSON.stringify(validate.errors?.[0] ?? null)}`).toBe(true)
    }
  })

  it("every infer model rides the room's own provider prefix", () => {
    for (const id of ids) {
      const doc = parse(PROVIDER_USAGE[id].yaml) as {
        tasks?: Record<string, { infer?: { model?: string }; agent?: { model?: string } }>
      }
      const models = Object.values(doc.tasks ?? {})
        .flatMap((t) => [t.infer?.model, t.agent?.model])
        .filter((m): m is string => typeof m === 'string')
      expect(models.length, id).toBeGreaterThanOrEqual(1)
      for (const m of models) {
        expect(m.split('/')[0], `${id}: ${m}`).toBe(id)
      }
    }
  })

  it('provider-meta covers the catalog id set exactly (authored coverage)', () => {
    expect(new Set(Object.keys(PROVIDER_META))).toEqual(new Set(ids))
    for (const id of ids) {
      const m = PROVIDER_META[id]
      expect(m.title, id).toBeTruthy()
      expect(m.angle, id).toBeTruthy()
      expect(m.pick, id).toBeTruthy()
      expect(m.setup.length, id).toBeGreaterThanOrEqual(1)
      if (m.console) {
        expect(m.console.href, id).toMatch(/^https:\/\//)
      }
      /* cloud providers that require a key must teach where it comes from */
      const entry = PROVIDERS.find((p) => p.id === id)!
      if (entry.kind === 'cloud' && entry.requires_key) {
        expect(m.console, `${id}: a key-holding provider needs its console link`).toBeTruthy()
      }
    }
  })
})
