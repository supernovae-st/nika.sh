import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CANON } from '../canon.generated'

/* ── the llms.txt drift gate ──────────────────────────────────────────────────
   public/llms.txt is the agent-facing face of the site — and it was the one
   counts-bearing surface without a gate (blog, errors and use-case projections
   all recompile-and-diff). Its counts are prose, not a projection, so the gate
   is an agreement check: every builtin/provider count in the file must equal
   src/canon.generated.ts — a canon bump without the llms.txt line goes red
   here, never silently stale to crawlers. */

const llms = readFileSync(join(__dirname, '../../public/llms.txt'), 'utf8')

describe('/llms.txt · counts agree with the generated canon', () => {
  it(`says ${CANON.builtins} builtins`, () => {
    expect(llms).toContain(`${CANON.builtins} builtins`)
  })

  it(`says ${CANON.providers} providers`, () => {
    expect(llms).toContain(`${CANON.providers} providers`)
  })

  it('carries no stale builtin or provider count', () => {
    for (const m of llms.matchAll(/(\d+) (builtins|providers)/g)) {
      const want = m[2] === 'builtins' ? CANON.builtins : CANON.providers
      expect(Number(m[1]), m[0]).toBe(want)
    }
  })
})
