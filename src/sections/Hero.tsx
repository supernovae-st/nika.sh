import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CodeFile } from '../components/CodeFile'
import { REPO, SPEC } from '../content'
import { SHOWCASE_YAML } from './usecases-yaml.generated'
import '../shell/shell.css'

/* ─── Hero · the v4 trust-landing first surface (design doc §4) ───────────────
   Register: a sovereign engineering instrument / technical blueprint. Austere,
   monochrome, hairline rules, FIG numbering. PURE DOM — ZERO WebGL. The SEO win:
   the headline `Intent as Code.` is a REAL <h1> in the prerendered HTML.

   Atmosphere WITHOUT color: a fine grain tile + a faint radial vignette + a
   barely-there blueprint grid pin depth onto the near-black surface so it never
   reads as flat black. The only color anywhere is the global EdgeAurora at the
   frame. The verb-hue whisper is reserved for live runs, NOT this static screen.

   Layout: asymmetric — copy left, the real .nika.yaml right (stacks on mobile),
   on a 1fr/1.08fr grid (not centered-symmetric). The file is a REAL projected
   showcase workflow (`t1-standup-digest`), never hand-typed.

   Entrance: ONE orchestrated staggered reveal (motion-safe only). Everything is
   visible by DEFAULT (SSR / no-JS / reduced-motion) — the `.v4-enter` opt-in is
   added on mount and only animates when motion is allowed. */

const HERO_YAML = SHOWCASE_YAML['t1-standup-digest']
const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

/* per-element entrance delay → the `--rise-delay` custom prop the stagger reads.
   Cast to CSSProperties (custom props aren't in the typed surface) — matches the
   existing `{ '--i': i } as React.CSSProperties` convention in the v3 home. */
const rise = (ms: number): React.CSSProperties => ({ '--rise-delay': `${ms}ms` }) as React.CSSProperties

/* the monochrome install affordance — replaces the v3 blue-glass pill.
   A bordered mono row + a copy button with a real, non-color-only copied state
   (icon + text both flip). SSR-safe: navigator is only read inside the handler. */
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

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null)

  /* opt the hero into the orchestrated entrance — only when motion is allowed.
     Adding the class in an effect (post-paint) guarantees the prerendered HTML
     ships fully visible (no opacity:0 stuck for crawlers / no-JS / reduced). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    rootRef.current?.classList.add('v4-enter')
  }, [])

  return (
    <section
      ref={rootRef}
      id="hero"
      className="theme-dark relative isolate flex min-h-screen flex-col justify-center overflow-hidden"
    >
      {/* atmosphere · grain + vignette + blueprint plate (pointer-events:none) */}
      <div className="v4hero-vignette" aria-hidden />
      <div className="v4hero-plate" aria-hidden />
      <div className="v4hero-grain" aria-hidden />

      {/* generous gutters + top padding clears the fixed nav */}
      <div className="relative z-[1] mx-auto w-full max-w-6xl px-6 pt-28 pb-20 md:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.08fr] lg:gap-16">
          {/* ── left · the copy ── */}
          <div className="flex flex-col">
            {/* FIG 0.0 · the blueprint numbering with its hairline tick */}
            <p className="v4fig mb-7" data-rise style={rise(0)}>
              FIG 0.0
            </p>

            {/* the REAL <h1> · permanent title (AGENTS.md) · the SEO win */}
            <h1
              data-rise
              style={{
                ...rise(70),
                fontFamily: 'var(--display)',
                fontSize: 'clamp(2.7rem, 1.3rem + 5.4vw, 5.3rem)',
                lineHeight: 0.98,
                letterSpacing: '-0.025em',
                fontWeight: 600,
              }}
              className="text-text text-pretty"
            >
              Intent as Code.
            </h1>

            <p
              data-rise
              style={rise(140)}
              className="mt-6 max-w-[33rem] text-[17.5px] leading-relaxed text-dim"
            >
              One file. The whole workflow&nbsp;— on your machine, forever.
            </p>

            {/* the monochrome install line · #install is the nav CTA's target */}
            <div id="install" className="mt-9 scroll-mt-28" data-rise style={rise(210)}>
              <InstallLine />
            </div>

            {/* one row of flat B/W CTAs · :focus-visible rings come from the global rule */}
            <div
              data-rise
              style={rise(280)}
              className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 text-[14.5px]"
            >
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-md py-1 text-text transition-colors"
              >
                <span aria-hidden className="text-dim transition-colors group-hover:text-text">
                  ★
                </span>
                Star on GitHub
              </a>
              <a
                href={SPEC}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-md py-1 text-dim transition-colors hover:text-text"
              >
                Read the spec
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <Link
                to="/learn"
                className="group inline-flex items-center gap-1.5 rounded-md py-1 text-dim transition-colors hover:text-text"
              >
                Learn it in 5&nbsp;min
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>

            {/* the trust line · mono, tabular, faint */}
            <p data-rise style={rise(350)} className="v4trust mt-9">
              Pure Rust<span className="px-2 text-faint">·</span>
              one binary<span className="px-2 text-faint">·</span>
              any model<span className="px-2 text-faint">·</span>
              <b>AGPL</b> forever
            </p>
          </div>

          {/* ── right · the real file (SEO-crawlable DOM text) ── */}
          <div className="w-full" data-rise style={rise(180)}>
            {/* a FIG caption above the panel — the engineering-manual register */}
            <p className="mono mb-3 flex items-center gap-2 text-[11px] tracking-[0.22em] text-faint uppercase">
              <span aria-hidden>FIG 0.1</span>
              <span aria-hidden className="text-faint/60">
                —
              </span>
              a workflow, as you would write it
            </p>
            <CodeFile filename="standup-digest.nika.yaml" yaml={HERO_YAML} highlight={[8, 11]} />
          </div>
        </div>
      </div>
    </section>
  )
}
