import type { ReactNode } from 'react'
import { useCopy } from '../lib/use-copy'

/* ─── the monochrome install/command row · the ONE .v4install affordance ──────
   A bordered mono row + a copy button with a non-color-only copied state
   (icon + text both flip). GetStarted's install/run rows and FinalCTA's
   install line render THIS component — the pattern used to be pasted in both
   files with drifting reset delays. Styles: .v4install in src/shell/shell.css.
   SSR-safe: navigator is only read inside the click handler (useCopy). */

/* the copied/copy glyph pair — shared with InstallCommand + CodeFile chrome. */
export function CopyIcon({ copied }: { copied: boolean }) {
  return copied ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

export function CopyRow({
  track,
  cmd,
  label,
  display,
}: {
  /** the command copied to the clipboard, verbatim */
  cmd: string
  /** optional funnel event fired via the RootLayout delegate */
  track?: string
  /** the accessible name of the copy action, e.g. "Homebrew install" */
  label: string
  /** optional styled rendering of the command (defaults to the plain cmd) */
  display?: ReactNode
}) {
  const { copied, copy } = useCopy(cmd)
  return (
    <div className="v4install">
      <span className="v4install-cmd">
        <span className="v4install-dollar" aria-hidden>
          ❯
        </span>
        {display ?? cmd}
      </span>
      <button
        type="button"
        onClick={copy}
        className="v4install-copy"
        data-copied={copied}
        data-track={track}
        aria-label={`Copy ${label} command`}
      >
        {/* polite live region — an aria-label swap alone is not reliably announced */}
        <span role="status" className="sr-only">
          {copied ? 'Copied to clipboard' : ''}
        </span>
        <CopyIcon copied={copied} />
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
