import { Link } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import { CodeFile } from '../components/CodeFile'
import { verbGlyph } from '../components/codefile-highlight'
import { MiniDag } from '../components/MiniDag'
import { InstallCommand } from '../components/InstallCommand'
import { useMagnetic } from '../fx/use-magnetic'
import { ENGINE_VERSION } from '../content'
import { type FlagshipEntry } from '../flagships'
import { HERO_TAB_COUNT, LIBRARY, verbsOf, type LibraryItem } from '../flagships/library'
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

/* ── the hero chrome · the readability vignette ───────────────────────────────
   (The corner registration ticks retired 2026-07-11: over the live dither
   field they rasterized as smudge squares, not 1px arms — pixel-probed at
   144,117/1282,117 — and they were the glitch-read the mobile hide rule
   already admitted. The blueprint register lives in the field + fig marks.) */
function HeroAtmosphere() {
  return <div className="v4hero-readscrim" aria-hidden />
}

/* ── the sharp file-tab strip · mono, hairline, no pills ──────────────────────
   role=tablist with roving tabIndex + arrow-key switching. Sits BELOW the
   editor panel (operator wave I): the panel chrome above carries the full
   filename; the strip is the compact switcher. The DEFAULT tab (daily-brief)
   is prerendered, so crawlers / no-JS get the default story.

   Wave N: the strip keeps the first THREE (permits · when-gate · schema — the
   pedagogy row; three + the picker fit the panel whole at every desktop
   width, five cut a tab mid-word); the full ten-file corpus lives behind the
   library picker at the strip's right edge. `active` is a LIBRARY index —
   when it points past the strip, no tab is selected (the picker trigger
   carries the active filename instead). */
const TABS = LIBRARY.slice(0, HERO_TAB_COUNT)

function FileTabs({
  active,
  onSelect,
}: {
  active: number
  onSelect: (i: number) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const stripRef = useRef<HTMLDivElement>(null)
  /* the strip can still overflow on a narrow phone — surface the same honest
     scroll cue as the code panel: fade only while there IS hidden content to
     the right. */
  useEffect(() => {
    const strip = stripRef.current
    const clip = strip?.parentElement
    if (!strip || !clip) return
    const update = () => {
      clip.dataset.overflowing = String(strip.scrollWidth - strip.clientWidth > 1)
      clip.dataset.atEnd = String(strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2)
    }
    update()
    strip.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    ro?.observe(strip)
    return () => {
      strip.removeEventListener('scroll', update)
      ro?.disconnect()
    }
  }, [])
  const onKeyDown = (e: React.KeyboardEvent) => {
    // APG tablist keys · arrows cycle, Home/End jump to the edges. When the
    // active file lives off-strip (library pick), arrows re-enter at the edge.
    const onStrip = active >= 0 && active < TABS.length
    let next: number
    if (e.key === 'ArrowRight') next = onStrip ? (active + 1) % TABS.length : 0
    else if (e.key === 'ArrowLeft')
      next = onStrip ? (active - 1 + TABS.length) % TABS.length : TABS.length - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    onSelect(next)
    refs.current[next]?.focus()
  }
  return (
    <div className="v4ftabs-clip">
      <div
        ref={stripRef}
        className="v4ftabs"
        role="tablist"
        aria-label="Flagship workflow files"
        onKeyDown={onKeyDown}
      >
      {TABS.map((f, i) => (
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
          tabIndex={i === active || (i === 0 && active >= TABS.length) ? 0 : -1}
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
    </div>
  )
}

/* ── the ghost tab bar · the morph card's inert chrome twin (wave P) ──────────
   The traveling card must render the SAME titlebar as the hero window at the
   seam (chrome = tabs now) — this is that bar as decoration: same classes,
   same layout, zero interaction. When the recorded flagship lives off-strip
   (a library pick), the trigger slot carries its name, exactly like the live
   picker does. */
export function FileTabsGhost({ active }: { active: string }) {
  const onStrip = TABS.some((f) => f.label === active)
  return (
    <span className="v4chrometabs v4chrometabs--ghost" aria-hidden>
      <span className="v4ftabs-clip">
        <span className="v4ftabs">
          {TABS.map((f) => (
            <span key={f.id} className="v4ftab" data-sel={f.label === active || undefined}>
              {f.label}
            </span>
          ))}
        </span>
      </span>
      <span className="v4lib">
        <span className="v4lib-trigger" data-active={!onStrip || undefined}>
          {onStrip ? 'library' : active}
          <span className="v4lib-trigger-glyph">⋯</span>
        </span>
      </span>
    </span>
  )
}

/* ── the library picker · the « other files » quick-open (wave K) ─────────────
   A compact popover listing the WHOLE ten-file corpus: verb glyphs (derived
   from each plan, hued), filename, one honest phrase, task count, and the
   recorded dot when a real trace backs the file. APG listbox: the trigger is
   a button (aria-haspopup/expanded); options take real focus, arrows walk,
   Enter/Space picks, Escape returns to the trigger; outside-pointerdown
   closes. SSR renders the trigger only (closed) — byte-stable. */
function LibraryPicker({
  active,
  onSelect,
}: {
  active: number
  onSelect: (i: number) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const optRefs = useRef<(HTMLButtonElement | null)[]>([])
  const offStrip = active >= HERO_TAB_COUNT

  /* outside-click + Escape · armed only while open (costs nothing at rest) */
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  /* opening lands focus on the active file's row (the quick-open register) */
  useEffect(() => {
    if (open) optRefs.current[active]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot on open only
  }, [open])

  const walk = (e: React.KeyboardEvent) => {
    const idx = optRefs.current.findIndex((el) => el === document.activeElement)
    let next: number
    if (e.key === 'ArrowDown') next = Math.min(LIBRARY.length - 1, idx + 1)
    else if (e.key === 'ArrowUp') next = Math.max(0, idx - 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = LIBRARY.length - 1
    else return
    e.preventDefault()
    optRefs.current[next]?.focus()
  }

  const pick = (i: number) => {
    onSelect(i)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="v4lib">
      <button
        ref={triggerRef}
        type="button"
        id="v4lib-trigger"
        className="v4lib-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="v4lib-panel"
        data-active={offStrip || undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {offStrip ? (
          <>
            {LIBRARY[active].label}
            <span className="v4ftab-ext" aria-hidden>
              .nika.yaml
            </span>
          </>
        ) : (
          'library'
        )}
        <span className="v4lib-trigger-glyph" aria-hidden>
          ⋯
        </span>
      </button>
      {open && (
        <div ref={panelRef} className="v4lib-panel" id="v4lib-panel">
          <p className="v4lib-head" aria-hidden>
            the workflow library · {LIBRARY.length} files
          </p>
          <div
            role="listbox"
            aria-label="Workflow library"
            className="v4lib-list"
            onKeyDown={walk}
          >
            {LIBRARY.map((f, i) => (
              <button
                key={f.id}
                ref={(el) => {
                  optRefs.current[i] = el
                }}
                type="button"
                role="option"
                aria-selected={i === active}
                className="v4lib-row"
                onClick={() => pick(i)}
              >
                <span className="v4lib-line">
                  <span className="v4lib-glyphs" aria-hidden>
                    {verbsOf(f.plan).map((v) => (
                      <span key={v} data-v={v}>
                        {verbGlyph(v)}
                      </span>
                    ))}
                  </span>
                  <span className="v4lib-name">
                    {f.label}
                    <span className="v4lib-ext" aria-hidden>
                      .nika.yaml
                    </span>
                  </span>
                  <span className="v4lib-meta">
                    {f.plan.tasks.length} tasks
                    {f.flagship ? (
                      <span className="v4lib-rec"> · ● recorded</span>
                    ) : null}
                  </span>
                </span>
                <span className="v4lib-blurb">{f.blurb}</span>
              </button>
            ))}
          </div>
          <p className="v4lib-legend">
            ● recorded from a real nika run · the rest browse from the embedded
            pack (<code>nika examples</code>)
          </p>
        </div>
      )}
    </div>
  )
}

export default function Hero({
  item,
  index,
  onSelect,
  flagship,
}: {
  /** the SELECTED library file — what the editor shows */
  item: LibraryItem
  /** LIBRARY index of the selection */
  index: number
  onSelect: (i: number) => void
  /** the recorded flagship the story below plays (item’s own when recorded,
      the last recorded pick when the selection is browse-only) */
  flagship: FlagshipEntry
}) {
  const rootRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  /* the primary CTA leans toward the hand (wave-I VFX · fine pointers only) */
  const ctaRef = useRef<HTMLAnchorElement>(null)
  useMagnetic(ctaRef)

  /* opt the hero into the orchestrated entrance — only when motion is allowed.
     Adding the class in an effect (post-paint) guarantees the prerendered HTML
     ships fully visible (no opacity:0 stuck for crawlers / no-JS / reduced). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    rootRef.current?.classList.add('v4-enter')
  }, [])

  /* the tab switch stays CALM (operator 2026-07-13, supersedes the goto
     pass): a new file opens at its TOP with nothing selected — the old
     scroll-to-evidence + pulse read as teleporting to arbitrary lines.
     The evidence still lights on hover (wave Q) and the tips still teach;
     the panel just never travels on its own. */
  useEffect(() => {
    const pre = panelRef.current?.querySelector<HTMLElement>('.cf-pre')
    if (pre) pre.scrollTop = 0
  }, [item.id])

  /* ── the bidirectional pairing (wave K) · one shared state, two mirrors ─────
     Hover/focus a mini-DAG node → the editor lights that task's exact lines;
     hover a task block in the YAML → its node lights. Hovering the evidence
     range lights ITS band (wave Q: nothing stays lit at rest — a permanent
     band read as a stuck selection, operator bug report). The pair resets on
     file switch. */
  const [pairTask, setPairTask] = useState<string | null>(null)
  const [overEvidence, setOverEvidence] = useState(false)
  /* file switch clears the pair · the render-time adjustment (not an effect):
     the stale pair never paints, and no cascading second render fires. */
  const [pairFile, setPairFile] = useState(item.id)
  if (pairFile !== item.id) {
    setPairFile(item.id)
    setPairTask(null)
    setOverEvidence(false)
  }
  const paired = pairTask ? item.plan.tasks.find((t) => t.id === pairTask) : undefined
  const onLineHover = (ln: number | null) => {
    if (ln == null) {
      setPairTask(null)
      setOverEvidence(false)
      return
    }
    const t = item.plan.tasks.find((t) => ln >= t.line0 && ln <= t.line1)
    setPairTask(t ? t.id : null)
    setOverEvidence(!t && ln >= item.highlight[0] && ln <= item.highlight[1])
  }

  /* the evidence range's hover card (wave P) · the tab's gloss is 'key: words'
     — hovering ANYWHERE on the lit band floats it, with the /spec link the
     resolver derives from the key. */
  const gi = item.gloss.indexOf(':')
  const rangeTip =
    gi > 0
      ? {
          lines: item.highlight,
          term: item.gloss.slice(0, gi),
          words: item.gloss.slice(gi + 1).trim(),
        }
      : undefined

  /* the run handoff · lives at TITLE LEVEL, on the plan's caption row (wave O
     — the old bottom chip repeated the filename the chrome already shows).
     Recorded files link into the run story below; a browse-only pick says so
     honestly — the replay stays on the last recorded file. */
  const planAction = item.flagship ? (
    <a href="#the-run" className="v4plan-run">
      see it run{' '}
      <span className="v4plan-run-arrow" aria-hidden>
        ↓
      </span>
    </a>
  ) : (
    <a href="#the-run" className="v4plan-run v4plan-run--browse">
      no recorded run · below replays{' '}
      <span className="v4plan-run-file">{flagship.label}</span>{' '}
      <span className="v4plan-run-arrow" aria-hidden>
        ↓
      </span>
    </a>
  )

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
          {/* the two moments lead (issue #192): audited BEFORE a token is
              spent · a verifiable receipt AFTER every run — the painkiller
              stops hiding behind the specs line (which lives on the plate).
              The receipt phrase links the long-form anchor, quietly. */}
          <p data-rise style={rise(150)} className="v4hero-sub v4hero-sub--full">
            Nika turns repeatable AI work into files you can run, review, diff
            and share: <b>audited before a token is spent</b>, with{' '}
            <Link to="/blog/the-pipeline-is-a-file" className="v4hero-sublink">
              a verifiable receipt
            </Link>{' '}
            after every run. An agent writes the plan; you review it; the
            runtime <b>enforces</b> it.
          </p>
          <p data-rise style={rise(150)} className="v4hero-sub v4hero-sub--short">
            Repeatable AI work as a file: audited before a token is spent, a
            receipt after every run. The runtime <b>enforces</b> it.
          </p>

          {/* the main CTA row · the primary button + the command-as-CTA install */}
          <div
            id="install"
            data-rise
            style={rise(220)}
            className="v4hero-ctas flex scroll-mt-28 flex-wrap items-center gap-3"
          >
            <a ref={ctaRef} href="#the-run" className="v4cta vfx-mag group">
              <span aria-hidden className="transition-transform group-hover:translate-y-0.5">
                ↓
              </span>
              See it run
            </a>
            <InstallCommand />
            {/* the two escape hatches, one quiet row: the browser playground
                (W12b·A2 · no install, nothing leaves the tab) and the editor
                extension (the surface most readers already live in — the
                anchor scrolls to the working miniature, which sells it
                better than any store page). */}
            <span className="v4hero-hatches">
              <Link to="/play" className="v4hero-play">
                try it in your browser
                <span className="acue acue--r" aria-hidden>
                  {' '}
                  →
                </span>
              </Link>
              <span className="v4hero-hatch-sep" aria-hidden>
                ·
              </span>
              <a href="#editor" className="v4hero-play">
                or in VS Code / Cursor
                <span className="acue acue--d" aria-hidden>
                  {' '}
                  ↓
                </span>
              </a>
            </span>
          </div>

          {/* the version plate · the ONE metadata line under the CTAs. (Wave Q
              diet: the spec/GitHub links row duplicated the nav, the trust
              litany repeated the sub — five quiet elements now, not eight;
              the trust story lives downstream where it's earned.) */}
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
        </div>

        {/* ── RIGHT · THE FILE · the switchable product replica ──────────────
             The selected tab is the file the whole page runs: it descends into
             the replay (beat 2), the plan (beat 3), the boundary (beat 4).
             Reading order (wave O·P): THE PLAN first (what happens, assembling
             in time order), then the file. The switcher lives IN the window's
             titlebar (wave P: a real editor's tab bar — the active tab IS the
             filename, no repeat), the copy chip floats in the code corner. */}
        <div className="v4hero-editor" data-rise style={rise(180)}>
          {/* THE PLAN · derived from the selection, so every library pick gets
              its diagram for free · ≥1024 only (the editor is the phone's
              whole story — phones keep the big See-it-run CTA). */}
          <MiniDag
            plan={item.plan}
            orientation="band"
            fileId={item.id}
            pairTask={pairTask}
            onPair={setPairTask}
            action={planAction}
            className="v4hero-dag"
          />
          <div ref={panelRef}>
            {/* wrap: the hero is the READING surface — long flow lines soft-wrap
                with a hanging indent (no right-edge clip, no hidden content).
                tips + rangeTip: the smart-hover layer (plain-words glossary +
                the tab's gloss over its whole evidence band). NOTHING is lit
                at rest (wave Q): hovering the evidence lights its band + card;
                hovering a plan node or a task block lights that task's exact
                lines (the pairing). bodyProps marks the CODE area as the
                tabpanel the chrome tabs control. */}
            <CodeFile
              yaml={item.yaml}
              highlight={
                paired
                  ? [paired.line0, paired.line1]
                  : overEvidence
                    ? item.highlight
                    : undefined
              }
              className="v4hero-code cf-panel--seam cf-panel--fadebottom"
              wrap
              tips
              rangeTip={rangeTip}
              onLineHover={onLineHover}
              copyInBody
              chromeSlot={
                <div className="v4chrometabs">
                  <FileTabs active={index} onSelect={onSelect} />
                  <LibraryPicker active={index} onSelect={onSelect} />
                </div>
              }
              bodyProps={{
                id: 'v4ftab-panel',
                role: 'tabpanel',
                'aria-labelledby':
                  index < HERO_TAB_COUNT ? `v4ftab-${item.id}` : 'v4lib-trigger',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
