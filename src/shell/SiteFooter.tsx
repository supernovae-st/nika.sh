import { Link, useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { useHydrated } from '../lib/use-hydrated'
import { useRevealOnce } from '../sections/use-reveal-once'
import { prefersLiteData } from '../lib/save-data'
import { REPO, SPEC, DOCS, ENGINE_VERSION } from '../content'
import type { FunnelEvent } from '../lib/track'
import { variantsFor } from '../lib/i18n'
/* the first three footer columns EXTEND the Reference panel's, so the panel is
   serialized once and composed at render rather than shipped twice in the
   entry chunk. `footerRows` is emitted beside the data so this component and
   its gates read the footer through the same composer. */
import {
  FOOTER_COLS,
  FOOTER_MACHINE,
  type NavItem,
} from '../content/lens-nav.generated'
import { NikaIcon } from '../icons/Icon'
import type { NikaIconId } from '../icons/manifest'
/* the registers strip DERIVES from the same generated registry the rooms
   render — a new family lands its footer door with its descriptor flip,
   never a hand edit (the complete-card law, mechanised) */
import { MEMBER_ROOM_FAMILIES } from '../content/member-rooms.generated'
import '../sections/v4-home.css'

/* ─── SiteFooter · the ONE footer, every route (F7) ───────────────────────────
   Extracted VERBATIM from FinalCTA (the operator-locked SUPERNOVAE block +
   the PROD rule) plus the F3 living-butterfly signature above it. Mounted by
   RootLayout on every non-home route; Home keeps it inside FinalCTA (the
   close beat owns its rhythm there). One footer register everywhere.

   THE SECOND PROJECTION (§4.12 · WO-3): the nav answers « where am I
   going » (two curated panels), the footer answers « what exists » — the
   complete card. Its first three columns ARE the Reference panel's columns
   plus their extras, the last two are authored intent — all five read
   lens-nav.generated.ts (one source, two projections, zero drift). The
   FOR MACHINES row names the site's own machine surfaces (the agents-first
   identity, said in the chrome). */

/* the signature reveal · lazy so it never enters any route's critical bundle
   (in-view only; the prerendered fallback below is the no-JS truth) */
const FooterSignature = lazy(() => import('../fx/FooterSignature'))

/* LES BOIS · the map as a neural tree (lazy — the zero-entry law). The
   grove's leaves are REAL links rendered by the chunk; until it mounts
   (or without JS) the plain columns below remain the index — the
   `:has(.grove)` rule swaps them only when the tree actually stands. */
const FooterGrove = lazy(() => import('../fx/FooterGrove'))

/* the funnel wiring the projection must not drop (the delegated listener in
   RootLayout reads [data-track]): which routes are funnel doors is a SHELL
   concern, so the map lives here — the nav descriptor stays structure-only. */
const FOOTER_TRACK: Record<string, FunnelEvent> = { '/convert': 'convert-open' }

/* each world wears its glyph from the icon ontology (design/icons.yaml →
   NK_ICONS · ink law: currentColor, never a verb hue on static chrome).
   Order = FOOTER_COLS order — the descriptor stays structure-only, the
   shell owns the dressing (the FOOTER_TRACK precedent). */
const WORLD_ICONS: NikaIconId[] = [
  'ui/run', // how it works · the loop
  'ui/book', // the language · the spec
  'ui/tiles', // workflows · the corpus
  'builtin/inspect', // what it knows · the catalog lens
  'ui/terminal', // get it running
  'ui/butterfly', // the project · the mark itself
]

/* the social rail · the studio's REAL doors only (no invented handles):
   the repo, the docs, the two founders. Icons from the ontology's
   social/* set — the desktop SVGs, finally seated. The founders keep
   their visible handles (the altar lock: nothing lost, icons added). */
const SOCIAL_RAIL: { icon: NikaIconId; label: string; href: string; text?: string }[] = [
  { icon: 'social/github', label: 'GitHub · supernovae-st/nika', href: REPO },
  { icon: 'social/documentation', label: 'Documentation', href: DOCS },
  { icon: 'social/x', label: 'X · @ThibautMelen', href: 'https://x.com/ThibautMelen', text: '@ThibautMelen' },
  { icon: 'social/x', label: 'X · @ncella_', href: 'https://x.com/ncella_', text: '@ncella_' },
]

/* the locale switcher row · SSR-identical (variants derive from the pathname
   + the static i18n registry, no client state) — pages without variants
   render nothing at all */
function LocaleSwitcher() {
  const { pathname } = useLocation()
  const variants = variantsFor(pathname)
  if (variants.length < 2) return null
  return (
    <nav className="sitefoot-langs" aria-label="Languages" data-rise style={{ ['--rise-delay' as string]: '230ms' }}>
      <span className="sitefoot-machines-kick">languages</span>
      <span className="sitefoot-machine-links">
        {variants.map(({ locale, path }) => (
          <Link
            key={locale.bcp47}
            to={path}
            lang={locale.bcp47}
            aria-current={path === pathname ? 'page' : undefined}
            className="sitefoot-lang-link"
          >
            {locale.label}
          </Link>
        ))}
      </span>
    </nav>
  )
}

function FooterLink({ item }: { item: NavItem }) {
  /* an anchored sub-door (one path, one door · §4.11): the footer keeps the
     flat list (completeness is its law) but marks the containment — § glyph,
     the deep link does the landing */
  if (item.sub) {
    return (
      <Link to={item.to!} className="sitefoot-link sitefoot-link--sub">
        <span aria-hidden>§ </span>
        {item.label}
      </Link>
    )
  }
  if (item.soon) {
    return (
      <span
        className="sitefoot-link sitefoot-link--soon"
        title={item.slot_wave ? `ships with the ${item.slot_wave} wave` : 'landing soon'}
      >
        {item.label}
        <span className="sitefoot-soon" aria-hidden>
          soon
        </span>
      </span>
    )
  }
  if (item.to) {
    return (
      <Link to={item.to} className="sitefoot-link" data-track={FOOTER_TRACK[item.to]}>
        {item.label}
      </Link>
    )
  }
  const href = item.external && item.label === 'Docs' ? DOCS : item.external && item.label === 'GitHub' ? REPO : item.href
  return (
    <a href={href} target="_blank" rel="noreferrer" className="sitefoot-link" title={item.title}>
      {item.label}
      <span aria-hidden className="sitefoot-ext acue acue--ext">
        {' '}
        ↗
      </span>
    </a>
  )
}

/* THE SIGNATURE · the living butterfly + its museum-plate caption (F3).
   Exported: Home lifts it ABOVE the final CTA (the mark OPENS the close —
   operator call), every other route keeps it at the footer's top. The lazy
   mount is POST-hydration only (W12a · the #419 fix): with renderToString
   SSG, a <Suspense> in the server tree throws React #419 on the client.
   The static butterfly is the SSG/no-JS truth; the living particles take
   over right after hydration (the shared useHydrated gate). */
export function SignatureMark() {
  /* W-H: the particle chunk is decoration — a lite-data visitor keeps the
     static butterfly (the SSG/no-JS truth), zero extra bytes */
  const fxReady = useHydrated() && !prefersLiteData()
  /* the static mark mirrors the live layout (stage + centered fallback):
     the hydration swap moves ZERO pixels — no CLS when the canvas takes over */
  const staticSig = (
    <div className="fsig">
      <div className="fsig-stage">
        <img src="/nika.svg" alt="" className="fsig-fallback" width={170} height={170} loading="lazy" />
      </div>
      <p className="fsig-caption">the noise becomes the file.</p>
    </div>
  )
  if (!fxReady) return staticSig
  return (
    <Suspense fallback={staticSig}>
      <FooterSignature />
    </Suspense>
  )
}

export default function SiteFooter({ signature = true }: { signature?: boolean }) {
  /* the shared entrance · the plate's bands rise once as the footer scrolls
     into view (the site's ONE reveal grammar — observer + safety net; SSR,
     no-JS and reduced-motion stay fully visible by the same laws as every
     other v4 section) */
  const ref = useRevealOnce<HTMLElement>()
  /* the sky mounts post-hydration only (the FooterSignature law) and never
     for a lite-data visitor — the reserved band of grain is the honest
     fallback either way */
  const skyReady = useHydrated() && !prefersLiteData()

  /* the grove's geometry rides the lazy chunk (computeGrove) — the shell
     only decides WHEN the tree may stand: post-hydration, wide pointer
     surfaces, never lite-data */
  const groveReady = skyReady
  return (
    /* lang="en" · see the note on the nav: the footer is English on every
       page, including the ones the document declares as French */
    <footer
      ref={ref}
      className={`theme-dark v4sec sitefoot${signature ? ' sitefoot--melt' : ''}`}
      aria-label="Site footer"
      lang="en"
    >
      {/* the melt field · on routed pages (signature=true) the grain BLOOMS in
          over the signature zone instead of snapping at the seam (page
          sections carry no grain — the old element-wide tile WAS the visible
          cut), then the ground deepens under the altar. Home (signature=false)
          sits INSIDE the grained CTA section: its grain stays continuous from
          the first pixel — masking it there would cut the field the other way. */}
      <div aria-hidden className="sitefoot-field" />
      <div className="v4sec-wrap v4cta-wrap sitefoot-wrap">
        {/* LES BOIS · the map as a neural tree: the ROOT (✦ SPEC, where the
            noise becomes the file) at the bottom center, antler branches
            rising around the living butterfly, every internal door a
            LABELED leaf — the tree IS the index on wide screens. The
            wrapper is the SSR truth (root · caption · the map door ·
            doctrine · butterfly); the branches and leaves stand with the
            chunk. Home passes signature=false and keeps its butterfly
            above the CTA — its grove grows leaves around an empty crown. */}
        <div className="sitefoot-grove" data-rise>
          {groveReady ? (
            <Suspense fallback={null}>
              <FooterGrove />
            </Suspense>
          ) : null}
          {signature && (
            <div className="grove-crown" aria-hidden>
              <SignatureMark />
            </div>
          )}
          <div className="grove-root-plate">
            <p className="grove-caption" aria-hidden>
              the noise becomes the file.
            </p>
            <Link to="/map" className="grove-map">
              THE MAP
              <span aria-hidden className="acue acue--r">
                {' '}
                →
              </span>
            </Link>
          </div>
          <span className="grove-doctrine">Every claim on this site derives from the spec</span>
        </div>

        {/* THE COLUMNS · one per WORLD, authored in the descriptor. They used
            to MIRROR the Reference panel's columns to avoid serializing them
            twice; the panels died with the nav table rase (2026-08-02) and the
            footer carries its own rows now — one source, one map. */}
        <nav className="sitefoot-cols sitefoot-cols--six" aria-label="Site map">
          {FOOTER_COLS.map((col, i) => (
            <div
              className="sitefoot-col"
              key={col.kick}
              data-rise
              data-world={i}
              style={{ ['--rise-delay' as string]: `${60 + i * 40}ms` }}
            >
              <p className="sitefoot-kick">
                {/* the world's glyph + its figure number · HUD ink, lights on
                    drawer hover */}
                <span aria-hidden className="sitefoot-kick-ic">
                  <NikaIcon id={WORLD_ICONS[i] ?? 'ui/tiles'} size={14} />
                </span>
                <span aria-hidden className="sitefoot-kick-idx">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {col.kick}
              </p>
              <ul className="sitefoot-list">
                {col.items.map((l) => (
                  <li key={l.label}>
                    <FooterLink item={l} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* THE REGISTERS · every roomed family's root, derived — the strip a
            new family joins by descriptor flip (the coverage gate's floor) */}
        <p className="sitefoot-machines sitefoot-registers" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
          <span className="sitefoot-machines-kick">the registers</span>
          <span className="sitefoot-machine-links">
            {Object.keys(MEMBER_ROOM_FAMILIES).map((f) => (
              <Link key={f} to={`/${f}`} className="sitefoot-machine-link">
                {f}
              </Link>
            ))}
          </span>
        </p>

        {/* FOR MACHINES · the site names its own machine surfaces */}
        <p className="sitefoot-machines" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          <span className="sitefoot-machines-kick">for machines</span>
          <span className="sitefoot-machine-links">
            {FOOTER_MACHINE.map((m) => (
              <a key={m.href} href={m.href} className="sitefoot-machine-link">
                {m.label}
              </a>
            ))}
          </span>
        </p>

        {/* THE LANGUAGES ROW · rendered ONLY when this page ships variants
            (the §4bis anti-slop law — today the manifesto family; L1 pages
            join at WO-10 through the i18n registry, zero edits here) */}
        <LocaleSwitcher />

        {/* ─── SUPERNOVAE · the footer — KEPT INTACT (operator lock). The per-letter
             float wave + hover lift wordmark, the studio line, the founders, and
             the free-software footer rule. Verbatim from the v3 close; only the
             band rhythm around it was recomposed (2026-08-03 cabinet pass). ─── */}
        <a
          href="https://supernovae.studio"
          target="_blank"
          rel="noreferrer"
          className="supernovae-type mt-10 block w-full transition-opacity hover:opacity-90"
          aria-label="SuperNovae Studio"
          data-rise
          style={{ ['--rise-delay' as string]: '280ms' }}
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
        {/* the social rail · the studio's doors as machined icon seats (the
            ontology's social/* set — the desktop SVGs). Replaces the bare
            text handles: same two founders, plus the repo and the docs,
            each seat a real ≥44px target with its name for the tree. */}
        <p className="sitefoot-social mt-5" data-rise style={{ ['--rise-delay' as string]: '320ms' }}>
          {SOCIAL_RAIL.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="sitefoot-social-seat"
              aria-label={s.text ? undefined : s.label}
              title={s.label}
            >
              <NikaIcon id={s.icon} size={17} />
              {s.text ? <span className="sitefoot-social-handle">{s.text}</span> : null}
            </a>
          ))}
        </p>

        <div className="mono mt-12 flex w-full flex-wrap items-center justify-between gap-3 pt-6 text-[12px] text-[var(--fg-ghost)]">
          {/* the exposed-state line (usgraphics register): what's deployed, in
              mono — the ONE hand-maintained version const + the real license +
              the ship log. No build SHA: the deploy SHA isn't knowable
              statically, and we don't fake state. Every state word is a door
              (operator 2026-08-03): the version opens its release room, the
              license opens the LICENSE file itself. The rule above the bar
              died the same evening as the seam hairline — the altar's void
              is the separation. */}
          <span className="flex items-center gap-2">
            <img src="/nika.svg" alt="" width={13} height={13} style={{ opacity: 0.7 }} />
            <span>
              <Link
                to={`/releases/${ENGINE_VERSION}`}
                className="underline decoration-1 underline-offset-2 transition-colors hover:text-[var(--fg-mute)]"
              >
                PROD {ENGINE_VERSION}
              </Link>{' '}
              ·{' '}
              <a
                href={`${REPO}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-1 underline-offset-2 transition-colors hover:text-[var(--fg-mute)]"
              >
                AGPL-3.0-or-later
              </a>{' '}
              ·{' '}
              <Link
                to="/changelog"
                className="underline decoration-1 underline-offset-2 transition-colors hover:text-[var(--fg-mute)]"
              >
                changelog
              </Link>{' '}
              ·{' '}
              <Link
                to="/timeline"
                className="underline decoration-1 underline-offset-2 transition-colors hover:text-[var(--fg-mute)]"
              >
                timeline
              </Link>
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-5">
            <a
              href="/.well-known/security.txt"
              className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
            >
              security.txt
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
            >
              GitHub
            </a>
            <a
              href={SPEC}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
            >
              Spec
            </a>
            <a
              href={DOCS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
            >
              Docs
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
