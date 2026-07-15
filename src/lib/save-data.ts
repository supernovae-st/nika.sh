/* ─── save-data · the lite-data signal (W-H · WO-12) ──────────────────────────
   True when the visitor ASKED for less data: the Save-Data client hint
   (navigator.connection.saveData — Chromium exposes the browser toggle) or
   the prefers-reduced-data media query where it ships. Consumers gate the
   HEAVY LAZY layers on it (the three.js scenes · the particle signature):
   the DOM story is always the complete truth, so honoring the request costs
   nothing but the decoration. SSR-safe: false on the server — the layers
   are client-mounted anyway. Deps injectable for the unit gate. */

interface ConnectionLike {
  saveData?: boolean
}

export function prefersLiteData(
  nav: { connection?: ConnectionLike } = typeof navigator !== 'undefined' ? (navigator as never) : {},
  mm: ((q: string) => { matches: boolean }) | undefined = typeof matchMedia !== 'undefined'
    ? matchMedia
    : undefined,
): boolean {
  if (nav.connection?.saveData === true) return true
  try {
    return mm?.('(prefers-reduced-data: reduce)').matches ?? false
  } catch {
    return false
  }
}
