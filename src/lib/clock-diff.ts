import { LENS_CLOCK_DIFF } from '../content/lens-meta.generated'

/* ─── the two clocks · one reading, every register ───────────────────────────
   Two clocks run on this language: what the SPEC has ratified at the pin, and
   what the ENGINE has shipped. Where they disagree, the site says so.

   THE BUG THIS MODULE EXISTS TO KILL: the claim « the two clocks agree » is a
   claim about EVERY register, so it is only honest when every register was
   read. /map hand-listed ['builtins', 'providers'] and printed agreement while
   the `grammar` register carried a live W1/W2 envelope split — a falsehood on
   the mother page, in the one sentence the whole site's honesty rests on. It
   was the SECOND time that hand list went stale (providers drifted the same
   way before it, caught by the swarm).

   So no consumer hand-lists registers again: the keys come from the data. A
   fourth register joins the compiler's emission and this reads it the same
   day, with nobody remembering to. clock-diff.test.ts pins that. */

export type ClockRegister = keyof typeof LENS_CLOCK_DIFF

/** every register the compiler emits, in its emission order */
export const CLOCK_REGISTERS = Object.keys(LENS_CLOCK_DIFF) as ClockRegister[]

/** the registers that actually disagree today */
export function clockDrift(): ClockRegister[] {
  return CLOCK_REGISTERS.filter((r) => {
    const d = LENS_CLOCK_DIFF[r]
    return d.ratified_only.length > 0 || d.shipped_only.length > 0
  })
}

/** the one-line reading · the agreement sentence ONLY when every register agrees */
export function clockDiffLine(): string {
  const parts: string[] = []
  for (const register of CLOCK_REGISTERS) {
    const d = LENS_CLOCK_DIFF[register]
    if (d.ratified_only.length)
      parts.push(`${register} ratified, ships with the next train: ${d.ratified_only.join(' · ')}`)
    if (d.shipped_only.length)
      parts.push(`${register} shipped ahead of canon: ${d.shipped_only.join(' · ')}`)
  }
  /* the house separator, not an em dash: this line was dormant until the
     grammar drift surfaced it, and the copy law (AGENTS.md · no em-dash
     slop) applies the moment prose reaches a page */
  return parts.length
    ? parts.join(' · ')
    : 'the two clocks agree today: everything ratified is shipped'
}
