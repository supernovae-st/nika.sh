import { useState } from 'react'

/* the brand mark everywhere is the REAL logo — /nika.svg (the butterfly).
   The v3 glass-pill Nav that lived here was replaced by the shared v4 monochrome
   nav (src/shell/Nav.tsx, mounted in RootLayout). InstallPill + Plain stay —
   InstallPill is the v3-styled install affordance (still used in the v3 hero +
   final-CTA below the fold); the v4 hero has its own monochrome install line. */

/* ─── « en clair » · the plain-words rail — one line per section so the site
       reads for EVERYONE, not just devs (operator-locked 2026-06-10) ─── */
export function Plain({ children }: { children: React.ReactNode }) {
  return (
    <p className="rv mt-4 max-w-[44rem] text-[13.5px] leading-relaxed text-[var(--fg-dim)]">
      <span
        className="mono mr-2.5 inline-block rounded-md border px-1.5 py-0.5 align-middle text-[9.5px] tracking-[0.18em] text-[var(--cyan)] uppercase"
        style={{ borderColor: 'color-mix(in oklch, var(--cyan) 30%, transparent)' }}
      >
        in plain words
      </span>
      {children}
    </p>
  )
}

/* the REAL install command — per the official tap (supernovae-st/homebrew-tap) */
const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

export function InstallPill() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_CMD)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <div className="glass flex items-center gap-3 rounded-2xl py-2 pr-2 pl-5">
      <span className="mono text-[12px] whitespace-nowrap text-[var(--fg)] sm:text-[14px]">
        <span className="text-[var(--fg-dim)]">$ </span>
        brew install <span className="text-[var(--fg-mute)]">supernovae-st/tap/</span>nika
      </span>
      <button
        onClick={copy}
        className="skeuo rounded-xl px-3 py-2 text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
        aria-label="copy"
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </div>
  )
}
