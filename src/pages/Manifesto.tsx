import { useEffect } from 'react'
import { REPO, SPEC } from '../content'

/* ─── /manifesto · the drum of liberation ───────────────────────────────────
   Hash-routed (#/manifesto) · no 3D, but cinematic: a CSS cosmic backdrop, the
   DRUM as concentric cyan ripples radiating from a beating core (every workflow
   run is a beat), gradient hero + statement type, glowing cognitive-stack tokens,
   skeuo promise cards. The sovereignty manifesto, written the day a single
   government letter switched off the most capable model on Earth for most of the
   planet. Structural + a light drum · universalist · for everyone.
   Copy discipline: no em-dash, no vendor named, no fact-checkable number.
   Effects (mf-*) live in index.css · reveal reuses the site's .rv (local observer). */

const STACK = ['models', 'memory', 'context', 'workflows', 'agents', 'tools']

const PROMISES = [
  {
    n: '01',
    t: 'Cognitive liberty',
    d: 'Bring any model. Local, open-weight, or frontier. Swappable at will. No lab is the load-bearing wall, so if one disappears tomorrow, your work does not.',
  },
  {
    n: '02',
    t: 'Sovereign memory',
    d: 'Your context, your taste, your habits live on your hardware. Readable, exportable, deletable, without asking anyone. Never hosted, never for rent.',
  },
  {
    n: '03',
    t: 'Work that survives',
    d: 'Useful work becomes source. Plain text, versioned, replayable. Still yours in ten years, on a machine that never phones home.',
  },
  {
    n: '04',
    t: 'Craft over capture',
    d: 'Quality over volume. Less, but better. The license makes the freedom structural, not a favour we could quietly take back.',
  },
  {
    n: '05',
    t: 'A galaxy, not a monolith',
    d: 'No single point that anyone can switch off. Composable, plural, sovereign by design.',
  },
]

export default function Manifesto() {
  /* reveal-on-scroll (reuses the site .rv/.in) + the cursor lamp + card spotlight */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add('in')
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll<HTMLElement>('.rv').forEach((el) => io.observe(el))

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const glow = document.getElementById('cursor-glow')
    let raf = 0
    let gx = window.innerWidth / 2
    let gy = window.innerHeight / 2
    let tx = gx
    let ty = gy
    let lastCard: HTMLElement | null = null

    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      const card = (e.target as HTMLElement).closest?.('.skeuo, .glass') as HTMLElement | null
      if (lastCard && lastCard !== card) lastCard.style.removeProperty('--spot-o')
      if (card) {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
        card.style.setProperty('--spot-o', '1')
      }
      lastCard = card
    }
    const tick = () => {
      gx += (tx - gx) * 0.16
      gy += (ty - gy) * 0.16
      if (glow) glow.style.transform = `translate(${gx - 190}px, ${gy - 190}px)`
      raf = requestAnimationFrame(tick)
    }
    if (!reduced && !coarse) {
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(tick)
    }
    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="mf-cosmos" aria-hidden />
      <div className="mf-stars" aria-hidden />
      <div id="cursor-glow" aria-hidden />

      {/* mini nav */}
      <nav className="glass fixed top-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 text-[13px]">
        <a href="#" className="flex items-center gap-2 px-3 py-1.5 font-semibold tracking-tight">
          <img src="/nika.svg" alt="" width={17} height={17} />
          nika
        </a>
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--hair)' }} />
        <span className="px-3 py-1.5 text-[var(--fg)]">Manifesto</span>
        <a
          href="#"
          className="rounded-full px-3 py-1.5 whitespace-nowrap text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
        >
          ← Back to site
        </a>
      </nav>

      <main className="relative z-20">
        {/* ─── HERO · the drum beats behind the title ─── */}
        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
          <div className="mf-drum" aria-hidden>
            <span className="mf-ring" />
            <span className="mf-ring" />
            <span className="mf-ring" />
            <span className="mf-ring" />
            <span className="mf-core" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <p className="mono mb-7 text-[12px] tracking-[0.34em] text-[var(--cyan)] uppercase">
              § The manifesto · 2026
            </p>
            <h1 className="mf-title mf-grad mb-6">
              The drum
              <br />
              of liberation.
            </h1>
            <p className="mb-3 max-w-[34rem] text-[19px] leading-relaxed text-[var(--fg-mute)]">
              Intelligence you can&apos;t be locked out of.
            </p>
            <p className="mono text-[12px] tracking-[0.04em] text-[var(--fg-dim)]">
              Written the day intelligence got a kill switch.
            </p>
          </div>

          <span className="mf-cue absolute bottom-9 text-[var(--fg-dim)]" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </section>

        {/* ─── the movements · scroll-revealed prose + big statements ─── */}
        <div className="mx-auto max-w-3xl px-6 pt-10 pb-8">
          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            On a Friday afternoon, by a single letter, the most capable intelligence on Earth was
            switched off for most of the people on Earth.{' '}
            <span className="text-[var(--fg)]">Not deleted. Not broken. Revoked.</span> One
            government decided who was allowed to think with it, and overnight, the rest of us were
            locked out of a tool we had been building our lives on.
          </p>

          <p className="rv mf-statement mf-grad my-16 text-center">This is the moment the argument ended.</p>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            The real problem was never <em>which</em> lab is ahead. It is{' '}
            <span className="text-[var(--fg)]">who controls access to intelligence</span>:
          </p>

          <div className="rv my-8 flex flex-wrap justify-center gap-2.5">
            {STACK.map((s) => (
              <span key={s} className="mf-token">
                {s}
              </span>
            ))}
          </div>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            Your entire cognitive stack. If all of it lives behind closed providers, it is not
            yours. It is <span className="text-[var(--fg)]">rented</span>. And what is rented can be
            priced out, locked down, or turned off, by a board, a court, a border, a letter.
          </p>

          <p className="rv mf-statement mf-grad my-16 text-center">
            We refuse the subscription economy for cognition.
          </p>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            <span className="text-[var(--fg)]">
              There is no US open source AI. There is no French open source AI.
            </span>{' '}
            Open source is open knowledge, shared infrastructure, and the right to run, study,
            modify, and own intelligence. Don&apos;t fight the cage by repainting it. Leave it.
          </p>

          <p className="rv mf-statement mf-grad my-16 text-center">Sovereignty for everyone, or for no one.</p>
        </div>

        {/* ─── the 5 promises · skeuo cards ─── */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <p className="rv mono mb-3 text-center text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
            § What we promise
          </p>
          <h2
            className="rv mb-12 text-center font-semibold tracking-tight"
            style={{ fontSize: 'clamp(1.7rem, 1rem + 2.4vw, 2.8rem)', lineHeight: 1.06 }}
          >
            Built for the day the robinet closes.
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p, i) => (
              <div
                key={p.n}
                className="rv mf-promise skeuo rounded-2xl px-7 py-7"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <p className="mf-pn mb-4">{p.n}</p>
                <h3 className="mb-2.5 text-[18px] font-semibold text-[var(--fg)]">{p.t}</h3>
                <p className="text-[14.5px] leading-relaxed text-[var(--fg-mute)]">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── the drum · the lore beat ─── */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            Nika is named for the sun god of liberation: the drum that turns fear into laughter and
            frees the ones who were locked out.
          </p>
          <p className="rv mt-5 text-[19px] font-medium text-[var(--fg)]">
            Every workflow run is a beat of that drum.
          </p>
        </section>

        {/* ─── the close ─── */}
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-6 pb-24 text-center">
          <p className="rv mf-statement mf-grad mb-12">
            Open source AI must win.
            <br />
            Not for a nation. For everyone.
          </p>
          <img
            src="/nika.svg"
            alt="Nika"
            width={48}
            height={48}
            className="rv mf-close-mark"
          />
          <p className="rv mono mt-6 text-[13px] tracking-[0.04em] text-[var(--cyan)]">
            The drum of liberation is getting louder.
          </p>
          <div className="rv mono mt-10 flex flex-wrap items-center justify-center gap-6 text-[12.5px]">
            <a
              href={SPEC}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--cyan)] transition-colors hover:text-[var(--fg)]"
            >
              Read the spec →
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              Star on GitHub →
            </a>
            <a href="#" className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]">
              ← Back to site
            </a>
          </div>
        </section>

        <footer
          className="mono mx-auto flex max-w-5xl items-center justify-between border-t px-6 py-7 text-[12px] text-[var(--fg-ghost)]"
          style={{ borderColor: 'var(--hair)' }}
        >
          <span className="flex items-center gap-2">
            <img src="/nika.svg" alt="" width={13} height={13} style={{ opacity: 0.7 }} />
            nika · free software · AGPL-3.0-or-later
          </span>
          <a href="#" className="transition-colors hover:text-[var(--fg-mute)]">
            ← supernovae
          </a>
        </footer>
      </main>
    </>
  )
}
