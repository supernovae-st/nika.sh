import { useState } from 'react'
import { REPO, SPEC } from '../content'

/* the brand mark everywhere is the REAL logo — /nika.svg (the butterfly) */

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Language', href: '#language' },
  { label: 'Verbs', href: '#verbs' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Learn', href: '#/learn' },
  { label: 'Play', href: '#/play' },
  { label: 'Blog', href: '#/blog' },
  { label: 'Spec', href: SPEC },
]

export function Nav() {
  return (
    <nav className="nav-in fixed top-5 left-1/2 z-30 -translate-x-1/2">
      <div className="glass nav-glass flex items-center gap-1 rounded-full px-2 py-1.5 text-[13px]">
        <a href="#" className="flex items-center gap-2 px-3 py-1.5 font-semibold tracking-tight">
          <img
            src="/nika.svg"
            alt=""
            width={17}
            height={17}
            style={{ filter: 'drop-shadow(0 0 6px rgba(98,210,255,0.7))' }}
          />
          nika
        </a>
        <span className="mx-1 hidden h-4 w-px md:block" style={{ background: 'var(--hair)' }} />
        {NAV_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className="hidden rounded-full px-3 py-1.5 whitespace-nowrap text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)] md:block"
          >
            {l.label}
          </a>
        ))}
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--hair)' }} />
        <a
          href={REPO} target="_blank" rel="noreferrer"
          aria-label="GitHub"
          className="skeuo flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--fg-mute)]"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <a href="#get-started" className="skeuo-brand ml-1 rounded-full px-4 py-1.5 font-medium">
          Install
        </a>
      </div>
    </nav>
  )
}

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
