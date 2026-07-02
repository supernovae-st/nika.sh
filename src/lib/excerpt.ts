/* ─── excerpt · a TRUE slice of a projected showcase YAML ─────────────────────
   The hero shows a FOCUSED window onto the real `t3-resume-screener` file (the
   only projected showcase with a real `permits:` block). We never hand-type the
   YAML — we slice real, contiguous line ranges out of the projected string and
   stitch them with a bare `…` marker where lines were trimmed. So every visible
   character (bar the `…` glyph) is verbatim from the spec projector.

   Determinism: pure string ops, no I/O, SSR-safe. Same input → same excerpt. */

/** the marker line dropped between non-contiguous slices (a bare ellipsis). */
export const TRIM = '…'

/** an inclusive 1-based line range to lift out of the source verbatim. */
export type Range = readonly [start: number, end: number]

/**
 * Build a focused excerpt from `yaml` by lifting the given 1-based line ranges
 * verbatim and inserting a single `…` marker line between non-adjacent ranges.
 * Returns the excerpt string plus the 1-based line span the `highlightTag`
 * lands on inside the EXCERPT (so the caller can emphasize e.g. the `permits:`
 * block without re-counting by hand).
 */
export function sliceExcerpt(
  yaml: string,
  ranges: readonly Range[],
  highlightTag?: RegExp,
): { text: string; highlight: [number, number] | undefined } {
  const src = yaml.split('\n')
  const out: string[] = []
  ranges.forEach((r, i) => {
    if (i > 0) out.push(TRIM)
    for (let n = r[0]; n <= r[1]; n++) {
      // 1-based → 0-based; clamp defensively so a stale range never throws
      const line = src[n - 1]
      if (line !== undefined) out.push(line)
    }
  })
  const text = out.join('\n')

  let highlight: [number, number] | undefined
  if (highlightTag) {
    let lo = -1
    let hi = -1
    out.forEach((line, idx) => {
      if (highlightTag.test(line)) {
        if (lo === -1) lo = idx + 1 // 1-based
        hi = idx + 1
      }
    })
    if (lo !== -1) highlight = [lo, hi]
  }
  return { text, highlight }
}
