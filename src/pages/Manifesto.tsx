import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { REPO, SPEC, SITE } from '../content'
import { MANIFESTO_LOCALES, manifestoCopyFor, type MfSeg } from '../content/manifesto-copy'
import { usePlan3D } from '../sections/morph/use-plan3d'
import { TheRecord } from '../sections/manifesto/TheRecord'

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

/* inline emphasis renderer · the copy module's segment idiom ({fg} bright,
   {em} italic) — the manifesto's whole formatting vocabulary. */
const seg = (segs: MfSeg[]) =>
  segs.map((x, i) =>
    typeof x === 'string' ? (
      x
    ) : 'fg' in x ? (
      <span key={i} className="text-[var(--fg)]">{x.fg}</span>
    ) : (
      <em key={i}>{x.em}</em>
    ),
  )

export function Component() {
  /* the locale rides the pathname (/manifesto · /fr/… · /es/… · /zh-hans/…) —
     explicit routes only, EN is the x-default. */
  const { pathname } = useLocation()
  const c = manifestoCopyFor(pathname)

  useHead({
    title: c.htmlTitle,
    /* <html lang> per variant (BCP 47) · unhead swaps it back on route change */
    htmlAttrs: { lang: c.bcp47 },
    link: [
      { rel: 'canonical', href: `${SITE}${c.path}` },
      /* the hreflang cluster · every variant lists every sibling + x-default */
      ...MANIFESTO_LOCALES.map((l) => ({
        rel: 'alternate' as const,
        hreflang: l.bcp47,
        href: `${SITE}${l.path}`,
      })),
      { rel: 'alternate', hreflang: 'x-default', href: `${SITE}/manifesto` },
    ],
    meta: [
      { property: 'og:url', content: `${SITE}${c.path}` },
      { name: 'description', content: c.metaDescription },
      { property: 'og:title', content: c.htmlTitle },
      { property: 'og:description', content: c.ogDescription },
      { property: 'og:locale', content: c.ogLocale },
      ...MANIFESTO_LOCALES.filter((l) => l.path !== c.path).map((l) => ({
        property: 'og:locale:alternate',
        content: l.ogLocale,
      })),
      { property: 'og:image', content: 'https://nika.sh/og-manifesto.png' },
      { property: 'og:image:alt', content: c.ogAlt },
      { name: 'twitter:title', content: c.htmlTitle },
      { name: 'twitter:description', content: c.ogDescription },
      { name: 'twitter:image', content: 'https://nika.sh/og-manifesto.png' },
    ],
  })

  /* the drum egg · type « drum » anywhere on the page and the rings answer
     with a 4s brighter beat ([data-egg] · CSS, motion-gated). Console lore
     speaks the locale's own drumline — the site's quiet second voice. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    console.log('%c🥁 ' + c.drumline, 'color:#22d3ee')
    let buffer = ''
    let timer: ReturnType<typeof setTimeout> | undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      buffer = (buffer + e.key.toLowerCase()).slice(-4)
      if (buffer === 'drum') {
        drumRef.current?.setAttribute('data-egg', '1')
        console.log('%c🥁 · 🥁 · 🥁', 'color:#22d3ee')
        clearTimeout(timer)
        timer = setTimeout(() => drumRef.current?.removeAttribute('data-egg'), 4000)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [c.drumline])

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
    let lastY = -1
    const apply = () => {
      raf = 0
      const max = Math.max(0, el.offsetHeight - window.innerHeight)
      const y = Math.min(window.scrollY * 0.14, max)
      if (y === lastY) return // clamped (deep scroll) → identical write, skip
      lastY = y
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

  /* the acid movements (W10c) · the v3 register returns: the manifesto's
     body warps under FAST scroll and resolves still when the reader settles
     — instability under haste, clarity at rest (the BeyondChat pattern:
     scroll-velocity → feDisplacementMap scale, zero re-renders, reduced-
     motion never references the filter). */
  const acidRef = useRef<HTMLDivElement>(null)
  const acidDispRef = useRef<SVGFEDisplacementMapElement>(null)
  const acidTurbRef = useRef<SVGFETurbulenceElement>(null)
  const [acid, setAcid] = useState<'off' | 'live'>('off')
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const host = acidRef.current
    if (!host) return
    setAcid('live')
    let onScreen = false
    let warp = 0
    let lastY = window.scrollY
    let raf = 0
    let wasStill = false
    const vis = new IntersectionObserver(
      (es) => {
        onScreen = es[0]?.isIntersecting ?? false
        if (onScreen && !raf) raf = requestAnimationFrame(tick)
      },
      { threshold: 0 },
    )
    vis.observe(host)
    const tick = () => {
      const y = window.scrollY
      const vel = Math.abs(y - lastY)
      lastY = y
      warp = Math.max(Math.min(1, vel / 46), warp * 0.87)
      if (warp < 0.004) warp = 0
      const still = warp === 0
      if (!(still && wasStill)) {
        acidDispRef.current?.setAttribute('scale', (warp * 22).toFixed(2))
        acidTurbRef.current?.setAttribute(
          'baseFrequency',
          `${(0.006 + 0.016 * warp).toFixed(4)} ${(0.006 + 0.016 * warp).toFixed(4)}`,
        )
      }
      wasStill = still
      raf = onScreen || warp > 0 ? requestAnimationFrame(tick) : 0
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      vis.disconnect()
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
              {c.kicker}
            </p>
            <h1 className="mf-title mf-grad mb-6">
              {c.title[0]}
              <br />
              {c.title[1]}
            </h1>
            <p className="mb-3 max-w-[34rem] text-[19px] leading-relaxed text-[var(--fg-mute)]">
              {c.sub}
            </p>
            <p className="mono text-[12px] tracking-[0.04em] text-[var(--fg-dim)]">
              {c.stamp}
            </p>
            {/* the language rail · real crawlable links, BCP 47 cluster */}
            <nav className="mf-langs mono mt-7 flex items-center gap-4 text-[12px] tracking-[0.08em]" aria-label="Languages">
              {MANIFESTO_LOCALES.map((l) => (
                <Link
                  key={l.bcp47}
                  to={l.path}
                  lang={l.bcp47}
                  aria-current={l.path === c.path ? 'page' : undefined}
                  className={
                    l.path === c.path
                      ? 'text-[var(--fg)] underline underline-offset-4 decoration-[var(--cyan)]'
                      : 'text-[var(--fg-dim)] transition-colors hover:text-[var(--fg)]'
                  }
                >
                  {l.label}
                </Link>
              ))}
            </nav>
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
          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{c.lore1}</p>
          <p className="rv mt-5 text-[19px] font-medium text-[var(--fg)]">{c.lore2}</p>
        </section>

        {/* the acid filter · inert until data-acid=live (motion-gated above) */}
        <svg width="0" height="0" aria-hidden focusable="false" style={{ position: 'absolute' }}>
          <filter id="mf-acid-warp" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
            <feTurbulence ref={acidTurbRef} type="fractalNoise" baseFrequency="0.006 0.006" numOctaves={2} seed={11} result="noise" />
            <feDisplacementMap ref={acidDispRef} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* ─── the movements · scroll-revealed prose + big statements — the
            acid layer: unstable under fast scroll, still when read ─── */}
        <div ref={acidRef} data-acid={acid} className="mf-acid mf-prose mx-auto px-6 pt-14 pb-16">
          <div className="rv mf-secreg" aria-hidden>
            <span className="mf-secno">02</span>
            <span className="mf-secrule" />
          </div>
          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.friday)}</p>

          <p className="rv mf-statement mf-grad mf-pull my-20">{c.statement1}</p>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.realProblem)}</p>

          <div className="rv my-8 flex flex-wrap justify-center gap-2.5">
            {c.stack.map((s) => (
              <span key={s} className="mf-token">
                {s}
              </span>
            ))}
          </div>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.rented)}</p>

          <p className="rv mf-statement mf-grad mf-pull my-20">{c.statement2}</p>

          <p className="rv text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.agent)}</p>

          <p className="rv mt-8 text-[17.5px] leading-relaxed text-[var(--fg-mute)]">{seg(c.openSource)}</p>

          <p className="rv mf-statement mf-grad mf-pull my-20">{c.statement3}</p>
        </div>

        {/* ─── the 5 promises · seam-kit panels ─── */}
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-24">
          <div className="rv mf-secreg" aria-hidden>
            <span className="mf-secno">03</span>
            <span className="mf-secrule" />
          </div>
          <p className="rv mono mb-3 text-center text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
            {c.promisesKicker}
          </p>
          <h2
            className="rv mb-12 text-center font-semibold tracking-tight"
            style={{ fontSize: 'clamp(1.7rem, 1rem + 2.4vw, 2.8rem)', lineHeight: 1.06 }}
          >
            {c.promisesTitle}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.promises.map((p, i) => (
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

        {/* ─── §04 · the record · the poem's proof layer (register duality:
            the prose above carries no number and no vendor · the record below
            carries ONLY dated primary-sourced facts · see manifesto-record.ts
            header for the scoped copy law) ─── */}
        <TheRecord />

        {/* ─── the close ─── */}
        <section className="mf-prose mx-auto flex flex-col items-center px-6 pt-20 pb-28 text-center">
          <div className="rv mf-secreg w-full" aria-hidden>
            <span className="mf-secno">05</span>
            <span className="mf-secrule" />
          </div>
          {/* the close keeps its words and links but carries NO butterfly of its
              own: the shared SiteFooter's living particle butterfly right below
              is THE mark (one signature, one close · the double-footer fix) */}
          <p className="rv mf-statement mf-grad mb-10">
            {c.close[0]}
            <br />
            {c.close[1]}
          </p>
          <p className="rv mono mt-2 text-[13px] tracking-[0.04em] text-[var(--cyan)]">
            {c.drumline}
          </p>
          <div className="rv mono mt-10 flex flex-wrap items-center justify-center gap-6 text-[12.5px]">
            <a
              href={SPEC}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--cyan)] transition-colors hover:text-[var(--fg)]"
            >
              {c.linkSpec}
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
            >
              {c.linkGithub}
            </a>
            <Link to="/" className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]">
              {c.linkBack}
            </Link>
          </div>
        </section>

      </main>
    </div>
  )
}
