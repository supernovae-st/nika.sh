// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import init, { check, engine_version } from '../lib/check-wasm/pkg/nika_check_wasm.js'
import { rowsToDiags } from '../lib/check-wasm/oracle'
import { HERO_FINDINGS, HERO_ENGINE } from '../content/hero-check.generated'

/* ── the vendored artifact, judged against the CLI-captured truth ────────────
   The pkg/ under src/lib/check-wasm is a BUILT artifact vendored from the
   engine branch (PROVENANCE.json beside it). Vendored artifacts drift the
   day nobody proves them, so this suite loads the REAL wasm in node (init
   from bytes — the web-target glue accepts a BufferSource) and re-judges the
   served hero twins against hero-check.generated.ts, which the binary itself
   captured and whose own drift gate re-proves it against `nika check`.

   One artifact, two independent provenances, byte-compared: the wasm's row
   must equal the CLI's row for the legs both run. This is the site-side
   half of the crate's differential gate. */

const ROOT = join(__dirname, '../..')
const wasmBytes = readFileSync(join(ROOT, 'src/lib/check-wasm/pkg/nika_check_wasm_bg.wasm'))
const broken = readFileSync(join(ROOT, 'public/hero/pr-review.broken.nika.yaml'), 'utf8')
const fixed = readFileSync(join(ROOT, 'public/hero/pr-review.nika.yaml'), 'utf8')

const ready = init(wasmBytes)

describe('the vendored wasm · the same voice as the captured binary', () => {
  it('speaks for the same engine version the captures pin', async () => {
    await ready
    expect(engine_version()).toBe(HERO_ENGINE)
  })

  it('names its coverage in-band and never claims the binary reach', async () => {
    await ready
    const v = JSON.parse(check(broken))
    expect(v.wasm).toBe(true)
    expect(v.legs).toEqual(['PARSE', 'CONFORM'])
  })

  it('re-emits the captured CONFORM finding byte for byte, line and col included', async () => {
    await ready
    const v = JSON.parse(check(broken))
    const conform = HERO_FINDINGS.filter((f) => f.gate === 'CONFORM')
    expect(conform.length).toBeGreaterThan(0)
    for (const truth of conform) {
      const row = (v.findings as { code: string; message: string; line?: number; col?: number }[]).find(
        (r) => r.code === truth.code,
      )
      expect(row, `the wasm lost ${truth.code}`).toBeDefined()
      expect(row?.message).toBe(truth.message)
      /* line/col are computed in the CRATE (chars, beside the source) and in
         the CAPTURE SCRIPT (chars, from the byte span) — two independent
         arithmetics that must land on the same square */
      expect(row?.line).toBe(truth.line)
      expect(row?.col).toBe(truth.col)
    }
  })

  it('emits nothing the captured truth does not know on its legs', async () => {
    await ready
    const v = JSON.parse(check(broken))
    const captured = new Set(
      HERO_FINDINGS.filter((f) => f.gate === 'PARSE' || f.gate === 'CONFORM').map((f) => f.code),
    )
    for (const r of v.findings as { code: string }[]) {
      expect(captured.has(r.code), `uncaptured wasm finding ${r.code}`).toBe(true)
    }
  })

  it('lands the fixed twin clean on its legs', async () => {
    await ready
    expect(JSON.parse(check(fixed)).clean).toBe(true)
  })

  it('maps rows to the LintDiag shape the judge-surfaces speak', async () => {
    await ready
    const diags = rowsToDiags(check(broken))
    expect(diags.length).toBeGreaterThan(0)
    for (const d of diags) {
      expect(d.line).toBeGreaterThan(0)
      expect(d.code.startsWith('NIKA-')).toBe(true)
      expect(d.fix).toBe(`nika explain ${d.code}`)
    }
  })
})
