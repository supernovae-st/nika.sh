import { useEffect, useRef } from 'react'
import './decode-text.css'

/* ─── DecodeText · the plate resolves from Bayer noise (wave-I VFX) ───────────
   The mono index plates (.v4sec-fig / .v4block-fig register) decode from the
   dither field's own glyph alphabet to the real stamp on first viewport entry:
   one shot, ~320ms, per-char stagger, then the instrument reads clean forever.

   TRUTH LAYERING (the a11y/SSG contract):
   · SSG HTML carries the REAL text · the face span ships EMPTY · zero noise
     can exist before hydration + IntersectionObserver fire.
   · During the decode the real text is only color:transparent (NEVER
     visibility/display-hidden) — the AT tree, find-in-page, selection and
     GEOMETRY all keep the stable real text at all times.
   · The noise lives in an aria-hidden absolute overlay clipped to the real
     text's box. Whitespace is never scrambled (word shape holds).
   · Reduced motion: the effect never arms — the plate is simply the text.

   Perf: ONE IntersectionObserver per plate, disconnected on fire; ONE rAF
   loop that lives ≤320ms and self-terminates. No listeners survive.

   Scope note: the proportional display titles are deliberately NOT decoded —
   `text-wrap: balance` re-flows per glyph swap and the headline reads broken,
   not instrumental. The decode belongs to the mono stamp register only. */

const GLYPHS = '▖▗▘▝░▒·'

export function DecodeText({ text }: { text: string }) {
  const wrap = useRef<HTMLSpanElement>(null)
  const face = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = wrap.current
    const fx = face.current
    if (!el || !fx) return

    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect() /* one-shot · the plate decodes once per visit */

        const chars = [...text]
        const n = chars.length
        const TOTAL = 320
        const LEAD = 120 /* first char resolves here · last lands at TOTAL */
        const isGap = (c: string) => c.trim() === ''
        const roll = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]
        let noise = chars.map((c) => (isGap(c) ? c : roll()))
        let lastSwap = 0
        const t0 = performance.now()
        el.dataset.decoding = '1'

        const step = (now: number) => {
          const t = now - t0
          /* the noise re-rolls at ~45ms (calm fizz), not per frame */
          if (now - lastSwap > 45) {
            lastSwap = now
            noise = chars.map((c) => (isGap(c) ? c : roll()))
          }
          fx.textContent = chars
            .map((c, i) => {
              const doneAt = LEAD + (n < 2 ? 0 : (i / (n - 1)) * (TOTAL - LEAD))
              return isGap(c) || t >= doneAt ? c : noise[i]
            })
            .join('')
          if (t < TOTAL) {
            raf = requestAnimationFrame(step)
          } else {
            fx.textContent = ''
            delete el.dataset.decoding
          }
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      if (fx) fx.textContent = ''
      if (el) delete el.dataset.decoding
    }
  }, [text])

  return (
    <span ref={wrap} className="vfx-decode">
      <span className="vfx-decode-real">{text}</span>
      <span ref={face} className="vfx-decode-face" aria-hidden />
    </span>
  )
}
