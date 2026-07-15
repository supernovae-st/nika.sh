import { Link, useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { useHydrated } from '../lib/use-hydrated'
import { REPO, SPEC, DOCS, ENGINE_VERSION } from '../content'
import type { FunnelEvent } from '../lib/track'
import { variantsFor } from '../lib/i18n'
import { FOOTER_COLS, FOOTER_MACHINE, type NavItem } from '../content/atlas-nav.generated'
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
   atlas-nav.generated.ts (one source, two projections, zero drift). The
   FOR MACHINES row names the site's own machine surfaces (the agents-first
   identity, said in the chrome). */

/* the signature reveal · lazy so it never enters any route's critical bundle
   (in-view only; the prerendered fallback below is the no-JS truth) */
const FooterSignature = lazy(() => import('../fx/FooterSignature'))

/* the funnel wiring the projection must not drop (the delegated listener in
   RootLayout reads [data-track]): which routes are funnel doors is a SHELL
   concern, so the map lives here — the nav descriptor stays structure-only. */
const FOOTER_TRACK: Record<string, FunnelEvent> = { '/convert': 'convert-open' }

/* the locale switcher row · SSR-identical (variants derive from the pathname
   + the static i18n registry, no client state) — pages without variants
   render nothing at all */
function LocaleSwitcher() {
  const { pathname } = useLocation()
  const variants = variantsFor(pathname)
  if (variants.length < 2) return null
  return (
    <nav className="sitefoot-langs" aria-label="Languages">
      <span className="sitefoot-machines-kick">languages</span>
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
    </nav>
  )
}

function FooterLink({ item }: { item: NavItem }) {
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
  const fxReady = useHydrated()
  const staticSig = (
    <div className="fsig">
      <img src="/nika.svg" alt="" width={170} height={170} loading="lazy" />
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
  return (
    <footer className="theme-dark v4sec" aria-label="Site footer">
      <div className="v4sec-wrap v4cta-wrap sitefoot-wrap">
        {/* THE SIGNATURE · the continuous living butterfly (F3) — Home
            renders it above the final CTA instead (signature={false}:
            one mark, one close) */}
        {signature && <SignatureMark />}

        {/* THE MAP ROW · the complete card opens on its cover (§4.12) */}
        <div className="sitefoot-maprow">
          <Link to="/map" className="sitefoot-maplink">
            <span aria-hidden className="sitefoot-mapstar">
              ★
            </span>
            The map · every page, one graph
          </Link>
          <span className="sitefoot-doctrine">Every claim on this site derives from the spec</span>
        </div>

        {/* THE COLUMNS · five, projected (the anatomy trio = the Reference
            panel's columns + extras · learn/build + project = authored) */}
        <nav className="sitefoot-cols sitefoot-cols--five" aria-label="Site map">
          {FOOTER_COLS.map((col) => (
            <div className="sitefoot-col" key={col.kick}>
              <p className="sitefoot-kick">{col.kick}</p>
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

        {/* FOR MACHINES · the site names its own machine surfaces */}
        <p className="sitefoot-machines">
          <span className="sitefoot-machines-kick">for machines</span>
          {FOOTER_MACHINE.map((m) => (
            <a key={m.href} href={m.href} className="sitefoot-machine-link">
              {m.label}
            </a>
          ))}
        </p>

        {/* THE LANGUAGES ROW · rendered ONLY when this page ships variants
            (the §4bis anti-slop law — today the manifesto family; L1 pages
            join at WO-10 through the i18n registry, zero edits here) */}
        <LocaleSwitcher />

        {/* ─── SUPERNOVAE · the footer — KEPT INTACT (operator lock). The per-letter
             float wave + hover lift wordmark, the studio line, the founders, and
             the free-software footer rule. Verbatim from the v3 close. ─── */}
        <a
          href="https://supernovae.studio"
          target="_blank"
          rel="noreferrer"
          className="supernovae-type mt-32 block w-full transition-opacity hover:opacity-90"
          aria-label="SuperNovae Studio"
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
        <p className="mono mt-5 flex flex-wrap items-center justify-center gap-x-6 text-[12px] text-[var(--fg-dim)]">
          <a
            href="https://x.com/ThibautMelen"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
          >
            𝕏 @ThibautMelen
          </a>
          <span aria-hidden className="text-[var(--fg-ghost)]">
            ·
          </span>
          <a
            href="https://x.com/ncella_"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
          >
            𝕏 @ncella_
          </a>
        </p>

        <div
          className="mono mt-20 flex w-full flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12px] text-[var(--fg-ghost)]"
          style={{ borderColor: 'var(--hair)' }}
        >
          {/* the exposed-state line (usgraphics register): what's deployed, in
              mono — the ONE hand-maintained version const + the real license +
              the ship log. No build SHA: the deploy SHA isn't knowable
              statically, and we don't fake state. */}
          <span className="flex items-center gap-2">
            <img src="/nika.svg" alt="" width={13} height={13} style={{ opacity: 0.7 }} />
            <span>
              PROD {ENGINE_VERSION} · AGPL-3.0-or-later ·{' '}
              <Link
                to="/changelog"
                className="underline decoration-1 underline-offset-2 transition-colors hover:text-[var(--fg-mute)]"
              >
                changelog
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
