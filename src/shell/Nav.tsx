import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { REPO, DOCS, ENGINE_VERSION } from '../content'
import {
  NAV_BAR_LINKS,
  NAV_DOCTRINE,
  NAV_PRODUCT,
  NAV_REFERENCE,
  NAV_VERSION_PILL,
  type NavItem,
} from '../content/atlas-nav.generated'
import { useMagnetic } from '../fx/use-magnetic'
import { useFocusTrap, useFocusReturn } from '../lib/focus'
import './nav.css'
import { NK_ICONS } from '../icons/manifest'

/* ─── Nav · the v4 shared shell nav (monochrome blueprint) ────────────────────
   ONE nav for every route (mounted in RootLayout). The chrome is a
   PROJECTION since WO-3 (§4.11): the bar, both panels and the footer read
   atlas-nav.generated.ts — the Reference panel's items, counts and `soon`
   badges resolve against the language graph at compile time (a hub landing
   flips them in the same build · never an edit here).

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
   - `Product ▾` and `Reference ▾` are real grouped mega-menus (WAI-ARIA
     disclosure · ONE shared MegaDisclosure machine): full keyboard (Esc
     closes + returns focus, ↓/↑ move through items, Home/End jump, Tab parks
     focus back on the trigger before closing — no focus drop), closes on
     outside click / route change. On MOUSE each opens on HOVER with intent
     timing (~70ms in, so flybys never flash it · ~250ms grace out) and a
     SAFE TRIANGLE — while the pointer keeps moving inside the triangle from
     its exit point to the panel's top corners (i.e. traveling toward the
     panel) the grace deadline keeps extending, so the diagonal path to the
     far corner never slams the menu shut; parking anywhere else (another
     rail link) lets the grace expire. Opening one panel closes the other
     (the parent owns WHICH is open). Touch/pen never hover-open (per-event
     pointerType gate); click still toggles; keyboard is untouched.
     Semantics: role=menu/menuitem is used WITH the full APG keyboard
     contract implemented below.
   - descriptions live ONLY in the Product panel (featured-class · §4.11) —
     the Reference panel speaks label + count chip + soon badge, nothing
     else (the scannability verdict).
   - the VERSION PILL replaces the Changelog text link: the release signal
     rides the bar, reads ENGINE_VERSION (the release cascade's one truth),
     links /changelog.
   - one emphasized CTA (`Install`) — near-white on dark, NOT a blue pill.
   - mobile: the rail collapses to a burger → a right-side sheet (disclosure),
     with generous ≥44px touch targets and ≥16px text (no iOS zoom); the
     sheet renders the same groups as the panels (same data, one source).

   SSR-safe: no window/document at render; all browser access is in effects or
   event handlers. The fixed-position sentinel detection degrades gracefully —
   if the observer never fires (no hero on a page) the nav simply stays solid. */

/* routes that ship the blue field behind the nav — ONLY these earn the
   transparent-at-top nav (F5). Everywhere else the transparent nav's dark
   legibility scrim reads as a gray smudge over a plain/light page top
   (review P2-12), so field-less routes render SOLID from scroll 0. */
const FIELD_ROUTES = new Set(['/', '/manifesto'])

type MegaIconName = 'run' | 'verbs' | 'shield' | 'tiles' | 'terminal' | 'book' | 'butterfly'

/* ── the mega icon set · the icon library's hand-drawn ui/* family (16px
   grid · stroke 1.5 · round joins · monochrome dim, inked+accent on row
   hover via CSS). Bodies come from the generated manifest (design/icons.yaml
   → src/icons/manifest.ts). */
const MEGA_ICON_BODY: Record<MegaIconName, string> = {
  run: NK_ICONS['ui/run'].body,
  verbs: NK_ICONS['ui/verbs'].body,
  shield: NK_ICONS['ui/shield'].body,
  tiles: NK_ICONS['ui/tiles'].body,
  terminal: NK_ICONS['ui/terminal'].body,
  book: NK_ICONS['ui/book'].body,
  butterfly: NK_ICONS['ui/butterfly'].body,
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
      // safe sink: static build-time bodies from our own committed SVGs
      // (design/build.mjs) — no user input reaches this innerHTML
      dangerouslySetInnerHTML={{ __html: MEGA_ICON_BODY[name] }}
    />
  )
}

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

/* one nav item rendered as the right element type (menu panel or sheet) */
function ItemLink({
  item,
  className,
  onSelect,
  refCb,
  showDesc,
  menuitem,
}: {
  item: NavItem
  className: string
  onSelect: () => void
  refCb?: (el: HTMLAnchorElement | null) => void
  showDesc?: boolean
  /* true only under the mega panels' role="menu" — the sheet is a dialog
     with plain links (an orphan menuitem is an axe serious) */
  menuitem?: boolean
}) {
  const inner = (
    <>
      {item.icon ? (
        <span className="v4mega-icobox" aria-hidden>
          <MegaIcon name={item.icon as MegaIconName} />
        </span>
      ) : null}
      <span className="v4mega-text">
        <span className="v4mega-label">
          {item.label}
          {item.count != null && <span className="v4mega-chip">·{item.count}</span>}
          {item.slot && (
            <span className="v4mega-soon" title={item.title ?? 'the surface is owed'}>
              slot
            </span>
          )}
        </span>
        {showDesc && item.desc ? <span className="v4mega-desc">{item.desc}</span> : null}
      </span>
    </>
  )
  if (item.soon) {
    /* a hub that has not landed yet: an honest non-link (never a 404) —
       the compile flips it to a link the day the page ships */
    return (
      <span
        className={`${className} v4mega-item--soon`}
        title={item.slot_wave ? `ships with the ${item.slot_wave} wave` : 'landing soon'}
      >
        {inner}
        <span className="v4mega-soon" aria-hidden>
          soon
        </span>
      </span>
    )
  }
  const href = item.external && item.label === 'Docs' ? DOCS : item.external && item.label === 'GitHub' ? REPO : item.href
  if (item.to) {
    return (
      <Link ref={refCb} to={item.to} role={menuitem ? 'menuitem' : undefined} className={className} onClick={onSelect}>
        {inner}
      </Link>
    )
  }
  return (
    <a
      ref={refCb}
      href={href}
      role={menuitem ? 'menuitem' : undefined}
      className={className}
      onClick={onSelect}
      {...(href?.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {inner}
    </a>
  )
}

/* ─── MegaDisclosure · the ONE panel machine (two instances ride it) ─────────
   Owns its trigger, panel, roving item refs, hover-intent timers, safe
   triangle and placement. The parent owns WHICH panel is open (mutual
   exclusion) via open/onOpenChange. */
function MegaDisclosure({
  label,
  open,
  onOpenChange,
  capsuleRef,
  wide,
  ariaLabel,
  children,
}: {
  label: string
  open: boolean
  onOpenChange: (open: boolean) => void
  capsuleRef: React.RefObject<HTMLDivElement | null>
  wide?: boolean
  ariaLabel: string
  children: (ctx: {
    close: () => void
    registerItem: (idx: number) => (el: HTMLAnchorElement | null) => void
  }) => React.ReactNode
}) {
  const panelId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const kbOpenRef = useRef(false)

  /* placement · align the capsule-anchored panel under its trigger (its
     containing block is the CAPSULE so the 8px bottom gap survives the
     64→56 compression); LEFT tracks the trigger. One read, one write. */
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const capsule = capsuleRef.current
      const wrap = wrapRef.current
      const panel = panelRef.current
      if (!capsule || !wrap || !panel) return
      const x =
        wrap.getBoundingClientRect().left - capsule.getBoundingClientRect().left - capsule.clientLeft
      panel.style.left = `${x}px`
      /* wide panels can overflow the capsule's right edge — clamp */
      const overflow = x + panel.offsetWidth - capsule.clientWidth + 8
      if (overflow > 0) panel.style.left = `${Math.max(8, x - overflow)}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, capsuleRef])

  /* outside-click + Escape (returns focus to the trigger) */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onOpenChange(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  /* move focus to the first item ONLY on keyboard opens (pointer opens leave
     focus on the trigger — the F6 permanent-selection-box fix) */
  useEffect(() => {
    if (open && kbOpenRef.current) itemRefs.current.find(Boolean)?.focus()
  }, [open])

  /* hover-intent (mouse only) · open ~70ms in · ~250ms grace out · safe
     triangle toward the panel's top corners (see the file header) */
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
  useEffect(() => {
    if (!open) cancelHoverTimers()
  }, [open, cancelHoverTimers])
  useEffect(() => cancelHoverTimers, [cancelHoverTimers])

  const onPointerEnter = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const h = hoverRef.current
      window.clearTimeout(h.closeT)
      h.closeT = 0
      stopGraceTracking()
      if (!open && !h.openT) {
        h.openT = window.setTimeout(() => {
          h.openT = 0
          kbOpenRef.current = false
          onOpenChange(true)
        }, 70)
      }
    },
    [open, onOpenChange, stopGraceTracking],
  )
  const onPointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const h = hoverRef.current
      window.clearTimeout(h.openT)
      h.openT = 0
      if (!open) return
      const now = performance.now()
      h.deadline = now + 250
      h.maxDeadline = now + 1200
      const panel = panelRef.current
      if (panel) {
        const box = panel.getBoundingClientRect()
        const ax = e.clientX
        const ay = e.clientY
        const bx = box.left - 12
        const cx = box.right + 12
        const ty = box.top
        const onMove = (ev: PointerEvent) => {
          /* sign-of-cross-product point-in-triangle {A exit · B top-left ·
             C top-right}; degenerates safely if layout ever flips */
          const px = ev.clientX
          const py = ev.clientY
          const d1 = (px - bx) * (ay - ty) - (ax - bx) * (py - ty)
          const d2 = (cx - bx) * (py - ty)
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
        onOpenChange(false)
      }
      window.clearTimeout(h.closeT)
      h.closeT = window.setTimeout(tick, 250)
    },
    [open, onOpenChange, stopGraceTracking],
  )

  /* roving arrow-key navigation across the flattened items (APG menu) */
  const onKeyDownPanel = useCallback(
    (e: React.KeyboardEvent) => {
      const items = itemRefs.current.filter(Boolean) as HTMLAnchorElement[]
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
        /* park focus back on the trigger FIRST, then close — Tab continues
           naturally from the trigger (no focus drop) */
        btnRef.current?.focus()
        onOpenChange(false)
      }
    },
    [onOpenChange],
  )

  const registerItem = useCallback(
    (idx: number) => (el: HTMLAnchorElement | null) => {
      itemRefs.current[idx] = el
    },
    [],
  )
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <div
      className="v4mega-wrap"
      ref={wrapRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <button
        ref={btnRef}
        type="button"
        className="v4nav-link"
        data-open={open}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={(e) => {
          kbOpenRef.current = e.detail === 0
          onOpenChange(!open)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            kbOpenRef.current = true
            if (open) itemRefs.current.find(Boolean)?.focus()
            else onOpenChange(true)
          }
        }}
      >
        {label}
        <CaretGlyph />
      </button>

      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          className={`v4mega${wide ? ' v4mega--wide' : ''}`}
          role="menu"
          aria-label={ariaLabel}
          onKeyDown={onKeyDownPanel}
        >
          {children({ close, registerItem })}
        </div>
      ) : null}
    </div>
  )
}

export default function Nav() {
  const location = useLocation()
  /* `scrolled` = the page is in motion (>24px) — drives the capsule COMPRESSION.
     The FLOOR is the derived `solid` below: field-less routes prerender solid
     from scroll 0 (no transparent flash · P2-12), field routes ride transparent
     until the sentinel scrolls out. */
  const [scrolled, setScrolled] = useState(false)
  const [openPanel, setOpenPanel] = useState<null | 'product' | 'reference'>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const sheetRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  /* the nav CTA leans toward the hand (wave-I VFX · fine pointers only) */
  const installRef = useRef<HTMLAnchorElement>(null)
  useMagnetic(installRef)
  const railRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const capsuleRef = useRef<HTMLDivElement>(null)

  const sheetId = useId()

  /* ── the 24px scroll sentinel (see the header comment) ── */
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

  /* ── the sliding hover pill (see the header comment) ── */
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
        pill.dataset.on = 'false'
        return
      }
      const capBox = capsule.getBoundingClientRect()
      const box = hot.getBoundingClientRect()
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

  /* close everything on a real route change (guarded — never unconditional) */
  const lastLocRef = useRef(`${location.pathname}${location.hash}`)
  useEffect(() => {
    const key = `${location.pathname}${location.hash}`
    if (lastLocRef.current !== key) {
      lastLocRef.current = key
      setOpenPanel(null)
      setSheetOpen(false)
    }
  }, [location.pathname, location.hash])

  /* ── sheet: Escape + scroll lock + the shared focus duties (focus.ts ·
     WO-12 — the trap machinery this file pioneered now lives there; the
     burger return rides useFocusReturn instead of a hand call) ── */
  useFocusReturn(sheetOpen)
  useFocusTrap(sheetRef, sheetOpen)
  useEffect(() => {
    if (!sheetOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false)
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => {
      sheetRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    })
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [sheetOpen])

  /* the panels' flattened item counts (roving index bases) */
  const productItemCount = NAV_PRODUCT.reduce((n, g) => n + g.items.length, 0)

  return (
    <>
      <header
        className="v4nav"
        data-solid={solid}
        data-scrolled={scrolled}
        data-mega={openPanel !== null}
      >
        <div className="v4nav-capsule" ref={capsuleRef}>
        <nav
          className="v4nav-row"
          aria-label="Primary"
          itemScope
          itemType="https://schema.org/SiteNavigationElement"
        >
          {/* brand · the butterfly mark + wordmark */}
          <Link to="/" viewTransition className="v4nav-brand" aria-label="Nika · home">
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

            {/* Product ▾ · persuasion + try (authored · descs allowed) */}
            <MegaDisclosure
              label="Product"
              open={openPanel === 'product'}
              onOpenChange={(v) => setOpenPanel(v ? 'product' : null)}
              capsuleRef={capsuleRef}
              ariaLabel="Product"
            >
              {({ close, registerItem }) => (
                <>
                  {NAV_PRODUCT.map((group, gi) => (
                    <div key={group.col} className="v4mega-col">
                      <p className="v4mega-col-title" role="presentation">
                        {group.col}
                      </p>
                      {group.items.map((item, ii) => {
                        const flatIdx = NAV_PRODUCT.slice(0, gi).reduce((n, g) => n + g.items.length, 0) + ii
                        return (
                          <div key={item.label} className="v4mega-cell">
                            <ItemLink
                              item={item}
                              className="v4mega-item"
                              onSelect={close}
                              refCb={registerItem(flatIdx)}
                              showDesc
                              menuitem
                            />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  {/* the doctrine line · the SSOT promise as a nav row (§4.11) */}
                  <div className="v4mega-rail">
                    <Link
                      to={NAV_DOCTRINE.to}
                      role="menuitem"
                      className="v4mega-rail-version"
                      onClick={close}
                      ref={registerItem(productItemCount)}
                    >
                      {NAV_DOCTRINE.label} →
                    </Link>
                  </div>
                </>
              )}
            </MegaDisclosure>

            {/* Reference ▾ · the Atlas panel (generated · chips, no descs) */}
            <MegaDisclosure
              label="Reference"
              open={openPanel === 'reference'}
              onOpenChange={(v) => setOpenPanel(v ? 'reference' : null)}
              capsuleRef={capsuleRef}
              wide
              ariaLabel="Reference"
            >
              {({ close, registerItem }) => (
                <>
                  <div className="v4mega-feat">
                    <ItemLink
                      item={NAV_REFERENCE.featured}
                      className="v4mega-item v4mega-item--feat"
                      onSelect={close}
                      refCb={registerItem(0)}
                      menuitem
                      showDesc
                    />
                  </div>
                  <div className="v4mega-refcols">
                    {NAV_REFERENCE.cols.map((group, gi) => (
                      <div key={group.col} className="v4mega-col">
                        <p className="v4mega-col-title" role="presentation">
                          {group.col}
                        </p>
                        {group.items.map((item, ii) => {
                          const flatIdx =
                            1 + NAV_REFERENCE.cols.slice(0, gi).reduce((n, g) => n + g.items.length, 0) + ii
                          return (
                            <div key={item.label} className="v4mega-cell">
                              <ItemLink
                                item={item}
                                className="v4mega-item v4mega-item--ref"
                                onSelect={close}
                                refCb={registerItem(flatIdx)}
                                menuitem
                              />
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </MegaDisclosure>

            {/* flat top-level links (generated bar data · Docs ↗ · Blog) */}
            {NAV_BAR_LINKS.map((l) =>
              l.external || l.href ? (
                <a
                  key={l.label}
                  href={l.external && l.label === 'Docs' ? DOCS : l.href}
                  className="v4nav-link"
                  itemProp="url"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span itemProp="name">{l.label}</span>
                  <span className="v4nav-ext-arrow" aria-hidden>
                    ↗
                  </span>
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to!}
                  viewTransition
                  className="v4nav-link"
                  itemProp="url"
                  aria-current={
                    location.pathname === l.to || location.pathname.startsWith(`${l.to}/`)
                      ? 'page'
                      : undefined
                  }
                >
                  <span itemProp="name">{l.label}</span>
                </Link>
              ),
            )}
          </div>

          {/* right cluster */}
          <div className="v4nav-right">
            {/* the version pill · the release signal rides the bar (reads
                ENGINE_VERSION — the release cascade's one truth) */}
            <Link
              to={NAV_VERSION_PILL.to}
              className="v4nav-vpill"
              title={NAV_VERSION_PILL.title}
              aria-label={`${ENGINE_VERSION} · changelog`}
            >
              {ENGINE_VERSION}
            </Link>
            {/* the palette trigger (arc 13 W2) · fires the shell's listener —
                no prop drilling; hidden on phones (command-k.css) */}
            <button
              type="button"
              className="ck-trigger"
              aria-label="Search the site (Command K)"
              onClick={() => window.dispatchEvent(new Event('ck:open'))}
            >
              <span aria-hidden>⌘</span>K
            </button>
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

            {/* the ONE solid CTA — the canonical /install deep link */}
            <Link
              ref={installRef}
              to="/install"
              className="v4nav-cta vfx-mag"
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

      {/* the scroll sentinel */}
      <div
        ref={sentinelRef}
        aria-hidden
        style={{ position: 'absolute', top: 24, left: 0, height: 1, width: 1, pointerEvents: 'none' }}
      />

      {/* ── the mobile sheet · the same groups, one source (§4.11 mobile) ── */}
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

            {/* the map first (the featured row's sheet seat) */}
            <ItemLink
              item={NAV_REFERENCE.featured}
              className="v4sheet-link"
              onSelect={() => setSheetOpen(false)}
            />

            {NAV_PRODUCT.map((group) => (
              <div key={group.col}>
                <p className="v4sheet-sectitle">{group.col}</p>
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

            {NAV_REFERENCE.cols.map((group) => (
              <div key={group.col}>
                <p className="v4sheet-sectitle">{group.col}</p>
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
            {NAV_BAR_LINKS.map((l) =>
              l.external || l.href ? (
                <a
                  key={l.label}
                  href={l.external && l.label === 'Docs' ? DOCS : l.href}
                  className="v4sheet-link"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setSheetOpen(false)}
                >
                  {l.label}
                  <span aria-hidden>↗</span>
                </a>
              ) : (
                <Link key={l.label} to={l.to!} className="v4sheet-link" onClick={() => setSheetOpen(false)}>
                  {l.label}
                </Link>
              ),
            )}
            <Link to={NAV_VERSION_PILL.to} className="v4sheet-link" onClick={() => setSheetOpen(false)}>
              {ENGINE_VERSION} · changelog
            </Link>
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
