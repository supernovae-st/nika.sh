import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NIKA_VERB_HEX, NIKA_STATUS, NIKA_BRAND } from '../design-tokens.generated'

/* ── the CSS↔SSOT structural gate ─────────────────────────────────────────────
   styles/tokens.css hand-authors the CSS layer of the shared vocabulary
   (--verb-* · --status-done · the brand core) — until now the link to the
   spec SSOT was a COMMENT ("spec NIKA_SEVERITY.ok"), i.e. discipline. This
   gate makes it structure: the hand-typed hexes must equal the generated
   module (design-tokens.generated.ts ← design/tokens.yaml). A spec-side
   value change that isn't re-typed here goes red in CI, never ships as
   silent drift. (The vscode canvas has the same gate on its dag.css.)

   The library stylesheet (components/dag/dag-node.css) is held to a harder
   law: NO raw hex at all — every color is a token var. */

const ROOT = join(__dirname, '../..')
const tokensCss = readFileSync(join(ROOT, 'src/styles/tokens.css'), 'utf8')

function cssVar(name: string): string {
  const m = tokensCss.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`))
  expect(m, `--${name} must be declared as a raw hex in styles/tokens.css`).toBeTruthy()
  return m![1].toLowerCase()
}

describe('styles/tokens.css · the hand-typed hexes ARE the SSOT values', () => {
  it('the four verb hues match NIKA_VERB_HEX', () => {
    expect(cssVar('verb-infer')).toBe(NIKA_VERB_HEX.infer)
    expect(cssVar('verb-exec')).toBe(NIKA_VERB_HEX.exec)
    expect(cssVar('verb-invoke')).toBe(NIKA_VERB_HEX.invoke)
    expect(cssVar('verb-agent')).toBe(NIKA_VERB_HEX.agent)
  })

  it('the recorded-run green matches NIKA_STATUS.done (= severity.ok)', () => {
    expect(cssVar('status-done')).toBe(NIKA_STATUS.done)
  })

  it('the engineered black base matches the brand core', () => {
    expect(cssVar('v4-bg')).toBe(NIKA_BRAND.bg)
  })
})

describe('components/dag/dag-node.css · the library stylesheet is hex-free', () => {
  it('every color is a token var (no raw hex can drift)', () => {
    const css = readFileSync(join(ROOT, 'src/components/dag/dag-node.css'), 'utf8')
    const body = css.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(body.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
  })
})
