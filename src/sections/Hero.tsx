import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CodeFile } from '../components/CodeFile'
import { REPO, SPEC } from '../content'
import '../shell/shell.css'
import './hero.css'

/* ─── Hero · the v4.3 BLUE control-narrative · two-column composition ──────────
   Register: a deep, refined blue lab (Maxime Heckel · Linear/Raycast restraint).
   A premium navy→azure gradient fills the surface, a faint blue perspective grid
   recedes below, faint HUD registration marks sit at the corners, and a 3D
   particle NIKA BUTTERFLY spins continuously as a focal accent behind the editor.

   The composition is the classic operator layout: the HEADLINE + pitch + install
   + CTAs sit LEFT, and the premium CodeFile editor (the product replica · a real
   .nika.yaml plan) sits RIGHT — KEPT, given room, balanced. Lots of whitespace;
   the two columns breathe (the previous hero felt crammed).

   The pitch stays CONTROL: "See what your AI will do. Before it does it." — the
   agent writes its plan as a reviewable file; the runtime enforces it; then it
   runs. The headline is a REAL <h1> in the prerendered HTML (the SEO win); the
   editor is real <pre>/<code> DOM text (crawlable, instant). The blue gradient +
   grid + HUD are PURE CSS (instant first paint). The WebGL butterfly is a lazy,
   client-only, aria-hidden ENHANCEMENT — it never blocks first paint, and it
   spins gently under prefers-reduced-motion.

   Entrance: ONE orchestrated staggered reveal (motion-safe only). Everything is
   visible by DEFAULT (SSR / no-JS / reduced-motion) — the `.v4-enter` opt-in is
   added on mount and only animates when motion is allowed. */

const INSTALL_CMD = 'brew install supernovae-st/tap/nika'

/* the hero editor plan · a compact, spec-correct slice of the resume-screener
   showcase (src/sections/usecases-yaml.generated.ts · t3-resume-screener). The
   control story is visible at a glance: the `permits:` block IS the blast radius,
   and the first task is a deterministic `invoke`. Verbatim spec shapes only —
   `nika: v1` envelope · `permits:` fs+tools · `invoke`/`infer` verbs. */
const HERO_PLAN = `nika: v1
workflow: resume-screener

model: ollama/llama3.1   # PII stays on the machine

permits:                 # the file IS the blast radius
  fs:
    read:  ["./hiring/inbox/**"]
    write: ["./hiring/out/**"]
  tools: ["nika:glob", "nika:read", "nika:jq"]

vars:
  role: "Senior Rust engineer"

tasks:
  - id: pool
    invoke:
      tool: "nika:glob"
      args: { pattern: "./hiring/inbox/*.md" }

  - id: screen
    depends_on: [pool]
    infer:
      prompt: "Score each CV against \${{ vars.role }}"
`

/* the heavy three.js butterfly canvas — code-split so it never enters the
   first-paint bundle (the hero ships as instant prerendered DOM + CSS). */
const HeroButterfly = lazy(() => import('../scene/HeroButterfly'))

/* per-element entrance delay → the `--rise-delay` custom prop the stagger reads. */
const rise = (ms: number): React.CSSProperties =>
  ({ '--rise-delay': `${ms}ms` }) as React.CSSProperties

/* the monochrome install affordance — a bordered mono row + a copy button with a
   real, non-color-only copied state (icon + text both flip). SSR-safe. */
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

/* ─── the blue atmosphere · gradient + perspective grid + HUD + butterfly canvas ─
   PURE-CSS layers (instant) PLUS the lazy WebGL canvas (client-only, mounted
   after first paint). All decorative — aria-hidden, pointer-events:none. The
   butterfly canvas anchors to the RIGHT column band (behind the editor) so it
   reads as a focal accent, not a busy centerpiece. */
function HeroAtmosphere() {
  const [mountCanvas, setMountCanvas] = useState(false)
  const [shown, setShown] = useState(false)

  /* mount the heavy canvas only AFTER the DOM has painted. We defer to an
     idle/next-frame so the hero's first paint (blue + grid + copy + editor) is
     never blocked by WebGL init. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    let raf = 0
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback
    const arm = () => setMountCanvas(true)
    if (idle) idle(arm)
    else raf = window.setTimeout(arm, 200) as unknown as number
    return () => {
      if (raf) clearTimeout(raf)
    }
  }, [])

  /* a one-tick flag → the canvas fades/scales in once it's actually in the tree */
  useEffect(() => {
    if (!mountCanvas) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [mountCanvas])

  return (
    <>
      {/* 1 · the deep blue gradient — instant CSS */}
      <div className="v4hero-blue" aria-hidden />

      {/* 2 · the faint blue perspective grid receding below — instant CSS */}
      <div className="v4bluegrid" aria-hidden>
        <div className="v4bluegrid-plane" />
      </div>

      {/* 3 · the spinning particle butterfly — lazy WebGL, client-only, RIGHT band */}
      <div className="v4bfly-stage" aria-hidden>
        <div className="v4bfly-canvas" data-mounted={shown}>
          {mountCanvas && (
            <Suspense fallback={null}>
              <HeroButterfly />
            </Suspense>
          )}
        </div>
      </div>

      {/* 4 · faint HUD registration marks · the four corner ticks (decorative) */}
      <div className="v4hud" aria-hidden>
        <span className="v4hud-tick v4hud-tick--tl" />
        <span className="v4hud-tick v4hud-tick--tr" />
        <span className="v4hud-tick v4hud-tick--bl" />
        <span className="v4hud-tick v4hud-tick--br" />
      </div>

      {/* a soft readability vignette so the copy clears contrast over the blue */}
      <div className="v4hero-readscrim" aria-hidden />
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
      {/* the blue gradient + grid + HUD + the spinning particle butterfly (lazy) */}
      <HeroAtmosphere />

      {/* the two-column composition · copy LEFT · editor RIGHT · generous space.
          Stacks to one column under 1024px (editor below the copy). */}
      <div className="v4hero-grid relative z-[1] mx-auto w-full max-w-6xl">
        {/* ── LEFT · the control narrative ─────────────────────────────────── */}
        <div className="v4hero-copy flex max-w-2xl flex-col">
          {/* FIG 0.0 · the blueprint numbering with its hairline tick */}
          <p className="v4fig mb-6" data-rise style={rise(0)}>
            FIG 0.0
          </p>

          {/* the brand kicker · "Intent as Code" survives as a small mark */}
          <p data-rise style={rise(40)} className="v4kicker mb-5">
            <span aria-hidden>✦</span> Intent as Code
          </p>

          {/* the REAL <h1> · the control hook · the SEO win. Two clauses on
              their own lines so the cadence reads as a promise. */}
          <h1
            data-rise
            style={{
              ...rise(80),
              fontFamily: 'var(--headline)',
              fontSize: 'clamp(1.45rem, 0.45rem + 4.6vw, 3.9rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              fontWeight: 600,
            }}
            className="text-text"
          >
            See what your AI will do.
            <br />
            <span className="text-dim">Before it does it.</span>
          </h1>

          <p
            data-rise
            style={rise(150)}
            className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-dim"
          >
            Agents are starting to touch real systems&nbsp;— your code, your APIs,
            production. Nika makes an agent write its plan as a file first: every
            step, tool, <b className="font-semibold text-text">permission</b> and
            output. You review it. The runtime enforces it. Then it runs.
          </p>

          {/* the install line · #install is the nav CTA's target */}
          <div id="install" className="mt-9 scroll-mt-28" data-rise style={rise(220)}>
            <InstallLine />
          </div>

          {/* one row of flat CTAs · they WRAP on narrow screens so every link
              stays visible. Each is a ≥44px mobile hit target. */}
          <div
            data-rise
            style={rise(290)}
            className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-1 text-[14.5px]"
          >
            <a
              href={SPEC}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-11 items-center gap-1.5 rounded-md text-text transition-colors"
            >
              Read the spec
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="#living-file"
              className="group inline-flex min-h-11 items-center gap-1.5 rounded-md text-dim transition-colors hover:text-text"
            >
              <span aria-hidden className="text-dim transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
              see it run
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-11 items-center gap-2 rounded-md text-dim transition-colors hover:text-text"
            >
              <span aria-hidden className="text-faint transition-colors group-hover:text-text">
                ★
              </span>
              Star on GitHub
            </a>
          </div>

          {/* the trust line · the control guarantee · mono, faint */}
          <p data-rise style={rise(360)} className="v4trust mt-9">
            Reviewable<span className="px-2 text-faint">·</span>
            enforced<span className="px-2 text-faint">·</span>
            replayable<span className="px-2 text-faint">·</span>
            one Rust binary<span className="px-2 text-faint">·</span>
            any model<span className="px-2 text-faint">·</span>
            <b>AGPL</b> forever
          </p>
        </div>

        {/* ── RIGHT · the premium editor panel · the product replica ────────── */}
        <div className="v4hero-editor" data-rise style={rise(180)}>
          <CodeFile
            yaml={HERO_PLAN}
            filename="screen-cvs.nika.yaml"
            highlight={[5, 9]}
            className="v4hero-code"
          />
          {/* a compact reference chip · "the plan, before it acts" · links to the
              full living-file run (so the editor isn't a dead end). */}
          <Link to="/use-cases" className="v4hint mt-4 w-fit">
            <span className="v4hint-file">screen-cvs.nika.yaml</span>
            <span className="text-faint" aria-hidden>
              ·
            </span>
            <span>the plan, before it acts</span>
            <span className="v4hint-arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
