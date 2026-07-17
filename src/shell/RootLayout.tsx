import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import ScrollRail from './ScrollRail'
import { useHead } from '@unhead/react'
import { useNavigate } from 'react-router'
import { NAV_CHORDS } from '../lib/chords'
import { AuroraProvider } from '../fx/EdgeAurora'
import { REPO, SITE } from '../content'
import { track, type FunnelEvent } from '../lib/track'
import Nav from './Nav'
import SiteFooter from './SiteFooter'
import { useHydrated } from '../lib/use-hydrated'
import './skip-link.css'

/* the palette is a lazy chunk — the initial bundle carries only the ⌘K
   listener below; the chunk (component + corpus) loads on first open */
const CommandK = lazy(() => import('./CommandK'))

/* the Accept-Language suggestion · lazy + post-hydration only (the
   FooterSignature precedent: no Suspense in the SSG tree, no initial-bundle
   bytes — the banner is client-state by design) */
const LocaleSuggest = lazy(() => import('./LocaleSuggest'))

/* the `?` overlay · lazy like the palette (a chord answers on first
   keystroke — its TABLE is inline; only the CARD is a chunk) */
const ShortcutsOverlay = lazy(() => import('./ShortcutsOverlay'))

/* the Inspector · lazy like the palette (the graph rides its own chunk
   through the atlas-access door — nothing reaches the entry) */
const Inspector = lazy(() => import('./Inspector'))

/* the member hover card (round-3) · fine-pointer courtesy — the chunk
   loads at the first settled hover */
const HoverCard = lazy(() => import('./HoverCard'))

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
   page's "Install" CTA → /#install), wrapped in THE MACHINED FRAME:
   AuroraProvider exposes the run-drum API (useAurora) to the tree AND renders
   the frame element itself (fixed, pointer-events:none, z-60 — one element,
   one ink; the run draws the lining ring).

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
  const hydrated = useHydrated()

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

  /* the Inspector bus (round-1): surfaces dispatch insp:open with a node
     id — zero prop drilling, the ck:open precedent · the chunk mounts at
     the first selection */
  /* deep-link read-side (§6 · the write-side lands at step 3): ?node=<id>
     opens the Inspector on load — an SSR-safe lazy initializer, never an
     effect write (the panel only exists client-side anyway) */
  const [inspNode, setInspNode] = useState<string | null>(() =>
    import.meta.env.SSR ? null : new URLSearchParams(window.location.search).get('node'),
  )
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ id?: string; href?: string }>).detail
      const next = d?.id ?? d?.href
      if (typeof next !== 'string' || !next) return
      setInspNode(next)
      /* §6 write-side: an explicit id-open pushes ONCE (?node=) so Back
         closes the panel (popstate → close · the NN/g law); href
         selections are courtesy doors and keep the URL clean */
      if (d?.id) {
        const url = new URL(window.location.href)
        if (url.searchParams.get('node') !== d.id) {
          url.searchParams.set('node', d.id)
          window.history.pushState({ insp: d.id }, '', url)
        }
      }
    }
    const onPop = () => {
      setInspNode(new URLSearchParams(window.location.search).get('node'))
    }
    window.addEventListener('insp:open', onOpen)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('insp:open', onOpen)
      window.removeEventListener('popstate', onPop)
    }
  }, [])

  /* closing cleans the URL (replace — closing is not a history moment) */
  const closeInspector = () => {
    setInspNode(null)
    const url = new URL(window.location.href)
    if (url.searchParams.has('node')) {
      url.searchParams.delete('node')
      window.history.replaceState({}, '', url)
    }
  }

  /* the hover cards (round-3 · the design's laws): fine-pointer only, no
     card without native anchor positioning (a missing courtesy is not a
     regression — never a positioning lib), ~350ms open · 150ms close-grace,
     aria-hidden courtesy (the link stays the semantic object). */
  const [hoverNode, setHoverNode] = useState<string | null>(null)
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (!CSS.supports('anchor-name: --x')) return
    let openT: ReturnType<typeof setTimeout> | undefined
    let closeT: ReturnType<typeof setTimeout> | undefined
    let current: HTMLElement | null = null
    const drop = () => {
      current?.style.removeProperty('anchor-name')
      current = null
      setHoverNode(null)
    }
    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element).closest?.<HTMLElement>('[data-node-id]') ?? null
      if (el === current && el) {
        clearTimeout(closeT)
        return
      }
      clearTimeout(openT)
      if (!el) {
        clearTimeout(closeT)
        closeT = setTimeout(drop, 150)
        return
      }
      clearTimeout(closeT)
      openT = setTimeout(() => {
        current?.style.removeProperty('anchor-name')
        current = el
        el.style.setProperty('anchor-name', '--member-hover')
        setHoverNode(el.dataset.nodeId ?? null)
      }, 350)
    }
    document.addEventListener('pointerover', onOver, { passive: true })
    return () => {
      document.removeEventListener('pointerover', onOver)
      clearTimeout(openT)
      clearTimeout(closeT)
      drop()
    }
  }, [])

  /* the g-chords + the `?` door (round-2A · the egg guards verbatim):
     g then a letter navigates; unknown = silent reset (a missed chord does
     not exist); modifiers or a field = abandon; 800ms window. */
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    let armed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const disarm = () => {
      armed = false
      clearTimeout(timer)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return disarm()
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((v) => !v)
        return disarm()
      }
      if (armed) {
        const hit = NAV_CHORDS.find((c) => c.key === e.key.toLowerCase())
        disarm()
        if (hit) {
          e.preventDefault()
          void navigate(hit.to, { viewTransition: true })
        }
        return
      }
      if (e.key.toLowerCase() === 'g') {
        armed = true
        clearTimeout(timer)
        timer = setTimeout(disarm, 800)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer)
    }
  }, [navigate])

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
      {/* post-hydration only (the LocaleSuggest law): the SSG tree never
          carried the panel — mounting it during hydration would mismatch */}
      {hydrated && hoverNode ? (
        <Suspense fallback={null}>
          <HoverCard nodeId={hoverNode} />
        </Suspense>
      ) : null}
      {hydrated && inspNode ? (
        <Suspense fallback={null}>
          <Inspector nodeId={inspNode} onClose={closeInspector} />
        </Suspense>
      ) : null}
      {shortcutsOpen ? (
        <Suspense fallback={null}>
          <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />
        </Suspense>
      ) : null}
      {/* the agpl egg toast · aria-live polite (announced), pointer-inert */}
      <div className="agpl-toast" role="status" data-on={agplToast || undefined}>
        AGPL-3.0-or-later · forever.
      </div>
      {/* the Accept-Language suggestion · §4bis law 2: a quiet dismissible
          bar when THIS page ships the visitor's language — never a redirect */}
      {hydrated ? (
        <Suspense fallback={null}>
          <LocaleSuggest />
        </Suspense>
      ) : null}
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
