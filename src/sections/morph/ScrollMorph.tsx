import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CodeFile } from '../../components/CodeFile'
import { usePlan3D } from './use-plan3d'
import { useAurora } from '../../fx/aurora-context'
import { formatMs, type FlagshipEntry, type FlagshipTask } from '../../flagships'
import { buildScript } from '../run/replay-model'
import {
  PH,
  clamp01,
  easeInOut,
  flightAt,
  phaseAt,
  runFracAt,
  shellAt,
  termAt,
  timelineAt,
  wireAt,
  type MorphTimeline,
} from './morph-model'
import './morph.css'

/* ─── ScrollMorph · F2 · the one continuous scroll-linked scene ───────────────
   Desktop (≥768px, motion-allowed) replaces the separate run/plan beats:
   the SELECTED flagship file travels with scroll, BURSTS into its DAG (the
   real task blocks fly to their node positions), then the recorded run
   chains through the DAG while a terminal strip narrates the same events.

   CONTRACT (the operator's law):
   · scroll-LINKED, never wheel-hijacked — sticky stage + transforms derived
     from native scroll progress, one rAF, no Lenis, no teleports (every
     visual is a continuous pure function of p — scrub back, it reverses)
   · reduced-motion / no-JS / mobile: this section renders the STATIC final
     state (assembled DAG + the full terminal + verdict) or stays hidden
     (≤767px keeps the vertical run+plan story — morph.css gates both)
   · HONESTY: the flying blocks are the file's real lines; node intervals and
     terminal lines come verbatim from the recorded trace (morph-model). */

interface FlightGeom {
  els: HTMLElement[]
  dx: number
  dy: number
}

interface Edge {
  from: string
  to: string
  d: string
  x1: number
  y1: number
  x2: number
  y2: number
}

function nodeChip(entry: FlagshipEntry, task: FlagshipTask): { text: string; skipped: boolean } {
  const done = entry.trace.steps.find((s) => s.kind === 'task_completed' && s.task === task.id)
  if (done?.durationMs !== undefined) return { text: formatMs(done.durationMs), skipped: false }
  const skipped = entry.trace.steps.some((s) => s.kind === 'task_skipped' && s.task === task.id)
  return { text: skipped ? 'skipped · gate closed' : '', skipped }
}

const whenLabel = (when: string): string =>
  when.replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '')

/* the narration counts in words (honest per flagship: the widest wave) */
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'] as const
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n)

/* the traveling card is ~500 spans — a timeline setState (which fires ~25×
   across the run window) must NEVER reconcile it. Its props are stable per
   flagship, so memo skips the whole subtree (longtask budget, F2). */
const MemoCodeFile = memo(CodeFile)

/* wave H · the 3D DAG layer (desktop ≥1024px + WebGL + motion, lazy chunk).
   It reads the SAME scroll progress apply() computes (progressRef) and hides
   the DOM DAG only once actually mounted ([data-plan3d], set by the layer
   itself) — the DOM story below stays the fallback truth everywhere else. */
const ThePlanScene = lazy(() => import('./ThePlanScene'))

export default function ScrollMorph({ flagship }: { flagship: FlagshipEntry }) {
  const script = useMemo(() => buildScript(flagship), [flagship])
  const plan = flagship.plan
  /* the widest wave — the narration's honest "N run together" */
  const maxTogether = useMemo(
    () => plan.waves.reduce((m, w) => Math.max(m, w.length), 0),
    [plan],
  )

  /* SSR / no-JS / reduced-motion truth: the finished scene */
  const [armed, setArmed] = useState(false)
  const [timeline, setTimeline] = useState<MorphTimeline>(() =>
    timelineAt(flagship, script.lines, 1),
  )
  const [edges, setEdges] = useState<Edge[]>([])

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dagRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const termBodyRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>())
  const wireRefs = useRef<(SVGPathElement | null)[]>([])
  /* path lengths cached at edge-commit — getTotalLength() in the frame loop
     would force a reflow per path per frame (longtask budget, F2) */
  const wireLenRef = useRef<number[]>([])
  const flightsRef = useRef<Map<string, FlightGeom>>(new Map())
  const nonTaskRef = useRef<HTMLElement[]>([])
  /** the morph panel's identity rect, section-relative (seam handoff base) */
  const seamBaseRef = useRef<{ left: number; top: number; w: number; h: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const scheduleRef = useRef<(() => void) | null>(null)
  const timelineSigRef = useRef(timelineAt(flagship, script.lines, 1).sig)
  const auroraStateRef = useRef<{ inRun: boolean; ended: boolean; running: string }>({
    inRun: false,
    ended: false,
    running: '',
  })
  const aurora = useAurora()
  const progressRef = useRef(0)
  const plan3d = usePlan3D(sectionRef)

  /* ── measure · file line blocks → node targets (stage coordinates) ──────────
     Transforms are cleared first so a mid-scroll (re)measure — reload, tab
     switch, font swap, resize — reads the true layout, then the same frame
     re-applies p. No flash: clear + measure + apply happen in one rAF. */
  const measure = useCallback(() => {
    const card = cardRef.current
    const dag = dagRef.current
    const stage = stageRef.current
    if (!card || !dag || !stage) return

    /* the card-level transform (seam handoff · settle drift) must not skew
       the line/node geometry this pass reads — clear, measure, re-apply
       (all inside the same rAF, no flash) */
    card.style.transform = ''

    /* the traveling panel's IDENTITY rect, STAGE-relative (the stage is the
       card's static ancestor — sticky offsets never skew this base): the
       hero→morph seam projects the hero panel onto this slot (H-continuity) */
    const code = card.querySelector<HTMLElement>('.morph-code')
    if (code) {
      const sr = stage.getBoundingClientRect()
      const cr = code.getBoundingClientRect()
      seamBaseRef.current = {
        left: cr.left - sr.left,
        top: cr.top - sr.top,
        w: cr.width,
        h: cr.height,
      }
    }

    const flights = new Map<string, FlightGeom>()
    const nonTask: HTMLElement[] = []

    const lineEls = new Map<number, HTMLElement>()
    for (const el of card.querySelectorAll<HTMLElement>('.cf-line')) {
      el.style.transform = ''
      el.style.opacity = ''
      const ln = Number(el.dataset.ln)
      if (!Number.isNaN(ln)) lineEls.set(ln, el)
    }

    const taskLines = new Set<number>()
    for (const t of plan.tasks) {
      const els: HTMLElement[] = []
      let top = Infinity
      let bottom = -Infinity
      let left = Infinity
      let right = -Infinity
      for (let n = t.line0; n <= t.line1; n++) {
        taskLines.add(n)
        const el = lineEls.get(n)
        if (!el) continue
        els.push(el)
        const r = el.getBoundingClientRect()
        top = Math.min(top, r.top)
        bottom = Math.max(bottom, r.bottom)
        left = Math.min(left, r.left)
        right = Math.max(right, r.right)
      }
      const nodeEl = nodeRefs.current.get(t.id)
      if (els.length === 0 || !nodeEl) continue
      nodeEl.style.opacity = ''
      nodeEl.style.transform = ''
      const nr = nodeEl.getBoundingClientRect()
      flights.set(t.id, {
        els,
        dx: nr.left + nr.width / 2 - (left + right) / 2,
        dy: nr.top + nr.height / 2 - (top + bottom) / 2,
      })
    }
    for (const [ln, el] of lineEls) if (!taskLines.has(ln)) nonTask.push(el)

    flightsRef.current = flights
    nonTaskRef.current = nonTask

    /* the wires · measured node-edge to node-edge, in DAG-local coordinates */
    const dr = dag.getBoundingClientRect()
    const next: Edge[] = []
    for (const t of plan.tasks) {
      const toEl = nodeRefs.current.get(t.id)
      if (!toEl) continue
      const tr = toEl.getBoundingClientRect()
      for (const d of t.deps) {
        const fromEl = nodeRefs.current.get(d)
        if (!fromEl) continue
        const fr = fromEl.getBoundingClientRect()
        const x1 = fr.right - dr.left
        const y1 = fr.top + fr.height / 2 - dr.top
        const x2 = tr.left - dr.left
        const y2 = tr.top + tr.height / 2 - dr.top
        const mx = (x2 - x1) / 2
        next.push({
          from: d,
          to: t.id,
          d: `M ${x1} ${y1} C ${x1 + mx} ${y1}, ${x2 - mx} ${y2}, ${x2} ${y2}`,
          x1,
          y1,
          x2,
          y2,
        })
      }
    }
    setEdges(next)
  }, [plan])

  /* ── apply(p) · every visual derives from the one progress ────────────────── */
  const apply = useCallback(
    (p: number) => {
      const stage = stageRef.current
      const card = cardRef.current
      const term = termRef.current
      if (!stage || !card || !term) return
      progressRef.current = p

      /* phase flag → caption + narration crossfade (morph.css) */
      stage.dataset.phase = phaseAt(p)

      /* the file card travels in, then its shell dissolves through the burst */
      const shell = shellAt(p)
      const settle = easeInOut(clamp01(p / PH.settleEnd))
      stage.style.setProperty('--msh', shell.toFixed(3))
      card.style.transform = `translateY(${((1 - settle) * 26).toFixed(2)}px)`
      /* once every flight has landed AND faded, the empty card stops painting
         (the flying lines live INSIDE it — never hide before burstEnd) */
      card.style.visibility = p >= PH.burstEnd && flightsRef.current.size > 0 ? 'hidden' : ''

      /* task blocks fly · wave order · slight per-line trail (comet feel) */
      for (const t of plan.tasks) {
        const geom = flightsRef.current.get(t.id)
        if (!geom) continue
        const e = flightAt(p, t.wave, plan.waveCount)
        for (let i = 0; i < geom.els.length; i++) {
          const le = clamp01(e * 1.18 - i * 0.035)
          const el = geom.els[i]
          const k = easeInOut(le)
          el.style.transform = le === 0 ? '' : `translate(${geom.dx * k}px, ${geom.dy * k}px)`
          el.style.opacity = le < 0.55 ? '1' : String(Math.max(0, 1 - (le - 0.55) / 0.4))
        }
        /* the node materializes where its lines land */
        const nodeEl = nodeRefs.current.get(t.id)
        if (nodeEl) {
          const o = clamp01((e - 0.55) / 0.4)
          nodeEl.style.opacity = o.toFixed(3)
          nodeEl.style.transform = o >= 1 ? '' : `translateY(${((1 - o) * 10).toFixed(2)}px)`
        }
      }
      /* non-task lines dissolve with the shell (a touch of drift) */
      for (let i = 0; i < nonTaskRef.current.length; i++) {
        const el = nonTaskRef.current[i]
        el.style.opacity = shell.toFixed(3)
        el.style.transform =
          shell >= 1 ? '' : `translateY(${((1 - shell) * (i % 2 === 0 ? 8 : -6)).toFixed(2)}px)`
      }

      /* wires draw once the nodes have landed (lengths pre-cached) */
      const wd = wireAt(p)
      for (let i = 0; i < wireRefs.current.length; i++) {
        const path = wireRefs.current[i]
        const len = wireLenRef.current[i]
        if (!path || len === undefined) continue
        path.style.strokeDasharray = String(len)
        path.style.strokeDashoffset = String(len * (1 - easeInOut(wd)))
        path.style.opacity = wd <= 0 ? '0' : '1'
      }

      /* the terminal strip rises, then the recorded run plays on scroll */
      const te = termAt(p)
      term.style.opacity = te.toFixed(3)
      term.style.transform = te >= 1 ? '' : `translateY(${((1 - te) * 18).toFixed(2)}px)`

      const rf = runFracAt(p)
      const next = timelineAt(flagship, script.lines, rf)
      if (next.sig !== timelineSigRef.current) {
        timelineSigRef.current = next.sig
        setTimeline(next)
      }

      /* EdgeAurora · the page frame breathes with the recorded run (E7) */
      const as = auroraStateRef.current
      if (rf > 0 && !as.inRun) {
        as.inRun = true
        as.ended = false
        aurora.runStart()
      }
      if (as.inRun) {
        aurora.runProgress(rf)
        const running = plan.tasks
          .filter((t) => next.nodes[t.id] === 'running')
          .map((t) => t.id)
          .join(' ')
        if (running && running !== as.running) {
          const newest = plan.tasks.find(
            (t) => next.nodes[t.id] === 'running' && !as.running.includes(t.id),
          )
          if (newest) aurora.verbTick(newest.verb)
        }
        as.running = running
        if (as.ended && rf < 1) {
          /* scrubbed back INTO the run window after the verdict — the scene is
             a pure function of p, so the frame re-enters the bloom with it */
          as.ended = false
          aurora.runStart()
        }
        if (rf >= 1 && !as.ended) {
          as.ended = true
          aurora.runEnd(flagship.trace.exit === 0 ? 'success' : 'failure')
        }
        if (rf <= 0) {
          as.inRun = false
          as.running = ''
        }
      }
    },
    [aurora, flagship, plan, script],
  )

  /* ── arm · desktop + motion only (the static final scene is the default) ──── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const wide = window.matchMedia('(min-width: 768px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => setArmed(wide.matches && !reduced.matches)
    decide()
    wide.addEventListener('change', decide)
    reduced.addEventListener('change', decide)
    return () => {
      wide.removeEventListener('change', decide)
      reduced.removeEventListener('change', decide)
    }
  }, [])

  /* disarm → clear every inline write so the static CSS truth shows */
  useEffect(() => {
    if (armed) return
    const stage = stageRef.current
    if (!stage) return
    stage.style.removeProperty('--msh')
    delete stage.dataset.phase
    for (const el of stage.querySelectorAll<HTMLElement>('.cf-line, .morph-node, .morph-term')) {
      el.style.transform = ''
      el.style.opacity = ''
    }
    setTimeline(timelineAt(flagship, script.lines, 1))
    timelineSigRef.current = timelineAt(flagship, script.lines, 1).sig
  }, [armed, flagship, script])

  /* ── the scroll driver · one rAF, event-scheduled, measure-aware ──────────── */
  useEffect(() => {
    if (!armed || typeof window === 'undefined') return
    const section = sectionRef.current
    if (!section) return

    /* H-CONTINUITY · the hero's file panel and this scene's file are ONE
       object. Across the hero→morph seam (section top traveling viewport
       bottom → top, q 0→1) the morph card takes over AT the hero panel's
       live projected rect (same CodeFile, same flagship — pixel-equivalent
       content) while the hero panel steps aside, then glides DOWN into its
       sticky slot. Pure function of scroll: scrub up, it hands back. */
    const heroPanel = document.querySelector<HTMLElement>('.v4hero-code')
    const SEAM_TAKE = 0.04
    const seam = (rect: DOMRect, vh: number) => {
      const card = cardRef.current
      const stage = stageRef.current
      if (!heroPanel || !card || !stage) return
      const q = 1 - rect.top / vh
      const inWindow = q >= SEAM_TAKE && q < 1
      /* the stage un-clips ONLY while the card travels outside its box */
      if (inWindow) stage.dataset.seam = '1'
      else delete stage.dataset.seam
      if (q >= 1) {
        /* past the seam · the hero panel is above the viewport; hand its
           visibility back so an upward scrub finds it intact */
        heroPanel.style.visibility = ''
        return
      }
      if (!inWindow) {
        /* before the takeover · the hero panel IS the file; no second copy */
        heroPanel.style.visibility = ''
        card.style.visibility = 'hidden'
        return
      }
      const base = seamBaseRef.current
      const hr = heroPanel.getBoundingClientRect()
      if (!base || base.w <= 0 || hr.width <= 0) return
      const sr = stage.getBoundingClientRect()
      const k = easeInOut(clamp01((q - SEAM_TAKE) / (1 - SEAM_TAKE)))
      const inv = 1 - k
      const dx = (hr.left + hr.width / 2 - (sr.left + base.left + base.w / 2)) * inv
      const dy = (hr.top + hr.height / 2 - (sr.top + base.top + base.h / 2)) * inv
      const s = 1 + (hr.width / base.w - 1) * inv
      /* the glide ENDS on the settle pose (translateY 26px) — apply() then
         eases 26→0 across the file beat, zero teleport at the boundary */
      card.style.visibility = ''
      card.style.transform = `translate3d(${dx.toFixed(1)}px, ${(dy + 26 * k).toFixed(1)}px, 0) scale(${s.toFixed(4)})`
      heroPanel.style.visibility = 'hidden'
    }

    let needMeasure = true
    const frame = () => {
      rafRef.current = null
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      /* off-screen → zero work */
      if (rect.bottom < -vh || rect.top > vh * 2) return
      if (needMeasure) {
        needMeasure = false
        measure()
      }
      const runway = rect.height - vh
      apply(runway > 0 ? clamp01(-rect.top / runway) : 1)
      seam(rect, vh)
    }
    const schedule = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(frame)
    }
    const remeasure = () => {
      needMeasure = true
      schedule()
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure)
    /* fonts swap the metrics the flights were measured from */
    document.fonts?.ready.then(remeasure).catch(() => {})
    const ro =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure)
    if (dagRef.current) ro?.observe(dagRef.current)
    scheduleRef.current = schedule
    schedule()

    return () => {
      scheduleRef.current = null
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      ro?.disconnect()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      /* hand the file back to the hero (disarm · unmount) */
      heroPanel?.style.removeProperty('visibility')
      if (stageRef.current) delete stageRef.current.dataset.seam
      if (cardRef.current) {
        cardRef.current.style.visibility = ''
        cardRef.current.style.transform = ''
      }
    }
  }, [armed, measure, apply])

  /* freshly committed wire paths carry no dash style until the next frame —
     cache their lengths ONCE (never in the frame loop) and re-apply as soon
     as the edge set lands (tab switch · first measure) */
  useEffect(() => {
    wireRefs.current.length = edges.length
    wireLenRef.current = wireRefs.current.map((p) => (p ? p.getTotalLength() : 0))
    scheduleRef.current?.()
  }, [edges])

  /* the terminal follows its newest line (internal scroll only) */
  useEffect(() => {
    const body = termBodyRef.current
    if (body) body.scrollTop = body.scrollHeight
  }, [timeline.reveal])

  const { verdict } = script

  return (
    <section
      ref={sectionRef}
      className="morphsec theme-dark"
      aria-labelledby="the-morph-title"
      data-armed={armed || undefined}
    >
      <div className="morph-stage" ref={stageRef} data-phase={armed ? 'file' : 'done'}>
        <div className="morph-wrap">
          <header className="morph-head">
            <p className="v4fig">FIG 1.0</p>
            <h2 id="the-morph-title" className="morph-title">
              Watch the file become the run.
            </h2>
            {/* the phase captions · one visible at a time (CSS crossfade) */}
            <div className="morph-captions" aria-hidden={armed ? undefined : true}>
              <p className="morph-cap" data-for="file">
                The same file you just read. Keep scrolling.
              </p>
              <p className="morph-cap" data-for="burst">
                It bursts into its plan. Steps with no dependency <b>run together</b>.
              </p>
              <p className="morph-cap" data-for="run">
                The recorded run chains through it, step by step.
              </p>
            </div>
          </header>

          <div className="morph-scene">
            {/* THE NARRATION · plain anyone-words, one line per phase — the
                empty left column at 1440 becomes the narration rail (H2 ·
                morph.css places, fades, and clears the DAG). Decorative: the
                head captions + the scene itself carry the meaning for AT. */}
            <div className="morph-say" aria-hidden="true">
              <p className="morph-say-line" data-for="file">
                one file · the whole plan, readable
              </p>
              <p className="morph-say-line" data-for="burst">
                each task takes its place
              </p>
              <p className="morph-say-line" data-for="run">
                steps light up in order
                {maxTogether > 1 ? ` · ${countWord(maxTogether)} run together` : ''}
              </p>
              <p className="morph-say-line" data-for="done">
                the run is a file too · replay it anytime
              </p>
            </div>

            {/* THE FILE · the traveling card (same chrome + filename as the hero) */}
            <div className="morph-file" ref={cardRef}>
              <MemoCodeFile
                yaml={flagship.yaml}
                filename={flagship.filename}
                highlight={flagship.highlight}
                className="morph-code"
              />
            </div>

            {/* THE DAG · wave columns + measured wires (the burst's target) */}
            <div className="morph-dag" ref={dagRef}>
              <svg className="morph-wires" aria-hidden>
                {edges.map((e, i) => (
                  <g key={`${e.from}-${e.to}`}>
                    <path
                      ref={(el) => {
                        wireRefs.current[i] = el
                      }}
                      d={e.d}
                    />
                    <circle cx={e.x1} cy={e.y1} r={2} />
                    <circle cx={e.x2} cy={e.y2} r={2} />
                  </g>
                ))}
              </svg>
              {plan.waves.map((wave, w) => (
                <div className="morph-wave" key={w}>
                  <p className="morph-wave-cap">
                    <span className="morph-wave-n">[ {String(w + 1).padStart(2, '0')} ]</span>
                    {wave.length > 1 ? `run together ×${wave.length}` : w === 0 ? 'start' : 'then'}
                  </p>
                  <div className="morph-col">
                    {wave.map((task) => {
                      const chip = nodeChip(flagship, task)
                      const state = timeline.nodes[task.id] ?? 'pending'
                      return (
                        <div
                          key={task.id}
                          ref={(el) => {
                            nodeRefs.current.set(task.id, el)
                          }}
                          className="morph-node"
                          data-verb={task.verb}
                          data-run={state}
                        >
                          <span className="morph-node-id">{task.id}</span>
                          <span className="morph-node-verb">{task.verb}</span>
                          <span className="morph-node-target" title={task.target}>
                            {task.target}
                          </span>
                          {task.when ? (
                            <span className="morph-node-when" title={task.when}>
                              when: {whenLabel(task.when)}
                            </span>
                          ) : null}
                          <span className="morph-node-chip" data-skipped={chip.skipped || undefined}>
                            {state === 'done' && chip.text && !chip.skipped ? `✓ ${chip.text}` : ''}
                            {state === 'skipped' ? `⊘ ${chip.text || 'skipped'}` : ''}
                            {state === 'running' ? '● running' : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* THE 3D MOMENT · wave H (desktop) — the DAG as dither-lit slabs,
                 the camera advancing through the waves with the recorded run */}
            {armed && plan3d ? (
              <Suspense fallback={null}>
                <ThePlanScene
                  flagship={flagship}
                  progressRef={progressRef}
                  stageRef={stageRef}
                  cardRef={cardRef}
                />
              </Suspense>
            ) : null}
          </div>

          {/* THE TERMINAL · the recorded event stream, driven by the scroll */}
          <div className="morph-term cf-panel" ref={termRef}>
            <div className="cf-chrome">
              <span className="cf-ticks" aria-hidden>
                <span className="cf-tick" />
                <span className="cf-tick" />
                <span className="cf-tick" />
              </span>
              <span className="cf-tab" title={flagship.filename}>
                <span className="cf-tab-name">{flagship.filename}</span>
              </span>
              <span className="morph-rec" aria-hidden>
                <span className="morph-rec-dot" data-live={armed && !timeline.verdictOn} />
                recorded
              </span>
            </div>
            <div className="morph-term-body" ref={termBodyRef} role="log" aria-live="off">
              {script.lines.slice(0, timeline.reveal).map((line, i) => (
                <div
                  className="morph-line"
                  data-kind={line.kind}
                  data-verb={line.verb}
                  key={`${flagship.id}-${i}`}
                >
                  <span className="morph-line-glyph" aria-hidden>
                    {line.glyph}
                  </span>
                  <span className="morph-line-text">{line.text}</span>
                </div>
              ))}
            </div>
            <div className="morph-verdict" data-done={timeline.verdictOn}>
              {timeline.verdictOn ? (
                <>
                  <span className="morph-verdict-exit" data-exit={verdict.exit}>
                    {verdict.exit === 0 ? '✓' : '✗'} exit {verdict.exit}
                  </span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span>
                    {verdict.completed} task{verdict.completed > 1 ? 's' : ''} ran
                    {verdict.skipped > 0 ? ` · ${verdict.skipped} skipped by its when: gate` : ''}
                  </span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span>{formatMs(verdict.totalMs)}</span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span className="morph-verdict-art">{verdict.artifact}</span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span>$0.00 · {verdict.model}</span>
                </>
              ) : (
                <span className="morph-verdict-wait">running…</span>
              )}
            </div>
          </div>

          <p className="morph-caption">
            recorded from a real nika run · replayed by your scroll · nothing staged
          </p>
        </div>
      </div>
    </section>
  )
}
