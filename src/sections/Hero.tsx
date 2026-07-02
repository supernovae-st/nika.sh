import { useEffect, useRef } from 'react'
import { CodeFile } from '../components/CodeFile'
import { InstallCommand } from '../components/InstallCommand'
import { ENGINE_VERSION, REPO, SPEC } from '../content'
import { FLAGSHIP_ENTRIES, type FlagshipEntry } from '../flagships'
import '../shell/shell.css'
import './hero.css'

/* ─── Hero · beat 1 · the file IS the hero ────────────────────────────────────
   V5: two-column composition — the pitch LEFT, THE FILE right (2-3 switchable
   flagship tabs). The SELECTED tab drives the ENTIRE story downstream: the run
   replay (beat 2), the plan (beat 3) and the boundary (beat 4) all re-render
   from it (law #1 · one story, one file). Selection state lives in Home.

   Register: engineered-black field + ONE blue pointe (the page-level dither
   field + the v5 header glow behind the editor column). Type reads the
   documented system (tokens.css): display 44-76px vs 17px body. Air lives
   BETWEEN elements (--gap tokens), never in dead voids.

   ZERO-LAG law: no scroll-linked per-frame JS (the v4 "aspiration" scrub is
   deleted); the entrance is a one-shot staggered reveal, motion-safe only.
   The H1 is a REAL <h1> in the prerendered HTML; the editor is real <pre>
   DOM text (crawlable, instant). */

/* per-element entrance delay → the `--rise-delay` custom prop the stagger reads. */
const rise = (ms: number): React.CSSProperties =>
  ({ '--rise-delay': `${ms}ms` }) as React.CSSProperties

/* ── the hero chrome · the desktop HUD ticks + a readability vignette ─────────
   The corner ticks are desktop-only (hero.css hides them ≤767px — orphan
   decorative anchors read as glitches on a phone). */
function HeroAtmosphere() {
  return (
    <>
      <div className="v4hud" aria-hidden>
        <span className="v4hud-tick v4hud-tick--tl" />
        <span className="v4hud-tick v4hud-tick--tr" />
        <span className="v4hud-tick v4hud-tick--bl" />
        <span className="v4hud-tick v4hud-tick--br" />
      </div>
      <div className="v4hero-readscrim" aria-hidden />
    </>
  )
}

/* ── the sharp file-tab strip · mono, hairline, no pills ──────────────────────
   role=tablist with roving tabIndex + arrow-key switching. The DEFAULT tab
   (daily-brief) is prerendered, so crawlers / no-JS get the default story. */
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
    if (e.key === 'ArrowRight') next = (active + 1) % FLAGSHIP_ENTRIES.length
    else if (e.key === 'ArrowLeft')
      next = (active - 1 + FLAGSHIP_ENTRIES.length) % FLAGSHIP_ENTRIES.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = FLAGSHIP_ENTRIES.length - 1
    else return
    e.preventDefault()
    onSelect(next)
    refs.current[next]?.focus()
  }
  return (
    <div
      className="v4ftabs"
      role="tablist"
      aria-label="Flagship workflow files"
      onKeyDown={onKeyDown}
    >
      {FLAGSHIP_ENTRIES.map((f, i) => (
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

export default function Hero({
  flagship,
  index,
  onSelect,
}: {
  flagship: FlagshipEntry
  index: number
  onSelect: (i: number) => void
}) {
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
      {/* the HUD ticks + the readability scrim (the WebGL field is page-level) */}
      <HeroAtmosphere />

      {/* the two-column composition · copy LEFT · editor RIGHT · generous air. */}
      <div className="v4hero-grid relative z-[1] mx-auto w-full max-w-6xl">
        {/* ── LEFT · the pitch ─────────────────────────────────────────────── */}
        <div className="v4hero-copy flex max-w-2xl flex-col">
          {/* FIG 0.0 · the blueprint numbering with its hairline tick */}
          <p className="v4fig mb-6" data-rise style={rise(0)}>
            FIG 0.0
          </p>

          {/* the bracket eyebrow · the mono museum-plate register */}
          <p data-rise style={rise(40)} className="v4beyebrow mb-6">
            [ INTENT AS CODE ]
          </p>

          {/* the REAL <h1> · the wedge · the SEO win. */}
          <h1 data-rise style={rise(80)} className="v4hero-h1">
            Useful AI work shouldn&rsquo;t disappear into chats.
          </h1>

          {/* the sub · ONE sentence pair. The full version is desktop; phones
              get the short register (the 7-line sub wall is a defect class). */}
          <p data-rise style={rise(150)} className="v4hero-sub v4hero-sub--full">
            Nika turns repeatable AI work into files you can run, review, diff and
            share. One file&nbsp;· 4&nbsp;verbs&nbsp;· one Rust binary. The agent
            writes the plan, you review it, the runtime{' '}
            <b>enforces</b> it. Then it runs.
          </p>
          <p data-rise style={rise(150)} className="v4hero-sub v4hero-sub--short">
            Repeatable AI work as a file you run, review and share. The agent
            writes the plan. You review it. The runtime <b>enforces</b> it.
          </p>

          {/* the main CTA row · the primary button + the command-as-CTA install */}
          <div
            id="install"
            data-rise
            style={rise(220)}
            className="v4hero-ctas flex scroll-mt-28 flex-wrap items-center gap-3"
          >
            <a href="#the-run" className="v4cta group">
              <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
              See it run
            </a>
            <InstallCommand />
          </div>

          {/* the version plate · mono metadata under the CTAs (Raycast register) */}
          <p className="v4vplate mt-5" data-rise style={rise(260)}>
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
            className="v4hero-links mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14.5px]"
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
          <p data-rise style={rise(360)} className="v4trust mt-10">
            Reviewable<span className="px-2 text-faint">·</span>
            enforced<span className="px-2 text-faint">·</span>
            replayable<span className="px-2 text-faint">·</span>
            one Rust binary<span className="px-2 text-faint">·</span>
            any model<span className="px-2 text-faint">·</span>
            <b>AGPL</b> forever
          </p>
        </div>

        {/* ── RIGHT · THE FILE · the switchable product replica ──────────────
             The selected tab is the file the whole page runs: it descends into
             the replay (beat 2), the plan (beat 3), the boundary (beat 4). */}
        <div className="v4hero-editor" data-rise style={rise(180)}>
          <FileTabs active={index} onSelect={onSelect} />
          <div id="v4ftab-panel" role="tabpanel" aria-labelledby={`v4ftab-${flagship.id}`}>
            <CodeFile
              yaml={flagship.yaml}
              filename={flagship.filename}
              highlight={flagship.highlight}
              className="v4hero-code"
            />
          </div>
          {/* the tab's one-line story + the handoff chip · the SELECTED file is
              the one the run replay below actually plays — filename continuity. */}
          <div className="v4hero-editorfoot mt-4">
            <span className="v4gloss">{flagship.gloss}</span>
            <a href="#the-run" className="v4hint w-fit">
              <span className="v4hint-file">{flagship.filename}</span>
              <span className="text-faint" aria-hidden>
                ·
              </span>
              <span>see it run</span>
              <span className="v4hint-arrow" aria-hidden>
                ↓
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
