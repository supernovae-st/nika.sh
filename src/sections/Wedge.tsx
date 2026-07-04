import { useEffect, useRef } from 'react'
import { CodeFile } from '../components/CodeFile'
import type { FlagshipEntry } from '../flagships'
import { useRevealOnce } from './use-reveal-once'
import './v4-home.css'

/* ─── FIG 4.0 · The wedge (theme-dark · the manifesto beat) ───────────────────
   The missing "why" beat (research section #4): one two-tone thesis paragraph
   (white lead + dim rest · Linear register) over THE CAPTURE — a split showing
   the same morning ritual twice: LEFT as a chat session (dim, dashed,
   evaporating — the transcript fades out mid-panel), RIGHT as daily-brief
   .nika.yaml in the sharp product frame (the permanent register). The mono
   caption carries the thesis in six words: the session ends · the file stays.

   HONESTY: the file shown IS the hero's default tab (HERO_FILES[0] — schema-
   true, gated by src/test/onpage-yaml.test.ts), so the beat re-uses the ONE
   flagship object instead of inventing a second workflow. The transcript is
   an illustrative register (clearly a vignette, no fabricated product output).

   Static composition — the only motion is the section's shared motion-safe
   data-rise reveal. SSR-safe: pure DOM. */

const TRANSCRIPT: { who: 'you' | 'agent'; text: string }[] = [
  { who: 'you', text: 'check my inbox and calendar. what matters today?' },
  { who: 'agent', text: 'Scanning… 3 urgent threads, one meeting conflict. Want the brief?' },
  { who: 'you', text: 'yes, same format as yesterday’s' },
  { who: 'agent', text: 'I don’t have yesterday’s session. Rebuilding the steps from scratch…' },
]

/* the three promises · now the BLUE PLATE (wave W7). Each carries an abstract
   geometric glyph in the survey register — bars (lines of a file, cursor still
   writing) · ring (the loop, the replay) · dots (the grid, one cell held). The
   glyph is the biggest thing on the card: glyph → fig → title → body. */
const COLS: { n: string; title: string; body: string; glyph: 'bars' | 'ring' | 'dots' }[] = [
  {
    n: '04.1',
    title: 'Written once',
    body: 'The ritual becomes a file: plain YAML, versioned next to your code.',
    glyph: 'bars',
  },
  {
    n: '04.2',
    title: 'Runs forever',
    body: 'Same file, same result. Tomorrow, on another machine, after the vendor is gone.',
    glyph: 'ring',
  },
  {
    n: '04.3',
    title: 'Owned',
    body: 'It lives on your disk. Nothing to export, no account to lose.',
    glyph: 'dots',
  },
]

/* ── the glyphs · ordered-dither pictograms (W9) ──────────────────────────────
   Each pictogram is PRINTED in the site's dither register: a coverage field
   (solid geometric core, feathered edge) quantized through the canonical
   Bayer-8 table — the same construction as the CTA's ASCII butterfly and the
   3D slabs' lighting, at icon scale. The HOT detail stays a solid punched-in
   shape so the meaning reads instantly: the cursor (still writing), the
   runner (the same lap, again), the held cell (claimed). Cells are baked at
   module scope — zero per-render work. */
const BAYER8 = [
  0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52, 11, 59, 7, 55, 40,
  24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13, 61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58,
  6, 54, 9, 57, 5, 53, 42, 26, 38, 22, 41, 25, 37, 21,
]
const G_N = 27 /* cells per side — fine enough that the SOLID core carries the
                  shape and the dither only dresses a ~1-cell edge halo */
const G_PITCH = 76 / G_N

/* coverage 1 inside the shape, feathering to 0 over `f` outside `half` */
const cov = (d: number, half: number, f: number) =>
  Math.max(0, Math.min(1, (half + f - d) / f))

function pledgeCells(kind: 'bars' | 'ring' | 'dots') {
  const cells: { x: number; y: number; o: number }[] = []
  for (let cy = 0; cy < G_N; cy++) {
    for (let cx = 0; cx < G_N; cx++) {
      const x = (cx + 0.5) / G_N
      const y = (cy + 0.5) / G_N
      let c = 0
      if (kind === 'bars') {
        /* four text lines · the last one short (the cursor writes after it) */
        const rows = [0.13, 0.37, 0.61, 0.85]
        for (let i = 0; i < rows.length; i++) {
          const end = i === 3 ? 0.48 : 0.97
          if (x > 0.03 && x < end) c = Math.max(c, cov(Math.abs(y - rows[i]), 0.055, 0.03))
        }
      } else if (kind === 'ring') {
        /* the loop · an annulus */
        c = cov(Math.abs(Math.hypot(x - 0.5, y - 0.5) - 0.34), 0.08, 0.03)
      } else {
        /* the grid · eight cells around the held one */
        for (const gy of [0.16, 0.5, 0.84]) {
          for (const gx of [0.16, 0.5, 0.84]) {
            if (gx === 0.5 && gy === 0.5) continue
            c = Math.max(c, cov(Math.hypot(x - gx, y - gy), 0.08, 0.03))
          }
        }
      }
      if (c <= 0.03) continue
      const t = (BAYER8[(cy % 8) * 8 + (cx % 8)] + 0.5) / 64
      if (c < 1 && c < t) continue /* the ordered-dither edge halo */
      /* the core prints SOLID (readability first) · only the halo is dithered */
      cells.push({ x: cx, y: cy, o: c >= 1 ? 1 : 0.42 })
    }
  }
  return cells
}
const PLEDGE_CELLS = {
  bars: pledgeCells('bars'),
  ring: pledgeCells('ring'),
  dots: pledgeCells('dots'),
} as const

function PledgeGlyph({ kind }: { kind: 'bars' | 'ring' | 'dots' }) {
  return (
    <svg
      className="v4pledge-glyph"
      data-glyph={kind}
      viewBox="0 0 76 76"
      aria-hidden
      focusable="false"
      shapeRendering="crispEdges"
    >
      <g fill="currentColor">
        {PLEDGE_CELLS[kind].map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x * G_PITCH + 0.45}
            y={c.y * G_PITCH + 0.45}
            width={G_PITCH - 0.9}
            height={G_PITCH - 0.9}
            opacity={c.o}
          />
        ))}
      </g>
      {kind === 'bars' && (
        /* the cursor · the file is being written (blinks on card hover) */
        <rect className="v4pledge-glyph-hot" x="44" y="60" width="10" height="10" />
      )}
      {kind === 'ring' && (
        /* the runner · the same lap, again (orbits on card hover) */
        <g className="v4pledge-orbit">
          <circle className="v4pledge-glyph-hot" cx="55.7" cy="20.3" r="5.5" />
        </g>
      )}
      {kind === 'dots' && (
        /* the held cell · yours, on your disk (settles-pulse on card hover) */
        <circle className="v4pledge-glyph-hot" cx="38" cy="38" r="7" />
      )}
    </svg>
  )
}

/* tilt tuning · degrees edge-to-edge (halved at center) — deliberate, not a
   funhouse: the card LIFTS toward the pointer, the glyph/type layers ride
   higher Z planes, a soft glare tracks the pointer over the grain. */
const TILT_X = 9
const TILT_Y = 12
const LERP = 0.16

export default function Wedge({ flagship }: { flagship: FlagshipEntry }) {
  const ref = useRevealOnce<HTMLElement>()
  const pledgeRef = useRevealOnce<HTMLElement>()
  const plateRef = useRef<HTMLDivElement>(null)

  /* the 3D hover · pointer-tracked tilt, rAF-lerped (site driver idiom: zero
     React re-renders, writes CSS vars). Gated to hover-capable fine pointers
     with motion allowed — touch / reduced-motion / SSR keep the flat, crisp
     plate ([data-tilt] never set, so the Z-layer transforms never apply). */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const plate = plateRef.current
    if (!plate) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    plate.dataset.tilt = '1'
    const cards = Array.from(plate.querySelectorAll<HTMLElement>('.v4pledge-card'))
    type S = { rx: number; ry: number; g: number; tx: number; ty: number; tg: number }
    const st = new Map<HTMLElement, S>()
    for (const c of cards) st.set(c, { rx: 0, ry: 0, g: 0, tx: 0, ty: 0, tg: 0 })

    let raf = 0
    const tick = () => {
      let live = false
      for (const [c, s] of st) {
        s.rx += (s.tx - s.rx) * LERP
        s.ry += (s.ty - s.ry) * LERP
        s.g += (s.tg - s.g) * LERP
        if (Math.abs(s.tx - s.rx) > 0.01 || Math.abs(s.ty - s.ry) > 0.01 || Math.abs(s.tg - s.g) > 0.004) {
          live = true
        } else {
          s.rx = s.tx
          s.ry = s.ty
          s.g = s.tg
        }
        c.style.setProperty('--prx', `${s.rx.toFixed(2)}deg`)
        c.style.setProperty('--pry', `${s.ry.toFixed(2)}deg`)
        c.style.setProperty('--pg', s.g.toFixed(3))
      }
      raf = live ? requestAnimationFrame(tick) : 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const c = e.currentTarget as HTMLElement
      const s = st.get(c)
      if (!s) return
      const r = c.getBoundingClientRect()
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
      /* lift toward the pointer: rotateX(−) tips the top edge to the viewer,
         rotateY(+) brings the left edge forward — hence the sign pairing */
      s.tx = (py - 0.5) * TILT_X
      s.ty = (0.5 - px) * TILT_Y
      s.tg = 1
      // the glare tracks the pointer directly (no lerp — light is instant)
      c.style.setProperty('--pmx', `${(px * 100).toFixed(1)}%`)
      c.style.setProperty('--pmy', `${(py * 100).toFixed(1)}%`)
      wake()
    }
    const onLeave = (e: PointerEvent) => {
      const s = st.get(e.currentTarget as HTMLElement)
      if (!s) return
      s.tx = 0
      s.ty = 0
      s.tg = 0
      wake()
    }

    for (const c of cards) {
      c.addEventListener('pointermove', onMove)
      c.addEventListener('pointerleave', onLeave)
    }
    return () => {
      cancelAnimationFrame(raf)
      for (const c of cards) {
        c.removeEventListener('pointermove', onMove)
        c.removeEventListener('pointerleave', onLeave)
      }
      delete plate.dataset.tilt
    }
  }, [])

  return (
    <>
    <section ref={ref} id="wedge" aria-labelledby="wedge-title" className="theme-dark v4sec scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          04
        </p>

        {/* the two-tone thesis · the manifesto, in one paragraph */}
        <h2 id="wedge-title" className="v4wedge-thesis" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          <b>Useful AI work shouldn’t disappear into chats.</b> The prompts you
          perfect, the steps an agent improvises: they evaporate with the
          session. Nika turns the work into a file: readable, versioned,
          runnable. Workflows are files, not SaaS state.
        </h2>

        {/* THE CAPTURE · the same work, twice · ephemeral vs permanent */}
        <div className="v4wedge-split" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
          <div className="v4wedge-chat" role="img" aria-label="A chat session: the same morning ritual asked again, the assistant rebuilding the steps from scratch. The transcript fades out; the session state is gone.">
            <p className="v4wedge-chat-kicker" aria-hidden>
              a chat, every morning
            </p>
            {TRANSCRIPT.map((line, i) => (
              <p className="v4wedge-chat-line" key={i} aria-hidden>
                <span className={`v4wedge-chat-who v4wedge-chat-who--${line.who}`}>{line.who} ›</span>{' '}
                {line.text}
              </p>
            ))}
            <p className="v4wedge-chat-gone" aria-hidden>
              (session closed · the steps are gone)
            </p>
          </div>

          <span className="v4wedge-arrow" aria-hidden>
            →
          </span>

          <div className="v4wedge-file v4-frame-canvas">
            <CodeFile yaml={flagship.yaml} filename={flagship.filename} wrap />
          </div>
        </div>

        <p className="v4wedge-caption" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          the session ends · the file stays
        </p>

      </div>
    </section>

    {/* the three promises · 04.1–04.3 · THE BLUE SECTION (W9). A full-bleed
        section in the page's alternation (theme-blue re-scopes the whole
        ladder) — the accent as a section surface, edge to edge, survey grid +
        quantized bloom + grain. Three textured cards ride the field, each
        glyph → fig → title → body, the glyphs printed in the ordered-dither
        register. */}
    <section
      ref={pledgeRef}
      className="theme-blue v4sec v4pledge scroll-mt-24"
      aria-labelledby="pledge-title"
    >
      <div className="v4sec-wrap" ref={plateRef}>
        <h2 id="pledge-title" className="v4pledge-kick" data-rise>
          what the file buys you
        </h2>
        <div className="v4pledge-grid" data-rise style={{ ['--rise-delay' as string]: '100ms' }}>
          {COLS.map((c) => (
            <article className="v4pledge-card" key={c.n}>
              <span className="v4pledge-glare" aria-hidden />
              <div className="v4pledge-lift v4pledge-lift--glyph">
                <PledgeGlyph kind={c.glyph} />
              </div>
              <div className="v4pledge-lift v4pledge-lift--head">
                <p className="v4pledge-fig" aria-hidden>
                  {c.n}
                </p>
                <h3 className="v4pledge-title">{c.title}</h3>
              </div>
              <p className="v4pledge-lift v4pledge-body">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
    </>
  )
}
