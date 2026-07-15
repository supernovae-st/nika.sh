import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TEMPLATES, TEMPLATE_INDEX } from '../content/templates.generated'
import { CANON } from '../canon.generated'
import { TEMPLATE_PATHS, PATHS } from '../../site.config'

/* ── the skeleton-register drift gates ────────────────────────────────────────
   public/templates/catalog.json is the source (derived from the nika-spec
   pack: README routing + the SLOT-marked files); templates.generated.ts is
   the compiled projection the /templates pages render. The gate recompiles
   hermetically (--from-catalog), byte-diffs, RE-HASHES every carried yaml
   against its sha256 pin (the copy-fidelity law — a copy is re-provable,
   never trusted), and pins the count against CANON.templates (spec
   canon.yaml) so site-vs-spec drift goes red, never silently stale. */

const ROOT = join(__dirname, '../..')

describe('/templates · the compiled projection matches the served catalog', () => {
  it('templates.generated.ts is exactly what the compiler emits today', () => {
    const committed = readFileSync(join(ROOT, 'src/content/templates.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-templates.mjs'), '--from-catalog'])
    const fresh = readFileSync(join(ROOT, 'src/content/templates.generated.ts'), 'utf8')
    expect(fresh).toBe(committed)
  })

  /* the FRESHNESS leg (the lint-fixtures precedent · RISK B of the PRE1
     census): the committed catalog is the release authority, and stage 1
     regex-parses the spec README's prose (intent · patterns · routing) —
     fields the sha/count gates below never see. Re-deriving from the
     sibling spec and byte-diffing catches EVERY parsed field, so a README
     edit or a hand edit of the committed catalog goes red naming the file,
     never ships silently wrong. Plain CI has no spec checkout — skipped
     there; the dev machine and the resync cron are the surfaces. */
  const specTemplates =
    process.env.NIKA_SPEC_ROOT != null
      ? join(process.env.NIKA_SPEC_ROOT, 'templates')
      : [
          join(ROOT, '../spec/repo/templates'),
          join(ROOT, '../../../../..', 'ventures/nika/02-engineering/repos/spec/repo/templates'),
        ].find((p) => existsSync(p)) ?? ''
  it.skipIf(!existsSync(specTemplates))(
    'catalog.json is exactly what the spec pack derives today (prose fields included)',
    () => {
      const committed = readFileSync(join(ROOT, 'public/templates/catalog.json'), 'utf8')
      execFileSync('node', [join(ROOT, 'scripts/build-templates.mjs')], { env: { ...process.env } })
      const fresh = readFileSync(join(ROOT, 'public/templates/catalog.json'), 'utf8')
      expect(fresh).toBe(committed)
    },
  )

  it('the pack size IS the spec vocabulary (CANON.templates, exactly)', () => {
    expect(TEMPLATES.length).toBe(CANON.templates)
    for (const t of TEMPLATES) {
      expect(TEMPLATE_INDEX[t.name], t.name).toBe(t)
    }
  })

  it('every carried yaml re-hashes to its pin (copy fidelity, re-proven)', () => {
    for (const t of TEMPLATES) {
      expect(createHash('sha256').update(t.yaml).digest('hex'), t.name).toBe(t.sha256)
    }
  })

  it('every skeleton actually carries its SLOT markers', () => {
    for (const t of TEMPLATES) {
      expect((t.yaml.match(/# SLOT:/g) ?? []).length, t.name).toBe(t.slots)
      expect(t.slots, t.name).toBeGreaterThan(0)
    }
  })

  it('/templates prerenders (PATHS carries the register page)', () => {
    expect(PATHS).toContain('/templates')
  })

  it('every template prerenders its deep page (DO error_document beats the catchall)', () => {
    expect(new Set(TEMPLATE_PATHS)).toEqual(new Set(TEMPLATES.map((t) => `/templates/${t.name}`)))
  })
})
