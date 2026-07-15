import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GATE_MATRIX, GATE_PRODUCERS, GATE_FORMS } from '../content/gate-matrix.generated'

/* ── the gate-matrix vendored truth (I1's data · the /flow#gate explorable
   replays THIS · one-truth form (a)) ──────────────────────────────────────────
   40 cells exactly: 4 producer states × 10 edge forms · 35 runnable
   (verdicts authored by the spec's reference model · engine-proven
   upstream) · 5 statically dead (NIKA-DAG-006). These gates hold the
   shape and the semantics the widget will lean on — a spec revision
   lands through the re-vendor, judged here. */

const ROOT = join(__dirname, '../..')

describe('gate matrix · the vendored corpus is byte-stable and complete', () => {
  const specGates =
    process.env.NIKA_SPEC_ROOT != null
      ? join(process.env.NIKA_SPEC_ROOT, 'conformance/tests/runtime/gates')
      : [
          join(ROOT, '../spec/repo/conformance/tests/runtime/gates'),
          join(ROOT, '../../../../..', 'ventures/nika/02-engineering/repos/spec/repo/conformance/tests/runtime/gates'),
        ].find((p) => existsSync(p)) ?? ''
  it.skipIf(!existsSync(specGates))('gate-matrix.generated.ts is exactly what the vendor emits', () => {
    const committed = readFileSync(join(ROOT, 'src/content/gate-matrix.generated.ts'), 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/vendor-gate-matrix.mjs')], { env: { ...process.env } })
    const fresh = readFileSync(join(ROOT, 'src/content/gate-matrix.generated.ts'), 'utf8')
    expect(fresh).toBe(committed)
  })

  it('exactly 40 cells: the full producer × form plane, no hole, no extra', () => {
    expect(GATE_MATRIX.length).toBe(40)
    const seen = new Set(GATE_MATRIX.map((c) => `${c.producer}/${c.form}`))
    for (const p of GATE_PRODUCERS) {
      for (const f of GATE_FORMS) {
        expect(seen.has(`${p}/${f}`), `${p}/${f}`).toBe(true)
      }
    }
  })

  it('the five dead cells are the DAG-006 refusals, nothing else', () => {
    const dead = GATE_MATRIX.filter((c) => c.dead)
    expect(dead.map((c) => `${c.producer}/${c.form}`).sort()).toEqual([
      'cancelled/after-skipped',
      'failure/after-skipped',
      'skipped/after-failed',
      'skipped/after-succeeded',
      'success/after-skipped',
    ])
    for (const c of dead) {
      expect(c.code).toBe('NIKA-DAG-006')
      expect(c.verdict).toBe('refused')
      expect(c.yaml).toBeNull()
    }
  })

  it('every runnable cell carries its fixture witness, its yaml and a legal verdict', () => {
    for (const c of GATE_MATRIX.filter((x) => !x.dead)) {
      expect(c.fixture, `${c.producer}/${c.form}`).toMatch(/^conformance\/tests\/runtime\/gates\/\d{3}-/)
      expect(c.yaml, `${c.producer}/${c.form}`).toContain('nika: v1')
      expect(['success', 'failure', 'skipped', 'cancelled']).toContain(c.verdict)
    }
  })

  it('the semantics the widget teaches hold (read FROM the fixtures, never guessed)', () => {
    const cell = (p: string, f: string) => GATE_MATRIX.find((c) => c.producer === p && c.form === f)!
    // a value that can never exist CANCELS the reader (not a skip): the
    // matrix's sharpest teaching — my first guess said `skipped`, the
    // reference model says cancelled. The explorable exists for this.
    expect(cell('failure', 'with-value').verdict).toBe('cancelled')
    expect(cell('cancelled', 'with-value').verdict).toBe('cancelled')
    expect(cell('success', 'with-value').verdict).toBe('success')
    // an error that never happened cancels its reader the same way
    expect(cell('success', 'with-error').verdict).toBe('cancelled')
    expect(cell('failure', 'with-error').verdict).toBe('success')
    // status observation settles with the producer, whatever its fate
    for (const p of GATE_PRODUCERS) expect(cell(p, 'with-status').verdict, p).toBe('success')
    // a gate that can no longer fire cancels its waiter; the matching one fires
    expect(cell('failure', 'after-succeeded').verdict).toBe('cancelled')
    expect(cell('success', 'after-succeeded').verdict).toBe('success')
    expect(cell('failure', 'after-failed').verdict).toBe('success')
    expect(cell('success', 'after-failed').verdict).toBe('cancelled')
    // terminal fires on any terminal state
    for (const p of GATE_PRODUCERS) expect(cell(p, 'after-terminal').verdict, p).toBe('success')
    // when: is POST-gate business logic — false holds, true admits, always
    for (const p of GATE_PRODUCERS) {
      expect(cell(p, 'when-false').verdict, p).toBe('skipped')
      expect(cell(p, 'when-true').verdict, p).toBe('success')
    }
    // no-edge: the consumer is independent
    for (const p of GATE_PRODUCERS) expect(cell(p, 'no-edge').verdict, p).toBe('success')
  })
})
