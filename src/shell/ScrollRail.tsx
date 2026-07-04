import { useEffect, useRef, useState } from 'react'
import './scroll-rail.css'

/* ─── ScrollRail · the wayfinding instrument (W10b) ───────────────────────────
   A fixed right-edge rail on wide desktop: one tick per anchored section,
   scroll-spy highlights the one under the reading line, the mono readout
   shows its FIG number (the site's HUD grammar — no invented labels), and a
   hairline progress fill tracks the whole page. Clicking a tick jumps via
   the native anchor (html scroll-behavior handles smoothness, motion-safe).

   Auto-discovers `section[id]` inside <main> and reads each section's FIG
   plate (.v4sec-fig) for the readout — zero hand-maintained maps. SSR-safe:
   renders nothing until mounted; ≥1280px only (scroll-rail.css). */

interface RailItem {
  id: string
  fig: string
  name: string
}

export default function ScrollRail() {
  const [items, setItems] = useState<RailItem[]>([])
  const [active, setActive] = useState(0)
  const railRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let io: IntersectionObserver | null = null
    let raf = 0
    let scrollRaf = 0
    const onScroll = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        const doc = document.documentElement
        const max = doc.scrollHeight - window.innerHeight
        const p = max > 0 ? window.scrollY / max : 0
        railRef.current?.style.setProperty('--srail-p', p.toFixed(4))
      })
    }

    /* discovery deferred one frame — the effect body only wires externals */
    raf = requestAnimationFrame(() => {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('main section[id]'),
      ).filter((s) => s.id !== '')
      if (sections.length < 3) return

      setItems(
        sections.map((s, i) => {
          const fig =
            s.querySelector('.v4sec-fig')?.textContent?.trim() ||
            String(i + 1).padStart(2, '0')
          const name =
            (s.getAttribute('aria-labelledby')
              ? document.getElementById(s.getAttribute('aria-labelledby')!)?.textContent
              : '') ?? s.id
          return { id: s.id, fig, name: name.trim() }
        }),
      )

      /* scroll-spy · the section under the reading line (upper third) wins */
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            const idx = sections.indexOf(e.target as HTMLElement)
            if (idx >= 0) setActive(idx)
          }
        },
        { rootMargin: '-30% 0px -55% 0px' },
      )
      for (const s of sections) io.observe(s)

      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
    })

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(scrollRaf)
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (items.length === 0) return null
  const current = items[Math.min(active, items.length - 1)]

  return (
    <nav ref={railRef} className="srail" aria-label="Page sections">
      {/* the readout · the active section's FIG plate (decorative twin of the
          tick's accessible name) */}
      <span className="srail-read" aria-hidden>
        {current?.fig ? `[ ${current.fig} ]` : '[ — ]'}
      </span>
      <ol className="srail-list">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              className="srail-tick"
              href={`#${it.id}`}
              data-on={i === active ? '1' : undefined}
              aria-label={it.name || it.id}
              aria-current={i === active ? 'true' : undefined}
            >
              <span className="srail-tick-line" aria-hidden />
            </a>
          </li>
        ))}
      </ol>
      <span className="srail-progress" aria-hidden />
    </nav>
  )
}
