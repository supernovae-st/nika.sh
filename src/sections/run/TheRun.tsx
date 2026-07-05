import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SectionHead } from '../../components/SectionHead'
import { useRevealOnce } from '../use-reveal-once'
import { useAurora } from '../../fx/aurora-context'
import { formatMs, type FlagshipEntry } from '../../flagships'
import { buildScript, type ReplayLine } from './replay-model'
import './run.css'

/* ─── THE RUN · beat 2 · the trace replay ─────────────────────────────────────
   The SELECTED flagship file (beat 1) executes as a recorded real-run event
   stream: typed lines land at reading pace, the EdgeAurora frame rises with
   the run (verb hues · E7), the verdict bar settles on the real exit code.

   HONESTY: everything displayed is verbatim from the flagship's recorded
   trace (a real `nika run` on a real machine · local model). Only the PACING
   is presentational — the caption says so.

   NO PIN · NO SCROLL-SCRUB (law #2): the device is tap-▶ / autoplay-once-in-
   view; the section is normal flow and resolves to the complete static state
   (SSR / no-JS / reduced-motion ship the full log + verdict — the replay only
   arms client-side when motion is allowed). Tab switches re-arm cleanly. */

/* word-level streaming reveal (the Cursor `streaming-word-fade` register):
   each word fades 0.35→1 over ~80ms with a small stagger. Reduced-motion
   renders plain text (run.css gates the animation). */
function Words({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((w, i) => (
        <span
          key={i}
          className="v5run-word"
          style={{ ['--wd' as string]: `${i * 26}ms` }}
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

function Line({ line }: { line: ReplayLine }) {
  return (
    <div className="v5run-line" data-kind={line.kind} data-verb={line.verb}>
      <span className="v5run-glyph" aria-hidden>
        {line.glyph}
      </span>
      <span className="v5run-text">
        <Words text={line.text} />
      </span>
    </div>
  )
}

export default function TheRun({ flagship }: { flagship: FlagshipEntry }) {
  const script = useMemo(() => buildScript(flagship), [flagship])
  const total = script.lines.length

  /* SSR / no-JS / reduced-motion: the COMPLETE run is visible. The replay
     arms on mount when motion is allowed (reveal drops to 0, the observer
     autoplays once in view). */
  const [revealed, setRevealed] = useState(total)
  const [done, setDone] = useState(true)
  const motionOkRef = useRef(false)

  const rootRef = useRevealOnce<HTMLElement>()
  const stageRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playingRef = useRef(false)
  const playedOnceRef = useRef(false)
  const aurora = useAurora()

  const stopTimers = useCallback(() => {
    if (timerRef.current != null) clearTimeout(timerRef.current)
    timerRef.current = null
    playingRef.current = false
  }, [])

  const play = useCallback(() => {
    stopTimers()
    playingRef.current = true
    playedOnceRef.current = true
    setRevealed(0)
    setDone(false)
    aurora.runStart()

    const step = (i: number) => {
      const line = script.lines[i]
      timerRef.current = setTimeout(() => {
        setRevealed(i + 1)
        if (line.kind === 'start' && line.verb) aurora.verbTick(line.verb)
        aurora.runProgress(line.progress)
        if (i + 1 < total) {
          step(i + 1)
        } else {
          playingRef.current = false
          setDone(true)
          aurora.runEnd(script.verdict.exit === 0 ? 'success' : 'failure')
        }
      }, line.delayMs)
    }
    step(0)
  }, [aurora, script, stopTimers, total])

  /* motion gate · a ref, not state (the static full-log render is the SSR /
     reduced-motion truth; only motion-allowed clients arm the device) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    motionOkRef.current = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  /* mount + flagship switch → re-arm on the (new) script. Async by design:
     the reset happens in a task, never synchronously inside the effect. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    stopTimers()
    const t = setTimeout(() => {
      if (!motionOkRef.current) return
      if (playedOnceRef.current) {
        play()
      } else {
        setRevealed(0)
        setDone(false)
      }
    }, 0)
    return () => clearTimeout(t)
  }, [script, play, stopTimers])

  /* autoplay ONCE when the stage enters the viewport */
  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && motionOkRef.current && !playedOnceRef.current) {
            play()
            io.disconnect()
          }
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [play])

  /* the log follows the newest line while playing (internal scroll only) */
  useEffect(() => {
    const body = bodyRef.current
    if (!body || !playingRef.current) return
    body.scrollTop = body.scrollHeight
  }, [revealed])

  /* unmount mid-run → hand the frame back to idle. stopTimers alone only
     silences the replay — the aurora entered run mode at play() and would
     stay loud on whatever page comes next; runStop() actually hands the
     frame back (the comment used to promise this without doing it). */
  useEffect(() => {
    return () => {
      const wasPlaying = playingRef.current
      stopTimers()
      if (wasPlaying) aurora.runStop()
    }
  }, [stopTimers, aurora])

  const { verdict } = script

  return (
    <section
      ref={rootRef}
      aria-labelledby="the-run-title"
      className="theme-dark v4sec v4-flip"
    >
      <div className="v4sec-wrap">
        <SectionHead fig="01" id="the-run-title" title="Press play. It really ran.">
          The same file, executed by the engine with a <b>local model</b> on a real
          machine. What you watch is the recorded event stream.
        </SectionHead>

        <div className="v5run-stage" data-rise ref={stageRef}>
          {/* the frame · the SAME window chrome family as the hero editor —
              the filename carries the continuity (one object, descending) */}
          <div className="cf-panel v5run-panel">
            <div className="cf-chrome">
              <span className="cf-ticks" aria-hidden>
                <span className="cf-tick" />
                <span className="cf-tick" />
                <span className="cf-tick" />
              </span>
              <span className="cf-tab" title={flagship.filename}>
                <span className="cf-tab-name">{flagship.filename}</span>
              </span>
              <span className="v5run-rec" aria-hidden>
                <span className="v5run-rec-dot" data-live={!done} />
                recorded
              </span>
            </div>

            {/* the CodeFile keyboard law applies HERE too: a fixed-height
                scrollable well must be keyboard-reachable — the log earns
                tabindex + an accessible name (the ring is the global
                --focus-ring seam) */}
            <div
              className="v5run-body"
              ref={bodyRef}
              role="log"
              aria-live="off"
              tabIndex={0}
              aria-label={`recorded run of ${flagship.filename} — scrollable log`}
            >
              {script.lines.slice(0, revealed).map((line, i) => (
                <Line line={line} key={`${flagship.id}-${i}`} />
              ))}
              {!done ? (
                <span className="v5run-cursor" aria-hidden>
                  ▌
                </span>
              ) : null}
            </div>

            {/* the verdict bar · reserved height (zero shift) · real numbers.
                role=status: the settled verdict announces ONCE to assistive
                tech when the replay lands it (the SSR / reduced-motion render
                is born settled — aria-live only speaks on change, so those
                registers stay silent). */}
            <div className="v5run-verdict" data-done={done} role="status">
              {done ? (
                <>
                  <span className="v5run-verdict-exit" data-exit={verdict.exit}>
                    {verdict.exit === 0 ? '✓' : '✗'} exit {verdict.exit}
                  </span>
                  <span className="v5run-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span>
                    {verdict.completed} task{verdict.completed > 1 ? 's' : ''} ran
                    {verdict.skipped > 0
                      ? ` · ${verdict.skipped} skipped by its when: gate`
                      : ''}
                  </span>
                  <span className="v5run-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span>{formatMs(verdict.totalMs)}</span>
                  <span className="v5run-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span className="v5run-verdict-art">{verdict.artifact}</span>
                  <span className="v5run-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span>$0.00 · {verdict.model}</span>
                </>
              ) : (
                <span className="v5run-verdict-wait">running…</span>
              )}
            </div>
          </div>

          <div className="v5run-foot">
            <button type="button" className="v5run-replay" onClick={play}>
              <span aria-hidden>▶</span> replay
            </button>
            <p className="v5run-caption">
              recorded from a real nika run · replayed at reading pace · nothing staged
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
