import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CodeFile } from '../components/CodeFile'
import { REPO, SPEC } from '../content'
import { SHOWCASE_YAML } from './usecases-yaml.generated'
import '../shell/shell.css'
import './hero.css'

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

/* ─── the blueprint chrome · depth grid + technical HUD ───────────────────────
   PURE DOM. Two decorative layers (aria-hidden, pointer-events:none) that frame
   the hero like an aerospace instrument readout: a 3D perspective floor grid
   receding to a vanishing point, plus a sparse set of registration marks. The
   values are ABSTRACT registration marks (FIG / SEC / EVT / coord pairs) — not
   fake metrics dressed as real claims. The SVG strokes inherit currentColor so
   the whole thing stays grayscale (the only colour is the global EdgeAurora). */
function HeroChrome() {
  return (
    <>
      {/* 1 · the 3D perspective depth grid — a floor receding to a vanishing
            point + a fainter back-wall grid it recedes into. CSS-only. */}
      <div className="v4depth" aria-hidden>
        <div className="v4depth-wall" />
        <div className="v4depth-plane" />
      </div>

      {/* 2 · the technical HUD — sparse marks in the margins / negative space */}
      <div className="v4hud" aria-hidden>
        {/* upper-left · a register crosshair + section code (anchors the plate) */}
        <div className="v4hud-mark v4hud-register">
          <svg className="v4hud-svg" width="34" height="34" viewBox="0 0 34 34" fill="none" style={{ position: 'static', display: 'block', marginBottom: 6 }}>
            <path d="M17 2v30M2 17h30" stroke="currentColor" strokeWidth="1" />
            <circle cx="17" cy="17" r="4.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2.6" data-faint />
          </svg>
          SEC_00 · ORIGIN
        </div>

        {/* upper-right · a coordinate pair (frame register) */}
        <div className="v4hud-mark v4hud-mark--coord v4hud-coord-tr">
          x 1185 · y 414
        </div>

        {/* center-right negative space · the dashed crosshair reticle —
            a quiet focal mark with a slow opacity pulse (motion-safe). */}
        <div className="v4hud-reticle">
          <svg className="v4hud-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            {/* outer dashed ring */}
            <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" data-faint />
            {/* inner solid ring */}
            <circle cx="60" cy="60" r="18" stroke="currentColor" strokeWidth="1" />
            {/* crosshair ticks (broken at center so the dot reads clean) */}
            <path d="M60 6v26M60 88v26M6 60h26M88 60h26" stroke="currentColor" strokeWidth="1" />
            {/* the live center dot */}
            <circle className="v4hud-reticle-dot" cx="60" cy="60" r="2.4" fill="currentColor" />
            {/* a small bearing tick on the ring */}
            <path d="M60 14v6" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* lower-left · a dimension line with a Φ measure label (the engine's
            register — abstract, not a claim). */}
        <svg className="v4hud-svg v4hud-dim" width="118" height="14" viewBox="0 0 118 14" fill="none">
          {/* end ticks + the span line, with arrowheads */}
          <path d="M3 2v10M115 2v10M3 7h112" stroke="currentColor" strokeWidth="1" />
          <path d="M3 7l7-3.2M3 7l7 3.2M115 7l-7-3.2M115 7l-7 3.2" stroke="currentColor" strokeWidth="1" data-faint />
        </svg>
        <div className="v4hud-mark v4hud-dim-label">Φ 218</div>

        {/* lower-right · an event code register */}
        <div className="v4hud-mark v4hud-mark--code v4hud-evt">
          EVT_36 ·{' '}STABLE
        </div>
      </div>
    </>
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
      {/* atmosphere · vignette + 3D depth grid + technical HUD + grain.
          (pointer-events:none, aria-hidden — pure background/chrome). The flat
          blueprint plate is superseded by the perspective depth grid below. */}
      <div className="v4hero-vignette" aria-hidden />
      <HeroChrome />
      <div className="v4hero-grain" aria-hidden />

      {/* generous gutters + top padding clears the fixed nav. px clamps with the
          safe-area inset so nothing rides under a notch in landscape. */}
      <div className="v4hero-wrap relative z-[1] mx-auto w-full max-w-6xl pt-28 pb-20 md:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.08fr] lg:gap-16">
          {/* ── left · the copy ── (min-w-0 so a long token never blows the grid) */}
          <div className="flex min-w-0 flex-col">
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
                /* floor lowered so "Intent as Code." (incl. the period) is fully
                   contained at 390px; still scales up big on wider screens. */
                fontSize: 'clamp(2.2rem, 0.95rem + 5.4vw, 5.3rem)',
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

            {/* one row of flat B/W CTAs · they WRAP on narrow screens (flex-wrap)
                so every link stays fully visible. Each is a ≥44px mobile hit
                target (min-h-11). :focus-visible rings come from the global rule. */}
            <div
              data-rise
              style={rise(280)}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14.5px] sm:mt-7 sm:gap-x-7"
            >
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 rounded-md text-text transition-colors"
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
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-md text-dim transition-colors hover:text-text"
              >
                Read the spec
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <Link
                to="/learn"
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-md text-dim transition-colors hover:text-text"
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

          {/* ── right · the real file (SEO-crawlable DOM text) ──
              min-w-0 lets the <pre>'s own overflow-x:auto contain the long YAML
              instead of the grid track stretching the whole page wider than the
              viewport (the mobile-clipping root cause). */}
          <div className="w-full min-w-0" data-rise style={rise(180)}>
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
