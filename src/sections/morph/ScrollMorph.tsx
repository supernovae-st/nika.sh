import { Fragment, Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
/* lz-string is CJS — named ESM imports break the Node prerender (the /play
   law); the done-frame handoff encodes the flagship into a /play?y= link */
import lz from 'lz-string'
import { CodeFile } from '../../components/CodeFile'
import { FileTabsGhost } from '../Hero'
import TheRun from '../run/TheRun'
import ThePlan from '../plan/ThePlan'
import { usePlan3D } from './use-plan3d'
import { useAurora } from '../../fx/aurora-context'
import { formatMs, type FlagshipEntry, type FlagshipTask } from '../../flagships'
import { buildScript } from '../run/replay-model'
import {
  PH,
  aspireAt,
  clamp01,
  condenseAt,
  drainRampAt,
  easeInOut,
  igniteAt,
  phaseAt,
  runFracAt,
  runMsAt,
  seedInAt,
  shellAt,
  taskInterval,
  termAt,
  timelineAt,
  travelAt,
  wireAt,
  type MorphPhase,
  type MorphTimeline,
} from './morph-model'
import { VERB_WORDS } from './plain-words'
import './morph.css'
import '../../fx/slab-sweep.css'

/* ─── ScrollMorph · F2 · the one continuous scroll-linked scene ───────────────
   EVERY width (motion-allowed · W20): the SELECTED flagship file travels
   with scroll, each task block CONDENSES into a seed chip and is DRAWN along
   a curve into its DAG slot (per-task aspiration, reading order — the
   causality IS the animation), then the recorded run chains through the DAG
   while a terminal strip narrates the same events. At `done` the settled
   file returns BESIDE the flat 2D DAG (≥1024) and hovering either side
   lights the other (the comprehension frame).

   PHONES (≤767px · W20): the same scene, portrait grammar — the DAG waves
   stack top→down (parallel waves 2-up), the wires re-anchor bottom→top, the
   file keeps the HERO'S OWN SIZE (scale-1 seam: the panel dives, it never
   shrinks to a map) and the drain parks the un-read queue below the fold.
   All of it falls out of the measured geometry — the flight engine reads
   rects, so the portrait layout needs zero new motion code.

   CONTRACT (the operator's law):
   · scroll-LINKED, never wheel-hijacked — sticky stage + transforms derived
     from native scroll progress, one rAF, no Lenis, no teleports (every
     visual is a continuous pure function of p — scrub back, it reverses)
   · reduced-motion / no-JS: ≥768px this section renders the STATIC final
     state (assembled DAG + the full terminal + verdict); ≤767px it renders
     the vertical run+plan story instead (the fallback children below —
     exactly ONE variant is ever mounted; morph.css hides the un-armed
     morphsec on phones)
   · HONESTY: a seed chip is the task's real id + verb; node intervals and
     terminal lines come verbatim from the recorded trace (morph-model). */

interface BlockGeom {
  /** the task block's own file lines */
  els: HTMLElement[]
  /** per line · distance to the block's center (the condensation vector) */
  lineDy: number[]
  /** the block's center — the seed's origin (seed-layer coords) */
  p0: { x: number; y: number }
  /** the DOM node's center — the seed's landing (seed-layer coords) */
  p2: { x: number; y: number }
}

/** the drain's measured geometry — block tops + the band edge (viewport px):
    apply() lerps remTop(p) from these and slides the remainder as ONE unit */
interface DrainGeom {
  tops: number[]
  end: number
  band: number
}

/* THE DRAIN lives in morph-model (wave M): the clearance is MEASURED per
   layout (drainNeedRef, computed in measure()) — never a magic constant. */

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

/* the model's provider is a LOCAL runtime → the « local » proof is honest for
   THIS flagship (never a blanket claim: a cloud model would drop the tag). The
   catalog's 5 local providers (spec canon · local-first order) */
const LOCAL_MODEL_RE = /^(ollama|llamacpp|llama\.cpp|vllm|lmstudio|lm-studio|localai)\b/i
const isLocalModel = (model: string): boolean => LOCAL_MODEL_RE.test(model)

/* the narration counts in words (honest per flagship: the widest wave) */
const COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'] as const
const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n)

/* THE ONE VOICE · plain anyone-words, one line per phase — the SINGLE source
   both narrator surfaces render (the armed console + the static caption):
   a copy edit can never fork the two (wave M review) */
const sayLines = (maxTogether: number): { phase: MorphPhase; text: string }[] => [
  { phase: 'file', text: 'one file · the whole plan' },
  { phase: 'burst', text: 'each task takes its place' },
  {
    phase: 'run',
    text: `steps light up in order${maxTogether > 1 ? ` · ${countWord(maxTogether)} together` : ''}`,
  },
  { phase: 'flat', text: 'the whole run · laid out flat' },
  { phase: 'done', text: 'the run is a file too · replay anytime' },
]

/* the seed trail params · [k-offset, alpha] per afterimage — module-level so
   the rAF path never allocates (longtask budget, F2) */
const GHOST_TRAIL = [
  [0.07, 0.26],
  [0.14, 0.12],
] as const

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

const { compressToEncodedURIComponent } = lz

export default function ScrollMorph({ flagship }: { flagship: FlagshipEntry }) {
  const script = useMemo(() => buildScript(flagship), [flagship])
  /* the see→touch handoff (arc 9j · user-journey pass): the done frame's
     settled file opens PRE-LOADED in the playground — the exact yaml the
     visitor just watched run, one click from editable (/play already reads
     ?y=, the E2 share format) */
  const playHref = useMemo(
    () => `/play?y=${compressToEncodedURIComponent(flagship.yaml)}`,
    [flagship],
  )
  /* the card's inert titlebar twin — memoized so MemoCodeFile's memo holds
     (a fresh element per render would re-tokenize the file on every state
     tick of this scroll-driven section) */
  const ghostChrome = useMemo(() => <FileTabsGhost active={flagship.label} />, [flagship.label])
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
  /* the press→drag slop gate · a press GLIDES to its spot; only real motion
     (>3px) switches the head to 1:1 finger tracking */
  const trackMovedRef = useRef(false)
  const trackDownXRef = useRef(0)
  /* the glide's rAF handle · a clicked seek catches up instead of teleporting */
  const glideRef = useRef<number | null>(null)
  const ariaPctRef = useRef(-1)
  /* the deck's timecode + the scrub tip write DOM-direct (data-scrub law:
     zero reconcile per frame/move — textContent + a string cache) */
  const clockRef = useRef<HTMLSpanElement>(null)
  const clockStrRef = useRef('')
  /* the ending's p-keyed settle — write-on-change (the verdict lands as the
     run completes; below run1 the content is « running » and land is 0) */
  const verdictLandRef = useRef('')
  const tipRef = useRef<HTMLSpanElement>(null)
  const tipStrRef = useRef('')
  const hoverSrcRef = useRef<'node' | 'yaml' | 'log'>('node')

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
  /** the drain's measured geometry — see measure() · morph-model */
  const drainGeomRef = useRef<DrainGeom | null>(null)
  /* non-task lines · header whispers UP, separators just dissolve, the
     outputs block lands LAST toward the run footer */
  const headLinesRef = useRef<HTMLElement[]>([])
  const midLinesRef = useRef<HTMLElement[]>([])
  const tailLinesRef = useRef<HTMLElement[]>([])
  /* the seed chips · one per task, driven along their bezier by apply() */
  const seedLayerRef = useRef<HTMLDivElement>(null)
  const seedRefs = useRef(new Map<string, HTMLSpanElement | null>())
  /* the landing reticles · one docking target per task (arc 10h) */
  const targetRefs = useRef(new Map<string, HTMLSpanElement | null>())
  /* the trail afterimages · two per seed (keys `${id}·0` / `${id}·1`) */
  const ghostRefs = useRef(new Map<string, HTMLSpanElement | null>())
  /* --morph-wired's last written value (write-on-change · F2 budget) */
  const wiredRef = useRef('')
  /* live slab landing targets (ps-layer px), written by the 3D loop when the
     slabs are the visible DAG — [x, y, projectedWidth] */
  const slabTargetsRef = useRef(new Map<string, [number, number, number]>())
  const psLayerRef = useRef<HTMLElement | null>(null)
  const psOffRef = useRef<{ x: number; y: number } | null>(null)
  /** the morph panel's identity rect, section-relative (seam handoff base) */
  const seamBaseRef = useRef<{ left: number; top: number; w: number; h: number } | null>(null)
  /** the card's line grid (final font) — the unroll clip snaps to whole rows */
  const seamClipRef = useRef<{ lineH: number; headH: number } | null>(null)
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
    /* the docked monitor's rect anchors the file slot below — clear its
       entrance transform too (same clear-measure-reapply rAF, no flash) */
    if (termRef.current) termRef.current.style.transform = ''

    /* portrait truth (W20) · phones re-anchor the wires and skip the fit-font
       — read ONCE per measure (resize/orientation re-measures) */
    const vertical = window.matchMedia('(max-width: 767px)').matches

    /* ONE LAYOUT TRUTH (wave M) · the card renders the hero panel's EXACT
       text layout at its own size: width = heroW × F_m/F_h locks the ch
       measure (wraps included — the seam projection is a pure uniform
       scale), and the font FITS the whole file to the stage slot. The seam
       variant (codefile.css) makes EVERY panel metric font-relative, so the
       whole card scales ∝ font-size — the fit is one homothety ratio
       (fM = f0 × slotH / H0), measured, zero mirrored constants (the CSS is
       the single source of the glyph grid). Set BEFORE the rect reads below
       (the gBCR flushes each new layout). */
    const heroCode = document.querySelector<HTMLElement>('.v4hero-code')
    const codeEl = card.querySelector<HTMLElement>('.morph-code')
    if (heroCode && codeEl) {
      /* baseline: clear prior overrides so the clamp() truth is re-read */
      stage.style.removeProperty('--morph-code-fs')
      stage.style.removeProperty('--morph-code-w')
      stage.style.removeProperty('--morph-slot-b')
      const fH = parseFloat(getComputedStyle(heroCode).fontSize)
      const f0 = parseFloat(getComputedStyle(codeEl).fontSize)
      const heroW = heroCode.getBoundingClientRect().width
      if (fH > 0 && f0 > 0 && heroW > 0) {
        if (vertical) {
          /* PHONE · scale 1 (W20): the card IS the hero panel's size — the
             seam becomes a pure translation and the yaml stays at reading
             size (the desktop fit-font would floor at 7.5px here, a map
             nobody can read). The tail past the fold is the fold's problem:
             the drain parks the un-read queue below the slab band and each
             block is drawn UP into view as its beat arrives. */
          stage.style.setProperty('--morph-code-fs', `${fH.toFixed(2)}px`)
          stage.style.setProperty('--morph-code-w', `${heroW.toFixed(2)}px`)
        } else {
          /* pass 1 · the ch measure at the baseline font (wrap truth) */
          stage.style.setProperty('--morph-code-w', `${((heroW * f0) / fH).toFixed(2)}px`)
          /* the slot: from the card's own measured padding to the DOCKED
             monitor's top edge (the run window stands from term0 — the file
             fits ABOVE the instrument it feeds) — every guard is a live
             rect, never a tuned literal */
          const padTop = parseFloat(getComputedStyle(card).paddingTop) || 0
          const monitorEl = termRef.current
          const cardTop = card.getBoundingClientRect().top + padTop
          const slotBottom = monitorEl
            ? monitorEl.getBoundingClientRect().top - 10
            : card.getBoundingClientRect().bottom
          /* the slot's floor, published for the CSS (the flex centering must
             center the card in the SLOT, not the whole scene — centered in
             the scene, a fitted card still kissed the docked monitor's
             chrome) — measured, same clear-measure-reapply rAF */
          const fileEl = card.getBoundingClientRect()
          stage.style.setProperty(
            '--morph-slot-b',
            `${Math.max(0, fileEl.bottom - slotBottom).toFixed(1)}px`,
          )
          const slotH = Math.max(160, slotBottom - cardTop) /* short-vh guard */
          /* pass 2 · scrollHeight is the un-cropped panel height at f0 (the
             pre crops via overflow, the panel doesn't lie) */
          const H0 = codeEl.scrollHeight
          if (H0 > 0 && slotH > 0) {
            const fM = Math.max(7.5, Math.min(f0, (f0 * slotH) / H0))
            stage.style.setProperty('--morph-code-fs', `${fM.toFixed(2)}px`)
            stage.style.setProperty('--morph-code-w', `${((heroW * fM) / fH).toFixed(2)}px`)
          }
        }
      }
    }

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
      /* the card's line grid at its FINAL font — the seam unroll clip snaps
         to whole rows (the hero's whole-lines law: a frame that cuts a line
         in half reads as broken) */
      const pre = code.querySelector<HTMLElement>('.cf-pre')
      if (pre) {
        const pcs = getComputedStyle(pre)
        const lineH = parseFloat(pcs.lineHeight)
        seamClipRef.current =
          Number.isFinite(lineH) && lineH > 0
            ? {
                lineH,
                headH:
                  pre.getBoundingClientRect().top - cr.top + (parseFloat(pcs.paddingTop) || 0),
              }
            : null
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

    const taskLines = new Set<number>()
    const blockTops: number[] = []
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
      /* the drain lerps dg.tops[i] by TASK index — every task must land an
         entry even when its block can't be measured (else the queue-slide
         reads a later task's top and D jumps · review find) */
      blockTops.push(
        Number.isFinite(top) ? top : (blockTops[blockTops.length - 1] ?? fileTop),
      )
      if (els.length === 0 || !nodeEl) continue
      nodeEl.style.opacity = ''
      nodeEl.style.transform = ''
      const nr = nodeEl.getBoundingClientRect()
      if (nr.bottom > nodesBottom) nodesBottom = nr.bottom
      const cy = (top + bottom) / 2
      blocks.set(t.id, {
        els,
        lineDy: centers.map((c) => cy - c),
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

    /* THE DRAIN GEOMETRY (wave M) · block tops + the band's lowest edge —
       apply() slides the un-consumed remainder below the band as ONE unit
       (order-preserving, layout intact: the queue stays readable), the
       offset lerped from these tops so it's continuous in p. Replaces the
       old 150px weighted sag that let un-read YAML and landed slabs
       interleave (operator: « des choses qui buggent »). */
    drainGeomRef.current =
      blockTops.length > 0 && Number.isFinite(nodesBottom)
        ? { tops: blockTops, end: fileBottom, band: nodesBottom }
        : null

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
        /* the anchoring follows the MEASURED flow, per edge (W20b): a dep
           mostly ABOVE its task (portrait column) wires bottom edge → top
           edge; mostly LEFT (desktop columns · the short-viewport frieze)
           wires right edge → left edge. Geometry decides — a width test
           here would just mirror morph.css and drift (the SE-landscape
           sweep caught exactly that: 667px is ≤767 so the old flag said
           « portrait » while the CSS laid the frieze out in a row). */
        const dxc = tr.left + tr.width / 2 - (fr.left + fr.width / 2)
        const dyc = tr.top + tr.height / 2 - (fr.top + fr.height / 2)
        if (Math.abs(dyc) > Math.abs(dxc)) {
          const x1 = fr.left + fr.width / 2 - dr.left
          const y1 = fr.bottom - dr.top
          const x2 = tr.left + tr.width / 2 - dr.left
          const y2 = tr.top - dr.top
          const my = (y2 - y1) / 2
          next.push({
            from: d,
            to: t.id,
            d: `M ${x1} ${y1} C ${x1} ${y1 + my}, ${x2} ${y2 - my}, ${x2} ${y2}`,
            x1,
            y1,
            x2,
            y2,
          })
          continue
        }
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
      /* the deck timecode · the recorded clock under the playhead — 0.1s
         steps, write-on-change, textContent only (never a reconcile) */
      const clockEl = clockRef.current
      if (clockEl) {
        const cs = `${(runMsAt(p, flagship.trace.totalMs) / 1000).toFixed(1)}s`
        if (cs !== clockStrRef.current) {
          clockStrRef.current = cs
          clockEl.textContent = cs
        }
      }
      /* THE ENDING LANDS · the verdict is the film's closing sentence. As the
         run saturates it SETTLES (p-keyed over [run1, run1+0.05], scrub-
         reversible — no timed transition in the scrubbed scene): exit-0 gains
         weight, $0.00 is the punchline. Below run1 the content is « running »
         and land clamps to 0, so the swap and the ramp stay in lockstep. */
      const landS = easeInOut(clamp01((p - PH.run1) / 0.05)).toFixed(3)
      if (landS !== verdictLandRef.current) {
        verdictLandRef.current = landS
        stage.style.setProperty('--morph-verdict-land', landS)
      }

      /* phase flag → caption + narration crossfade (morph.css) */
      stage.dataset.phase = phaseAt(p)
      /* the 3D layer's END-OF-RUNWAY visibility gate (plan-scene.css · W5):
         p-keyed like its opacity ramp — the hit-rects leave hover/tab order
         exactly when the layer has fully receded, and scrub-back restores
         them the same frame (never a timer) */
      if (p >= 0.97) stage.dataset.psgone = '1'
      else delete stage.dataset.psgone

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
      const n = plan.tasks.length

      /* THE DRAIN (wave M) · the un-consumed remainder slides below the slab
         band as ONE unit — layout intact, the queue readable, no cross-over.
         remTop lerps between successive block tops as each block condenses,
         so D is continuous in p; the ramp completes before first ignition. */
      let D = 0
      const dg = drainGeomRef.current
      if (dg) {
        let remTop = dg.end
        for (let i = 0; i < n && i < dg.tops.length; i++) {
          const ceI = condenseAt(aspireAt(p, i, n))
          if (ceI < 1) {
            const next = i + 1 < dg.tops.length ? dg.tops[i + 1] : dg.end
            remTop = dg.tops[i] + (next - dg.tops[i]) * ceI
            break
          }
        }
        D = Math.max(0, dg.band + 24 - remTop) * drainRampAt(p)
      }

      for (let i = 0; i < n; i++) {
        const t = plan.tasks[i]
        const g = blocksRef.current.get(t.id)
        if (!g) continue
        const e = aspireAt(p, i, n)
        const ce = easeInOut(condenseAt(e))
        const te = travelAt(e)

        /* the block's lines ride the queue-slide and TIGHTEN toward their
           center (0.55 damp — a squeeze, never a cross-over), then hand over */
        for (let j = 0; j < g.els.length; j++) {
          const el = g.els[j]
          const dy = g.lineDy[j] * ce * 0.55 + D
          el.style.transform = dy === 0 ? '' : `translateY(${dy.toFixed(2)}px)`
          el.style.opacity =
            ce <= 0.25 ? '1' : String(Math.max(0, 1 - (ce - 0.25) / 0.5))
        }

        /* the seed chip · born from the condensation, drawn along its curve.
           Birth OVERLAPS the block (seedInAt · wave M): the chip exists while
           its lines are still readable — visibly born FROM them. */
        const seed = seedRefs.current.get(t.id)
        if (seed) {
          const seedIn = seedInAt(ce)
          const seedOut = 1 - clamp01((te - 0.85) / 0.15)
          const o = seedIn * seedOut
          const g0 = ghostRefs.current.get(`${t.id}·0`)
          const g1 = ghostRefs.current.get(`${t.id}·1`)
          const ret = targetRefs.current.get(t.id)
          if (o <= 0.001) {
            seed.style.opacity = '0'
            seed.style.visibility = 'hidden'
            if (g0) {
              g0.style.opacity = '0'
              g0.style.visibility = 'hidden'
            }
            if (g1) {
              g1.style.opacity = '0'
              g1.style.visibility = 'hidden'
            }
            if (ret) {
              ret.style.opacity = '0'
              ret.style.visibility = 'hidden'
            }
          } else {
            const t3 = use3d && psOff ? slabTargetsRef.current.get(t.id) : undefined
            const tx = t3 ? t3[0] + psOff!.x : g.p2.x
            const ty = t3 ? t3[1] + psOff!.y : g.p2.y
            /* landing size follows the projected slab into depth (3D mode) */
            const scale = t3 ? Math.max(0.55, Math.min(1, t3[2])) : 1
            const k = easeInOut(te)
            /* the seed is born where its DRAINED block sits (the queue-slide) */
            const y0 = g.p0.y + D
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
            /* THE TRAIL (wave M) · two afterimages ride the same bezier a
               step behind — the flight reads as MOTION in a still glance,
               and the trail collapses into the chip at landing (eased-k
               offsets bunch at the ends). Pure function of p; params live at
               module scope so this hot path never allocates (F2 budget). */
            for (let gI = 0; gI < 2; gI++) {
              const gh = gI === 0 ? g0 : g1
              if (!gh) continue
              const gk = k - GHOST_TRAIL[gI][0]
              const go = gk > 0.001 && k < 0.995 ? o * GHOST_TRAIL[gI][1] : 0
              if (go <= 0.003) {
                gh.style.opacity = '0'
                gh.style.visibility = 'hidden'
              } else {
                const gx = qbez(g.p0.x, cx, tx, gk)
                const gy = qbez(y0, cy, ty, gk)
                gh.style.opacity = go.toFixed(3)
                gh.style.visibility = 'visible'
                gh.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(1 - (1 - scale) * gk).toFixed(3)})`
              }
            }
            /* THE LANDING RETICLE (arc 10h) · the destination announces
               itself while the seed is in flight — a dashed docking target
               at (tx, ty), the chip's own footprint (it clones the seed's
               layout metrics with transparent ink). It tightens as the chip
               approaches, then the IGNITION consumes it: a brief expansion
               that dissolves into the slab's materialization. Pure function
               of p (scrubbing replays it); same hot-path discipline as the
               ghosts — direct style writes, zero allocation. */
            if (ret) {
              const ig = easeInOut(igniteAt(e))
              const retO = clamp01((te - 0.06) / 0.28) * (1 - ig) * 0.85
              if (retO <= 0.003) {
                ret.style.opacity = '0'
                ret.style.visibility = 'hidden'
              } else {
                const rs = scale * (1.16 - 0.16 * k) * (1 + 0.26 * ig)
                ret.style.opacity = retO.toFixed(3)
                ret.style.visibility = 'visible'
                ret.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) translate(-50%, -50%) scale(${rs.toFixed(3)})`
              }
            }
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
        /* separators ride the queue-slide WITH the blocks around them */
        el.style.transform = D === 0 ? '' : `translateY(${D.toFixed(2)}px)`
      }
      /* the outputs tail rides the queue-slide WITH the document (D) — it
         re-enters from below as the queue empties — then exits INTO the
         terminal's birth, done by the time the strip is half-risen, so YAML
         never reads through its chrome (wave M · the p060 mush) */
      const oe = easeInOut(clamp01((p - (PH.burstEnd - 0.09)) / 0.06))
      for (let i = 0; i < tailLinesRef.current.length; i++) {
        const el = tailLinesRef.current[i]
        el.style.opacity = (1 - oe).toFixed(3)
        const dy = D + oe * 34
        el.style.transform = dy === 0 ? '' : `translateY(${dy.toFixed(2)}px)`
      }

      /* wires draw once the nodes have landed (lengths pre-cached) — the
         wave caps read the eased progress from CSS (--morph-wired): DAG
         anatomy appears WITH the structure it annotates, never before.
         Write-on-change only: outside the wire window the value is a
         constant 0/1 and a per-frame setProperty would invalidate style
         for nothing (F2 budget). */
      const wd = wireAt(p)
      const wired = easeInOut(wd).toFixed(3)
      if (wired !== wiredRef.current) {
        wiredRef.current = wired
        stage.style.setProperty('--morph-wired', wired)
      }
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

  /* ── arm · motion only (W20: every width — the static scene / the vertical
     story are the un-armed truths, per the CONTRACT above) ─────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const decide = () => setArmed(!reduced.matches)
    decide()
    reduced.addEventListener('change', decide)
    return () => {
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
    stage.style.removeProperty('--morph-wired')
    stage.style.removeProperty('--morph-p')
    stage.style.removeProperty('--morph-code-w')
    stage.style.removeProperty('--morph-code-fs')
    stage.style.removeProperty('--morph-slot-b')
    delete stage.dataset.phase
    delete stage.dataset.entry
    delete stage.dataset.psgone
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
    /* the hero's peripheral mini-DAG fades WITH the copy — no orphan
       micro-text hanging beside the flight (wave M) */
    const heroDags = Array.from(document.querySelectorAll<HTMLElement>('.v4hero-dag'))
    const SEAM_TAKE = 0.04
    const handBack = () => {
      if (heroBox) heroBox.style.visibility = ''
      if (heroCopy) heroCopy.style.opacity = ''
      for (const d of heroDags) d.style.opacity = ''
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
           back so an upward scrub finds it intact (and the unroll clip must
           not survive a fast scrub past the window) */
        handBack()
        card.style.clipPath = ''
        return
      }
      if (!inWindow) {
        /* before the takeover · the hero editor IS the file; no second copy —
           and the heading stands aside (the hero still owns this scroll) */
        stage.dataset.entry = '1'
        handBack()
        card.style.visibility = 'hidden'
        card.style.clipPath = ''
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
        card.style.clipPath = ''
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
      /* THE UNROLL (wave M) · the hero caps its file at ~20 lines; the card
         carries the WHOLE file. At takeover the card clips to the hero
         panel's projected height (the shared top region is pixel-identical),
         then the clip releases with k — the rest of the file REVEALS below
         the fold instead of popping in. Pure function of q. */
      const visH = Math.min(base.h, hr.height / Math.max(s, 0.0001))
      let clipB = Math.max(0, (base.h - visH) * (1 - k))
      /* snap the cut to the line grid — whole rows only (the hero's law);
         the release then steps line by line, terminal-like */
      const sc = seamClipRef.current
      if (sc && clipB > 0.5) {
        const cut = Math.max(sc.headH + sc.lineH, base.h - clipB)
        const rows = Math.round((cut - sc.headH) / sc.lineH)
        clipB = Math.max(0, base.h - (sc.headH + rows * sc.lineH))
      }
      card.style.clipPath = clipB > 0.5 ? `inset(-1px -1px ${clipB.toFixed(1)}px -1px)` : ''
      /* the glide ENDS on the settle pose (translateY 26px) — apply() then
         eases 26→0 across the file beat, zero teleport at the boundary */
      card.style.visibility = ''
      card.style.transform = `translate3d(${dx.toFixed(1)}px, ${(dy + 26 * k).toFixed(1)}px, 0) scale(${s.toFixed(4)})`
      heroBox.style.visibility = 'hidden'
      /* the pitch fades as its file is drawn away (restored on scrub-up) —
         q-based so the dimming is felt from the seam's first third */
      const peel = (1 - easeInOut(clamp01(q * 1.8))).toFixed(3)
      if (heroCopy) heroCopy.style.opacity = peel
      for (const d of heroDags) d.style.opacity = peel
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
      /* runway from the STAGE's own height, not innerHeight (W20): the stage
         is 100svh on phones — innerHeight grows when the URL bar collapses
         and would let p hit 1 before the sticky actually detaches. Desktop
         stage is 100vh = innerHeight, so this changes nothing there. */
      const runway = rect.height - (stageRef.current?.offsetHeight ?? vh)
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
        cardEl.style.clipPath = ''
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
    /* node- and log-driven pairing scrolls the lit lines into view; the
       yaml side is already under the pointer — scrolling it would fight it */
    if (!pre || lit.length === 0 || hoverSrcRef.current === 'yaml') return
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
    return flagship.plan.tasks
      .flatMap((task) => {
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
      /* rail order (the chapter keys walk this list — file order is
         topological but parallel siblings can start out of file order) */
      .sort((a, b) => a.at - b.at)
  }, [flagship])

  /* seek: scroll IS the store — a fraction maps to one scroll offset (the
     stage height is the runway's anchor, same law as the frame loop) */
  const seek = useCallback((frac: number) => {
    const section = sectionRef.current
    if (!section) return
    const rect = section.getBoundingClientRect()
    const runway = rect.height - (stageRef.current?.offsetHeight ?? window.innerHeight)
    if (runway <= 0) return
    window.scrollTo({ top: window.scrollY + rect.top + clamp01(frac) * runway })
  }, [])

  const cancelGlide = useCallback(() => {
    if (glideRef.current != null) cancelAnimationFrame(glideRef.current)
    glideRef.current = null
  }, [])

  /* THE GLIDE · a clicked/keyed seek CATCHES UP to its spot instead of
     teleporting — an exponential ease driven through the one scroll store
     (scrollBy per frame, same law as the play loop), so every visual stays
     a pure function of p and the ride reverses mid-flight. Any manual input
     (drag · wheel · touch) takes the wheel back (transport etiquette). */
  const glideTo = useCallback(
    (frac: number) => {
      cancelGlide()
      const section = sectionRef.current
      if (!section) return
      let last = performance.now()
      const step = (now: number) => {
        glideRef.current = null
        const dt = Math.min(64, now - last)
        last = now
        /* RE-AIM every frame from the live rect: content-visibility sections
           re-layout as they render, so a fixed absolute target drifts by
           whole viewports (the shoot-scroll re-aim lesson, applied to the
           glide). Remaining distance = target offset − current offset. */
        const rect = section.getBoundingClientRect()
        const runway = rect.height - (stageRef.current?.offsetHeight ?? window.innerHeight)
        if (runway <= 0) return
        const d = rect.top + clamp01(frac) * runway
        if (Math.abs(d) <= 1) {
          window.scrollBy(0, d)
          return
        }
        /* halve the remaining distance every ~90ms — quick catch, soft land */
        window.scrollBy(0, d * (1 - Math.exp((-dt / 90) * Math.LN2)))
        glideRef.current = requestAnimationFrame(step)
      }
      glideRef.current = requestAnimationFrame(step)
    },
    [cancelGlide],
  )

  /* manual scroll input cancels a gliding seek — the finger always wins */
  useEffect(() => {
    if (!armed || typeof window === 'undefined') return
    const cancel = () => cancelGlide()
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    return () => {
      cancelGlide()
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
    }
  }, [armed, cancelGlide])

  const trackFrac = (e: { clientX: number }) => {
    const r = trackRef.current?.getBoundingClientRect()
    return r ? clamp01((e.clientX - r.left) / r.width) : 0
  }
  /* the scrub flag lives on the DOM (grip cursor + rail swell in CSS) —
     a per-move setState would reconcile the whole section for nothing */
  const setScrub = (on: boolean) => {
    const el = trackRef.current
    if (!el) return
    if (on) el.dataset.scrub = '1'
    else delete el.dataset.scrub
  }
  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPlaying(false)
    trackDragRef.current = true
    trackMovedRef.current = false
    trackDownXRef.current = e.clientX
    setScrub(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* inactive pointer id (synthetic dispatch) · the drag works un-captured */
    }
    /* the press GLIDES the head under the pointer (no teleport); the first
       real drag motion below switches to 1:1 tracking */
    glideTo(trackFrac(e))
  }
  const onTrackMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const frac = trackFrac(e)
    /* the hover ghost caret reads the pointer straight from CSS — a style
       write on the track, never a reconcile */
    trackRef.current?.style.setProperty('--morph-hx', frac.toFixed(4))
    /* the scrub tip rides the same var; its words update on-change only */
    const tipEl = tipRef.current
    if (tipEl) {
      const ts = tipAt(frac)
      if (ts !== tipStrRef.current) {
        tipStrRef.current = ts
        tipEl.textContent = ts
      }
    }
    if (!trackDragRef.current) return
    if (!trackMovedRef.current && Math.abs(e.clientX - trackDownXRef.current) < 3) return
    trackMovedRef.current = true
    cancelGlide()
    seek(frac)
  }
  const onTrackUp = () => {
    trackDragRef.current = false
    setScrub(false)
  }
  const onTrackKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cur = progressRef.current
    /* Shift+←/→ · the chapter keys: jump from task tick to task tick — the
       rail's recorded starts become keyboard chapters (seek-by-object,
       operator lock arc 8b); plain arrows keep the fine 0.02 scrub */
    if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const fwd = e.key === 'ArrowRight'
      const next = fwd
        ? ticks.find((t) => t.at > cur + 0.001)
        : [...ticks].reverse().find((t) => t.at < cur - 0.005)
      glideTo(next ? next.at : fwd ? 1 : 0)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') glideTo(cur + 0.02)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') glideTo(cur - 0.02)
    else if (e.key === 'Home') glideTo(0)
    else if (e.key === 'End') glideTo(1)
    else return
    setPlaying(false)
    e.preventDefault()
  }
  const onPlayClick = () => {
    cancelGlide()
    if (!playing && progressRef.current >= 0.999) seek(0) /* replay from the top */
    setPlaying((v) => !v)
  }

  /* ── seek-by-object · the DAG, the slabs and the log double as the
     timeline's own nav (real-software law): click a step anywhere and the
     film GLIDES to its recorded moment — same glide, same one scroll store */
  const taskP = useCallback(
    (id: string): number | null => {
      const iv = taskInterval(flagship, id)
      if (!iv) return null
      const total = flagship.trace.totalMs || 1
      const at = 'skipAt' in iv ? iv.skipAt : iv.start
      /* +ε lands just INSIDE the step's window — its node reads live at rest */
      return Math.min(PH.run0 + (at / total) * (PH.run1 - PH.run0) + 0.004, 1)
    },
    [flagship],
  )
  const seekTask = useCallback(
    (id: string) => {
      const p = taskP(id)
      if (p == null) return
      setPlaying(false)
      glideTo(p)
    },
    [taskP, glideTo],
  )
  const seekMs = useCallback(
    (atMs: number) => {
      const total = flagship.trace.totalMs || 1
      setPlaying(false)
      glideTo(Math.min(PH.run0 + (atMs / total) * (PH.run1 - PH.run0) + 0.004, 1))
    },
    [flagship, glideTo],
  )
  /* the scrub tip · what truly lives under the pointer: the recorded clock
     plus the tasks running there (verbatim intervals) — never a guess */
  const tipAt = useCallback(
    (frac: number): string => {
      if (frac < PH.burst0) return 'the file'
      const rf = runFracAt(frac)
      if (rf <= 0) return 'the plan assembles'
      if (rf >= 1) return `exit ${script.verdict.exit} · ${formatMs(script.verdict.totalMs)}`
      const t = rf * flagship.trace.totalMs
      const running: string[] = []
      for (const task of plan.tasks) {
        const iv = taskInterval(flagship, task.id)
        if (iv && 'end' in iv && t >= iv.start && t < iv.end) running.push(task.id)
      }
      return `${(t / 1000).toFixed(1)}s${running.length > 0 ? ` · ${running.join(' · ')}` : ''}`
    },
    [flagship, plan, script],
  )
  /* the settled file joins seek-by-object (third surface): click a task's
     yaml block → replay from that step. A drag-select is not a seek. */
  const onYamlClick = useCallback(
    (e: React.MouseEvent) => {
      if (window.getSelection()?.toString()) return
      const line = (e.target as HTMLElement).closest<HTMLElement>('.cf-line')
      const ln = line ? Number(line.dataset.ln) : NaN
      const task = Number.isNaN(ln)
        ? undefined
        : plan.tasks.find((t) => ln >= t.line0 && ln <= t.line1)
      if (task) seekTask(task.id)
    },
    [plan, seekTask],
  )

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
      const runway = rect.height - (stageRef.current?.offsetHeight ?? window.innerHeight)
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
  /* the status row's live readout · which steps are truly running (recorded
     truth — recomputed only when the timeline state actually changes) */
  const runningIds = plan.tasks
    .filter((t) => timeline.nodes[t.id] === 'running')
    .map((t) => t.id)

  return (
    <>
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
                Hover any step to see its lines in the file. Click it to replay from there.
              </p>
              {/* the phone's done voice (W20) · no settled file panel <1024,
                  so the hover wording would lie — and a TAP now seeks (the
                  instrument wave), so « tap to read » would lie too */}
              <p className="morph-cap" data-for="done-touch">
                Tap any step to replay from it. The run is a file too.
              </p>
            </div>
          </header>

          <div className="morph-scene">
            {/* THE NARRATION · the STATIC scene's quiet caption above the
                finished DAG (armed hides this — the console narrator below
                is the armed voice; both render the ONE sayLines source).
                Decorative: the head captions carry the meaning for AT. */}
            <div className="morph-say" aria-hidden="true">
              {sayLines(maxTogether).map((l) => (
                <p key={l.phase} className="morph-say-line" data-for={l.phase}>
                  {l.text}
                </p>
              ))}
            </div>

            {/* THE FILE · the traveling card — the hero panel's OTHER size.
                Same seam variant + wrap + the same default evidence highlight
                + the same TITLEBAR (wave P: the hero chrome carries the file
                tabs now — the card renders their inert ghost + the floating
                copy, or the bar would swap content at the seam crossfade), so
                the two render ONE layout differing by a uniform scale (the
                projection can't teleport). */}
            <div className="morph-file" ref={cardRef}>
              <MemoCodeFile
                yaml={flagship.yaml}
                filename={flagship.filename}
                highlight={flagship.highlight}
                className="morph-code cf-panel--seam cf-panel--fadebottom"
                wrap
                copyInBody
                chromeSlot={ghostChrome}
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
                    {/* the circulation (W10) · a dash flow riding the same
                        curve — the flat plan visibly LIVES: data moves along
                        every wait. Motion-safe; phase-gated in morph.css. */}
                    <path className="morph-wire-flow" d={e.d} />
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
                          data-task={task.id}
                          data-verb={task.verb}
                          data-run={state}
                          data-hi={pairTask === task.id ? '1' : undefined}
                          role={done ? 'button' : undefined}
                          aria-label={
                            done
                              ? `${task.id} · ${task.verb} · replay from this step`
                              : undefined
                          }
                          tabIndex={done ? 0 : undefined}
                          onClick={
                            armed
                              ? () => {
                                  if (!window.getSelection()?.toString()) seekTask(task.id)
                                }
                              : undefined
                          }
                          onKeyDown={
                            done
                              ? (e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    seekTask(task.id)
                                  }
                                }
                              : undefined
                          }
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
                  onSeekTask={seekTask}
                />
              </Suspense>
            ) : null}

            {/* THE SEEDS · one chip per task, driven along their curves by
                apply() — the condensed block traveling INTO its slot. The two
                ghosts BEFORE each seed (paint order: trail under chip) are its
                afterimages — the flight's motion, readable in a still glance. */}
            <div className="morph-seeds" aria-hidden ref={seedLayerRef}>
              {plan.tasks.map((t) => (
                <Fragment key={t.id}>
                  {/* the landing reticle · paints UNDER the trail + chip (DOM
                      order) — it clones the seed's structure so its box IS
                      the chip's landing footprint (transparent ink sizes it) */}
                  <span
                    className="morph-seed morph-seed-target"
                    data-verb={t.verb}
                    ref={(el) => {
                      targetRefs.current.set(t.id, el)
                    }}
                  >
                    <span className="morph-seed-id">{t.id}</span>
                    <span className="morph-seed-verb">{t.verb}</span>
                  </span>
                  {[0, 1].map((gI) => (
                    <span
                      key={gI}
                      className="morph-seed morph-seed-ghost"
                      data-verb={t.verb}
                      ref={(el) => {
                        ghostRefs.current.set(`${t.id}·${gI}`, el)
                      }}
                    >
                      <span className="morph-seed-id">{t.id}</span>
                      <span className="morph-seed-verb">{t.verb}</span>
                    </span>
                  ))}
                  <span
                    className="morph-seed"
                    data-verb={t.verb}
                    ref={(el) => {
                      seedRefs.current.set(t.id, el)
                    }}
                  >
                    <span className="morph-seed-id">{t.id}</span>
                    <span className="morph-seed-verb">{t.verb}</span>
                  </span>
                </Fragment>
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
                onClick={done ? onYamlClick : undefined}
              >
                <MemoCodeFile
                  yaml={flagship.yaml}
                  filename={flagship.filename}
                    wrap
                  className="morph-done-code"
                />
                {/* the handoff · watch it run → now touch it (the playground
                    opens on THIS file) — the loop closes where the film ends */}
                <Link className="morph-done-open" to={playHref} viewTransition>
                  edit this file in the playground →
                </Link>
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
              {/* the timecode · the recorded clock under the playhead (the
                  driver writes the moving half; SSR ships the settled truth) */}
              <span className="morph-clock" aria-hidden>
                <span ref={clockRef}>{`${(flagship.trace.totalMs / 1000).toFixed(1)}s`}</span>
                {` / ${(flagship.trace.totalMs / 1000).toFixed(1)}s`}
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
                  data-task={line.task}
                  data-hi={line.task && pairTask === line.task ? '1' : undefined}
                  title={armed ? 'replay from this moment' : undefined}
                  onClick={
                    armed
                      ? () => {
                          if (!window.getSelection()?.toString()) seekMs(line.atMs)
                        }
                      : undefined
                  }
                  onPointerEnter={
                    done && line.task
                      ? () => {
                          hoverSrcRef.current = 'log'
                          setHoverTask(line.task ?? null)
                        }
                      : undefined
                  }
                  onPointerLeave={done && line.task ? () => setHoverTask(null) : undefined}
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
                  {/* classed so the short-phone frame can yield it — the DAG
                      on screen IS the task count there */}
                  <span className="morph-verdict-tasks">
                    {verdict.completed} task{verdict.completed > 1 ? 's' : ''} ran
                    {verdict.skipped > 0 ? ` · ${verdict.skipped} skipped by its when: gate` : ''}
                  </span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  {/* classed so the short-phone frame can yield it — the same
                      figure already reads in the body's « run complete » line */}
                  <span className="morph-verdict-ms">{formatMs(verdict.totalMs)}</span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  <span className="morph-verdict-art">{verdict.artifact}</span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  {/* the punchline · the one fact no cloud tool can print —
                      $0.00, and « local » when the provider is a local runtime
                      (honest per flagship, never a blanket claim) */}
                  <span className="morph-verdict-cost">$0.00</span>
                  <span className="morph-verdict-sep" aria-hidden>
                    ·
                  </span>
                  {isLocalModel(verdict.model) ? (
                    <span className="morph-verdict-local">local</span>
                  ) : null}
                  <span className="morph-verdict-sep morph-verdict-sep--model" aria-hidden>
                    ·
                  </span>
                  <span className="morph-verdict-model">{verdict.model}</span>
                </>
              ) : timeline.reveal > 0 ? (
                /* mid-run · the status row names what is truly running */
                <span className="morph-verdict-wait">
                  {runningIds.length > 0 ? `running · ${runningIds.join(' · ')}` : 'running…'}
                </span>
              ) : (
                /* pre-run · the plan's facts stand in the docked window —
                   tasks + the permit families (the blast radius IS the
                   argument · derived verbatim from the file) + the model */
                <span className="morph-verdict-plan">
                  {plan.tasks.length} tasks
                  {plan.permits.length > 0
                    ? ` · permits: ${[...new Set(plan.permits.map((p) => p.kind))].join(' + ')}`
                    : ''}
                  {` · ${verdict.model}`}
                </span>
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
            {/* THE NARRATOR (wave M) · the one ambient voice, anchored in the
                transport — the SAME sayLines source as the static caption
                (a copy edit can never fork the two). The 0.3s text crossfade
                is deliberate: same register as the head captions — a TEXT
                swap, not a spatial film beat (those are all p-keyed). */}
            <span className="morph-console-say" aria-hidden>
              {sayLines(maxTogether).map((l) => (
                <span key={l.phase} className="morph-csay-line" data-for={l.phase}>
                  {l.text}
                </span>
              ))}
            </span>
            <div
              className="morph-track"
              ref={trackRef}
              role="slider"
              tabIndex={0}
              aria-label="replay timeline"
              aria-keyshortcuts="Shift+ArrowRight Shift+ArrowLeft"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
              onPointerDown={onTrackDown}
              onPointerMove={onTrackMove}
              onPointerUp={onTrackUp}
              onPointerCancel={onTrackUp}
              onLostPointerCapture={onTrackUp}
              onKeyDown={onTrackKey}
            >
              <span className="morph-track-rail" aria-hidden />
              {/* the hover ghost · a hairline preview caret under the pointer —
                  the track answers BEFORE you commit (hidden while the head
                  itself is in hand) */}
              <span className="morph-track-ghost" aria-hidden />
              {/* the scrub tip · the recorded moment under the pointer (clock +
                  the tasks truly running there) — words written DOM-direct by
                  onTrackMove, position riding the same --morph-hx var */}
              <span className="morph-track-tip" aria-hidden ref={tipRef} />
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

      {/* ── the un-armed phone story (W20) · exactly ONE variant ever mounts ──
          SSR/no-JS keeps this vertical run+plan story in the HTML (morph.css
          hides the un-armed morphsec ≤767px and this story ≥768px); the arm
          effect unmounts it everywhere else, so an armed phone never carries
          a hidden duplicate of the tale. */}
      {!armed && (
        <div className="morph-mobile-story">
          {/* FIG 1.0m · THE RUN — the trace replay (tap ▶ / in-view autoplay) */}
          <TheRun flagship={flagship} />
          {/* FIG 2.0m · THE PLAN — the same file as a vertical timeline */}
          <ThePlan flagship={flagship} />
        </div>
      )}
    </>
  )
}
