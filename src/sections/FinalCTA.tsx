import { useState } from 'react'
import { Link } from 'react-router'
import { REPO, SPEC, DOCS } from '../content'
import { useRevealOnce } from './use-reveal-once'
import './v4-home.css'

/* ─── FIG 10.0 · Final CTA + SUPERNOVAE footer (theme-dark · the close) ─────────
   Design doc §6 (FIG 10.0). The clean v4 close: the install affordance (the same
   monochrome install line as the hero, §4), Star on GitHub, Read the spec — in
   the blueprint register. The SUPERNOVAE footer below is KEPT INTACT (operator
   lock): the per-letter wordmark float, the studio line, the founders, the
   free-software footer — copied verbatim from the v3 close, just re-housed here.

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount,
   content fully visible by default (no-JS / reduced-motion). navigator is only
   read inside the copy handler. */

const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

/* the monochrome install affordance — identical register to the hero's
   InstallLine (src/shell/shell.css .v4install). A bordered mono row + a copy
   button with a non-color-only copied state (icon + text both flip). */
function InstallLine() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="v4install">
      <span className="v4install-cmd">
        <span className="v4install-dollar" aria-hidden>
          ❯
        </span>
        brew install <span className="v4install-dim">supernovae-st/tap/</span>nika
      </span>
      <button
        type="button"
        onClick={copy}
        className="v4install-copy"
        data-copied={copied}
        aria-label={copied ? 'Copied to clipboard' : 'Copy install command'}
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  )
}

export default function FinalCTA() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section
      ref={ref}
      id="get-started"
      aria-labelledby="cta-title"
      className="theme-dark v4sec v4-flip scroll-mt-24"
    >
      <div className="v4sec-wrap v4cta-wrap">
        {/* the close · the install affordance + two flat CTAs, blueprint register */}
        <p className="v4sec-fig" data-rise>
          FIG 10.0
        </p>
        <h2
          id="cta-title"
          className="v4cta-title"
          data-rise
          style={{ ['--rise-delay' as string]: '60ms' }}
        >
          Put your agents on a leash you can&nbsp;read.
        </h2>
        <p className="v4cta-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          Install the binary, write the plan as a file, review what it&apos;s allowed
          to touch, run it. Same file, same result, enforced on your machine —
          tomorrow and the day the vendor is gone.
        </p>

        <div className="v4cta-install" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          <InstallLine />
        </div>

        <div className="v4cta-links" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
          <a href={REPO} target="_blank" rel="noreferrer" className="v4cta-link">
            <span aria-hidden className="v4cta-link-glyph">
              ★
            </span>
            Star on GitHub
          </a>
          <a href={SPEC} target="_blank" rel="noreferrer" className="v4cta-link v4cta-link--dim">
            Read the spec
            <span aria-hidden className="v4cta-link-arrow">
              →
            </span>
          </a>
          <Link to="/learn" className="v4cta-link v4cta-link--dim">
            Learn it in 5&nbsp;min
            <span aria-hidden className="v4cta-link-arrow">
              →
            </span>
          </Link>
        </div>

        {/* ─── SUPERNOVAE · the footer — KEPT INTACT (operator lock). The per-letter
             float wave + hover lift wordmark, the studio line, the founders, and
             the free-software footer rule. Copied verbatim from the v3 close. ─── */}
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
            className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--cyan)]"
          >
            𝕏 @ThibautMelen
          </a>
          <span aria-hidden className="text-[var(--fg-ghost)]">·</span>
          <a
            href="https://x.com/niccela"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center px-1 transition-colors hover:text-[var(--cyan)]"
          >
            𝕏 @niccela
          </a>
        </p>

        <footer
          className="mono mt-20 flex w-full flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12px] text-[var(--fg-ghost)]"
          style={{ borderColor: 'var(--hair)' }}
        >
          <span className="flex items-center gap-2">
            <img src="/nika.svg" alt="" width={13} height={13} style={{ opacity: 0.7 }} />
            nika · free software · AGPL-3.0-or-later
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
        </footer>
      </div>
    </section>
  )
}
