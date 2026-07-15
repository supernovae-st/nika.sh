/* ─── breakpoints · the three thresholds, named (WO-12 prerequisite) ──────────
   §4quater.10: the codebase carries ~29 distinct media-query widths and the
   HUD pack must not add the 30th. CSS custom properties cannot drive @media,
   so the tokens live HERE and structure holds two ways:
   - breakpoints.test.ts pins the census of every width used in src CSS —
     a NEW distinct value goes red naming it (the ratchet only shrinks);
   - new JS media logic reads THESE constants (the useBreakpoint hook lands
     with its first consumer — the Inspector bottom sheet, WO-12).
   Presentation-class; the values are the site's own (not spec facts). */

export const BP = {
  /** compact density default below this (phones) */
  phone: 560,
  /** the fold: one-column ↔ two-column seam (tablets portrait) */
  fold: 768,
  /** full desktop chrome (mega panels · hover affordances) */
  desk: 1024,
} as const

export type Breakpoint = keyof typeof BP
