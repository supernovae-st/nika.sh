import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CodeFile } from '../../components/CodeFile'
import { usePlan3D } from './use-plan3d'
import { useAurora } from '../../fx/aurora-context'
import { formatMs, type FlagshipEntry, type FlagshipTask } from '../../flagships'
import { buildScript } from '../run/replay-model'
import {
  PH,
  aspireAt,
  clamp01,
  condenseAt,
  easeInOut,
  igniteAt,
  phaseAt,
  runFracAt,
  shellAt,
  taskInterval,
  termAt,
  timelineAt,
  travelAt,
  wireAt,
  type MorphTimeline,
} from './morph-model'
import { VERB_WORDS } from './plain-words'
import './morph.css'
import '../../fx/slab-sweep.css'

/* ─── ScrollMorph · F2 · the one continuous scroll-linked scene ───────────────
   Desktop (≥768px, motion-allowed) replaces the separate run/plan beats:
   the SELECTED flagship file travels with scroll, each task block CONDENSES
   into a seed chip and is DRAWN along a curve into its DAG slot (per-task
   aspiration, reading order — the causality IS the animation), then the
   recorded run chains through the DAG while a terminal strip narrates the
   same events. At `done` the settled file returns BESIDE the flat 2D DAG and
   hovering either side lights the other (the comprehension frame).

   CONTRACT (the operator's law):
   · scroll-LINKED, never wheel-hijacked — sticky stage + transforms derived
     from native scroll progress, one rAF, no Lenis, no teleports (every
     visual is a continuous pure function of p — scrub back, it reverses)
   · reduced-motion / no-JS / mobile: this section renders the STATIC final
     state (assembled DAG + the full terminal + verdict) or stays hidden
     (≤767px keeps the vertical run+plan story — morph.css gates both)
   · HONESTY: a seed chip is the task's real id + verb; node intervals and
     terminal lines come verbatim from the recorded trace (morph-model). */

interface BlockGeom {
  /** the task block's own file lines */
  els: HTMLElement[]
  /** per line · distance to the block's center (the condensation vector) */
  lineDy: number[]
  /** per line · drain factor 1 (file top) → 0 (file bottom) */
  lineF: number[]
  /** the block's drain factor (its lines' mean) — offsets the seed origin */
  f: number
  /** the block's center — the seed's origin (seed-layer coords) */
  p0: { x: number; y: number }
  /** the DOM node's center — the seed's landing (seed-layer coords) */
  p2: { x: number; y: number }
}

/* THE DRAIN · as the file is consumed top-first, the remaining lines sag
   DOWNWARD (top lines most, the outputs line pinned) so the text clears the
   slab band where the consumed tasks land — un-read YAML and a landed slab
   may never interleave (operator, wave I). Analytic (a pure function of p),
   so the seed origins ride the same offset and scrubbing reverses it. */
const DRAIN_MAX = 150
const drainAt = (p: number): number =>
  DRAIN_MAX * easeInOut(clamp01((p - (PH.burst0 + 0.06)) / 0.1))

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

/* one quadratic bezier axis — the seed's curved aspiration path */
const qbez = (a: number, c: number, b: number, t: number): number => {
  const v = 1 - t
  return v * v * a + 2 * v * t * c + t * t * b
}

/* the traveling card is ~500 spans — a timeline setState (which fires ~25×
   across the run window) must NEVER reconcile it. Its props are stable per
   flagship, so memo skips the whole subtree (longtask budget, F2). */
const MemoCodeFile = memo(CodeFile)

/* the fixed nav floats over the stage — the traveling card must dive UNDER
   it, never linger behind it (operator: the YAML rows hid behind the nav) */
const NAV_SAFE = 92

/* ENTRY YIELD · geometric, never timed (operator, wave I: the lede rendered
   through the panel's title bar). The heading + narration hide while the
   traveling panel's top edge is within these margins of the caption band's
   measured bottom — a pure function of the two rects, so the window holds at
   any scroll speed, in both directions. Hysteresis kills boundary flicker. */
const YIELD_ON = 10
const YIELD_OFF = 14
const yieldEntry = (stage: HTMLElement, clearance: number): void => {
  if (stage.dataset.entry) {
    if (clearance >= YIELD_OFF) delete stage.dataset.entry
  } else if (clearance < YIELD_ON) {
    stage.dataset.entry = '1'
  }
}

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
  /* the done-frame pairing · hovered/focused task (node ⟷ YAML both drive) */
  const [hoverTask, setHoverTask] = useState<string | null>(null)
  /* THE CONSOLE (wave L) · play state + track refs — all three inputs (scroll,
     scrub, play) drive the ONE scroll position, so p stays a pure function
     of scroll and every phase remains scrub-reversible. */
  const [playing, setPlaying] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const trackDragRef = useRef(false)
  const ariaPctRef = useRef(-1)
  const hoverSrcRef = useRef<'node' | 'yaml'>('node')

  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dagRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const termBodyRef = useRef<HTMLDivElement>(null)
  const donePanelRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLDivElement | null>())
  const wireRefs = useRef<(SVGPathElement | null)[]>([])
  /* path lengths cached at edge-commit — getTotalLength() in the frame loop
     would force a reflow per path per frame (longtask budget, F2) */
  const wireLenRef = useRef<number[]>([])
  const blocksRef = useRef<Map<string, BlockGeom>>(new Map())
  /* non-task lines · header whispers UP, separators just dissolve, the
     outputs block lands LAST toward the run footer */
  const headLinesRef = useRef<HTMLElement[]>([])
  const midLinesRef = useRef<HTMLElement[]>([])
  const tailLinesRef = useRef<HTMLElement[]>([])
  /* the seed chips · one per task, driven along their bezier by apply() */
  const seedLayerRef = useRef<HTMLDivElement>(null)
  const seedRefs = useRef(new Map<string, HTMLSpanElement | null>())
  /* live slab landing targets (ps-layer px), written by the 3D loop when the
     slabs are the visible DAG — [x, y, projectedWidth] */
  const slabTargetsRef = useRef(new Map<string, [number, number, number]>())
  const psLayerRef = useRef<HTMLElement | null>(null)
  const psOffRef = useRef<{ x: number; y: number } | null>(null)
  /** the morph panel's identity rect, section-relative (seam handoff base) */
  const seamBaseRef = useRef<{ left: number; top: number; w: number; h: number } | null>(null)
  /** the caption band's bottom edge, stage-relative (the yield gate's line) */
  const capBotRef = useRef(0)
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

  /* ── measure · task blocks + seed paths + node targets (live layout) ────────
     Transforms are cleared first so a mid-scroll (re)measure — reload, tab
     switch, font swap, resize — reads the true layout, then the same frame
     re-applies p. No flash: clear + measure + apply happen in one rAF. */
  const measure = useCallback(() => {
    const card = cardRef.current
    const dag = dagRef.current
    const stage = stageRef.current
    const seedLayer = seedLayerRef.current
    if (!card || !dag || !stage || !seedLayer) return

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
      /* the caption band the entry yield protects (+3 · the caps bleed a
         couple px past their row) — measured, never guessed (wave I) */
      const caps = stage.querySelector<HTMLElement>('.morph-captions')
      if (caps) capBotRef.current = caps.getBoundingClientRect().bottom - sr.top + 3
    }

    const slr = seedLayer.getBoundingClientRect()
    const blocks = new Map<string, BlockGeom>()

    const lineEls = new Map<number, HTMLElement>()
    let fileTop = Infinity
    let fileBottom = -Infinity
    for (const el of card.querySelectorAll<HTMLElement>('.cf-line')) {
      el.style.transform = ''
      el.style.opacity = ''
      const ln = Number(el.dataset.ln)
      if (Number.isNaN(ln)) continue
      lineEls.set(ln, el)
      const r = el.getBoundingClientRect()
      fileTop = Math.min(fileTop, r.top)
      fileBottom = Math.max(fileBottom, r.bottom)
    }
    const fileSpan = Math.max(1, fileBottom - fileTop)
    const drainF = (y: number): number => clamp01((fileBottom - y) / fileSpan)

    const taskLines = new Set<number>()
    let firstTaskLn = Infinity
    let lastTaskLn = -Infinity
    /* the DAG content's lowest edge (viewport px) — anchors the flat-note
       caption BELOW the bounding box (plan-scene.css · --morph-nodes-b) */
    let nodesBottom = -Infinity
    for (const t of plan.tasks) {
      firstTaskLn = Math.min(firstTaskLn, t.line0)
      lastTaskLn = Math.max(lastTaskLn, t.line1)
      const els: HTMLElement[] = []
      const centers: number[] = []
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
        centers.push(r.top + r.height / 2)
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
      if (nr.bottom > nodesBottom) nodesBottom = nr.bottom
      const cy = (top + bottom) / 2
      blocks.set(t.id, {
        els,
        lineDy: centers.map((c) => cy - c),
        lineF: centers.map((c) => drainF(c)),
        f: drainF(cy),
        p0: { x: (left + right) / 2 - slr.left, y: cy - slr.top },
        p2: {
          x: nr.left + nr.width / 2 - slr.left,
          y: nr.top + nr.height / 2 - slr.top,
        },
      })
    }

    const head: HTMLElement[] = []
    const mid: HTMLElement[] = []
    const tail: HTMLElement[] = []
    for (const [ln, el] of lineEls) {
      if (taskLines.has(ln)) continue
      if (ln < firstTaskLn) head.push(el)
      else if (ln > lastTaskLn) tail.push(el)
      else mid.push(el)
    }

    blocksRef.current = blocks
    headLinesRef.current = head
    midLinesRef.current = mid
    tailLinesRef.current = tail

    /* the wires · measured node-edge to node-edge, in DAG-local coordinates */
    const dr = dag.getBoundingClientRect()
    /* the DAG box top IS the scene top (inset 0) — the note var lands in the
       flat-note's own containing-block coords */
    if (Number.isFinite(nodesBottom)) {
      stage.style.setProperty('--morph-nodes-b', `${(nodesBottom - dr.top).toFixed(1)}px`)
    }
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
      /* the console reads p straight from CSS (playhead) + integer aria */
      stage.style.setProperty('--morph-p', p.toFixed(4))
      const pct = Math.round(p * 100)
      if (pct !== ariaPctRef.current) {
        ariaPctRef.current = pct
        trackRef.current?.setAttribute('aria-valuenow', String(pct))
      }

      /* phase flag → caption + narration crossfade (morph.css) */
      stage.dataset.phase = phaseAt(p)

      /* the file card travels in, then its shell steps aside for the burst */
      const shell = shellAt(p)
      const settle = easeInOut(clamp01(p / PH.settleEnd))
      stage.style.setProperty('--msh', shell.toFixed(3))
      card.style.transform = `translateY(${((1 - settle) * 26).toFixed(2)}px)`
      /* the entry yield at rest · the docked card's top edge vs the caption
         band (seam() re-evaluates with the in-flight rect while it owns the
         card — same gate, same frame, its verdict lands last) */
      const base = seamBaseRef.current
      if (base) yieldEntry(stage, base.top + (1 - settle) * 26 - capBotRef.current)
      /* once every seed has landed AND the outputs line has left, the empty
         card stops painting (the condensing lines live INSIDE it) */
      card.style.visibility = p >= PH.wire1 && blocksRef.current.size > 0 ? 'hidden' : ''

      /* ── the aspiration · one task at a time, reading order ──────────────────
         Each block CONDENSES in place into its seed chip, the chip rides a
         curve INTO its DAG slot, the slot ignites on arrival. In 3D mode the
         landing follows the LIVE projected slab; the DOM node is the truth
         everywhere else. */
      const use3d = !!stage.dataset.plan3d
      const psOff = psOffRef.current
      const drain = drainAt(p)
      const n = plan.tasks.length
      for (let i = 0; i < n; i++) {
        const t = plan.tasks[i]
        const g = blocksRef.current.get(t.id)
        if (!g) continue
        const e = aspireAt(p, i, n)
        const ce = easeInOut(condenseAt(e))
        const te = travelAt(e)

        /* the block's lines drain downward, TIGHTEN toward their center
           (0.55 damp — a squeeze, never a cross-over) and hand over */
        for (let j = 0; j < g.els.length; j++) {
          const el = g.els[j]
          const dy = g.lineDy[j] * ce * 0.55 + drain * g.lineF[j]
          el.style.transform = dy === 0 ? '' : `translateY(${dy.toFixed(2)}px)`
          el.style.opacity =
            ce <= 0.25 ? '1' : String(Math.max(0, 1 - (ce - 0.25) / 0.5))
        }

        /* the seed chip · born from the condensation, drawn along its curve */
        const seed = seedRefs.current.get(t.id)
        if (seed) {
          const seedIn = clamp01((ce - 0.55) / 0.45)
          const seedOut = 1 - clamp01((te - 0.85) / 0.15)
          const o = seedIn * seedOut
          if (o <= 0.001) {
            seed.style.opacity = '0'
            seed.style.visibility = 'hidden'
          } else {
            const t3 = use3d && psOff ? slabTargetsRef.current.get(t.id) : undefined
            const tx = t3 ? t3[0] + psOff!.x : g.p2.x
            const ty = t3 ? t3[1] + psOff!.y : g.p2.y
            /* landing size follows the projected slab into depth (3D mode) */
            const scale = t3 ? Math.max(0.55, Math.min(1, t3[2])) : 1
            const k = easeInOut(te)
            /* the seed is born where its DRAINED block sits */
            const y0 = g.p0.y + drain * g.f
            const dist = Math.hypot(tx - g.p0.x, ty - y0)
            const cx = (g.p0.x + tx) / 2
            const cy = (y0 + ty) / 2 - Math.min(90, Math.max(24, dist * 0.22))
            const x = qbez(g.p0.x, cx, tx, k)
            const y = qbez(y0, cy, ty, k)
            seed.style.opacity = o.toFixed(3)
            /* the base class ships hidden — an empty inline write would fall
               back to the stylesheet and never show (found empirically) */
            seed.style.visibility = 'visible'
            seed.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(1 - (1 - scale) * k).toFixed(3)})`
          }
        }

        /* the node is BORN as its seed lands (2D truth; the 3D slab mirrors
           this same ignition via plan-scene-model.materializeAt) */
        const nodeEl = nodeRefs.current.get(t.id)
        if (nodeEl) {
          const o = easeInOut(igniteAt(e))
          nodeEl.style.opacity = o.toFixed(3)
          nodeEl.style.transform = o >= 1 ? '' : `translateY(${((1 - o) * 10).toFixed(2)}px)`
        }
      }

      /* header lines whisper UP and out with the shell; separators dissolve
         in place; the outputs block holds, then lands LAST toward the run
         footer as the terminal rises (its landing = the footer being born) */
      for (let i = 0; i < headLinesRef.current.length; i++) {
        const el = headLinesRef.current[i]
        el.style.opacity = shell.toFixed(3)
        el.style.transform = shell >= 1 ? '' : `translateY(${(-(1 - shell) * 14).toFixed(2)}px)`
      }
      for (let i = 0; i < midLinesRef.current.length; i++) {
        const el = midLinesRef.current[i]
        el.style.opacity = shell.toFixed(3)
        el.style.transform = ''
      }
      const oe = easeInOut(clamp01((p - (PH.burstEnd - 0.05)) / 0.1))
      for (let i = 0; i < tailLinesRef.current.length; i++) {
        const el = tailLinesRef.current[i]
        el.style.opacity = (1 - oe).toFixed(3)
        el.style.transform = oe <= 0 ? '' : `translateY(${(oe * 26).toFixed(2)}px)`
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
        if (as.ended && rf > 0 && rf < 1) {
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
          /* scrubbed back ABOVE the run window — the scene is a pure function
             of p, so the frame must leave run mode WITH it (no verdict beat ·
             without this the loud run frame outlives the run · found in the
             wave-I sweep) */
          as.inRun = false
          as.ended = false
          as.running = ''
          aurora.runStop()
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
    stage.style.removeProperty('--morph-nodes-b')
    delete stage.dataset.phase
    delete stage.dataset.entry
    for (const el of stage.querySelectorAll<HTMLElement>(
      '.cf-line, .morph-node, .morph-term, .morph-seed',
    )) {
      el.style.transform = ''
      el.style.opacity = ''
      el.style.visibility = ''
    }
    setTimeline(timelineAt(flagship, script.lines, 1))
    timelineSigRef.current = timelineAt(flagship, script.lines, 1).sig
  }, [armed, flagship, script])

  /* ── the scroll driver · one rAF, event-scheduled, measure-aware ──────────── */
  useEffect(() => {
    if (!armed || typeof window === 'undefined') return
    const section = sectionRef.current
    /* pinned for the cleanup — the refs may be cleared by unmount order
       (auroraState is a stable plain object, same instance for the
       component's whole life — pinning it just makes that explicit) */
    const stageEl = stageRef.current
    const cardEl = cardRef.current
    const auroraState = auroraStateRef.current
    if (!section) return

    /* H-CONTINUITY · the hero's file panel and this scene's file are ONE
       object. Across the hero→morph seam (section top traveling viewport
       bottom → top, q 0→1) the morph card takes over AT the hero panel's
       live projected rect (same CodeFile, same flagship — pixel-equivalent
       content) while the hero editor steps aside, then dives DOWN into its
       sticky slot. Pure function of scroll: scrub up, it hands back.

       THE HANDOFF IS HARD (operator verdict, wave I): at every scroll
       position exactly ONE copy of the file paints. The WHOLE hero editor
       column steps aside (visibility, never opacity) — hiding only the
       panel left its tab strip + footer chip doubling the filename under
       the traveling card (the "interleaved mush" bug). The panel keeps
       layout, so its rect still drives the projection. The hero COPY column
       fades as the file is drawn away (the page is being pulled toward the
       DAG), and the card's path clears the fixed nav early (NAV_SAFE). */
    const heroPanel = document.querySelector<HTMLElement>('.v4hero-code')
    const heroBox = heroPanel?.closest<HTMLElement>('.v4hero-editor') ?? heroPanel
    const heroCopy = document.querySelector<HTMLElement>('.v4hero-copy')
    const SEAM_TAKE = 0.04
    const handBack = () => {
      if (heroBox) heroBox.style.visibility = ''
      if (heroCopy) heroCopy.style.opacity = ''
    }
    const seam = (rect: DOMRect, vh: number) => {
      const card = cardRef.current
      const stage = stageRef.current
      if (!heroPanel || !heroBox || !card || !stage) return
      const q = 1 - rect.top / vh
      const inWindow = q >= SEAM_TAKE && q < 1
      /* the stage un-clips ONLY while the card travels outside its box */
      if (inWindow) stage.dataset.seam = '1'
      else delete stage.dataset.seam
      /* the ENTRY yield window is GEOMETRIC (wave I): computed below from the
         panel's actual travel rect vs the caption band — never from q alone
         (the old q<1 window let the lede overlap the diving title bar) */
      if (q >= 1) {
        /* past the seam · the hero is above the viewport; hand everything
           back so an upward scrub finds it intact */
        handBack()
        return
      }
      if (!inWindow) {
        /* before the takeover · the hero editor IS the file; no second copy —
           and the heading stands aside (the hero still owns this scroll) */
        stage.dataset.entry = '1'
        handBack()
        card.style.visibility = 'hidden'
        return
      }
      const base = seamBaseRef.current
      const hr = heroPanel.getBoundingClientRect()
      if (!base || base.w <= 0 || hr.width <= 0) {
        /* no geometry yet (first frame · zero-width edge) — the hero stays
           the ONE visible file until the projection can take over */
        stage.dataset.entry = '1'
        handBack()
        card.style.visibility = 'hidden'
        return
      }
      const sr = stage.getBoundingClientRect()
      const k = easeInOut(clamp01((q - SEAM_TAKE) / (1 - SEAM_TAKE)))
      const inv = 1 - k
      /* the vertical component eases faster — the card DIVES out of the
         nav band instead of lingering behind it */
      const invY = Math.pow(inv, 1.5)
      const slotCx = sr.left + base.left + base.w / 2
      const slotCy = sr.top + base.top + base.h / 2
      const dx = (hr.left + hr.width / 2 - slotCx) * inv
      let dy = (hr.top + hr.height / 2 - slotCy) * invY
      const s = 1 + (hr.width / base.w - 1) * inv
      /* nav clearance · blended in across the seam's first fifth so the
         takeover instant stays pixel-continuous with the hero panel while
         the card clears the fixed nav EARLY (never lingers behind it) */
      const top = slotCy + dy + 26 * k - (base.h * s) / 2
      const lift = Math.max(0, NAV_SAFE - top) * Math.min(1, q * 5)
      dy += lift
      /* the yield gate, from the panel's LIVE top edge — the heading/lede is
         gone before the title bar can reach its band, and comes back the
         moment the flight clears it (scrub-up reverses it the same way) */
      yieldEntry(stage, top + lift - (capBotRef.current + sr.top))
      /* the glide ENDS on the settle pose (translateY 26px) — apply() then
         eases 26→0 across the file beat, zero teleport at the boundary */
      card.style.visibility = ''
      card.style.transform = `translate3d(${dx.toFixed(1)}px, ${(dy + 26 * k).toFixed(1)}px, 0) scale(${s.toFixed(4)})`
      heroBox.style.visibility = 'hidden'
      /* the pitch fades as its file is drawn away (restored on scrub-up) —
         q-based so the dimming is felt from the seam's first third */
      if (heroCopy) heroCopy.style.opacity = (1 - easeInOut(clamp01(q * 1.8))).toFixed(3)
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
      /* the seed→slab coordinate bridge (3D mode) · read while the frame is
         still in its read phase */
      const stage = stageRef.current
      const seedLayer = seedLayerRef.current
      if (stage?.dataset.plan3d && seedLayer) {
        const ps =
          psLayerRef.current ??
          (psLayerRef.current = stage.querySelector<HTMLElement>(
            '.ps-layer:not(.ps-tiplayer)',
          ))
        if (ps) {
          const a = ps.getBoundingClientRect()
          const b = seedLayer.getBoundingClientRect()
          psOffRef.current = { x: a.left - b.left, y: a.top - b.top }
        }
      } else {
        psLayerRef.current = null
        psOffRef.current = null
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
      handBack()
      if (stageEl) {
        delete stageEl.dataset.seam
        delete stageEl.dataset.entry
      }
      if (cardEl) {
        cardEl.style.visibility = ''
        cardEl.style.transform = ''
      }
      /* the driver dies mid-run (route change · disarm · flagship switch) →
         the global frame must not stay in run mode. A flagship switch re-arms
         next frame and runStart()s again — one 16ms dip, never a stuck loud
         frame. */
      if (auroraState.inRun) {
        auroraState.inRun = false
        auroraState.ended = false
        auroraState.running = ''
        aurora.runStop()
      }
    }
  }, [armed, measure, apply, aurora])

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

  /* ── the done frame · node ⟷ YAML cross-highlight ──────────────────────────
     The hovered/focused task's lines light in the settled file panel; when
     the DAG side drives, the panel keeps the lit lines in view (its own
     scroll only — never the page's). DOM class sweep, no reconciliation.
     The pairing is DERIVED from the phase — leaving `done` clears it without
     any state write. */
  const done = timeline.verdictOn
  const pairTask = done ? hoverTask : null
  useEffect(() => {
    const panel = donePanelRef.current
    if (!panel) return
    for (const el of panel.querySelectorAll<HTMLElement>('.cf-line.morph-hi')) {
      el.classList.remove('morph-hi')
    }
    if (!pairTask) return
    const t = plan.tasks.find((x) => x.id === pairTask)
    if (!t) return
    const lit: HTMLElement[] = []
    for (const el of panel.querySelectorAll<HTMLElement>('.cf-line')) {
      const ln = Number(el.dataset.ln)
      if (ln >= t.line0 && ln <= t.line1) {
        el.classList.add('morph-hi')
        lit.push(el)
      }
    }
    const pre = panel.querySelector<HTMLElement>('.cf-pre')
    if (!pre || lit.length === 0 || hoverSrcRef.current !== 'node') return
    const pr = pre.getBoundingClientRect()
    const fr = lit[0].getBoundingClientRect()
    const lr = lit[lit.length - 1].getBoundingClientRect()
    if (fr.top < pr.top) pre.scrollTop += fr.top - pr.top - 12
    else if (lr.bottom > pr.bottom) {
      pre.scrollTop += Math.min(lr.bottom - pr.bottom + 12, Math.max(0, fr.top - pr.top - 12))
    }
  }, [pairTask, plan])

  const onYamlMove = useCallback(
    (e: React.PointerEvent) => {
      const line = (e.target as HTMLElement).closest<HTMLElement>('.cf-line')
      const ln = line ? Number(line.dataset.ln) : NaN
      const task = Number.isNaN(ln)
        ? undefined
        : plan.tasks.find((t) => ln >= t.line0 && ln <= t.line1)
      hoverSrcRef.current = 'yaml'
      setHoverTask(task?.id ?? null)
    },
    [plan],
  )
  const onYamlLeave = useCallback(() => setHoverTask(null), [])

  /* ── THE CONSOLE · ticks, seek, scrub, play ─────────────────────────────────
     Ticks are the RECORDED task starts mapped into the run window of p —
     the timeline shows where each step truly began (verb-hued), plus the
     phase notches (burst · run · flat). */
  const ticks = useMemo(() => {
    const total = flagship.trace.totalMs || 1
    return flagship.plan.tasks.flatMap((task) => {
      const iv = taskInterval(flagship, task.id)
      if (!iv || 'skipAt' in iv) return []
      return [
        {
          id: task.id,
          verb: task.verb,
          at: PH.run0 + (iv.start / total) * (PH.run1 - PH.run0),
        },
      ]
    })
  }, [flagship])

  /* seek: scroll IS the store — a fraction maps to one scroll offset */
  const seek = useCallback((frac: number) => {
    const section = sectionRef.current
    if (!section) return
    const rect = section.getBoundingClientRect()
    const runway = rect.height - window.innerHeight
    if (runway <= 0) return
    window.scrollTo({ top: window.scrollY + rect.top + clamp01(frac) * runway })
  }, [])

  const trackFrac = (e: { clientX: number }) => {
    const r = trackRef.current?.getBoundingClientRect()
    return r ? clamp01((e.clientX - r.left) / r.width) : 0
  }
  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPlaying(false)
    trackDragRef.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* inactive pointer id (synthetic dispatch) · the drag works un-captured */
    }
    seek(trackFrac(e))
  }
  const onTrackMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trackDragRef.current) seek(trackFrac(e))
  }
  const onTrackUp = () => {
    trackDragRef.current = false
  }
  const onTrackKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cur = progressRef.current
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') seek(cur + 0.02)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') seek(cur - 0.02)
    else if (e.key === 'Home') seek(0)
    else if (e.key === 'End') seek(1)
    else return
    e.preventDefault()
  }
  const onPlayClick = () => {
    if (!playing && progressRef.current >= 0.999) seek(0) /* replay from the top */
    setPlaying((v) => !v)
  }

  /* the play loop · advances the SCROLL (~26s full story) — any manual wheel
     or touch takes the wheel back (transport etiquette) */
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = 0
    const PLAY_MS = 26000
    const step = (ts: number) => {
      if (!last) last = ts
      const dt = ts - last
      last = ts
      const section = sectionRef.current
      if (!section) {
        setPlaying(false)
        return
      }
      const rect = section.getBoundingClientRect()
      const runway = rect.height - window.innerHeight
      const p = runway > 0 ? clamp01(-rect.top / runway) : 1
      if (p >= 1) {
        setPlaying(false)
        return
      }
      window.scrollBy(0, Math.max(1, (runway / PLAY_MS) * dt))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    const stop = () => setPlaying(false)
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [playing])

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
            <p className="v4fig">01</p>
            <h2 id="the-morph-title" className="morph-title">
              Watch the file become the run.
            </h2>
            {/* the phase captions · one visible at a time (CSS crossfade) */}
            <div className="morph-captions" aria-hidden={armed ? undefined : true}>
              <p className="morph-cap" data-for="file">
                The same file you just read. Keep scrolling.
              </p>
              <p className="morph-cap" data-for="burst">
                One task at a time is <b>drawn into its place</b> in the plan.
              </p>
              <p className="morph-cap" data-for="run">
                The recorded run chains through it, step by step.
              </p>
              <p className="morph-cap" data-for="flat">
                The run is done. The plan <b>lies down flat</b>.
              </p>
              <p className="morph-cap" data-for="done">
                Hover any step to see its exact lines in the file.
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
              <p className="morph-say-line" data-for="flat">
                the whole run · laid out flat
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

            {/* THE DAG · wave columns + measured wires (the aspiration's target) */}
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
                          data-hi={pairTask === task.id ? '1' : undefined}
                          tabIndex={done ? 0 : undefined}
                          onPointerEnter={
                            done
                              ? () => {
                                  hoverSrcRef.current = 'node'
                                  setHoverTask(task.id)
                                }
                              : undefined
                          }
                          onPointerLeave={done ? () => setHoverTask(null) : undefined}
                          onFocus={
                            done
                              ? () => {
                                  hoverSrcRef.current = 'node'
                                  setHoverTask(task.id)
                                }
                              : undefined
                          }
                          onBlur={done ? () => setHoverTask(null) : undefined}
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
                          {/* the plain-words whisper (H6 dictionary) · done frame */}
                          <span className="morph-node-tip" aria-hidden>
                            {VERB_WORDS[task.verb]}
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
                  slabTargetsRef={slabTargetsRef}
                />
              </Suspense>
            ) : null}

            {/* THE SEEDS · one chip per task, driven along their curves by
                apply() — the condensed block traveling INTO its slot */}
            <div className="morph-seeds" aria-hidden ref={seedLayerRef}>
              {plan.tasks.map((t) => (
                <span
                  key={t.id}
                  className="morph-seed"
                  data-verb={t.verb}
                  ref={(el) => {
                    seedRefs.current.set(t.id, el)
                  }}
                >
                  <span className="morph-seed-id">{t.id}</span>
                  <span className="morph-seed-verb">{t.verb}</span>
                </span>
              ))}
            </div>

            {/* THE SETTLED FILE · the done frame's left panel (≥1024) — the
                same file, back at rest BESIDE its flat plan; hover pairs it
                with the DAG both ways */}
            {armed ? (
              <div
                className="morph-done-file"
                ref={donePanelRef}
                onPointerMove={done ? onYamlMove : undefined}
                onPointerLeave={done ? onYamlLeave : undefined}
              >
                <MemoCodeFile
                  yaml={flagship.yaml}
                  filename={flagship.filename}
                  highlight={flagship.highlight}
                  className="morph-done-code"
                />
              </div>
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

          {/* THE CONSOLE · the run's transport (wave L): play it, scrub it, or
              scroll — three inputs, one scroll position. The strip absorbs the
              honesty line: recorded ticks ARE the timeline. */}
          <div className="morph-console">
            <button
              type="button"
              className="morph-play"
              aria-pressed={playing}
              onClick={onPlayClick}
            >
              <span aria-hidden>{playing ? '❚❚' : '▶'}</span>
              <span className="sr-only">{playing ? 'pause the replay' : 'play the replay'}</span>
            </button>
            <div
              className="morph-track"
              ref={trackRef}
              role="slider"
              tabIndex={0}
              aria-label="replay timeline"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
              onPointerDown={onTrackDown}
              onPointerMove={onTrackMove}
              onPointerUp={onTrackUp}
              onPointerCancel={onTrackUp}
              onKeyDown={onTrackKey}
            >
              <span className="morph-track-rail" aria-hidden />
              {[PH.burst0, PH.run0, PH.run1].map((b) => (
                <span key={b} className="morph-notch" style={{ left: `${b * 100}%` }} aria-hidden />
              ))}
              {ticks.map((t) => (
                <span
                  key={t.id}
                  className="morph-tick"
                  data-verb={t.verb}
                  style={{ left: `${t.at * 100}%` }}
                  aria-hidden
                />
              ))}
              <span className="morph-playhead" aria-hidden />
            </div>
            <span className="morph-console-truth">recorded · nothing staged</span>
          </div>

          <p className="morph-caption">
            recorded from a real nika run · replayed by your scroll · nothing staged
          </p>
        </div>
      </div>
    </section>
  )
}
