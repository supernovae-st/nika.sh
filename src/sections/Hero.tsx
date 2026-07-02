import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CodeFile } from '../components/CodeFile'
import { InstallCommand } from '../components/InstallCommand'
import { ENGINE_VERSION, REPO, SPEC } from '../content'
import { HERO_FILES } from './hero-files'
import '../shell/shell.css'
import './hero.css'

/* ─── Hero · the v5 dither black/blue header · two-column composition ──────────
   Register: an engineered-black field (the v5 ladder) with ONE pointe of blue —
   Linear/Codex/Raycast restraint, sharp ("carré"): hairline borders, 0–4px
   radii, ordered-dither grain (BRAND-11), museum-plate mono captions.

   The composition is the classic operator layout: the HEADLINE + one sentence +
   install + CTAs sit LEFT, and the premium CodeFile editor (the product replica)
   sits RIGHT — now with a sharp mono FILE-TAB strip above it (2026-07 operator
   ask): 3 switchable spec-true examples the visitor can flip through in the
   header. daily-brief.nika.yaml is the DEFAULT tab because it is THE file the
   Living File below plays — the hero editor and the run read as the same object
   (docs/plans/2026-06-18 §2 continuity).

   The H1 is a REAL <h1> in the prerendered HTML (the SEO win); the editor is
   real <pre>/<code> DOM text (crawlable, instant). The WebGL background (the
   dither field / tunnel) mounts at the PAGE level — the hero stays transparent.

   Entrance: ONE orchestrated staggered reveal (motion-safe only). Everything is
   visible by DEFAULT (SSR / no-JS / reduced-motion) — the `.v4-enter` opt-in is
   added on mount and only animates when motion is allowed. */

/* per-element entrance delay → the `--rise-delay` custom prop the stagger reads. */
const rise = (ms: number): React.CSSProperties =>
  ({ '--rise-delay': `${ms}ms` }) as React.CSSProperties

/* the install affordance · COMMAND-AS-CTA — the shared pill (extracted to
   src/components/InstallCommand.tsx so GetStarted's runs-everywhere terminal
   card renders the exact same affordance). */

/* ── the rotating mono audience line (Vercel register) ────────────────────────
   Three all-caps mono lines under the hero sub-line, ALL always rendered (zero
   layout shift — the rotation is color-only): the active one reads full-
   contrast, the others stay dim, crossfading every ~4s. Small and quiet — it
   must never compete with the H1. The FIRST line ships active in the
   prerendered HTML (SSR = client initial state · no hydration drift); the
   interval only arms after mount when motion is allowed, so reduced-motion /
   no-JS get the static three-line stack. Screen readers get ONE sentence via
   the container label; the visual lines are aria-hidden. */
const AUDIENCE = [
  'FOR HUMANS WHO WRITE IT',
  'FOR AGENTS THAT RUN IT',
  'FOR TEAMS THAT AUDIT IT',
]

function AudienceLines() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((a) => (a + 1) % AUDIENCE.length), 4000)
    return () => clearInterval(id)
  }, [])
  return (
    <p className="v4aud">
      {/* the SR sentence · real text (aria-label on a <p> is name-prohibited and
          dropped by most screen readers) — the rotating visual lines stay hidden */}
      <span className="sr-only">
        For humans who write it, for agents that run it, for teams that audit it.
      </span>
      {AUDIENCE.map((line, i) => (
        <span key={line} className="v4aud-line" data-active={i === active} aria-hidden>
          {line}
        </span>
      ))}
    </p>
  )
}

/* ─── the hero chrome · faint HUD ticks + a readability vignette ───────────────
   The WebGL background lives at the PAGE level (Home · fixed behind everything);
   the hero is transparent so it shows through. This is just the decorative HUD +
   a left vignette so the copy clears contrast over the field. */
function HeroAtmosphere() {
  return (
    <>
      {/* faint HUD registration marks · the four corner ticks (decorative) */}
      <div className="v4hud" aria-hidden>
        <span className="v4hud-tick v4hud-tick--tl" />
        <span className="v4hud-tick v4hud-tick--tr" />
        <span className="v4hud-tick v4hud-tick--bl" />
        <span className="v4hud-tick v4hud-tick--br" />
      </div>

      {/* a soft readability vignette so the LEFT copy clears contrast over the field */}
      <div className="v4hero-readscrim" aria-hidden />
    </>
  )
}

/* ── the sharp file-tab strip · mono, hairline, no pills ──────────────────────
   role=tablist with roving tabIndex + arrow-key switching. The DEFAULT tab
   (daily-brief) is prerendered, so crawlers / no-JS get the continuity file. */
function FileTabs({
  active,
  onSelect,
}: {
  active: number
  onSelect: (i: number) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: React.KeyboardEvent) => {
    // APG tablist keys · arrows cycle, Home/End jump to the edges
    let next: number
    if (e.key === 'ArrowRight') next = (active + 1) % HERO_FILES.length
    else if (e.key === 'ArrowLeft') next = (active - 1 + HERO_FILES.length) % HERO_FILES.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = HERO_FILES.length - 1
    else return
    e.preventDefault()
    onSelect(next)
    refs.current[next]?.focus()
  }
  return (
    <div className="v4ftabs" role="tablist" aria-label="Example workflow files" onKeyDown={onKeyDown}>
      {HERO_FILES.map((f, i) => (
        <button
          key={f.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`v4ftab-${f.id}`}
          aria-selected={i === active}
          aria-controls="v4ftab-panel"
          tabIndex={i === active ? 0 : -1}
          className="v4ftab"
          onClick={() => onSelect(i)}
        >
          {f.label}
          <span className="v4ftab-ext" aria-hidden>
            .nika.yaml
          </span>
        </button>
      ))}
    </div>
  )
}

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState(0)
  const file = HERO_FILES[tab]

  /* opt the hero into the orchestrated entrance — only when motion is allowed.
     Adding the class in an effect (post-paint) guarantees the prerendered HTML
     ships fully visible (no opacity:0 stuck for crawlers / no-JS / reduced). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    rootRef.current?.classList.add('v4-enter')
  }, [])

  /* ── the ASPIRATION · the hero is drawn DOWN into the machine ────────────────
     As the hero scrolls out, the editor (the plan) is pulled downward + tilts
     into depth + dissolves — "sucked into the machine" — while the copy fades up.
     This is the visual bridge to the Living File below (the SAME file, now
     running): the two stop reading as disjoint blocks. A motion-safe rAF scroll
     scrub (transform/opacity only · compositor-cheap); SSR / no-JS / reduced get
     the static hero (no transform applied). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const section = rootRef.current
    if (!section) return
    let raf = 0
    const tick = () => {
      const rect = section.getBoundingClientRect()
      const h = rect.height || 1
      // 0 while the hero fills the view → 1 as it scrolls out (the pull window)
      const ap = Math.min(1, Math.max(0, -rect.top / (h * 0.82)))
      // the editor (the plan) sinks down + dissolves as the hero scrolls out, the
      // copy fades up — a clean exit into the Living File below.
      const e = ap * ap
      const editor = editorRef.current
      if (editor) {
        editor.style.transform = `translateY(${e * 46}px) scale(${1 - e * 0.07})`
        editor.style.opacity = `${Math.max(0, 1 - e * 1.18)}`
      }
      const copy = copyRef.current
      if (copy) {
        copy.style.transform = `translateY(${ap * -26}px)`
        copy.style.opacity = `${Math.max(0, 1 - ap * 1.08)}`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section
      ref={rootRef}
      id="hero"
      className="theme-dark relative isolate flex min-h-screen flex-col justify-center overflow-hidden"
    >
      {/* the HUD ticks + the readability scrim (the WebGL field is page-level) */}
      <HeroAtmosphere />

      {/* the two-column composition · copy LEFT · editor RIGHT · generous space.
          Stacks to one column under 1024px (editor below the copy). */}
      <div className="v4hero-grid relative z-[1] mx-auto w-full max-w-6xl">
        {/* ── LEFT · the wedge ─────────────────────────────────────────────── */}
        <div ref={copyRef} className="v4hero-copy flex max-w-2xl flex-col">
          {/* FIG 0.0 · the blueprint numbering with its hairline tick */}
          <p className="v4fig mb-6" data-rise style={rise(0)}>
            FIG 0.0
          </p>

          {/* the brand kicker · "Intent as Code" survives as a small mark */}
          <p data-rise style={rise(40)} className="v4kicker mb-5">
            <span aria-hidden>✦</span> Intent as Code
          </p>

          {/* the REAL <h1> · the wedge · the SEO win. */}
          <h1
            data-rise
            style={{
              ...rise(80),
              fontFamily: 'var(--headline)',
              fontSize: 'clamp(1.9rem, 1.05rem + 3vw, 3.1rem)',
              lineHeight: 1.04,
              letterSpacing: '-0.022em',
              fontWeight: 600,
              textWrap: 'balance',
            }}
            className="text-text"
          >
            Useful AI work shouldn&rsquo;t disappear into chats.
          </h1>

          <p
            data-rise
            style={rise(150)}
            className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-dim"
          >
            Nika turns repeatable AI work into files you can run, review, diff and
            share. One file&nbsp;· 4&nbsp;verbs&nbsp;· one Rust binary. The agent
            writes the plan, you review it, the runtime{' '}
            <b className="font-semibold text-text">enforces</b> it — then it runs.
          </p>

          {/* the rotating mono audience line · quiet, color-only, zero shift */}
          <div data-rise style={rise(190)}>
            <AudienceLines />
          </div>

          {/* the main CTA row · the primary button + the command-as-CTA install
              (equal rank · Codex/Vercel register). #install is the nav target.
              They WRAP on narrow screens; each is a ≥44px mobile hit target. */}
          <div
            id="install"
            data-rise
            style={rise(220)}
            className="mt-9 flex scroll-mt-28 flex-wrap items-center gap-3"
          >
            <a href="#living-file" className="v4cta group">
              <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
              See it run
            </a>
            <InstallCommand />
          </div>

          {/* the version plate · mono metadata under the CTAs (Raycast register) */}
          <p className="v4vplate mt-4" data-rise style={rise(260)}>
            {ENGINE_VERSION}
            <span className="v4vplate-pipe" aria-hidden>
              |
            </span>
            macOS · Linux
            <span className="v4vplate-pipe" aria-hidden>
              |
            </span>
            AGPL-3.0
          </p>

          {/* the flat links row */}
          <div
            data-rise
            style={rise(300)}
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14.5px]"
          >
            <a
              href={SPEC}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-11 items-center gap-1.5 text-dim transition-colors hover:text-text"
            >
              Read the spec
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-11 items-center gap-2 text-dim transition-colors hover:text-text"
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

        {/* ── RIGHT · the premium editor panel · switchable product replica ── */}
        <div className="v4hero-editor" data-rise style={rise(180)}>
          <div ref={editorRef} className="v4hero-aspirate">
            <FileTabs active={tab} onSelect={setTab} />
            <div id="v4ftab-panel" role="tabpanel" aria-labelledby={`v4ftab-${file.id}`}>
              <CodeFile
                yaml={file.yaml}
                filename={file.filename}
                highlight={file.highlight}
                className="v4hero-code"
              />
            </div>
            {/* the tab's one-line story + the handoff chip: the DEFAULT file is
                the one the Living File below actually runs — "see it run" is the
                continuity link into that choreography. */}
            <div className="v4hero-editorfoot mt-4">
              <span className="v4gloss">{file.gloss}</span>
              <Link to="#living-file" className="v4hint w-fit">
                <span className="v4hint-file">daily-brief.nika.yaml</span>
                <span className="text-faint" aria-hidden>
                  ·
                </span>
                <span>see it run</span>
                <span className="v4hint-arrow" aria-hidden>
                  ↓
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
