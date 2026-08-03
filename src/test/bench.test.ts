import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BENCH_WITNESSES, BENCH_BY_MODEL } from '../content/bench.generated'
import { MODELS } from '../content/catalog.generated'

/* ─── the bench · a measured claim is a projection of a PUBLISHED receipt ────
   The R7 law: no receipt, no number. These gates hold the whole chain —
   authored twin ↔ the run's own table ↔ the evidence pack ↔ the projection
   the rooms render ↔ the served byte-copy — so a number on a page can never
   exist without the receipt that re-derives it. */

const ROOT = join(__dirname, '../..')
const SRC = join(ROOT, 'content', 'bench')

const walk = (dir: string, base = ''): string[] =>
  readdirSync(dir).flatMap((name) => {
    const rel = base ? `${base}/${name}` : name
    return statSync(join(dir, name)).isDirectory() ? walk(join(dir, name), rel) : [rel]
  })

describe('the bench · receipts and their projection', () => {
  it('every witness dir projects, every projected witness has its dir', () => {
    const dirs = readdirSync(SRC).filter((d) => statSync(join(SRC, d)).isDirectory())
    expect(BENCH_WITNESSES.map((w) => w.id).sort()).toEqual(dirs.sort())
  })

  it('the twin agrees with the run table, row for row (two readers, one truth)', () => {
    for (const w of BENCH_WITNESSES) {
      const table = readFileSync(join(SRC, w.id, 'table.md'), 'utf8')
      const rows = [...table.matchAll(/^\| (\S+) \| (\d+)ms \| (\d+) \|/gm)].map((m) => ({
        model: m[1],
        latency_ms: Number(m[2]),
        chars: Number(m[3]),
      }))
      expect(rows.length, `${w.id}/table.md carries no parseable rows`).toBeGreaterThan(0)
      expect(
        w.seats.map((s) => ({ model: s.model, latency_ms: s.latency_ms, chars: s.chars })),
        `${w.id}: witness.json seats ≠ table.md rows`,
      ).toEqual(rows)
    }
  })

  it('the twin agrees with the evidence pack (trace head · engine · chain)', () => {
    for (const w of BENCH_WITNESSES) {
      const pack = JSON.parse(readFileSync(join(SRC, w.id, 'evidence', 'pack.json'), 'utf8')) as {
        trace: { head: string; chain: string }
        engine: { version: string; platform: string }
      }
      expect(pack.trace.chain, `${w.id}: exported chain not intact`).toBe('intact')
      expect(w.trace_head, `${w.id}: trace_head ≠ pack.json head`).toBe(pack.trace.head)
      expect(w.engine, `${w.id}: engine ≠ pack.json engine`).toBe(pack.engine.version)
      expect(w.platform, `${w.id}: platform ≠ pack.json platform`).toBe(pack.engine.platform)
    }
  })

  it('cost honesty: spent under the announced ceiling, sha pins well-formed', () => {
    for (const w of BENCH_WITNESSES) {
      expect(w.spent_usd).toBeLessThanOrEqual(w.ceiling_usd)
      expect(w.artifact.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(w.artifact.source_rev).toMatch(/^[0-9a-f]{40}$/)
    }
  })

  it('the join is honest: every row keys the model its seat names, catalog rooms find theirs', () => {
    const catalogIds = new Set(MODELS.map((m) => m.id))
    for (const [model, rows] of Object.entries(BENCH_BY_MODEL)) {
      for (const r of rows) {
        expect(r.seat.endsWith(`/${model}`), `${r.seat} does not name ${model}`).toBe(true)
        expect(r.href).toBe(`/bench/${r.witness}/PROVENANCE.md`)
      }
    }
    /* at least one measured seat must join a real catalog room, or the whole
       surface is dead text (the first witness guarantees llama3.2:3b) */
    expect(
      Object.keys(BENCH_BY_MODEL).some((m) => catalogIds.has(m)),
      'no bench row joins any catalog model room',
    ).toBe(true)
  })

  it('the served copy is byte-identical to the source of record', () => {
    for (const rel of walk(SRC)) {
      const pub = join(ROOT, 'public', 'bench', rel)
      expect(existsSync(pub), `public/bench/${rel} missing — run node scripts/build-bench.mjs`).toBe(
        true,
      )
      expect(
        readFileSync(pub).equals(readFileSync(join(SRC, rel))),
        `public/bench/${rel} diverges from content/bench/${rel}`,
      ).toBe(true)
    }
  })
})
