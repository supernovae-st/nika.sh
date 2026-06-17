import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { REPO, SPEC, DOCS } from '../content'
import './shell.css'

/* ─── Nav · the v4 shared shell nav (monochrome blueprint) ────────────────────
   ONE nav for every route (mounted in RootLayout). Replaces the v3 glass pill.

   Register: sovereign-engineering-instrument — austere, hairline 1px rules, a
   FIG/blueprint feel. Grayscale only; the lone color is the global EdgeAurora.

   Behaviour
   - sticky/fixed · transparent OVER the hero · solid (bg-bg/78 + 1px border +
     blur) once a hero sentinel scrolls out of view (IntersectionObserver).
   - `Product ▾` is a real grouped mega-menu (WAI-ARIA disclosure): full keyboard
     (Esc closes + returns focus, ↓/↑ move through items, Home/End jump), focus
     trapped to the panel while open, closes on outside click / route change.
   - one emphasized CTA (`Install`) — near-white on dark, NOT a blue pill.
   - mobile: the rail collapses to a burger → a right-side sheet (disclosure),
     with generous ≥44px touch targets and ≥16px text (no iOS zoom).

   SSR-safe: no window/document at render; all browser access is in effects or
   event handlers. The fixed-position sentinel detection degrades gracefully —
   if the observer never fires (no hero on a page) the nav simply stays solid. */

interface MegaItem {
  label: string
  desc: string
  glyph: string
  to?: string // internal RR route
  href?: string // home anchor (/#x) or external
  external?: boolean
}

interface MegaGroup {
  title: string
  items: MegaItem[]
}

/* the Product mega-menu · two grouped columns (Language · Workflows + Learn).
   Internal routes use RR <Link>; home anchors use /#x; externals open a tab. */
const PRODUCT_GROUPS: MegaGroup[] = [
  {
    title: 'Language',
    items: [
      { label: 'The language', desc: 'One file, the whole workflow', glyph: '❯', href: '/#language' },
      { label: 'The four verbs', desc: 'infer · exec · invoke · agent', glyph: '◆', href: '/#verbs' },
      { label: 'Use cases', desc: 'Real workflows from the spec', glyph: '◇', href: '/#use-cases' },
    ],
  },
  {
    title: 'Build · Learn',
    items: [
      { label: 'Playground', desc: 'Write & run in the browser', glyph: '▷', to: '/play' },
      { label: 'Learn it in 5 min', desc: 'The quickstart', glyph: '✦', to: '/learn' },
      { label: 'Manifesto', desc: 'The drum of liberation', glyph: '∴', to: '/manifesto' },
    ],
  },
]

/* the flat top-level links after Product */
const TOP_LINKS: { label: string; href: string; external?: boolean; newTab?: boolean }[] = [
  { label: 'Docs', href: DOCS, external: true },
  { label: 'Spec', href: SPEC, external: true, newTab: true },
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
      <span className="v4mega-glyph" aria-hidden>
        {item.glyph}
      </span>
      <span>
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
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const megaWrapRef = useRef<HTMLDivElement>(null)
  const megaBtnRef = useRef<HTMLButtonElement>(null)
  const megaItemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const sheetRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const megaId = useId()
  const sheetId = useId()

  /* ── nav solidifies once the hero sentinel scrolls past the top ──
     The sentinel is a 1px marker placed just under the nav height. While it is
     in view (top of page over the hero) the nav stays transparent; once it
     leaves, the nav goes solid. Pages without a hero keep the nav solid. */
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
  }, [location.pathname])

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

  /* ── mega-menu: move focus to the first item when it opens ── */
  useEffect(() => {
    if (megaOpen) megaItemRefs.current[0]?.focus()
  }, [megaOpen])

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
      // let Tab fall through but close the panel so focus continues in the bar
      setMegaOpen(false)
    }
  }, [])

  /* ── sheet: Escape + scroll lock + focus the close button ── */
  useEffect(() => {
    if (!sheetOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetOpen(false)
        burgerRef.current?.focus()
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

  const isHome = location.pathname === '/'

  return (
    <>
      <header className="v4nav" data-scrolled={scrolled} data-mega={megaOpen}>
        <nav className="v4nav-row" aria-label="Primary">
          {/* brand · the butterfly mark + wordmark */}
          <Link to="/" className="v4nav-brand" aria-label="Nika — home">
            <img src="/nika.svg" alt="" width={19} height={19} />
            nika
          </Link>

          {/* desktop rail */}
          <div className="v4nav-rail">
            {/* Product ▾ — the mega-menu disclosure */}
            <div className="v4mega-wrap" ref={megaWrapRef}>
              <button
                ref={megaBtnRef}
                type="button"
                className="v4nav-link"
                data-open={megaOpen}
                aria-expanded={megaOpen}
                aria-controls={megaId}
                aria-haspopup="true"
                onClick={() => setMegaOpen((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setMegaOpen(true)
                  }
                }}
              >
                Product
                <CaretGlyph />
              </button>

              {megaOpen ? (
                <div
                  id={megaId}
                  className="v4mega"
                  role="menu"
                  aria-label="Product"
                  onKeyDown={onMegaKeyDown}
                >
                  {PRODUCT_GROUPS.map((group) => (
                    <div key={group.title} style={{ display: 'contents' }}>
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
                <Link key={l.label} to={l.href} className="v4nav-link">
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

            {/* the ONE solid CTA — anchors the hero install on home, jumps there otherwise */}
            <a
              href={isHome ? '#install' : '/#install'}
              className="v4nav-cta"
              aria-label="Install Nika"
            >
              <span className="v4nav-cta-glyph" aria-hidden>
                ❯
              </span>
              Install
            </a>

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
      </header>

      {/* the hero sentinel · fixed just under the nav; toggles solidification.
          A 1px, pointer-events:none marker at the top of the document flow. */}
      <div
        ref={sentinelRef}
        aria-hidden
        style={{ position: 'absolute', top: 1, left: 0, height: 1, width: 1, pointerEvents: 'none' }}
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
              <Link to="/" className="v4nav-brand" aria-label="Nika — home">
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

            <a
              href={isHome ? '#install' : '/#install'}
              className="v4sheet-cta"
              onClick={() => setSheetOpen(false)}
            >
              <span aria-hidden>❯</span>
              Install Nika
            </a>
          </div>
        </>
      ) : null}
    </>
  )
}
