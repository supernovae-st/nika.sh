import { Link } from 'react-router'
import { lazy, Suspense } from 'react'
import { useHydrated } from '../lib/use-hydrated'
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

/* the link columns (W8 · the Cursor/ElevenLabs footer grammar, sized honestly
   for one OSS product) — every route the site actually has + the canonical
   external surfaces. Internal = <Link>, external = <a ↗>. */
const COLS: {
  kick: string
  links: { label: string; to?: string; href?: string; track?: string }[]
}[] = [
  {
    kick: 'product',
    links: [
      { label: 'Install', to: '/install' },
      { label: 'Playground', to: '/play' },
      { label: 'Learn', to: '/learn' },
      { label: 'Use cases', to: '/use-cases' },
      { label: 'Changelog', to: '/changelog' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    kick: 'resources',
    links: [
      { label: 'Docs', href: DOCS },
      { label: 'Spec', to: '/spec' },
      { label: 'Standard library', to: '/tools' },
      { label: 'Providers', to: '/providers' },
      { label: 'GitHub', href: REPO },
      { label: 'VS Code extension', href: 'https://marketplace.visualstudio.com/items?itemName=supernovae.nika-lang' },
      { label: 'Homebrew tap', href: 'https://github.com/supernovae-st/homebrew-tap' },
    ],
  },
  {
    kick: 'project',
    links: [
      { label: 'Manifesto', to: '/manifesto' },
      { label: 'Send a workflow', to: '/convert', track: 'convert-open' },
      { label: 'SuperNovae', href: 'https://supernovae.studio' },
      { label: 'License · AGPL-3.0', href: `${REPO}/blob/main/LICENSE` },
      { label: 'security.txt', href: '/.well-known/security.txt' },
      { label: 'Site map', to: '/sitemap' },
    ],
  },
]

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

        {/* THE COLUMNS · the wayfinding band (W8) — left-aligned survey grid
            over the centered altar below; every label is a real surface */}
        <nav className="sitefoot-cols" aria-label="Site map">
          {COLS.map((col) => (
            <div className="sitefoot-col" key={col.kick}>
              <p className="sitefoot-kick">{col.kick}</p>
              <ul className="sitefoot-list">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="sitefoot-link" data-track={l.track}>
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} target="_blank" rel="noreferrer" className="sitefoot-link">
                        {l.label}
                        <span aria-hidden className="sitefoot-ext">
                          {' '}
                          ↗
                        </span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

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
