import { Link } from 'react-router'
import { lazy, Suspense } from 'react'
import { REPO, SPEC, DOCS, ENGINE_VERSION } from '../content'
import '../sections/v4-home.css'

/* ─── SiteFooter · the ONE footer, every route (F7) ───────────────────────────
   Extracted VERBATIM from FinalCTA (the operator-locked SUPERNOVAE block +
   the PROD rule) plus the F3 living-butterfly signature above it. Mounted by
   RootLayout on every non-home route; Home keeps it inside FinalCTA (the
   close beat owns its rhythm there). One footer register everywhere — the
   theme-drift class the operator flagged (F7) ends here. */

/* the signature reveal · lazy so it never enters any route's critical bundle
   (in-view only; the prerendered fallback below is the no-JS truth) */
const FooterSignature = lazy(() => import('../fx/FooterSignature'))

export default function SiteFooter() {
  return (
    <footer className="theme-dark v4sec" aria-label="Site footer">
      <div className="v4sec-wrap v4cta-wrap sitefoot-wrap">
        {/* THE SIGNATURE · the continuous living butterfly (F3) */}
        <Suspense
          fallback={
            <div className="fsig">
              <img src="/nika.svg" alt="" width={170} height={170} loading="lazy" />
              <p className="fsig-caption">the noise becomes the file.</p>
            </div>
          }
        >
          <FooterSignature />
        </Suspense>

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
            href="https://x.com/niccela"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--fg-mute)]"
          >
            𝕏 @niccela
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
