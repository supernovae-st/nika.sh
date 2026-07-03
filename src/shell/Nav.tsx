import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { REPO, DOCS, ENGINE_VERSION } from '../content'
import './nav.css'

/* ─── Nav · the v4 shared shell nav (monochrome blueprint) ────────────────────
   ONE nav for every route (mounted in RootLayout). Replaces the v3 glass pill.

   Register: sovereign-engineering-instrument — austere, hairline 1px rules, a
   FIG/blueprint feel. Grayscale only; the lone color is the global EdgeAurora.

   Behaviour
   - a FLOATING CAPSULE (wave-h): the nav detaches from the top edge on desktop
     (12px gutter · 72rem max · 12px radius · near-opaque floor + the seam kit).
     Two orthogonal states drive it — `data-solid` (transparent riding the hero
     field → capsule floor, via a 24px scroll sentinel + IntersectionObserver)
     and `data-scrolled` (the capsule compresses 64→56px and its shadow
     tightens once the page is in motion). Below 720px it is a full-width bar
     with the same depth kit.
   - the rail carries ONE shared hover pill — a single absolutely-positioned
     highlight that SLIDES between items on hover/keyboard-focus (transform +
     width · ~180ms), fades in on first entry and out on leave. rAF-batched
     reads/writes, zero per-item hover backgrounds. The active route keeps its
     own persistent dim pill (aria-current, pure CSS).
   - `Product ▾` is a real grouped mega-menu (WAI-ARIA disclosure): full keyboard
     (Esc closes + returns focus, ↓/↑ move through items, Home/End jump, Tab
     parks focus back on the trigger before closing — no focus drop), closes on
     outside click / route change. On MOUSE it opens on HOVER with intent
     timing (~70ms in, so flybys never flash it · ~250ms grace out) and a
     SAFE TRIANGLE — while the pointer keeps moving inside the triangle from
     its exit point to the panel's top corners (i.e. traveling toward the
     panel) the grace deadline keeps extending, so the diagonal path to the
     far corner never slams the menu shut; parking anywhere else (another
     rail link) lets the grace expire. Touch/pen never hover-open (per-event
     pointerType gate); click still toggles; keyboard is untouched.
     Semantics: role=menu/menuitem is used WITH
     the full APG keyboard contract implemented below — a plain list of links
     would also be a11y-correct, but the roving-focus behaviour is already here,
     so the roles are honest.
   - one emphasized CTA (`Install`) — near-white on dark, NOT a blue pill.
   - mobile: the rail collapses to a burger → a right-side sheet (disclosure),
     with generous ≥44px touch targets and ≥16px text (no iOS zoom).

   SSR-safe: no window/document at render; all browser access is in effects or
   event handlers. The fixed-position sentinel detection degrades gracefully —
   if the observer never fires (no hero on a page) the nav simply stays solid. */

/* routes that ship the blue field behind the nav — ONLY these earn the
   transparent-at-top nav (F5). Everywhere else the transparent nav's dark
   legibility scrim reads as a gray smudge over a plain/light page top
   (review P2-12), so field-less routes render SOLID from scroll 0. */
const FIELD_ROUTES = new Set(['/', '/manifesto'])

type MegaIconName = 'run' | 'verbs' | 'shield' | 'tiles' | 'terminal' | 'book' | 'butterfly'

interface MegaItem {
  label: string
  desc: string
  icon: MegaIconName
  to?: string // internal RR route
  href?: string // home anchor (/#x) or external
  external?: boolean
}

interface MegaGroup {
  title: string
  items: MegaItem[]
}

/* the Product mega-menu · two grouped columns (Language · Workflows + Learn).
   Internal routes use RR <Link>; home anchors use /#x; externals open a tab.
   F6 (operator drop #2): NO bullet glyphs — text hierarchy only (six mixed
   glyphs read as noise; the Linear/Cursor register is title+desc, nothing
   else). */
const PRODUCT_GROUPS: MegaGroup[] = [
  {
    title: 'The control layer',
    items: [
      { label: 'See it run', desc: 'The plan, reviewed and enforced', icon: 'run', href: '/#the-run' },
      { label: 'The four verbs', desc: 'infer · exec · invoke · agent', icon: 'verbs', href: '/#verbs' },
      { label: 'What it can touch', desc: 'The permits enforcement model', icon: 'shield', href: '/#the-boundary' },
      { label: 'Use cases', desc: 'Real plans, reviewable and bound', icon: 'tiles', to: '/use-cases' },
    ],
  },
  {
    title: 'Build · Learn',
    items: [
      { label: 'Playground', desc: 'Write & run in the browser', icon: 'terminal', to: '/play' },
      { label: 'Learn it in 5 min', desc: 'The quickstart', icon: 'book', to: '/learn' },
      { label: 'Manifesto', desc: 'The drum of liberation', icon: 'butterfly', to: '/manifesto' },
    ],
  },
]

/* ── the mega icon set · ONE hand-drawn outlined family (16px grid · stroke
   1.5 · round joins · monochrome dim, inked+accent on row hover via CSS).
   The butterfly is the nika mark reduced to a 4-lobe glyph — the full-color
   public/nika.svg art doesn't survive 16px, so the wings are re-traced as
   stroke teardrops off a short body line. */
const MEGA_ICON_PATHS: Record<MegaIconName, React.ReactNode> = {
  run: (
    <>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M6.8 5.7v4.6L10.6 8Z" />
    </>
  ),
  verbs: (
    <>
      <circle cx="5.1" cy="5.1" r="1.7" />
      <circle cx="10.9" cy="5.1" r="1.7" />
      <circle cx="5.1" cy="10.9" r="1.7" />
      <circle cx="10.9" cy="10.9" r="1.7" />
    </>
  ),
  shield: (
    <path d="M8 1.9 13.1 3.9v4c0 3.2-2.2 5.2-5.1 6.4-2.9-1.2-5.1-3.2-5.1-6.4v-4Z" />
  ),
  tiles: (
    <>
      <rect x="2.2" y="2.4" width="11.6" height="4.6" rx="1.2" />
      <rect x="2.2" y="9" width="5.1" height="4.6" rx="1.2" />
      <rect x="8.7" y="9" width="5.1" height="4.6" rx="1.2" />
    </>
  ),
  terminal: (
    <>
      <rect x="1.8" y="2.7" width="12.4" height="10.6" rx="1.6" />
      <path d="m4.6 6.5 2.3 1.9-2.3 1.9" />
      <path d="M8.7 10.3h2.7" />
    </>
  ),
  book: (
    <>
      <path d="M8 4.3C6.9 3.1 4.9 2.8 2.4 3v9.7c2.5-.2 4.5.1 5.6 1.3 1.1-1.2 3.1-1.5 5.6-1.3V3c-2.5-.2-4.5.1-5.6 1.3Z" />
      <path d="M8 4.3v9.7" />
    </>
  ),
  butterfly: (
    <>
      <path d="M8 6.4v4.9" />
      <path d="M7.5 7.4C6.8 4.7 4.3 2.4 2.8 3.5 1.4 4.6 3.3 7.9 7.5 8.7Z" />
      <path d="M8.5 7.4c.7-2.7 3.2-5 4.7-3.9 1.4 1.1-.5 4.4-4.7 5.2Z" />
      <path d="M7.6 10c-1.9-.3-3.6.6-3.3 1.9.3 1.2 2.2.8 3.3-.8Z" />
      <path d="M8.4 10c1.9-.3 3.6.6 3.3 1.9-.3 1.2-2.2.8-3.3-.8Z" />
    </>
  ),
}

function MegaIcon({ name }: { name: MegaIconName }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {MEGA_ICON_PATHS[name]}
    </svg>
  )
}

/* the flat top-level links after Product */
const TOP_LINKS: { label: string; href: string; external?: boolean; newTab?: boolean }[] = [
  { label: 'Docs', href: DOCS, external: true },
  { label: 'Spec', href: '/spec' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Blog', href: '/blog' },
]

function GitHubGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function CaretGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className="v4nav-caret">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/* the flat list of all mega items, in tab/arrow order (Language then Build) */
const FLAT_PRODUCT_ITEMS: MegaItem[] = PRODUCT_GROUPS.flatMap((g) => g.items)

/* a single mega-menu / sheet item rendered as the right element type */
function ItemLink({
  item,
  className,
  onSelect,
  refCb,
}: {
  item: MegaItem
  className: string
  onSelect: () => void
  refCb?: (el: HTMLAnchorElement | null) => void
}) {
  const inner = (
    <>
      <span className="v4mega-icobox" aria-hidden>
        <MegaIcon name={item.icon} />
      </span>
      <span className="v4mega-text">
        <span className="v4mega-label">{item.label}</span>
        <span className="v4mega-desc">{item.desc}</span>
      </span>
    </>
  )
  if (item.to) {
    return (
      <Link ref={refCb} to={item.to} role="menuitem" className={className} onClick={onSelect}>
        {inner}
      </Link>
    )
  }
  return (
    <a
      ref={refCb}
      href={item.href}
      role="menuitem"
      className={className}
      onClick={onSelect}
      {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {inner}
    </a>
  )
}

export default function Nav() {
  const location = useLocation()
  /* `scrolled` = the page is in motion (>24px) — drives the capsule COMPRESSION.
     The FLOOR is the derived `solid` below: field-less routes prerender solid
     from scroll 0 (no transparent flash · P2-12), field routes ride transparent
     until the sentinel scrolls out. */
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const megaWrapRef = useRef<HTMLDivElement>(null)
  const megaBtnRef = useRef<HTMLButtonElement>(null)
  const megaItemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const sheetRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const capsuleRef = useRef<HTMLDivElement>(null)
  const megaPanelRef = useRef<HTMLDivElement>(null)

  const megaId = useId()
  const sheetId = useId()

  /* ── the 24px scroll sentinel ──
     A 1px marker parked 24px down the document; while it is in view the page
     counts as "at the top" (capsule relaxed), once it leaves the capsule
     compresses (and, on field routes, gains its floor). The observer runs on
     EVERY route so compression works everywhere; the FLOOR is the derived
     `solid` — transparent-at-top applies ONLY on FIELD_ROUTES (the nav floats
     on the hero field, F5), field-less routes are solid from scroll 0 (P2-12). */
  const hasField = FIELD_ROUTES.has(location.pathname)
  const solid = scrolled || !hasField
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setScrolled(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ── the sliding hover pill ──
     ONE shared highlight <span> parked in the rail; hover or keyboard focus on
     a rail item makes it the "hot" target and the pill SLIDES there (transform
     + width). Two sources (hover · focus) are tracked separately so mousing
     away doesn't strand a keyboard user, and vice-versa. rAF-batched: all
     rect reads and style writes happen inside one frame, and repeated
     triggers coalesce into the latest — zero layout thrash. Measurement is
     rect-based against the CAPSULE (the pill's containing block — the rail is
     deliberately unpositioned so the mega panel can anchor to the capsule
     too). First entry: the position commits while the pill is HIDDEN (the
     hidden state transitions opacity only, so the write is silent), then it
     fades in on the next frame — no cross-rail streak. */
  const pillRaf = useRef(0)
  const pillHot = useRef<{ hover: HTMLElement | null; focus: HTMLElement | null }>({
    hover: null,
    focus: null,
  })
  const syncPill = useCallback(() => {
    cancelAnimationFrame(pillRaf.current)
    pillRaf.current = requestAnimationFrame(() => {
      const capsule = capsuleRef.current
      const pill = pillRef.current
      if (!capsule || !pill) return
      const hot = pillHot.current.hover ?? pillHot.current.focus
      if (!hot) {
        pill.dataset.on = 'false' // fade out in place (opacity-only when hidden)
        return
      }
      const capBox = capsule.getBoundingClientRect()
      const box = hot.getBoundingClientRect()
      /* clientLeft/Top: absolute children offset from the PADDING box (the
         capsule wears a 1px border) */
      const x = box.left - capBox.left - capsule.clientLeft
      const y = box.top - capBox.top - capsule.clientTop
      pill.style.transform = `translate(${x}px, ${y}px)`
      pill.style.width = `${box.width}px`
      pill.style.height = `${box.height}px`
      if (pill.dataset.on !== 'true') {
        pillRaf.current = requestAnimationFrame(() => {
          pill.dataset.on = 'true'
        })
      }
    })
  }, [])
  useEffect(() => () => cancelAnimationFrame(pillRaf.current), [])
  const railItemOf = (t: EventTarget | null): HTMLElement | null =>
    t instanceof Element ? t.closest<HTMLElement>('.v4nav-link') : null

  /* ── close everything on a real route change (back/forward + cross-route nav).
     Guarded by a ref so setState only fires when the location actually changed —
     never unconditionally in the effect body (react-hooks/set-state-in-effect). */
  const lastLocRef = useRef(`${location.pathname}${location.hash}`)
  useEffect(() => {
    const key = `${location.pathname}${location.hash}`
    if (lastLocRef.current !== key) {
      lastLocRef.current = key
      setMegaOpen(false)
      setSheetOpen(false)
    }
  }, [location.pathname, location.hash])

  /* ── mega panel placement · align the capsule-anchored panel under its
     trigger. The panel's containing block is the CAPSULE (so its 8px
     bottom gap survives the 64→56 compression — pure CSS), but its LEFT must
     track the trigger, whose x depends on the brand width. Measured once per
     open (+ on resize), before paint — one read, one write, no flash. */
  useLayoutEffect(() => {
    if (!megaOpen) return
    const place = () => {
      const capsule = capsuleRef.current
      const wrap = megaWrapRef.current
      const panel = megaPanelRef.current
      if (!capsule || !wrap || !panel) return
      const x =
        wrap.getBoundingClientRect().left - capsule.getBoundingClientRect().left - capsule.clientLeft
      panel.style.left = `${x}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [megaOpen])

  /* ── mega-menu: outside-click + Escape (returns focus to the trigger) ── */
  useEffect(() => {
    if (!megaOpen) return
    const onDown = (e: MouseEvent) => {
      if (!megaWrapRef.current?.contains(e.target as Node)) setMegaOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMegaOpen(false)
        megaBtnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [megaOpen])

  /* ── mega-menu: move focus to the first item ONLY on keyboard opens ──
     Auto-focusing after a mouse click made the first item wear the global
     :focus-visible ring as a permanent-looking selection box (operator F6
     screenshot). Pointer opens leave focus on the trigger; keyboard opens
     (Enter/Space fire click with detail 0 · ArrowDown) move it in. */
  const kbOpenRef = useRef(false)
  useEffect(() => {
    if (megaOpen && kbOpenRef.current) megaItemRefs.current[0]?.focus()
  }, [megaOpen])

  /* ── hover-intent (mouse only) · open ~70ms in · ~250ms grace out ──
     The wrap is the hover surface: the panel is a DOM CHILD of the wrap (even
     though it positions against the capsule), so pointerenter/leave on the
     wrap already treat trigger+panel as ONE region — leaving the trigger for
     the panel fires leave (the gap is rail territory) then enter, and the
     grace timer bridges the crossing. SAFE TRIANGLE: while a close is
     pending, a document-level pointermove keeps extending the deadline as
     long as the pointer moves INSIDE the triangle {exit point → panel top
     corners} (traveling toward the panel), capped at ~1.2s so parking inside
     the triangle (e.g. on Docs) still lets it expire. All timers/listeners
     are refs — zero re-renders until the open/close state actually flips. */
  const hoverRef = useRef({ openT: 0, closeT: 0, deadline: 0, maxDeadline: 0 })
  const graceMoveRef = useRef<((e: PointerEvent) => void) | null>(null)
  const stopGraceTracking = useCallback(() => {
    if (graceMoveRef.current) {
      document.removeEventListener('pointermove', graceMoveRef.current)
      graceMoveRef.current = null
    }
  }, [])
  const cancelHoverTimers = useCallback(() => {
    const h = hoverRef.current
    window.clearTimeout(h.openT)
    window.clearTimeout(h.closeT)
    h.openT = 0
    h.closeT = 0
    stopGraceTracking()
  }, [stopGraceTracking])
  /* any non-hover close (Esc · outside click · route · click-toggle) must not
     leave a stale open/close timer or a dangling pointermove listener */
  useEffect(() => {
    if (!megaOpen) cancelHoverTimers()
  }, [megaOpen, cancelHoverTimers])
  useEffect(() => cancelHoverTimers, [cancelHoverTimers])

  const onMegaPointerEnter = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const h = hoverRef.current
      // re-entering trigger or panel: a pending grace close is void
      window.clearTimeout(h.closeT)
      h.closeT = 0
      stopGraceTracking()
      if (!megaOpen && !h.openT) {
        h.openT = window.setTimeout(() => {
          h.openT = 0
          kbOpenRef.current = false
          setMegaOpen(true)
        }, 70)
      }
    },
    [megaOpen, stopGraceTracking],
  )
  const onMegaPointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const h = hoverRef.current
      window.clearTimeout(h.openT)
      h.openT = 0
      if (!megaOpen) return
      // grace close + safe-triangle tracking toward the panel's top edge
      const now = performance.now()
      h.deadline = now + 250
      h.maxDeadline = now + 1200
      const panel = megaPanelRef.current
      if (panel) {
        const box = panel.getBoundingClientRect()
        const ax = e.clientX
        const ay = e.clientY
        const bx = box.left - 12
        const cx = box.right + 12
        const ty = box.top
        const onMove = (ev: PointerEvent) => {
          /* sign-of-cross-product point-in-triangle {A exit · B top-left ·
             C top-right}; the panel hangs BELOW the exit point so the test
             degenerates safely (never true) if layout ever flips */
          const px = ev.clientX
          const py = ev.clientY
          const d1 = (px - bx) * (ay - ty) - (ax - bx) * (py - ty)
          const d2 = (cx - bx) * (py - ty) // B→C edge is horizontal (both at ty)
          const d3 = (px - ax) * (ty - ay) - (cx - ax) * (py - ay)
          const neg = d1 < 0 || d2 < 0 || d3 < 0
          const pos = d1 > 0 || d2 > 0 || d3 > 0
          if (!(neg && pos)) {
            hoverRef.current.deadline = Math.min(performance.now() + 250, hoverRef.current.maxDeadline)
          }
        }
        graceMoveRef.current = onMove
        document.addEventListener('pointermove', onMove)
      }
      const tick = () => {
        const left = hoverRef.current.deadline - performance.now()
        if (left > 0) {
          hoverRef.current.closeT = window.setTimeout(tick, left)
          return
        }
        hoverRef.current.closeT = 0
        stopGraceTracking()
        setMegaOpen(false)
      }
      window.clearTimeout(h.closeT)
      h.closeT = window.setTimeout(tick, 250)
    },
    [megaOpen, stopGraceTracking],
  )

  /* roving arrow-key navigation across the flattened mega items (APG menu) */
  const onMegaKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = megaItemRefs.current.filter(Boolean) as HTMLAnchorElement[]
    if (items.length === 0) return
    const idx = items.indexOf(document.activeElement as HTMLAnchorElement)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      /* Tab leaves the menu. Without intervention the panel unmounts with
         focus still inside it and the browser restarts tabbing from <body>
         (focus drop). Park focus back on the trigger FIRST, then close — the
         default Tab action then continues naturally from the trigger
         (forward: the link after Product · Shift+Tab: the brand). */
      megaBtnRef.current?.focus()
      setMegaOpen(false)
    }
  }, [])

  /* ── sheet: Escape + scroll lock + focus trap (Tab cycles WITHIN the sheet) ──
     role="dialog" aria-modal needs a real trap or focus escapes to the page
     behind. We cycle Tab / Shift+Tab across the sheet's focusable set (querying
     it live on each Tab so it stays correct as the DOM changes), Escape closes
     and returns focus to the burger. */
  useEffect(() => {
    if (!sheetOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusables = () =>
      Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetOpen(false)
        burgerRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      // wrap at the edges; also pull focus back in if it has somehow escaped
      if (e.shiftKey) {
        if (active === first || !sheetRef.current?.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !sheetRef.current?.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    // focus the first focusable in the sheet
    requestAnimationFrame(() => {
      sheetRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    })
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [sheetOpen])

  return (
    <>
      <header className="v4nav" data-solid={solid} data-scrolled={scrolled} data-mega={megaOpen}>
        <div className="v4nav-capsule" ref={capsuleRef}>
        <nav className="v4nav-row" aria-label="Primary">
          {/* brand · the butterfly mark + wordmark */}
          <Link to="/" className="v4nav-brand" aria-label="Nika · home">
            <img src="/nika.svg" alt="" width={19} height={19} />
            nika
          </Link>

          {/* desktop rail · owns the ONE sliding hover pill */}
          <div
            className="v4nav-rail"
            ref={railRef}
            onPointerOver={(e) => {
              const el = railItemOf(e.target)
              if (el) {
                pillHot.current.hover = el
                syncPill()
              }
            }}
            onPointerLeave={() => {
              pillHot.current.hover = null
              syncPill()
            }}
            onFocus={(e) => {
              /* keyboard only — pointer clicks already carry the hover pill;
                 :focus-visible keeps a mouse press from double-driving it */
              const el = railItemOf(e.target)
              if (el && e.target instanceof Element && e.target.matches(':focus-visible')) {
                pillHot.current.focus = el
                syncPill()
              }
            }}
            onBlur={(e) => {
              if (!railRef.current?.contains(e.relatedTarget as Node)) {
                pillHot.current.focus = null
                syncPill()
              }
            }}
          >
            {/* the shared sliding highlight — purely decorative */}
            <span ref={pillRef} className="v4nav-pill" data-on="false" aria-hidden />

            {/* Product ▾ — the mega-menu disclosure. The wrap is the hover
                surface (trigger + panel are both inside it, DOM-wise) */}
            <div
              className="v4mega-wrap"
              ref={megaWrapRef}
              onPointerEnter={onMegaPointerEnter}
              onPointerLeave={onMegaPointerLeave}
            >
              <button
                ref={megaBtnRef}
                type="button"
                className="v4nav-link"
                data-open={megaOpen}
                aria-expanded={megaOpen}
                aria-controls={megaId}
                aria-haspopup="true"
                onClick={(e) => {
                  kbOpenRef.current = e.detail === 0 // keyboard "click"
                  setMegaOpen((v) => !v)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    kbOpenRef.current = true
                    if (megaOpen) megaItemRefs.current[0]?.focus()
                    else setMegaOpen(true)
                  }
                }}
              >
                Product
                <CaretGlyph />
              </button>

              {megaOpen ? (
                <div
                  id={megaId}
                  ref={megaPanelRef}
                  className="v4mega"
                  role="menu"
                  aria-label="Product"
                  onKeyDown={onMegaKeyDown}
                >
                  {PRODUCT_GROUPS.map((group) => (
                    <div key={group.title} className="v4mega-col">
                      <p className="v4mega-col-title" role="presentation">
                        {group.title}
                      </p>
                      {group.items.map((item) => {
                        const flatIdx = FLAT_PRODUCT_ITEMS.indexOf(item)
                        return (
                          <ItemLink
                            key={item.label}
                            item={item}
                            className="v4mega-item"
                            onSelect={() => setMegaOpen(false)}
                            refCb={(el) => {
                              megaItemRefs.current[flatIdx] = el
                            }}
                          />
                        )
                      })}
                    </div>
                  ))}

                  {/* the bottom rail · version truth (left · links /changelog)
                      + the one conversion CTA (right). Both are honest
                      menuitems: they join the roving arrow order after the
                      grouped items, and Tab still parks on the trigger. */}
                  <div className="v4mega-rail">
                    <Link
                      to="/changelog"
                      role="menuitem"
                      className="v4mega-rail-version"
                      onClick={() => setMegaOpen(false)}
                      ref={(el) => {
                        megaItemRefs.current[FLAT_PRODUCT_ITEMS.length] = el
                      }}
                    >
                      {ENGINE_VERSION} · shipping in the open
                    </Link>
                    <Link
                      to="/install"
                      role="menuitem"
                      className="v4mega-rail-install"
                      onClick={() => setMegaOpen(false)}
                      ref={(el) => {
                        megaItemRefs.current[FLAT_PRODUCT_ITEMS.length + 1] = el
                      }}
                    >
                      Install
                      <span className="v4mega-rail-arrow" aria-hidden>
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {/* flat top-level links */}
            {TOP_LINKS.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="v4nav-link"
                  {...(l.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  {l.label}
                  {l.newTab ? (
                    <span className="v4nav-ext-arrow" aria-hidden>
                      ↗
                    </span>
                  ) : null}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.href}
                  className="v4nav-link"
                  /* the active route keeps a persistent dim pill (pure CSS on
                     aria-current) under the sliding hover pill */
                  aria-current={
                    location.pathname === l.href || location.pathname.startsWith(`${l.href}/`)
                      ? 'page'
                      : undefined
                  }
                >
                  {l.label}
                </Link>
              ),
            )}
          </div>

          {/* right cluster */}
          <div className="v4nav-right">
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="v4nav-ghost"
              aria-label="Nika on GitHub"
            >
              <GitHubGlyph />
              <span className="v4nav-ghost-label">GitHub</span>
            </a>

            {/* the ONE solid CTA — the canonical /install deep link (docs/README/
               social share one stable URL; the old /#install anchor had none). */}
            <Link
              to="/install"
              className="v4nav-cta"
              aria-label="Install Nika"
            >
              <span className="v4nav-cta-glyph" aria-hidden>
                ❯
              </span>
              Install
            </Link>

            {/* mobile burger */}
            <button
              ref={burgerRef}
              type="button"
              className="v4nav-burger"
              aria-label="Open menu"
              aria-expanded={sheetOpen}
              aria-controls={sheetId}
              onClick={() => setSheetOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </nav>
        </div>
      </header>

      {/* the scroll sentinel · a 1px, pointer-events:none marker parked 24px
          down the document flow; leaving the viewport = "the page is in
          motion" (capsule compression + field-route solidification). */}
      <div
        ref={sentinelRef}
        aria-hidden
        style={{ position: 'absolute', top: 24, left: 0, height: 1, width: 1, pointerEvents: 'none' }}
      />

      {/* ── the mobile sheet ── */}
      {sheetOpen ? (
        <>
          <div className="v4sheet-scrim" onClick={() => setSheetOpen(false)} aria-hidden />
          <div
            id={sheetId}
            ref={sheetRef}
            className="v4sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="v4sheet-head">
              <Link to="/" className="v4nav-brand" aria-label="Nika · home">
                <img src="/nika.svg" alt="" width={19} height={19} />
                nika
              </Link>
              <button
                type="button"
                className="v4sheet-close"
                aria-label="Close menu"
                data-autofocus
                onClick={() => setSheetOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {PRODUCT_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="v4sheet-sectitle">{group.title}</p>
                {group.items.map((item) => (
                  <ItemLink
                    key={item.label}
                    item={item}
                    className="v4sheet-link"
                    onSelect={() => setSheetOpen(false)}
                  />
                ))}
              </div>
            ))}

            <div className="v4sheet-rule" />
            {TOP_LINKS.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  className="v4sheet-link"
                  {...(l.newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
                  onClick={() => setSheetOpen(false)}
                >
                  {l.label}
                  {l.newTab ? <span aria-hidden>↗</span> : null}
                </a>
              ) : (
                <Link key={l.label} to={l.href} className="v4sheet-link" onClick={() => setSheetOpen(false)}>
                  {l.label}
                </Link>
              ),
            )}
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="v4sheet-link"
              onClick={() => setSheetOpen(false)}
            >
              <GitHubGlyph size={16} />
              GitHub
            </a>

            <Link
              to="/install"
              className="v4sheet-cta"
              onClick={() => setSheetOpen(false)}
            >
              <span aria-hidden>❯</span>
              Install Nika
            </Link>
          </div>
        </>
      ) : null}
    </>
  )
}
