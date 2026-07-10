import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import ScrollRail from './ScrollRail'
import { useHead } from '@unhead/react'
import { AuroraProvider } from '../fx/EdgeAurora'
import { REPO, SITE } from '../content'
import { track, type FunnelEvent } from '../lib/track'
import Nav from './Nav'
import SiteFooter from './SiteFooter'
import './skip-link.css'

/* the palette is a lazy chunk — the initial bundle carries only the ⌘K
   listener below; the chunk (component + corpus) loads on first open */
const CommandK = lazy(() => import('./CommandK'))

/* ─── site-wide JSON-LD · Organization + WebSite (schema.org) ─────────────────
   Build-time / zero-runtime: @unhead/react flushes this <script> into every
   route's prerendered HTML (and reconciles on the client — one node, no dupes).
   Honest only — no fabricated version/metrics. The @graph links the two
   entities by @id so crawlers read one connected knowledge object. */
const SITE_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'SuperNovae Studio',
      url: SITE,
      sameAs: [REPO, 'https://github.com/supernovae-st'],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'Nika',
      url: SITE,
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en',
    },
  ],
}

/* ─── the app shell ─────────────────────────────────────────────────────────
   The routed outlet + scroll restoration (restores scroll on back/forward and
   scrolls to a #hash target after a cross-route navigation — e.g. the Learn
   page's "Install" CTA → /#install), wrapped in the EdgeAurora signature: an
   iridescent Siri-pool halo living on the black device frame (design doc §3.2).
   AuroraProvider exposes useAuroraPulse().pulse() to the tree AND renders the
   <EdgeAurora/> visual itself (fixed, pointer-events:none — bezel z-60 +
   aurora z-61).

   <Nav/> is the ONE shared v4 nav (monochrome blueprint) — mounted here so every
   route shares a single nav (no per-page duplicate). It is fixed/sticky and
   transparent over a hero, solid once scrolled.

   <SiteFooter/> is the ONE shared footer (F7 · the F3 signature + the locked
   SUPERNOVAE block + PROD rule) — mounted here on every route EXCEPT Home,
   where FinalCTA renders it inside the close beat (its rhythm). Deriving both
   from the path (not route flags) keeps SSR + client identical (no hydration
   branch). The old /manifesto bare-nav exception is GONE (F7: one nav, one
   footer, one theme everywhere — the manifesto now rides the shared shell). */

export default function RootLayout() {
  const { pathname } = useLocation()
  const showFooter = pathname !== '/'

  /* the funnel listener (W12a · FRONT F) · ONE delegated click handler for
     the whole site: any element carrying data-track fires its event, and
     outbound GitHub links count as github-out without per-link handlers.
     No-op while the analytics loader is inert (track() guards). */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track], a[href*="github.com/supernovae-st"]')
      if (!el) return
      const named = el.dataset.track as FunnelEvent | undefined
      track(named ?? 'github-out')
    }
    document.addEventListener('click', onClick, { passive: true })
    return () => document.removeEventListener('click', onClick)
  }, [])

  /* boot-guard handshake · tells the index.html watchdog that hydration
     landed, so the entrance choreography keeps its slow-device fallback
     without ever firing on fast ones. */
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', '')
  }, [])

  /* ⌘K / Ctrl+K · the palette (arc 13 W2) — the shell owns only this
     listener; the dialog + corpus live in the lazy chunk. The nav's own
     trigger button drives the same state (window event, no prop drilling
     through Nav). */
  const [paletteOpen, setPaletteOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    const onOpen = () => setPaletteOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('ck:open', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('ck:open', onOpen)
    }
  }, [])

  /* the license egg · type « agpl » anywhere: a quiet mono toast answers
     « forever. » (the same input guards as the drum egg — never inside a
     field; auto-dismiss; polite live region so it is announced once). */
  const [agplToast, setAgplToast] = useState(false)
  useEffect(() => {
    let buffer = ''
    let timer: ReturnType<typeof setTimeout> | undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      buffer = (buffer + e.key.toLowerCase()).slice(-4)
      if (buffer === 'agpl') {
        console.log('%c🦋 AGPL-3.0-or-later · forever.', 'color:#608dff')
        setAgplToast(true)
        clearTimeout(timer)
        timer = setTimeout(() => setAgplToast(false), 3200)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [])

  /* site-wide structured data · prerendered into every route's <head> */
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(SITE_JSONLD),
        // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
        processTemplateParams: false,
      },
    ],
  })

  return (
    <AuroraProvider>
      <ScrollRestoration />
      {/* the first focusable on every page · visually hidden until focused, then
          it reveals and jumps keyboard users past the nav straight to the routed
          content (#main). */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      {/* the palette · mounts only while open (the chunk loads on first use) */}
      {paletteOpen ? (
        <Suspense fallback={null}>
          <CommandK onClose={() => setPaletteOpen(false)} />
        </Suspense>
      ) : null}
      {/* the agpl egg toast · aria-live polite (announced), pointer-inert */}
      <div className="agpl-toast" role="status" data-on={agplToast || undefined}>
        AGPL-3.0-or-later · forever.
      </div>
      {/* the routed content target · the skip link lands here (id="main"); each
          page renders its own <main> landmark inside. tabindex=-1 so the link can
          move focus to it programmatically. */}
      {/* route entrance · keying the wrapper on the pathname remounts it per
          navigation, replaying a single 240ms fade+rise (CSS, compositor-only,
          reduced-motion gated). SSR-safe: the animation is a plain CSS entrance
          on the prerendered markup — no JS timing, no exit phase to desync. */}
      <div id="main" tabIndex={-1} className="skip-target route-enter" key={pathname}>
        <Outlet />
        {/* the wayfinding rail · site-wide (keyed by route: each page
            re-discovers its own section marks; <3 marks = no rail) */}
        <ScrollRail key={pathname} />
      </div>
      {showFooter ? <SiteFooter /> : null}
    </AuroraProvider>
  )
}
