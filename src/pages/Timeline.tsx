import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { TIMELINE } from '../content/timeline.generated'
import { routeHead } from '../content'
import '../sections/v4-home.css'
import './timeline-page.css'

/* ─── /timeline · the one verifiable record ──────────────────────────────────
   Three eras, dated entries, forward gates — spoken in the register
   grammar (the /providers · /tools · /errors family). The page renders
   the vendored projection of nika-spec timeline/timeline.yaml — the SSOT
   whose provable claims are re-proven by the spec's own CI. Every
   proof badge links to the public source (crates.io keeps yanked
   versions listed forever · GitHub keeps commits and releases).
   Unprovable claims are labeled, never dressed as proof. The future
   carries conditions, never dates.

   TWO LAYOUTS (the manifesto stage law, TheRecord.tsx):
   - the LEDGER below = the truth. What SSG renders, what mobile,
     reduced motion, keyboards and readers get. Always complete.
   - the STAGE (desktop ≥1024px + motion): a sticky full-viewport
     scene; vertical scroll slides the record left→right through a
     fixed playhead. Releases ride ABOVE the baseline (they carry the
     light), milestones BELOW; era marks stand on the rail; past the
     today pulse the gates wait as porous cards. The stage is a visual
     double of the ledger — aria-hidden, zero duplicate tab stops. */

const CLASS_LABEL: Record<string, string> = {
  'crates-io': 'crates.io',
  'github-release': 'release',
  'github-commit': 'commit',
  'github-pr': 'PR',
  'git-tag': 'tag',
  scorecard: 'scorecard',
  'private-archive': 'private archive',
  testimony: 'testimony',
}

type Evidence = (typeof TIMELINE.eras)[number]['entries'][number]['evidence']

function Proof({ evidence, tabbable = true }: { evidence: Evidence; tabbable?: boolean }) {
  const label = CLASS_LABEL[evidence.class] ?? evidence.class
  const tab = tabbable ? undefined : -1
  if (evidence.provable && evidence.href) {
    return (
      <a className="tl-proof tl-proof-proved" href={evidence.href} target="_blank" rel="noreferrer" tabIndex={tab}>
        ✓ {label}
      </a>
    )
  }
  if (evidence.class === 'scorecard' && evidence.href) {
    return (
      <a className="tl-proof tl-proof-recorded" href={evidence.href} target="_blank" rel="noreferrer" tabIndex={tab}>
        · {label}
      </a>
    )
  }
  return (
    <span className="tl-proof tl-proof-unprovable" title="labeled honestly — no mechanical proof exists or is claimed">
      ○ {label}
    </span>
  )
}

/* ─── the stage track · one flat run of the whole record ─────────────────────
   Era marks open their chapter, entries alternate staves by type, the
   today pulse closes the past, the gates close the track. All derived
   from the SSOT at module scope — deterministic, SSG byte-stable
   (today = lastUpdated, never the wall clock). */

const ERA_GLYPH: Record<string, string> = { exploration: '✧', brouillon: '✎', diamond: '◆' }

type Era = (typeof TIMELINE.eras)[number]
type Entry = Era['entries'][number]
type Gate = (typeof TIMELINE.gates)[number]
type TrackItem =
  | { kind: 'era'; era: Era }
  | { kind: 'entry'; era: string; e: Entry }
  | { kind: 'today' }
  | { kind: 'gate'; g: Gate }

const TRACK: TrackItem[] = [
  ...TIMELINE.eras.flatMap((era): TrackItem[] => [
    { kind: 'era', era },
    ...era.entries.map((e): TrackItem => ({ kind: 'entry', era: era.id, e })),
  ]),
  { kind: 'today' },
  ...TIMELINE.gates.map((g): TrackItem => ({ kind: 'gate', g })),
]

/* the record's dimensions · derived from the SSOT, never typed (the
   count-source law) — the stamp figures below read these */
const ENTRY_COUNT = TRACK.filter((t) => t.kind === 'entry').length
const PROVEN_COUNT = TRACK.filter((t) => t.kind === 'entry' && t.e.evidence.provable).length

/* the chapters · one chip per era + the gates. The href is the era's
   deep-link id: the ledger scrolls natively, the stage SEEKS (toHash).
   Era openings derive from each era's first dated entry — never typed. */
const CHAPTERS = [
  ...TIMELINE.eras.map((era) => ({
    id: era.id,
    glyph: ERA_GLYPH[era.id] ?? '·',
    label: era.title.replace(/^The /, ''),
  })),
  { id: 'gates', glyph: '◇', label: 'The gates' },
]
const ERA_OPENINGS = TIMELINE.eras.flatMap((era) =>
  era.entries.length > 0
    ? [{ id: era.id as string, glyph: ERA_GLYPH[era.id] ?? '·', date: era.entries[0].date as string }]
    : [],
)

/* band counts pluralize over a widened number — the SSOT tuples carry
   literal lengths, and `=== 1` on a literal that is never 1 is a TS2367 */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/* minimap seats · day-linear from the record's dawn, gates in a visual
   tail past the now mark (24 virtual days each — the future has no
   real time axis, only order) */
const T0 = Date.parse('2025-07-01')
const DAY = 86_400_000
const NOW_DAYS = (Date.parse(TIMELINE.lastUpdated) - T0) / DAY
const GATE_DAYS = 24
const RANGE = NOW_DAYS + TIMELINE.gates.length * GATE_DAYS + 10
const seatOf = (iso: string) => {
  const d = Date.parse(iso.length === 7 ? `${iso}-15` : iso)
  return `${((((d - T0) / DAY) / RANGE) * 100).toFixed(2)}%`
}
const gateSeat = (i: number) => `${(((NOW_DAYS + (i + 0.5) * GATE_DAYS) / RANGE) * 100).toFixed(2)}%`
const NOW_SEAT = `${((NOW_DAYS / RANGE) * 100).toFixed(2)}%`

/* the playhead's horizontal seat inside the stage (fraction of width) */
const PLAYHEAD = 0.38

function Stage() {
  const [mode, setMode] = useState<'v' | 'h'>('v')
  const [playing, setPlaying] = useState(false)
  const [flies, setFlies] = useState<number[]>([])
  const geomRef = useRef({ wrapTop: 0, trackScroll: 0 })

  /* ▶ the record plays itself at reading pace · any gesture takes the
     wheel back (wheel/touch/pointer/key). Also the keyboard's one door
     into the stage's motion — the button is real, never aria-hidden.
     House law: the imperative lives in an effect, exposed by ref. */
  const playCtl = useRef<{ start: () => void; stop: () => void } | null>(null)
  useEffect(() => {
    let raf = 0
    const CANCEL = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    const stop = () => {
      cancelAnimationFrame(raf)
      for (const ev of CANCEL) window.removeEventListener(ev, stop)
      setPlaying(false)
    }
    const start = () => {
      const to = geomRef.current.wrapTop + geomRef.current.trackScroll
      const from = window.scrollY
      if (to - from < 40) return
      const dur = Math.max(6000, ((to - from) / 380) * 1000)
      const t0 = performance.now()
      setPlaying(true)
      for (const ev of CANCEL) window.addEventListener(ev, stop, { passive: true })
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur)
        window.scrollTo(0, from + (to - from) * t)
        if (t < 1) raf = requestAnimationFrame(step)
        else stop()
      }
      raf = requestAnimationFrame(step)
    }
    playCtl.current = { start, stop }
    return () => {
      stop()
      playCtl.current = null
    }
  }, [])
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const yearRef = useRef<HTMLSpanElement>(null)
  const eraRef = useRef<HTMLSpanElement>(null)
  const miniRef = useRef<HTMLSpanElement>(null)
  const minimapRef = useRef<HTMLDivElement>(null)

  /* capability gate · the stage needs width and motion; everyone else
     keeps the ledger (live listeners: resize/OS toggle flips layouts) */
  useEffect(() => {
    const mqW = window.matchMedia('(min-width: 1024px)')
    const mqM = window.matchMedia('(prefers-reduced-motion: reduce)')
    const set = () => setMode(mqW.matches && !mqM.matches ? 'h' : 'v')
    set()
    mqW.addEventListener('change', set)
    mqM.addEventListener('change', set)
    return () => {
      mqW.removeEventListener('change', set)
      mqM.removeEventListener('change', set)
    }
  }, [])

  /* the stage driver (h only) · the house rAF+translate3d pattern from
     TheRecord.tsx: 1px of wheel = 1px of track, the sticky stage just
     watches progress; whatever crosses the playhead goes live and turns
     the year + era counters. Sleeps while offscreen. */
  useEffect(() => {
    if (mode !== 'h') return
    const wrap = wrapRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!wrap || !stage || !track) return

    let trackScroll = 0
    let wrapTop = 0
    let miniW = 0
    let lastX = -1
    let near = true
    let centers: { el: HTMLElement; cx: number; year: string; era: string }[] = []
    let liveEl: HTMLElement | null = null
    let ended = false
    let raf = 0

    const measure = () => {
      trackScroll = Math.max(0, track.scrollWidth - stage.clientWidth)
      wrap.style.height = `calc(100dvh + ${trackScroll}px)`
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY
      geomRef.current = { wrapTop, trackScroll }
      miniW = (minimapRef.current?.clientWidth ?? 0) - 2
      centers = [...track.querySelectorAll<HTMLElement>('.tls-ent')].map((el) => ({
        el,
        cx: el.offsetLeft + el.offsetWidth / 2,
        year: el.querySelector('time')?.getAttribute('datetime')?.slice(0, 4) ?? '',
        era: el.dataset.era ?? '',
      }))
    }

    const ERA_NAME: Record<string, string> = {
      exploration: '✧ exploration',
      brouillon: '✎ brouillon',
      diamond: '◆ diamond',
      gates: '◇ the gates',
    }

    const apply = () => {
      raf = 0
      const p = Math.min(1, Math.max(0, (window.scrollY - wrapTop) / (trackScroll || 1)))
      const x = p * trackScroll
      if (x === lastX) return
      lastX = x
      track.style.transform = `translate3d(${-x}px, 0, 0)`
      if (miniRef.current) miniRef.current.style.transform = `translate3d(${p * miniW}px, 0, 0)`
      const ph = x + stage.clientWidth * PLAYHEAD
      let cur: (typeof centers)[0] | undefined
      for (const it of centers) {
        if (it.cx <= ph + 30) cur = it
        else break
      }
      if (!cur && centers[0]) {
        if (yearRef.current && yearRef.current.textContent !== centers[0].year)
          yearRef.current.textContent = centers[0].year
        if (eraRef.current && eraRef.current.textContent !== ERA_NAME[centers[0].era])
          eraRef.current.textContent = ERA_NAME[centers[0].era] ?? ''
      }
      if (cur && cur.el !== liveEl) {
        liveEl?.removeAttribute('data-live')
        cur.el.setAttribute('data-live', '1')
        liveEl = cur.el
        if (yearRef.current && cur.year) yearRef.current.textContent = cur.year
        if (eraRef.current) eraRef.current.textContent = ERA_NAME[cur.era] ?? ''
      }
      const end = p > 0.965
      if (end !== ended) {
        ended = end
        stage.toggleAttribute('data-end', end)
      }
    }

    const onScroll = () => {
      if (near && !raf) raf = requestAnimationFrame(apply)
    }
    const onResize = () => {
      measure()
      apply()
    }

    /* the minimap scrubs · pointer-only travel (the stage is the pointer's
       surface; keyboards and readers own the ledger). Fraction of the strip
       = fraction of the record — the same mapping the riding head renders. */
    const mm = minimapRef.current
    const scrub = (e: PointerEvent) => {
      if (!mm) return
      const r = mm.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      window.scrollTo({ top: wrapTop + p * trackScroll, behavior: 'instant' })
    }
    const mmUp = () => mm?.removeEventListener('pointermove', scrub)
    const mmDown = (e: PointerEvent) => {
      e.preventDefault()
      mm?.setPointerCapture?.(e.pointerId)
      scrub(e)
      mm?.addEventListener('pointermove', scrub)
    }
    mm?.addEventListener('pointerdown', mmDown)
    mm?.addEventListener('pointerup', mmUp)
    mm?.addEventListener('pointercancel', mmUp)

    /* deep links play the record · #exploration/#brouillon/#diamond seek the
       era mark onto the playhead, #gates seeks the first gate card (the
       manifesto's toHash law). The ledger anchor below stays the reading
       position; this is the visual seat. */
    const toHash = () => {
      const id = location.hash.slice(1)
      if (!['exploration', 'brouillon', 'diamond', 'gates'].includes(id)) return
      const el = track.querySelector<HTMLElement>(
        id === 'gates' ? ".tls-ent[data-era='gates']" : `.tls-eramark[data-era='${id}']`,
      )
      if (!el) return
      const cx = el.offsetLeft + el.offsetWidth / 2
      window.scrollTo({
        top: wrapTop + Math.max(0, Math.min(trackScroll, cx - stage.clientWidth * PLAYHEAD)),
        behavior: 'instant',
      })
    }

    const io = new IntersectionObserver(
      (es) => {
        near = es[0]?.isIntersecting ?? true
        if (near) {
          lastX = -1
          onScroll()
        }
      },
      { rootMargin: '50% 0px' },
    )
    io.observe(wrap)
    measure()
    apply()
    toHash()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('hashchange', toHash)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('hashchange', toHash)
      mm?.removeEventListener('pointerdown', mmDown)
      mm?.removeEventListener('pointerup', mmUp)
      mm?.removeEventListener('pointercancel', mmUp)
      mm?.removeEventListener('pointermove', scrub)
      track.style.transform = ''
      wrap.style.height = ''
      stage.removeAttribute('data-end')
      liveEl?.removeAttribute('data-live')
    }
  }, [mode])

  return (
    <div className="tls-scope" data-mode={mode}>
      {/* the stage is a visual double of the ledger below — hidden from
          the tree, zero duplicate tab stops (proof links tab -1) */}
      <div ref={wrapRef} className="tls-wrap" aria-hidden="true">
        <div ref={stageRef} className="tls-stage">
          <span className="tls-year mono" ref={yearRef} />
          <span className="tls-eraname mono" ref={eraRef} />
          <span className="tls-playhead" />

          {/* the whole record in one glance · the reading head rides it ·
              the burst of 79 versions reads as physical density */}
          <div className="tls-minimap" ref={minimapRef}>
            <div className="tls-mstrip">
              {TIMELINE.eras.flatMap((era) =>
                era.entries.map((e, i) => (
                  <span
                    key={`${era.id}-${i}`}
                    className="tls-tick"
                    data-kind={e.type}
                    style={{ left: seatOf(e.date) }}
                  />
                )),
              )}
              {TIMELINE.gates.map((g, i) => (
                <span key={g.id} className="tls-tick" data-kind="gate" style={{ left: gateSeat(i) }} />
              ))}
              {ERA_OPENINGS.map((e) => (
                <span key={e.id} className="tls-mera" style={{ left: seatOf(e.date) }}>
                  {e.glyph}
                </span>
              ))}
              <span className="tls-mnow" style={{ left: NOW_SEAT }} />
            </div>
            <span className="tls-mini-ph" ref={miniRef} />
          </div>

          <ol ref={trackRef} className="tls-track">
            {TRACK.map((it, i) => {
              if (it.kind === 'era')
                return (
                  <li key={i} className="tls-eramark" data-era={it.era.id}>
                    <span className="tls-era-rule" />
                    <p className="tls-era-lab mono">
                      {ERA_GLYPH[it.era.id]} {it.era.title}
                      <span>{it.era.span}</span>
                      <span className="tls-era-count">
                        {plural(it.era.entries.length, 'dated entry', 'dated entries')}
                      </span>
                    </p>
                  </li>
                )
              if (it.kind === 'today')
                return (
                  <li key={i} className="tls-todaymark">
                    <span className="tls-today-dot" />
                    <p className="mono">
                      today · <time dateTime={TIMELINE.lastUpdated}>{TIMELINE.lastUpdated}</time>
                    </p>
                  </li>
                )
              if (it.kind === 'gate')
                return (
                  <li key={i} className="tls-ent tls-gatecard" data-kind="gate" data-era="gates">
                    <p className="tls-date mono tls-gatetag">gate · conditions, never dates</p>
                    <h3 className="tls-title">{it.g.title}</h3>
                    <ul className="tls-conds">
                      {it.g.conditions.slice(0, 2).map((c, j) => (
                        <li key={j}>{c}</li>
                      ))}
                      {it.g.conditions.length > 2 ? <li>…</li> : null}
                    </ul>
                  </li>
                )
              const { e, era } = it
              const rel = e.type === 'release'
              return (
                <li key={i} className="tls-ent" data-kind={rel ? 'release' : 'milestone'} data-era={era}>
                  <span className="tls-glyph" />
                  <span className="tls-stem" />
                  <p className="tls-date mono">
                    <time dateTime={e.date}>{e.precision === 'month' ? e.date.slice(0, 7) : e.date}</time>
                  </p>
                  <h3 className="tls-title">
                    {rel && e.version ? <code className="tl-ver">{e.version}</code> : null}
                    {e.title}
                  </h3>
                  {e.detail ? <p className="tls-line">{e.detail}</p> : null}
                  <p className="tls-srcs mono">
                    <Proof evidence={e.evidence} tabbable={false} />
                  </p>
                </li>
              )
            })}
          </ol>

          {/* the terminus lands with the last card */}
          <div
            className="tls-terminus"
            onClick={() => setFlies((f) => (f.length > 5 ? f : [...f, Date.now()]))}
          >
            {flies.map((id) => (
              <span key={id} className="tls-fly" onAnimationEnd={() => setFlies((f) => f.filter((x) => x !== id))}>
                🦋
              </span>
            ))}
            <span className="tls-pulse" />
            <p className="mono">
              re-proven in CI · verified <time dateTime={TIMELINE.lastUpdated}>{TIMELINE.lastUpdated}</time>
            </p>
          </div>
        </div>
      </div>
      <div className="tls-hintrow">
        <button
          type="button"
          className="tls-play mono"
          onClick={() => (playing ? playCtl.current?.stop() : playCtl.current?.start())}
          aria-label={playing ? 'Take the wheel back' : 'Play the record: travel it end to end at reading pace'}
        >
          {playing ? '⏸ take the wheel' : '▶ play the record'}
        </button>
        <p className="tls-hint mono" aria-hidden="true">
          scroll plays the record · drag the strip to travel · the full ledger is below
        </p>
      </div>
    </div>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const head = routeHead('/timeline')
  useHead({
    title: 'Timeline · the one verifiable record · Nika',
    meta: [
      {
        name: 'description',
        content:
          'Private exploration through 2025 · 79 versions in the 103-day brouillon era · rewritten from scratch April 13. Every dated claim re-proven in CI. The future carries conditions, never dates.',
      },
      { property: 'og:title', content: 'Timeline · the one verifiable record · Nika' },
      {
        property: 'og:description',
        content:
          'Three eras: the exploration through 2025, the 79-version brouillon, the diamond rewrite. Every provable claim re-proven in CI; the future carries conditions, never dates.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-timeline.png' },
      {
        property: 'og:image:alt',
        content:
          'Nika timeline: the one verifiable record. Three eras, every provable claim re-proven in CI, gates never dates.',
      },
      { name: 'twitter:title', content: 'Timeline · Nika' },
      {
        name: 'twitter:description',
        content: 'The one verifiable record: eras, releases, gates never dates.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-timeline.png' },
      ...head.meta,
    ],
    link: head.link,
  })

  return (
    <main className="theme-dark tl-page" style={{ ['--hub-hue' as string]: '#f0b429' }}>
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="tl-title" className="v4sec v4-in">
        <div className="v4sec-wrap tl-head">
          <p className="v4sec-fig" data-rise>
            the verifiable record
          </p>
          <h1 id="tl-title" className="v4sec-title tl-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Timeline.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Three eras, one continuous version line, rendered from the spec&apos;s own{' '}
            <a href="https://github.com/supernovae-st/nika-spec/blob/main/timeline/timeline.yaml">
              <code>timeline/timeline.yaml</code>
            </a>
            . Every provable claim on this page is <b>re-proven in CI</b> against its public
            source: crates.io keeps yanked versions listed forever, GitHub keeps commits and
            releases. What cannot be proven is labeled, never dressed as proof; the future
            carries conditions, never dates.
          </p>
          <p className="tl-authority" data-rise style={{ ['--rise-delay' as string]: '170ms' }}>
            source of truth ·{' '}
            <a href="https://github.com/supernovae-st/nika-spec/blob/main/timeline/timeline.yaml">
              timeline/timeline.yaml
            </a>{' '}
            · verified by{' '}
            <a href="https://github.com/supernovae-st/nika-spec/blob/main/timeline/verify.py">
              verify.py
            </a>{' '}
            · last verified <time dateTime={TIMELINE.lastUpdated}>{TIMELINE.lastUpdated}</time>
          </p>

          {/* the record's dimensions, at a glance — every figure derived from the SSOT */}
          <StampStrip
            items={[
              { n: TIMELINE.eras.length, label: 'eras', sub: 'exploration · brouillon · diamond' },
              { n: ENTRY_COUNT, label: 'dated entries', sub: 'every one carries evidence' },
              { n: PROVEN_COUNT, label: 're-proven in CI', sub: 'against public sources' },
              { n: TIMELINE.gates.length, label: 'gates ahead', sub: 'conditions, never dates' },
            ]}
          />

          {/* the chapters · deep links the whole page understands: the ledger
              scrolls, the stage SEEKS the era onto the playhead (toHash) */}
          <nav className="tl-chapters mono" aria-label="Chapters" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {CHAPTERS.map((c) => (
              <a key={c.id} className="tl-chapter" href={`#${c.id}`}>
                <span aria-hidden>{c.glyph}</span> {c.label}
              </a>
            ))}
          </nav>
        </div>

        <Stage />

        <div className="v4sec-wrap tl-ledger">
          {TIMELINE.eras.map((era, gi) => (
            <section
              className="tl-era"
              id={era.id}
              key={era.id}
              aria-labelledby={`${era.id}-title`}
              data-rise
              style={{ ['--rise-delay' as string]: `${180 + gi * 30}ms` }}
            >
              <div className="cl-year-head">
                <h2 className="cl-year-n tl-era-n" id={`${era.id}-title`}>
                  {era.title}
                </h2>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">{plural(era.entries.length, 'entry', 'entries')}</span>
              </div>
              <p className="tl-span">{era.span}</p>
              <p className="tl-story">{era.story}</p>
              {era.entries.length > 0 && (
                <ol className="tl-entries">
                  {era.entries.map((e, i) => (
                    <li className="tl-entry" key={i}>
                      <span className="tl-date">{e.precision === 'month' ? e.date.slice(0, 7) : e.date}</span>
                      <span className="tl-body">
                        <span className="tl-title">
                          {e.type === 'release' && e.version ? <code className="tl-ver">{e.version}</code> : null}
                          {e.title}
                        </span>
                        {e.detail ? <span className="tl-detail">{e.detail}</span> : null}
                      </span>
                      <Proof evidence={e.evidence} />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          {/* the past closes here · the same pulse the stage carries */}
          <div className="tl-today-divider mono" data-rise aria-hidden="true">
            <span className="tl-today-dot" />
            today · <time dateTime={TIMELINE.lastUpdated}>{TIMELINE.lastUpdated}</time> ·
            re-proven in CI
          </div>

          <section
            className="tl-gates"
            id="gates"
            aria-labelledby="gates-title"
            data-rise
            style={{ ['--rise-delay' as string]: `${180 + TIMELINE.eras.length * 30}ms` }}
          >
            <div className="cl-year-head">
              <h2 className="cl-year-n tl-era-n" id="gates-title">
                What comes next
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {plural(TIMELINE.gates.length, 'gate', 'gates')} · never dates
              </span>
            </div>
            <p className="tl-story">
              Forward motion is expressed as conditions that must hold. A gate flips when its
              conditions are true, and the timeline gains a dated, proven entry at that moment.
              No promised dates exist to slip.
            </p>
            <ol className="tl-entries tl-gate-list">
              {TIMELINE.gates.map((g) => (
                <li className="tl-entry tl-gate" key={g.id}>
                  <span className="tl-date tl-gate-mark">gate</span>
                  <span className="tl-body">
                    <span className="tl-title">{g.title}</span>
                    <ul className="tl-conditions">
                      {g.conditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                    {g.note ? <span className="tl-detail">{g.note}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <p className="tl-foot" data-rise>
            The record grows only at its source: a claim lands in the spec&apos;s YAML, CI
            re-proves it, this page re-renders. The{' '}
            <Link to="/changelog">changelog</Link> is the exhaustive ship log this record
            distills, and <Link to="/install">install</Link> puts the engine it describes on
            your machine. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
