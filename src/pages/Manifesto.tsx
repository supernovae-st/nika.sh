import { Suspense, lazy, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { SITE } from '../content'
import { MANIFESTO_LOCALES, manifestoCopyFor } from '../content/manifesto-copy'
import { usePlan3D } from '../sections/morph/use-plan3d'
import { TheMovements } from '../sections/manifesto/TheMovements'
import { ThePromises } from '../sections/manifesto/ThePromises'
import { TheRecord } from '../sections/manifesto/TheRecord'
import { TheClose } from '../sections/manifesto/TheClose'

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
            {/* E1 · the stamp is the loop: the poem's own dateline deep-links to
                the record's founding entry (#rec-the-kill-switch · :target lit).
                Same words, now a doorway. */}
            <a
              href="#rec-the-kill-switch"
              className="mono text-[12px] tracking-[0.04em] text-[var(--fg-dim)] underline decoration-[color-mix(in_srgb,var(--cyan)_35%,transparent)] underline-offset-4 transition-colors hover:text-[var(--fg-mute)]"
            >
              {c.stamp}
            </a>
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

        {/* ─── §02 · the movements (extracted · sections/manifesto/TheMovements) ─── */}
        <TheMovements c={c} />

        {/* ─── §03 · the promises + receipts (extracted · sections/manifesto/ThePromises) ─── */}
        <ThePromises c={c} />

        {/* ─── §04 · the record · the poem's proof layer (register duality:
            the prose above carries no number and no vendor · the record below
            carries ONLY dated primary-sourced facts · see manifesto-record.ts
            header for the scoped copy law) ─── */}
        <TheRecord c={c} />

        {/* ─── §05 · the close (extracted · sections/manifesto/TheClose) ─── */}
        <TheClose c={c} />

      </main>
    </div>
  )
}
