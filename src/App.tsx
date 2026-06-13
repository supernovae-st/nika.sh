import { useEffect, useRef, useState } from 'react'
import Galaxy3D from './scene/Galaxy'
import { scroll, mouse, egg } from './scene/state'
import Code from './Code'
import { WF, NOTES, VERBS, WEDGE, VERSUS, REPO, SPEC, DOCS } from './content'
import { Nav, InstallPill, Plain } from './components/ui'
import ScrollStory from './sections/ScrollStory'
import MethodDiagram from './sections/MethodDiagram'
import Toolbelt from './sections/Toolbelt'
import { VerbForm } from './scene/verb-forms'
import Transform from './sections/Transform'
import UseCases from './sections/UseCases'
import { lazy, Suspense } from 'react'

const Blog = lazy(() => import('./pages/Blog'))
const Learn = lazy(() => import('./pages/Learn'))
const Play = lazy(() => import('./pages/Play'))
const Manifesto = lazy(() => import('./pages/Manifesto'))
import { VERB_COLOR, type Verb } from './sections/transform-data'

const TICKER_LINES = [
  'Runs on your machine',
  'Any model, cloud or local',
  'Never lose your work',
  'Pure Rust · one binary',
  'Free & open source · AGPL forever',
]

function pageFromHash(): 'main' | 'blog' | 'learn' | 'play' | 'manifesto' {
  if (typeof window === 'undefined') return 'main'
  const h = window.location.hash
  if (h.startsWith('#/manifesto')) return 'manifesto'
  if (h.startsWith('#/learn')) return 'learn'
  if (h.startsWith('#/play')) return 'play'
  if (h.startsWith('#/')) return 'blog'
  return 'main'
}

export default function App() {
  const heroRef = useRef<HTMLDivElement>(null)
  const tickerRef = useRef<HTMLSpanElement>(null)
  const [page, setPage] = useState(() => pageFromHash())

  /* hash-router-lite · #/blog · #/learn = pages · plain #anchors = native scroll */
  useEffect(() => {
    const onHash = () => {
      setPage((prev) => {
        const next = pageFromHash()
        if (prev !== next) window.scrollTo(0, 0)
        return next
      })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /* benefits ticker · glitch-swap a SECONDARY line (the title never changes) */
  useEffect(() => {
    if (page !== 'main') return
    const el = tickerRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % TICKER_LINES.length
      el.classList.add('tick-glitch')
      setTimeout(() => {
        el.textContent = TICKER_LINES[i]
      }, 140)
      setTimeout(() => el.classList.remove('tick-glitch'), 340)
    }, 3800)
    return () => clearInterval(id)
  }, [page])

  /* dev: ?it=N freezes the whole intro film at t=N (handled in director.tsx —
     ONE clock drives the canvas phases AND the DOM title cards) */

  /* easter eggs · console lore + type « nika » → the butterfly re-forms */
  useEffect(() => {
    console.log(
      '%c\n   ⊱ ✦ ⊰\n  nika 🦋\n\n' +
        'you found the source.\n' +
        'the butterfly answers its name. try typing it.\n' +
        'https://github.com/supernovae-st/nika\n',
      'color:#7fe9ff;font-family:monospace;font-size:12px',
    )
    let buf = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-4)
      if (buf === 'nika') {
        egg.bflyUntil = Date.now() + 4500
        console.log('%c🦋 she heard you.', 'color:#7fe9ff;font-family:monospace')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* smooth scroll + granular parallax + global mouse — one rAF, zero re-renders */
  useEffect(() => {
    if (page !== 'main') return
    let raf = 0
    let sY = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pxEls = reduced ? [] : Array.from(document.querySelectorAll<HTMLElement>('[data-px]'))

    const apply = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scroll.progress = max > 0 ? Math.min(1, Math.max(0, sY / max)) : 0
      scroll.y = sY
      scroll.vh = window.innerHeight
      const ht = Math.min(1, sY / (window.innerHeight * 0.85))
      const el = heroRef.current
      if (el) {
        el.style.opacity = String(Math.max(0, 1 - ht * 1.05))
        el.style.filter = `blur(${ht * 5}px)`
      }
      // granular per-element parallax (depth, not one flat block)
      for (const p of pxEls) {
        const f = Number(p.dataset.px)
        const my = mouse.y * f * -9
        const mx = mouse.x * f * -13
        p.style.transform = `translate(${mx}px, ${sY * f + my}px)`
      }
    }

    let last = performance.now()
    const tick = (now: number) => {
      // dt-based damp — frame-rate independent (same feel at 2fps and 120Hz)
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      sY = reduced ? window.scrollY : sY + (window.scrollY - sY) * (1 - Math.exp(-8.5 * dt))
      if (glow) {
        const k = 1 - Math.exp(-7 * dt)
        gx += (mxPx - gx) * k
        gy += (myPx - gy) * k
        glow.style.transform = `translate(${gx - 190}px, ${gy - 190}px)`
      }
      apply()
      raf = requestAnimationFrame(tick)
    }
    // spotlight: the hovered glass card gets a light that FOLLOWS the cursor
    let lastCard: HTMLElement | null = null
    // magnetic CTAs: hero buttons lean toward a nearby cursor
    const magnets = Array.from(document.querySelectorAll<HTMLElement>('[data-magnet]'))
    const glow = document.getElementById('cursor-glow')
    let gx = window.innerWidth / 2
    let gy = window.innerHeight / 2
    let mxPx = gx
    let myPx = gy
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2
      mxPx = e.clientX
      myPx = e.clientY
      const card = (e.target as HTMLElement).closest?.('.skeuo, .glass') as HTMLElement | null
      if (lastCard && lastCard !== card) lastCard.style.removeProperty('--spot-o')
      if (card) {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
        card.style.setProperty('--spot-o', '1')
      }
      lastCard = card
      for (const m of magnets) {
        const r = m.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const d = Math.hypot(dx, dy)
        const reach = 130
        if (d < reach) {
          const k = (1 - d / reach) * 0.22
          m.style.transform = `translate(${dx * k}px, ${dy * k}px)`
        } else if (m.style.transform) {
          m.style.transform = ''
        }
      }
    }

    apply()
    raf = requestAnimationFrame(tick)
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [page])

  /* entrance choreography — sections rise + fade as they cross into view.
     Re-runs whenever we come back to the main page: the first mount may have
     happened on #/blog or #/learn where none of these nodes existed (the
     blurred-forever light-zone bug · operator-caught 2026-06-10 morning). */
  useEffect(() => {
    if (page !== 'main') return
    const els = document.querySelectorAll<HTMLElement>('.rv')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add('in')
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [page])

  if (page === 'blog')
    return (
      <Suspense fallback={null}>
        <Blog />
      </Suspense>
    )
  if (page === 'learn')
    return (
      <Suspense fallback={null}>
        <Learn />
      </Suspense>
    )
  if (page === 'play')
    return (
      <Suspense fallback={null}>
        <Play />
      </Suspense>
    )
  if (page === 'manifesto')
    return (
      <Suspense fallback={null}>
        <Manifesto />
      </Suspense>
    )

  return (
    <>
      <Galaxy3D />

      {/* ─── cinematic opening · black → the ELECTRIC BUTTERFLY (in the canvas,
           made of the galaxy's own particles) → SUPERNOVAE presents / NIKA →
           supernova burst → the butterfly scatters into the galaxy → reveal.
           Timing locked to the scene clock (4.6s) — see director.tsx. ─── */}
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

      {/* light readability vignette (canvas already vignettes) */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            'radial-gradient(130% 90% at 50% 42%, transparent 42%, rgba(5,6,14,0.4) 78%, rgba(5,6,14,0.82) 100%)',
        }}
      />
      {/* cursor light · a soft cyan lamp that trails the pointer (fine pointers only) */}
      <div id="cursor-glow" aria-hidden />
      {/* curved-tube screen feel · whole site (very light · comfort first) */}
      <div className="crt-curve" />
      <Nav />

      <main className="relative z-20">
        {/* ─── hero · the title itself lives inside the galaxy scene ─── */}
        <section className="hero-in relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div
            ref={heroRef}
            className="hero-scrim relative flex flex-col items-center"
            style={{ willChange: 'transform, opacity, filter' }}
          >
            <p
              data-px="-0.05"
              className="mono mb-7 flex items-center justify-center gap-3 text-[12px] tracking-[0.32em] text-[var(--fg-mute)] uppercase"
            >
              <img
                src="/nika.svg"
                alt=""
                width={19}
                height={19}
                className="cursor-pointer transition-transform hover:scale-125"
                style={{ filter: 'drop-shadow(0 0 9px rgba(98,210,255,0.65))' }}
                onClick={() => {
                  egg.bflyUntil = Date.now() + 4500
                }}
              />
              <span className="font-semibold text-[var(--fg-mute)]">Nika</span>
              <span className="text-[var(--fg-ghost)]">·</span>
              <span style={{ color: "var(--fg-dim)" }}>Open language for AI workflows</span>
            </p>

            {/* invisible spacer — reserves the headline's space (+ accessible);
                the visible title is real 3D text living in the galaxy scene */}
            <h1 className="h-hero mb-5" style={{ opacity: 0, pointerEvents: 'none' }}>
              Intent
              <br />
              as Code.
            </h1>

            {/* ONE short line — the full pitch is WRITTEN INTO the dive below
                (ScrollStory · word-by-word on scroll) */}
            <p
              data-px="0.06"
              className="hero-sub mt-14 max-w-[46rem] text-[20px] leading-relaxed text-pretty"
            >
              Write what you want in <span className="font-semibold text-[var(--fg)]">one file</span>.
              Nika does the rest.
            </p>

            <div
              id="install"
              data-px="0.12"
              className="mt-11 flex flex-wrap items-center justify-center gap-4"
            >
              <span data-magnet className="magnet-wrap">
                <InstallPill />
              </span>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                data-magnet
                className="skeuo magnet-wrap group flex items-center gap-2.5 rounded-full px-5 py-3 text-[14.5px] font-medium text-[var(--fg)]"
              >
                <span className="star-spark text-[15px]" aria-hidden>
                  ★
                </span>
                Star on GitHub
              </a>
              <a
                href={SPEC}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 text-[15px] text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
              >
                Read the spec
                <span className="transition-transform group-hover:translate-x-0.5">↗</span>
              </a>
            </div>
          </div>

          {/* ONE quiet strip at the hero's bottom edge — the rotating benefit,
              framed by thin rules (the old 3-line stack is gone) */}
          <p
            className="hero-strip mono absolute inset-x-0 bottom-9 flex items-center justify-center gap-5 px-8 text-[12px] tracking-[0.26em] uppercase"
            aria-hidden
          >
            <span className="strip-rule" />
            <span ref={tickerRef} className="whitespace-nowrap text-[var(--cyan)]">
              Runs on your machine
            </span>
            <span className="strip-rule" />
          </p>
        </section>

        {/* ─── stargate spacer · the camera dives the curve and flies THROUGH
             real extruded 3D letters (WireWords · in the canvas) — the only
             DOM here is the quiet kicker line ─── */}
        <section className="pointer-events-none relative h-[380vh]">
          <p className="sr-only">
            Beyond the chat. You write what you want. Nika fetches, thinks, runs, saves.
            Same file, same outcome, forever.
          </p>
          <ScrollStory />
        </section>

        {/* ─── the content acts · galaxy keeps breathing behind the veil ───
             the veil arrives over ~45vh — you drift INTO the reading light,
             never hit a wall (the hard seam was operator-flagged 2026-06-10) */}
        <div className="relative" style={{ background: 'rgba(4,8,24,0.85)' }}>
          <div
            className="pointer-events-none absolute inset-x-0 -top-[45vh] h-[45vh]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(4,8,24,0) 0%, rgba(4,8,24,0.3) 45%, rgba(4,8,24,0.62) 75%, rgba(4,8,24,0.85) 100%)',
            }}
          />

          {/* ─── §1 · the language made tangible ─── */}
          <section id="language" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:py-36">
            <p className="rv mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
              § The language
            </p>
            <h2
              className="rv mb-3 font-semibold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 1rem + 3.5vw, 3.6rem)', lineHeight: 1.02 }}
            >
              One file. The whole workflow.
            </h2>
            <p className="rv max-w-[40rem] text-[17px] leading-relaxed text-[var(--fg-mute)]">
              Not a config that hides the logic. The logic itself, in YAML a human reads and a
              machine runs. Same file, same truth.
            </p>

            {/* how it works · the whole loop in three beats */}
            <div className="rv hiw mt-9 mb-2" aria-label="How it works">
              <div className="hiw-step">
                <span className="hiw-n mono">01</span>
                <div>
                  <p className="hiw-t">Write the file</p>
                  <p className="hiw-d">plain YAML · say what you want</p>
                </div>
              </div>
              <span className="hiw-arrow" />
              <div className="hiw-step">
                <span className="hiw-n mono">02</span>
                <div>
                  <p className="hiw-t mono">nika run</p>
                  <p className="hiw-d">the engine does every step</p>
                </div>
              </div>
              <span className="hiw-arrow" />
              <div className="hiw-step">
                <span className="hiw-n mono">03</span>
                <div>
                  <p className="hiw-t">Keep the result</p>
                  <p className="hiw-d">and the file · run it forever</p>
                </div>
              </div>
            </div>
            <div className="mb-14">
              <Plain>
                You describe what you want in a simple text file. The machine does it the same
                way, every time, on any computer.
              </Plain>
            </div>

            <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
              {/* the code card */}
              <div className="rv skeuo overflow-hidden rounded-2xl">
                <div
                  className="flex items-center gap-2 border-b px-4 py-3"
                  style={{ borderColor: 'var(--hair)' }}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
                  <span className="mono ml-3 text-[12px] text-[var(--fg-dim)]">
                    research-pipeline.nika.yaml
                  </span>
                </div>
                <div className="px-5 py-5">
                  <Code code={WF} />
                </div>
              </div>

              {/* the annotations */}
              <div className="flex flex-col gap-3">
                {NOTES.map((n, i) => (
                  <div
                    key={n.token}
                    className="rv glass rounded-xl px-5 py-4"
                    style={{ transitionDelay: `${i * 90}ms` }}
                  >
                    <code className="mono text-[13px] break-words text-[var(--cyan)]">
                      {n.token}
                    </code>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--fg-mute)]">
                      {n.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── §transform · the showpiece · file → DAG → run, in one scroll ─── */}
          <Transform />

          {/* ─── §2 · the four verbs · the whole operation space ─── */}
          <section id="verbs" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:py-36">
            <p className="rv mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
              § The verbs
            </p>
            <h2
              className="rv mb-3 font-semibold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 1rem + 3.5vw, 3.6rem)', lineHeight: 1.02 }}
            >
              Four verbs. Locked forever.
            </h2>
            <p className="rv max-w-[40rem] text-[17px] leading-relaxed text-[var(--fg-mute)]">
              A verb is a distinct execution model. Everything callable is a tool; everything
              about ordering is the DAG. No fifth verb, ever.
            </p>
            <div className="mb-14">
              <Plain>
                Four words cover everything an AI helper can do: think, run a program, use a tool,
                or work on its own. That&apos;s the whole language.
              </Plain>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {VERBS.map((v, i) => (
                <div
                  key={v.verb}
                  className="rv skeuo group rounded-2xl px-6 py-6 transition-transform duration-300 hover:-translate-y-1"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="mb-1 flex items-baseline gap-3">
                    <span
                      className="mono text-[20px] font-semibold"
                      style={{ color: VERB_COLOR[v.verb as Verb] }}
                    >
                      {v.verb}
                    </span>
                    <span className="text-[13.5px] text-[var(--fg-dim)]">{v.tagline}</span>
                    <span
                      className="ml-auto inline-block h-2 w-2 rounded-full"
                      style={{ background: VERB_COLOR[v.verb as Verb] }}
                    />
                  </div>
                  <VerbForm kind={v.verb as Verb} />
                  <p className="mb-5 text-[14.5px] leading-relaxed text-[var(--fg-mute)]">
                    {v.body}
                  </p>
                  <div className="code-well px-4 py-3.5">
                    <Code code={v.code} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── §toolbelt · builtins + providers (derived from canon.generated.ts) ─── */}
          <Toolbelt />

          {/* ─── §use-cases · tabbed explorer (persona tabs + real files) ─── */}
          <UseCases />

          {/* ─── §3 · the method · the white room (2001: after the stargate, the
               readable light) — the cosmos fades to paper, the source reads like print ─── */}
          <div className="light-fade-in pointer-events-none" />
          <div className="light-zone">
            <section id="method" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:py-40">
            <p className="rv mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
              {WEDGE.eyebrow}
            </p>
            <h2
              className="rv mb-3 max-w-[46rem] font-semibold tracking-tight"
              style={{ fontSize: 'clamp(2rem, 1rem + 3.5vw, 3.6rem)', lineHeight: 1.04 }}
            >
              {WEDGE.title}
            </h2>
            <p className="rv max-w-[42rem] text-[17px] leading-relaxed text-[var(--fg-mute)]">
              {WEDGE.body}
            </p>
            <div className="mb-10">
              <Plain>
                Chat to figure things out, then keep the result as a file. The chat disappears;
                the file works again tomorrow.
              </Plain>
            </div>

            {/* the pipeline · intent → four verbs → result (animated · paper-legible) */}
            <MethodDiagram />

            <div className="relative grid items-stretch gap-6 md:grid-cols-2">
              {/* the duel badge */}
              <span className="vs-badge mono" aria-hidden>
                VS
              </span>

              {/* the chat tier · a real chat window, dissolving */}
              <div className="rv vs-chat flex flex-col rounded-2xl" style={{ opacity: 0.96 }}>
                <div className="term-bar">
                  <span className="t-dot r" />
                  <span className="t-dot y" />
                  <span className="t-dot g" />
                  <span className="term-name mono">chat · session #847</span>
                </div>
                <div className="flex flex-1 flex-col gap-3.5 px-6 py-6">
                  <p className="mono mb-1 text-[10.5px] tracking-[0.22em] text-[var(--fg-dim)] uppercase">
                    {WEDGE.chat.label}
                  </p>
                  {WEDGE.chat.lines.map((l, i) => (
                    <div key={l} className="flex items-end gap-2.5">
                      <span className="chat-ava mono">U</span>
                      <p
                        className="chat-bubble chat-line text-[14.5px] leading-relaxed"
                        style={{
                          opacity: 1 - i * 0.22,
                          filter: `blur(${i * 0.4}px)`,
                          animationDelay: `${i * 1.1}s`,
                        }}
                      >
                        {l}
                      </p>
                    </div>
                  ))}
                  <p className="mt-auto pt-5 text-[13.5px] text-[var(--fg-ghost)]">
                    <span className="tab-closed mono">× tab closed</span> {WEDGE.chat.verdict}
                  </p>
                </div>
              </div>

              {/* the source tier · a real terminal, durable */}
              <div className="rv vs-src flex flex-col rounded-2xl">
                <div className="term-bar">
                  <span className="t-dot r" />
                  <span className="t-dot y" />
                  <span className="t-dot g" />
                  <span className="term-name mono">research-pipeline.nika.yaml</span>
                </div>
                <div className="flex flex-1 flex-col px-6 py-6">
                  <p className="mono mb-4 text-[10.5px] tracking-[0.22em] text-[var(--cyan)] uppercase">
                    {WEDGE.source.label}
                  </p>
                  <div className="code-well flex-1 px-5 py-4">
                    <pre className="code">{WEDGE.source.code}</pre>
                  </div>
                  <p className="mt-6 flex flex-wrap items-center gap-3 text-[14px] font-medium text-[var(--cyan)]">
                    {WEDGE.source.verdict}
                    <span className="replay-badge mono">
                      <span className="spin-slow">⟳</span> replays forever
                    </span>
                  </p>
                </div>
              </div>
            </div>
            </section>

            {/* ─── §versus · why a file beats the alternatives (printed-page clarity) ─── */}
            <section id="versus" className="mx-auto max-w-6xl scroll-mt-24 px-6 pt-6 pb-32 md:pb-44">
              <h2
                className="rv mb-3 font-semibold tracking-tight"
                style={{ fontSize: 'clamp(1.7rem, 0.9rem + 2.6vw, 2.9rem)', lineHeight: 1.04 }}
              >
                Same goal. Different fate.
              </h2>
              <p className="rv mb-12 max-w-[42rem] text-[16px] leading-relaxed text-[var(--fg-mute)]">
                Three honest comparisons: what you trade away with each alternative, and what a
                file keeps.
              </p>
              <div className="grid gap-5 md:grid-cols-3">
                {VERSUS.map((v) => (
                  <div
                    key={v.them}
                    data-fate={v.fate}
                    className="rv vs-card glass relative flex flex-col rounded-2xl px-6 py-6"
                  >
                    <span className="fate-stamp mono" aria-hidden>
                      {v.fate}
                    </span>
                    <p className="mono mb-3 text-[11px] tracking-[0.2em] text-[var(--fg-dim)] uppercase">
                      {v.them}
                    </p>
                    <ul className="vs-them mb-5 space-y-1.5 text-[13.5px] leading-relaxed text-[var(--fg-mute)]">
                      {v.themLines.map((l) => (
                        <li key={l} className="flex gap-2">
                          <span className="text-[var(--fg-ghost)]">–</span>
                          {l}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto border-t pt-4" style={{ borderColor: 'var(--hair)' }}>
                      <p className="mono mb-2 flex items-center gap-2 text-[11px] tracking-[0.2em] text-[var(--cyan)] uppercase">
                        <img src="/nika.svg" alt="" width={12} height={12} style={{ opacity: 0.8 }} />
                        {v.nika}
                      </p>
                      <ul className="vs-nika space-y-1.5 text-[13.5px] leading-relaxed text-[var(--fg)]">
                        {v.nikaLines.map((l) => (
                          <li key={l} className="flex gap-2">
                            <span className="text-[var(--cyan)]">✓</span>
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          {/* back into the cosmos for the close */}
          <div className="light-fade-out pointer-events-none" />

          {/* ─── final CTA · own your workflows ─── */}
          <section
            id="get-started"
            className="mx-auto flex max-w-4xl scroll-mt-24 flex-col items-center px-6 pt-32 pb-24 text-center md:pt-44"
          >
            <div className="rv">
              <img
                src="/nika.svg"
                alt="Nika"
                width={56}
                height={56}
                style={{ filter: 'drop-shadow(0 0 20px rgba(98,210,255,0.7))' }}
              />
            </div>
            <h2
              className="rv mt-8 mb-5 font-semibold tracking-tight"
              style={{ fontSize: 'clamp(2.2rem, 1rem + 4.5vw, 4.4rem)', lineHeight: 1 }}
            >
              Own your workflows<span style={{ color: 'var(--cyan)' }}>.</span>
            </h2>
            <p className="rv mb-10 max-w-[34rem] text-[16.5px] leading-relaxed text-[var(--fg-mute)]">
              One Rust binary. Your machine, your models, your files. The spec is open and the
              license is AGPL, forever.
            </p>
            <div className="rv flex flex-wrap items-center justify-center gap-4">
              <InstallPill />
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="skeuo flex items-center gap-2.5 rounded-full px-5 py-3 text-[15px] font-medium text-[var(--fg)] transition-transform hover:-translate-y-0.5"
              >
                <span className="star-spark" aria-hidden>
                  ★
                </span>
                Star on GitHub
              </a>
              <a
                href="#/learn"
                className="text-[15px] text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
              >
                Learn it in 5 minutes →
              </a>
            </div>

            {/* ─── SUPERNOVAE · the type play — born from a supernova, signed by one.
                 Per-letter float wave + hover lift · gradient dissolving into the void ─── */}
            <a
              href="https://supernovae.studio"
              target="_blank"
              rel="noreferrer"
              className="supernovae-type mt-32 block w-full transition-opacity hover:opacity-90"
              aria-label="SuperNovae Studio"
            >
              {'SUPERNOVAE'.split('').map((ch, i) => (
                <span key={i} style={{ '--i': i } as React.CSSProperties}>
                  {ch}
                </span>
              ))}
            </a>
            <p className="mono -mt-2 text-[11px] tracking-[0.42em] text-[var(--fg-ghost)] uppercase">
              a SuperNovae Studio creation
            </p>
            <p className="mono mt-5 flex items-center justify-center gap-6 text-[12px] text-[var(--fg-dim)]">
              <a
                href="https://x.com/ThibautMelen"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[var(--cyan)]"
              >
                𝕏 @ThibautMelen
              </a>
              <span className="text-[var(--fg-ghost)]">·</span>
              <a
                href="https://x.com/niccela"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[var(--cyan)]"
              >
                𝕏 @niccela
              </a>
            </p>

            <footer
              className="mono mt-20 flex w-full flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12px] text-[var(--fg-ghost)]"
              style={{ borderColor: 'var(--hair)' }}
            >
              <span className="flex items-center gap-2">
                <img src="/nika.svg" alt="" width={13} height={13} style={{ opacity: 0.7 }} />
                nika · free software · AGPL-3.0-or-later
              </span>
              <span className="flex gap-5">
                <a
                  href={REPO}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[var(--fg-mute)]"
                >
                  GitHub
                </a>
                <a
                  href={SPEC}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[var(--fg-mute)]"
                >
                  Spec
                </a>
                <a
                  href={DOCS}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-[var(--fg-mute)]"
                >
                  Docs
                </a>
              </span>
            </footer>
          </section>
        </div>
      </main>
    </>
  )
}
