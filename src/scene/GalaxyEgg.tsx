import { useEffect, useRef } from 'react'
import Galaxy3D from './Galaxy'
import { scroll, mouse, egg, intro } from './state'

/* ─── « enter the galaxy » · the v3 cinematic, now an easter egg ──────────────
   The whole v3 wow — the butterfly→supernova intro film + the Galaxy3D r3f
   canvas — moved verbatim out of the default Home into this overlay. It mounts
   ONLY when the visitor types « nika » (design doc §10), and it is the lazy
   chunk loaded only on that trigger: the default home ships zero WebGL.

   The overlay owns everything the scene needs to run on its own (the default
   v4 home no longer pumps `scroll`/`mouse`, and the film markup is no longer in
   Home's DOM):
     · the `#intro` film overlay markup (read frame-by-frame by `Intro` in
       director.tsx via getElementById — same one clock that drives the canvas)
     · a tiny rAF that feeds the scene's shared `scroll`/`mouse` state so the
       Rig camera + parallax respond while the egg is open
     · Esc / a close button to dismiss → unmount → the WebGL context is freed

   `onClose` returns to the calm v4 site. Reduced-motion: the film is skipped
   (director.tsx already short-circuits the intro under prefers-reduced-motion),
   so the visitor lands straight on the breathing galaxy with a gentle note. */

export default function GalaxyEgg({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* Replay the intro film from this mount: the director reads the GL clock, so
     re-arm the shared intro state and let the canvas's first frame start it. */
  useEffect(() => {
    if (reduced) return
    intro.reveal = 0
    intro.born = 0
    intro.dolly = 0
    intro.bfly = 0
    intro.bflyA = 0
    intro.bloom = 3.0
  }, [reduced])

  /* Esc closes · focus the close button on open (focus management · APG). */
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* Pump the scene's shared scroll/mouse state while the egg is open — the v4
     home no longer does this. One rAF, zero React re-renders (the scene reads
     these module-level objects every frame). Also keep the butterfly summoned
     so typing « nika » again inside the galaxy re-forms her. */
  useEffect(() => {
    if (reduced) return
    let raf = 0
    let sY = window.scrollY
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      sY += (window.scrollY - sY) * (1 - Math.exp(-8.5 * dt))
      const max = document.documentElement.scrollHeight - window.innerHeight
      scroll.progress = max > 0 ? Math.min(1, Math.max(0, sY / max)) : 0
      scroll.y = sY
      scroll.vh = window.innerHeight
      raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'a') egg.bflyUntil = Date.now() + 4500
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [reduced])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enter the galaxy — the Nika cinematic"
      className="fixed inset-0 z-[90]"
    >
      <Galaxy3D />

      {/* ─── the cinematic film overlay · black → the ELECTRIC BUTTERFLY (in the
           canvas, made of the galaxy's own particles) → SUPERNOVAE presents /
           NIKA → supernova burst → the butterfly scatters into the galaxy →
           reveal. Timing locked to the scene clock (4.6s) — director.tsx reads
           this `#intro` subtree by id, every frame. Skipped under reduced
           motion (director short-circuits + we render a gentle note instead). */}
      {reduced ? (
        <p
          className="pointer-events-none fixed inset-x-0 top-[52%] z-[60] px-6 text-center text-[13.5px] tracking-[0.04em]"
          style={{ color: 'var(--fg-dim)' }}
        >
          You found the galaxy. 🦋
        </p>
      ) : (
        <div id="intro" className="pointer-events-none fixed inset-0 z-[60]">
          {/* pure black — lifts to unveil the flickering butterfly */}
          <div className="intro-black absolute inset-0" style={{ background: '#000005' }} />

          {/* card 1 · the studio line — 2001 grammar: thin grotesque · vast
               tracking · small size · pure fade · sits quiet below the wings */}
          <div className="intro-super absolute inset-x-0 top-[76%] flex flex-col items-center gap-5">
            <p
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 420,
                letterSpacing: '0.68em',
                textIndent: '0.68em',
                fontSize: 'clamp(0.95rem, 1.7vw, 1.35rem)',
                color: '#e9eef8',
              }}
            >
              SUPERNOVAE
            </p>
            <p
              className="mono text-[10px] tracking-[0.55em] uppercase"
              style={{ color: 'var(--fg-dim)', textIndent: '0.55em' }}
            >
              presents
            </p>
          </div>

          {/* card 2 · the title — same restraint, one step louder */}
          <div className="intro-nika absolute inset-x-0 top-[75%] flex flex-col items-center gap-6">
            <p
              className="intro-nika-word"
              style={{
                fontFamily: 'var(--display)',
                fontWeight: 460,
                letterSpacing: '0.55em',
                textIndent: '0.55em',
                fontSize: 'clamp(1.7rem, 3.6vw, 2.9rem)',
                lineHeight: 1,
                color: '#f2f5fc',
              }}
            >
              NIKA
            </p>
            <p
              className="px-6 text-center text-[13.5px] tracking-[0.04em]"
              style={{ color: 'var(--fg-dim)' }}
            >
              Intent as Code
            </p>
          </div>

          {/* the supernova burst */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="intro-burst h-[46vmin] w-[46vmin] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, #ffffff 0%, #d8f0ff 26%, rgba(110,190,255,0.55) 52%, transparent 70%)',
              }}
            />
          </div>
        </div>
      )}

      {/* readability vignette (canvas already vignettes) */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            'radial-gradient(130% 90% at 50% 42%, transparent 42%, rgba(5,6,14,0.4) 78%, rgba(5,6,14,0.82) 100%)',
        }}
      />

      {/* ─── exit · a discreet close (Esc also works) ─── */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close the galaxy and return to the site"
        className="egg-close fixed top-5 right-5 z-[70] flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] tracking-[0.06em] text-[var(--fg)]"
      >
        <span aria-hidden>Esc</span>
        <span aria-hidden>·</span>
        <span>close</span>
      </button>
    </div>
  )
}
