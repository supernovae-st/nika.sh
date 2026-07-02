import { useCopy } from '../lib/use-copy'
import { CopyIcon } from './CopyRow'
import '../sections/hero.css'

/* ─── the command-as-CTA install pill (Codex/Vercel/Cursor register) ──────────
   Extracted from the W1 hero so every surface (hero · GetStarted's runs-
   everywhere terminal card) renders the SAME affordance: the whole row is ONE
   button whose label IS the command; clicking anywhere copies it. Equal rank
   with a primary CTA (same 44px height, outline register — .v4cmd in
   hero.css). Real, non-color-only copied state (icon + text both flip).
   Copy state via the shared useCopy (one reset delay · unmount-safe). */

export const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

export function InstallCommand() {
  const { copied, copy } = useCopy(INSTALL_CMD)
  return (
    <button
      type="button"
      onClick={copy}
      className="v4cmd"
      data-copied={copied}
      aria-label={`Copy install command: ${INSTALL_CMD}`}
    >
      {/* the SR announcement · a polite live region flips to "Copied" (an
          aria-label swap alone is not reliably announced) — the visible
          Copy/Copied affordance stays aria-hidden. */}
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
      <span className="v4cmd-dollar" aria-hidden>
        ❯
      </span>
      {/* ONE flex item for the whole command — a flex container trims the
          boundary whitespace between items. */}
      {/* machine-string rule · when the pill is too narrow the tap path
          ellipsizes in the MIDDLE (…/) — the start (brew install) and the end
          (nika) never fall off. Copy always copies the full command. */}
      <span className="v4cmd-text">
        brew install <span className="v4cmd-dim v4cmd-mid">supernovae-st/tap/</span>
        <span className="v4cmd-dim v4cmd-mid-ell" aria-hidden>
          …/
        </span>
        nika
      </span>
      <span className="v4cmd-copy" aria-hidden>
        <CopyIcon copied={copied} />
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
}
