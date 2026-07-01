import { useState } from 'react'
import '../sections/hero.css'

/* ─── the command-as-CTA install pill (Codex/Vercel/Cursor register) ──────────
   Extracted from the W1 hero so every surface (hero · GetStarted's runs-
   everywhere row) renders the SAME affordance: the whole row is ONE button
   whose label IS the command; clicking anywhere copies it. Equal rank with a
   primary CTA (same 44px height, outline register — .v4cmd in hero.css).
   Real, non-color-only copied state (icon + text both flip). SSR-safe:
   navigator is only read inside the click handler. */

export const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

export function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="v4cmd"
      data-copied={copied}
      aria-label={copied ? 'Copied to clipboard' : `Copy install command: ${INSTALL_CMD}`}
    >
      <span className="v4cmd-dollar" aria-hidden>
        ❯
      </span>
      {/* ONE flex item for the whole command — a flex container trims the
          boundary whitespace between items. */}
      <span className="v4cmd-text">
        brew install <span className="v4cmd-dim">supernovae-st/tap/</span>nika
      </span>
      <span className="v4cmd-copy" aria-hidden>
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
      </span>
    </button>
  )
}
