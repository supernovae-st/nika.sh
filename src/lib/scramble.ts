/* ─── scramble · the decode-once flourish (F-SENSATION-2 · R16) ──────────────
   The Vercel-school ScrambleText, house-sized (~1KB, never a 30KB lib):
   mono-only so nothing shifts, locks left→right, lands on the EXACT
   original, once per element per page visit, hover-triggered only — the
   resting DOM stays byte-identical, so the golden frames never see it.
   reduced-motion skips entirely; the element keeps a stable aria-label so
   assistive tech never hears the noise. */

const CHARSET = 'abcdefghijklmnopqrstuvwxyz:/·-_'

export function scrambleOnce(el: HTMLElement, durationMs = 450): void {
  if (el.dataset.scrambled === '1') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const original = el.textContent ?? ''
  if (!original) return
  el.dataset.scrambled = '1'
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', original)
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs)
    const locked = Math.floor(t * original.length)
    el.textContent =
      original.slice(0, locked)
      + [...original.slice(locked)]
        .map((ch) => (ch === ' ' ? ' ' : CHARSET[Math.floor(Math.random() * CHARSET.length)]))
        .join('')
    if (t < 1) requestAnimationFrame(step)
    else el.textContent = original
  }
  requestAnimationFrame(step)
}
