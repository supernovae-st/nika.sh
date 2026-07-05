import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { useRevealOnce } from '../use-reveal-once'
import './run-explains.css'

/* ─── THE RUN EXPLAINS ITSELF · fig 4.5 · the observability chapter ─────────
   One signature workflow (9 tasks · all four verbs · a diamond fanout),
   watched from every side: audited before it starts, storyboarded while it
   runs, replayable after it ends, durable through a kill and a human gate.

   HONESTY: every frame is real output of the real binary (nika 0.93.1),
   captured on a 100-col pty against committed fixtures, converted to these
   assets mechanically (scripts/media/ in this repo: raw captures · manifest ·
   the regeneration gate). The hero loop replays the recorded frames at
   reading pace; the caption says so.

   Device: a poster-first <video> hero (plays only in view + motion allowed)
   and a chapter strip swapping ONE still (fixed aspect → zero shift). */

const MEDIA = '/media'

interface Beat {
  id: string
  /** the strip button label (mono register) */
  label: string
  /** the beat's one-line claim (fed to the tab aria-label) */
  claim: string
  /** the honest caption: what the capture actually shows */
  note: string
  img: string
  alt: string
}

const BEATS: Beat[] = [
  {
    id: 'check',
    label: 'nika check',
    claim: 'Audited before a single token.',
    note: 'the pre-flight ladder: plan · cost · secrets · types · tools · args · schema · permits, then one hint. rc=0.',
    img: `${MEDIA}/posters/check-audit.png`,
    alt: 'Terminal capture of nika check on the signature workflow: the audit ladder passes with a cost floor warning and one permits hint, rc=0.',
  },
  {
    id: 'inspect',
    label: 'nika inspect',
    claim: 'The shape of the run, before the run.',
    note: 'static anatomy: 8 waves · a 2-wide parallel box · the pinch points · the blast radius per task.',
    img: `${MEDIA}/posters/inspect-anatomy.png`,
    alt: 'Terminal capture of nika inspect: the DAG as waves with a parallel box, plus parallelism, pinch and blast-radius lines.',
  },
  {
    id: 'epilogue',
    label: 'the epilogue',
    claim: 'Every run ends with its proof.',
    note: 'per-task waterfall · the verdict card · 922 tokens · $0.00 · outputs typed. Straight off the live render.',
    img: `${MEDIA}/posters/run-epilogue.png`,
    alt: 'Terminal capture of the end of a nika run: nine green tasks, a duration waterfall, and the verdict card with tokens and cost.',
  },
  {
    id: 'outputs',
    label: 'trace outputs',
    claim: 'The flight recorder, browsable.',
    note: 'nika trace outputs: verb · duration · tokens · a bounded preview per task, from the run’s NDJSON trace.',
    img: `${MEDIA}/posters/trace-outputs.png`,
    alt: 'Terminal capture of nika trace outputs: a table of nine tasks with verbs, durations, token counts and output previews.',
  },
  {
    id: 'flow',
    label: 'trace flow',
    claim: 'Which output fed which task.',
    note: 'the data waterfall: 11 edges with recorded sizes, derived from plan bindings and the trace.',
    img: `${MEDIA}/posters/trace-flow.png`,
    alt: 'Terminal capture of nika trace flow: task-to-task edges annotated with the byte size that flowed across each one.',
  },
  {
    id: 'resume',
    label: 'kill → resume',
    claim: 'Finished work never runs twice.',
    note: 'kill -9 mid-fanout (exit 137), then nika run --resume: 4 cache hits banked, 4 ran live.',
    img: `${MEDIA}/posters/kill-resume.png`,
    alt: 'Two terminal panels: a run killed mid-fanout with exit 137, then a resumed run where four tasks are cache hits and four run live.',
  },
  {
    id: 'gate',
    label: 'human gate',
    claim: 'It pauses for a human. Durably.',
    note: 'a nika:prompt gate exits 4 and journals the question; --resume --answer approve=true re-arms and publishes.',
    img: `${MEDIA}/posters/gate-consent.png`,
    alt: 'Two terminal panels: a gated run pausing with exit 4 and a workflow_paused note, then the answered resume completing with five cache hits.',
  },
]

export default function RunExplains() {
  const rootRef = useRevealOnce<HTMLElement>()
  const videoRef = useRef<HTMLVideoElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [beat, setBeat] = useState(0)
  const active = BEATS[beat]

  /* the hero loop plays ONLY in view and only when motion is allowed —
     poster-first (preload=none), so the section costs nothing at load */
  useEffect(() => {
    const el = videoRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) void el.play().catch(() => {})
          else el.pause()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* pre-decode the next still so the swap never flashes */
  const prefetch = useCallback((i: number) => {
    const img = new Image()
    img.src = BEATS[i].img
  }, [])

  /* APG tablist keys · arrows cycle, Home/End jump — selection follows focus
     (the Hero FileTabs contract, one keyboard voice for every tab strip) */
  const onTabKeyDown = (e: React.KeyboardEvent) => {
    let next: number
    if (e.key === 'ArrowRight') next = (beat + 1) % BEATS.length
    else if (e.key === 'ArrowLeft') next = (beat - 1 + BEATS.length) % BEATS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = BEATS.length - 1
    else return
    e.preventDefault()
    setBeat(next)
    prefetch(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section
      ref={rootRef}
      id="run-explains"
      aria-labelledby="run-explains-title"
      className="theme-dark v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <SectionHead fig="4.5" id="run-explains-title" title="The run explains itself.">
          One file ran once: audited before it started, storyboarded while it ran,
          replayable after it ended. Every frame below is real output of the real
          binary, captured on a terminal against committed fixtures. Offline, on the
          mock model, for zero dollars.
        </SectionHead>

        {/* the hero loop · the recorded live run */}
        <figure className="v5rx-hero" data-rise>
          <video
            ref={videoRef}
            className="v5rx-video"
            poster={`${MEDIA}/posters/run-live.png`}
            width={1600}
            height={900}
            muted
            loop
            playsInline
            preload="none"
            aria-label="The live run: nine tasks schedule, execute and complete, ending on the waterfall and the verdict card."
          >
            <source src={`${MEDIA}/videos/run-live.webm`} type="video/webm" />
            <source src={`${MEDIA}/videos/run-live.mp4`} type="video/mp4" />
          </video>
          <figcaption className="v5rx-caption">
            recorded from a real <code>nika run</code> · replayed at reading pace ·
            nothing staged
          </figcaption>
        </figure>

        {/* the chapter strip · one still, seven surfaces */}
        <div
          className="v5rx-beats"
          data-rise
          role="tablist"
          aria-label="The run's surfaces"
          onKeyDown={onTabKeyDown}
        >
          {BEATS.map((b, i) => (
            <button
              key={b.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`v5rx-tab-${b.id}`}
              aria-selected={i === beat}
              aria-controls="v5rx-panel"
              aria-label={`${b.label} · ${b.claim}`}
              tabIndex={i === beat ? 0 : -1}
              className="v5rx-beat"
              onClick={() => setBeat(i)}
              onMouseEnter={() => prefetch(i)}
              onFocus={() => prefetch(i)}
            >
              {b.label}
            </button>
          ))}
        </div>

        <figure
          className="v5rx-stage"
          data-rise
          role="tabpanel"
          id="v5rx-panel"
          aria-labelledby={`v5rx-tab-${active.id}`}
        >
          <img
            className="v5rx-still"
            src={active.img}
            alt={active.alt}
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
          />
          <figcaption className="v5rx-caption">{active.note}</figcaption>
        </figure>
      </div>
    </section>
  )
}
