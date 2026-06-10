import { useEffect, useRef } from 'react'

/* ─── the scroll story · the pitch written INTO the dive ────────────────────
   Instead of a paragraph parked under the title, the three ideas arrive as
   word-by-word reveals while the camera dives the stargate — each with a
   tiny visual proof line. Awwwards grammar: the scroll IS the sentence. */

interface Beat {
  /** viewport-screens where the beat lives (scroll.y / vh) */
  from: number
  to: number
  words: { w: string; c?: string }[]
  proof: string
}

const BEATS: Beat[] = [
  {
    from: 1.8,
    to: 2.4,
    words: [{ w: 'You' }, { w: 'write' }, { w: 'what' }, { w: 'you' }, { w: 'want', c: '#7fe9ff' }, { w: '.' }],
    proof: 'topic: "Rust async runtimes"',
  },
  {
    from: 2.5,
    to: 3.1,
    words: [
      { w: 'Nika' },
      { w: 'fetches', c: '#22d3ee' },
      { w: '·' },
      { w: 'thinks', c: '#5b8cff' },
      { w: '·' },
      { w: 'runs', c: '#ff7a3c' },
      { w: '·' },
      { w: 'saves', c: '#b07bff' },
      { w: '.' },
    ],
    proof: '✓ 5 tasks · 2 branches in parallel · 41s',
  },
  {
    from: 3.2,
    to: 3.8,
    words: [
      { w: 'Same' },
      { w: 'file.' },
      { w: 'Same' },
      { w: 'outcome.' },
      { w: 'Forever', c: '#7fe9ff' },
      { w: '.' },
    ],
    proof: '$ git diff weekly-radar.nika.yaml',
  },
]

export default function ScrollStory() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el) return
    const beats = Array.from(el.querySelectorAll<HTMLElement>('[data-beat]'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const tick = () => {
      const vh = window.innerHeight
      const yv = window.scrollY / vh
      beats.forEach((b, bi) => {
        const { from, to } = BEATS[bi]
        const p = Math.min(1, Math.max(0, (yv - from) / (to - from)))
        const visible = p > 0 && p < 1
        b.style.opacity = visible ? '1' : '0'
        // visibility hard-off: Chromium applies backdrop-filter even under an
        // opacity-0 ancestor — the hidden glass was blurring whole sections
        b.style.visibility = visible ? 'visible' : 'hidden'
        if (!visible && !reduced) return
        // the frozen-glass zone breathes with the beat (in fast · out gently)
        const glass = b.querySelector<HTMLElement>('.sw-glass')
        if (glass) {
          const gin = Math.min(1, p / 0.1)
          const gout = 1 - Math.min(1, Math.max(0, (p - 0.84) / 0.16))
          glass.style.opacity = String(gin * gout)
        }
        const words = Array.from(b.querySelectorAll<HTMLElement>('.sw'))
        const n = words.length
        words.forEach((w, i) => {
          // each word owns a slice of the beat · fully readable by p=0.62
          const wp = Math.min(1, Math.max(0, (p - (i / n) * 0.55) / 0.2))
          const out = Math.min(1, Math.max(0, (p - 0.86) / 0.14)) // gentle exit
          w.style.opacity = String(wp * (1 - out))
          w.style.transform = reduced
            ? 'none'
            : `translateY(${(1 - wp) * 34}px) rotate(${(1 - wp) * (i % 2 ? 2.5 : -2.5)}deg)`
          w.style.filter = `blur(${(1 - wp) * 7}px)`
          // the ACTION flash — a colored glow pulses as the word lands
          const wc = BEATS[bi].words[i]?.c
          const pulse = wp * (1 - wp) * 4 // peaks mid-landing · settles to 0
          w.style.textShadow =
            pulse > 0.04 && wc
              ? `0 3px 26px rgba(2,4,14,0.9), 0 0 ${Math.round(34 * pulse)}px ${wc}`
              : '0 3px 26px rgba(2,4,14,0.9), 0 0 56px rgba(2,4,14,0.65)'
        })
        const proof = b.querySelector<HTMLElement>('.sw-proof')
        if (proof) {
          const pp = Math.min(1, Math.max(0, (p - 0.55) / 0.18))
          const out = Math.min(1, Math.max(0, (p - 0.88) / 0.12))
          proof.style.opacity = String(pp * (1 - out))
          proof.style.transform = `translateY(${(1 - pp) * 12}px)`
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={root} className="pointer-events-none">
      {BEATS.map((beat, i) => (
        <div
          key={i}
          data-beat
          className="fixed inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          {/* frozen-glass zone · masked backdrop blur — no hard rectangle */}
          <div className="sw-glass" style={{ opacity: 0 }} />
          <p
            className="relative max-w-[60rem] font-semibold tracking-tight"
            style={{
              fontFamily: 'var(--headline)',
              fontSize: 'clamp(2.2rem, 1rem + 4.6vw, 4.8rem)',
              lineHeight: 1.05,
            }}
          >
            {beat.words.map((word, wi) => (
              <span
                key={wi}
                className="sw mx-[0.14em] inline-block"
                style={{ color: word.c ?? 'var(--fg)', opacity: 0, willChange: 'transform, opacity, filter' }}
              >
                {word.w}
              </span>
            ))}
          </p>
          <p
            className="sw-proof mono mt-8 rounded-xl border px-4 py-2 text-[13px] text-[var(--fg)]"
            style={{
              opacity: 0,
              borderColor: 'var(--hair-bright)',
              background: 'rgba(5,10,28,0.78)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {beat.proof}
          </p>
        </div>
      ))}
    </div>
  )
}
