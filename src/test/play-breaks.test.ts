import { describe, expect, it } from 'vitest'
import { PLAY_BREAKS } from '../pages/play-breaks'
import { TEMPLATES_YAML } from '../sections/usecases-yaml.generated'
import { w1ToW2 } from '../lib/w1-to-w2'
import { lintNika } from '../lib/nika-lint'

/* ── the break-it gates (U8 · structural honesty) ─────────────────────────────
   Every authored mutation is applied to the REAL skeleton bytes and judged
   by the REAL port: the promised code fires on the mutated file and does
   NOT fire on the pristine one. An upstream template diet that moves the
   `find` bytes goes red here with the seed's name — the button can never
   silently do nothing. */

const seeds = Object.keys(PLAY_BREAKS)

describe('play breaks · one honest mutation per template seed', () => {
  it('covers exactly the six template seeds', () => {
    expect(seeds.sort()).toEqual([
      'agent-loop',
      'chain',
      'etl-state',
      'fanout',
      'gate-and-act',
      'human-gated-ship',
    ])
  })

  it.each(seeds.map((s) => [s, PLAY_BREAKS[s]] as const))(
    '%s · the find exists, the code fires mutated, stays quiet pristine',
    (seed, b) => {
      // the button mutates what the page SERVES — the W2 door output
      const yaml = w1ToW2(TEMPLATES_YAML[seed])
      expect(yaml, `${seed} skeleton missing`).toBeTruthy()
      expect(yaml.includes(b.find), `${seed}: find not in the skeleton`).toBe(true)
      // one occurrence only — the button applies a single, predictable edit
      expect(yaml.split(b.find).length - 1, `${seed}: find must be unique`).toBe(1)

      const pristine = lintNika(yaml).map((d) => d.code)
      expect(pristine.includes(b.fires), `${seed}: pristine already fires ${b.fires}`).toBe(false)

      const mutated = lintNika(yaml.replace(b.find, b.replace)).map((d) => d.code)
      expect(
        mutated.includes(b.fires),
        `${seed}: expected ${b.fires} · got [${mutated.join(', ') || 'nothing'}]`,
      ).toBe(true)
    },
  )

  it('six distinct codes: each break teaches a different refusal', () => {
    const codes = seeds.map((s) => PLAY_BREAKS[s].fires)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('the anti-slop voice holds on the authored strings', () => {
    for (const s of seeds) {
      const b = PLAY_BREAKS[s]
      for (const t of [b.label, b.lesson]) {
        expect(t).not.toMatch(/—/)
        expect(t).not.toMatch(/\b(seamless|powerful|robust)\b/i)
      }
    }
  })
})
