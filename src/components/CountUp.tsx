import { useEffect, useState } from 'react'

/* ─── CountUp · a stat figure rolls from 0 on first sight ─────────────────────
   Integers only, ~700ms cubic ease-out, one-shot (the observer disconnects on
   first fire). SSG renders the final value (initial state = n) so crawlers and
   no-JS readers always see the true number; the roll is a client enhancement.
   Reduced-motion: static value, no observer. */
export function CountUp({ n }: { n: number }) {
  const [shown, setShown] = useState(n)
  const [el, setEl] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / 700)
          setShown(Math.round(n * (1 - (1 - p) ** 3)))
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [el, n])
  return <span ref={setEl}>{shown}</span>
}
