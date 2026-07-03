import { Suspense, lazy, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { REPO, SPEC, routeHead } from '../content'
import { usePlan3D } from '../sections/morph/use-plan3d'

/* ─── /manifesto · the drum of liberation (v5 theme · F7) ─────────────────────
   Routed at /manifesto (React Router) · the sovereignty manifesto, written the
   day a single government letter switched off the most capable model on Earth
   for most of the planet. Every WORD kept (operator voice) — the SKIN is now
   the one v5 system: the shared Nav + SiteFooter (RootLayout), the v5 header
   field as backdrop (centered variant of the hero's quantized blue), seam-kit
   promise panels. The v3 cosmic kit (cursor-glow lamp · .glass mini-nav ·
   .skeuo spotlight cards · star backdrop) is GONE with its CSS. The DRUM stays:
   it is the page's own metaphor, beating in the v5 accent.
   Copy discipline: no em-dash, no vendor named, no fact-checkable number.
   Effects (mf-*) live in index.css · reveal reuses the site's .rv (local observer). */

/* wave I · the hero drum as a tholos sphere (desktop ≥1024px + WebGL + motion,
   lazy chunk — three itself is already the shared vendor chunk). It hides the
   CSS drum rings only once actually mounted ([data-drum3d], set by the layer
   itself) — the rings below stay the mobile / reduced-motion / no-WebGL truth. */
const TheDrumSphere = lazy(() => import('../scene/TheDrumSphere'))

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

export function Component() {
  useHead({
    title: 'Manifesto — Nika',
    link: routeHead('/manifesto').link,
    meta: [
      ...routeHead('/manifesto').meta,
      {
        name: 'description',
        content:
          'The drum of liberation. Why your workflows should run on your machine, with any model, and never be switched off by anyone but you.',
      },
      { property: 'og:title', content: 'Manifesto — Nika' },
      {
        property: 'og:description',
        content: 'The drum of liberation — sovereign AI workflows, owned by you.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-manifesto.png' },
      {
        property: 'og:image:alt',
        content:
          'Nika manifesto — the drum of liberation. Any model, your memory, owned by you.',
      },
      { name: 'twitter:title', content: 'Manifesto — Nika' },
      {
        name: 'twitter:description',
        content: 'The drum of liberation — sovereign AI workflows, owned by you.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-manifesto.png' },
    ],
  })

  /* the drum-sphere capability gate · desktop + motion + WebGL + hero-near */
  const heroRef = useRef<HTMLElement>(null)
  const drumRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const sphere = usePlan3D(heroRef)

  /* the field's scroll depth · the 150vh fixed backdrop slides up at ~0.14 of
     the scroll rate (pure rAF + transform, compositor-only, no scroll-jack),
     so the quantized arcs + grid recede as the reader descends. Clamped to
     the field's own overflow so an edge never enters the viewport; skipped
     entirely under prefers-reduced-motion. */
  useEffect(() => {
    const el = fieldRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const apply = () => {
      raf = 0
      const max = Math.max(0, el.offsetHeight - window.innerHeight)
      const y = Math.min(window.scrollY * 0.14, max)
      el.style.transform = `translate3d(0, ${-y}px, 0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  /* reveal-on-scroll (reuses the site .rv/.in) — the v3 cursor lamp + card
     spotlight are gone with their DOM (F7) */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add('in')
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll<HTMLElement>('.rv').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    /* .mf-scope · the v5 skin: re-seats the page accent onto the v5 blue and
       re-centres the shared v5 header field behind the drum (see index.css).
       The site Nav + SiteFooter come from RootLayout. Zero copy changes. */
    <div className="mf-scope">
      {/* the v5 field · the hero's quantized blue, deepened for the manifesto
          (denser 16-step ladder + page grid + 150vh scroll depth · the
          mf-scope overrides in index.css) and slid by the parallax above */}
      <div className="v5-header-field" aria-hidden ref={fieldRef} />

      <main className="relative z-20">
        {/* ─── HERO · the drum beats behind the title ─── */}
        <section
          ref={heroRef}
          className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
        >
          {/* THE THOLOS SPHERE · wave I (desktop) — the drum of liberation as a
              breathing shell of wireframe blocks; the CSS rings just below stay
              the fallback truth. The sphere's own strike core-glow carries the
              heartbeat: once mounted ([data-drum3d]) the CSS .mf-core heart is
              retired entirely so no DOM dot ever lands inside the title. In the
              fallback the heart survives as a soft wide glow (never a hard
              disc), so it can never read as a stray period over the words. */}
          {sphere ? (
            <Suspense fallback={null}>
              <TheDrumSphere drumRef={drumRef} />
            </Suspense>
          ) : null}
          <div className="mf-drum" aria-hidden ref={drumRef}>
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

        {/* ─── the drum · the lore beat (operator pacing: the drum metaphor
            lands FIRST, right after the hero, before the story · the words
            are untouched, only the beat moved up) ─── */}
        <section className="mf-prose mx-auto px-6 pt-20 pb-10 text-center">
          <div className="rv mf-secreg" aria-hidden>
            <span className="mf-secno">01</span>
            <span className="mf-secrule" />
          </div>
          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            Nika is named for the sun god of liberation: the drum that turns fear into laughter and
            frees the ones who were locked out.
          </p>
          <p className="rv mt-5 text-[19px] font-medium text-[var(--fg)]">
            Every workflow run is a beat of that drum.
          </p>
        </section>

        {/* ─── the movements · scroll-revealed prose + big statements ─── */}
        <div className="mf-prose mx-auto px-6 pt-14 pb-16">
          <div className="rv mf-secreg" aria-hidden>
            <span className="mf-secno">02</span>
            <span className="mf-secrule" />
          </div>
          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            On a Friday afternoon, by a single letter, the most capable intelligence on Earth was
            switched off for most of the people on Earth.{' '}
            <span className="text-[var(--fg)]">Not deleted. Not broken. Revoked.</span> One
            government decided who was allowed to think with it, and overnight, the rest of us were
            locked out of a tool we had been building our lives on.
          </p>

          <p className="rv mf-statement mf-grad mf-pull my-20">This is the moment the argument ended.</p>

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

          <p className="rv mf-statement mf-grad mf-pull my-20">
            We refuse the subscription economy for cognition.
          </p>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            And as these tools start to act on the world, the same rule holds for what they
            do, not just where they run.{' '}
            <span className="text-[var(--fg)]">
              An agent should never act from a hidden prompt.
            </span>{' '}
            The plan it intends to run should be a file you can read, and reviewable before it
            acts. Power you cannot see is power you do not control.
          </p>

          <p className="rv mt-8 text-[17.5px] leading-relaxed text-[var(--fg-mute)]">
            <span className="text-[var(--fg)]">
              There is no US open source AI. There is no French open source AI.
            </span>{' '}
            Open source is open knowledge, shared infrastructure, and the right to run, study,
            modify, and own intelligence. Don&apos;t fight the cage by repainting it. Leave it.
          </p>

          <p className="rv mf-statement mf-grad mf-pull my-20">Sovereignty for everyone, or for no one.</p>
        </div>

        {/* ─── the 5 promises · seam-kit panels ─── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-24">
          <div className="rv mf-secreg" aria-hidden>
            <span className="mf-secno">03</span>
            <span className="mf-secrule" />
          </div>
          <p className="rv mono mb-3 text-center text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
            § What we promise
          </p>
          <h2
            className="rv mb-12 text-center font-semibold tracking-tight"
            style={{ fontSize: 'clamp(1.7rem, 1rem + 2.4vw, 2.8rem)', lineHeight: 1.06 }}
          >
            Built for the day the tap closes.
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p, i) => (
              <div
                key={p.n}
                className="rv mf-promise px-7 py-7"
                style={{ transitionDelay: `${i * 70}ms` }}
              >
                <span className="mf-promise-hud" aria-hidden />
                <div className="mf-promise-reg">
                  <p className="mf-pn">{p.n}</p>
                  <span className="mf-promise-rule" aria-hidden />
                  <span className="mf-promise-tag" aria-hidden>
                    promise
                  </span>
                </div>
                <h3 className="mb-2.5 text-[18px] font-semibold text-[var(--fg)]">{p.t}</h3>
                <p className="text-[14.5px] leading-relaxed text-[var(--fg-mute)]">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── the close ─── */}
        <section className="mf-prose mx-auto flex flex-col items-center px-6 pt-20 pb-28 text-center">
          <div className="rv mf-secreg w-full" aria-hidden>
            <span className="mf-secno">04</span>
            <span className="mf-secrule" />
          </div>
          {/* the close keeps its words and links but carries NO butterfly of its
              own: the shared SiteFooter's living particle butterfly right below
              is THE mark (one signature, one close · the double-footer fix) */}
          <p className="rv mf-statement mf-grad mb-10">
            Open source AI must win.
            <br />
            Not for a nation. For everyone.
          </p>
          <p className="rv mono mt-2 text-[13px] tracking-[0.04em] text-[var(--cyan)]">
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
            <Link to="/" className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]">
              ← Back to site
            </Link>
          </div>
        </section>

      </main>
    </div>
  )
}
