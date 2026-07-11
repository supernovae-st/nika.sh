import { useEffect, useRef } from 'react'

/* ─── useRevealOnce · the shared "rise on first view" reveal, with a safety net ─
   Every v4 section opens with its [data-rise] rows at opacity:0 (under
   prefers-reduced-motion: no-preference) and depends on an IntersectionObserver
   adding `.v4-in` to the section to fade them in. If that observer ever MISFIRES
   — a layout quirk, a never-intersecting root, a tab restored already-scrolled —
   the content would be stuck invisible. That is an accessibility / content
   failure, not a graceful degradation.

   This hook centralises the pattern AND adds a cheap JS safety net: a timer that
   force-adds `.v4-in` after `fallbackMs` no matter what the observer did, so
   content can never be left hidden by a misbehaving observer. Reduced-motion and
   SSR/no-JS keep the content visible by default (the CSS only hides rows under
   no-preference), so this only matters when motion is on.

   THE POSTER LAW (LH-measured, /spec first, then every one-section page): any
   arm that waits on JS — this observer, hydration, the index.html watchdog —
   lands seconds after the prerendered bytes on a throttled connection, so the
   hero lede sat at a ~4.7s LCP with ~100% render delay (≡ FCP + the watchdog's
   1600ms). Pages whose whole content is ONE .v4sec bake `v4-in` into the JSX
   instead: the observer was arming everything at hydration anyway (the section
   intersects at load), so the only trade is the entrance stagger — and a
   poster page paints its poster at first paint. The hook stays attached for
   its ref; adding `.v4-in` to a section that already has it is a no-op.
   Multi-section surfaces (the home plates) keep the on-scroll entrance.

   Returns a ref to attach to the section element. */
export function useRevealOnce<T extends HTMLElement = HTMLElement>(opts?: {
  threshold?: number
  rootMargin?: string
  fallbackMs?: number
}) {
  const ref = useRef<T>(null)
  const { threshold = 0.12, rootMargin = '0px 0px -10% 0px', fallbackMs = 1000 } = opts ?? {}

  useEffect(() => {
    if (typeof window === 'undefined') return
    // reduced-motion: rows are already visible (the CSS reveal is gated to
    // no-preference), so there is nothing to reveal and no net to cast.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return

    const reveal = () => {
      el.classList.add('v4-in')
      io.disconnect()
      clearTimeout(timer)
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal()
            break
          }
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    // SAFETY NET · if the observer never fires, reveal anyway so content is
    // never trapped invisible by a misfiring IntersectionObserver.
    const timer = setTimeout(reveal, fallbackMs)

    return () => {
      io.disconnect()
      clearTimeout(timer)
    }
  }, [threshold, rootMargin, fallbackMs])

  return ref
}
