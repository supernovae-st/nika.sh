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

/* the glyphs · crisp geometry, no icon library — near-white strokes, one HOT
   detail in the deep plate ink (the reference hierarchy: glyph carries the
   card, words explain it) */
function PledgeGlyph({ kind }: { kind: 'bars' | 'ring' | 'dots' }) {
  if (kind === 'bars') {
    return (
      <svg className="v4pledge-glyph" viewBox="0 0 64 64" aria-hidden focusable="false" shapeRendering="crispEdges">
        <g fill="currentColor">
          <rect x="10" y="14" width="44" height="3" />
          <rect x="10" y="25" width="44" height="3" />
          <rect x="10" y="36" width="44" height="3" />
          <rect x="10" y="47" width="20" height="3" />
        </g>
        {/* the cursor · the file is being written */}
        <rect className="v4pledge-glyph-hot" x="34" y="44" width="9" height="9" />
      </svg>
    )
  }
  if (kind === 'ring') {
    return (
      <svg className="v4pledge-glyph" viewBox="0 0 64 64" aria-hidden focusable="false">
        <circle cx="32" cy="32" r="17" fill="none" stroke="currentColor" strokeWidth="3" />
        {/* the runner · the same lap, again */}
        <circle className="v4pledge-glyph-hot" cx="44.02" cy="19.98" r="5" />
      </svg>
    )
  }
  return (
    <svg className="v4pledge-glyph" viewBox="0 0 64 64" aria-hidden focusable="false">
      <g fill="currentColor">
        {[13, 32, 51].map((cy) =>
          [13, 32, 51].map((cx) =>
            cx === 32 && cy === 32 ? null : <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.6" />,
          ),
        )}
      </g>
      {/* the held cell · yours, on your disk */}
      <circle className="v4pledge-glyph-hot" cx="32" cy="32" r="6.5" />
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
            <CodeFile yaml={flagship.yaml} filename={flagship.filename} />
          </div>
        </div>

        <p className="v4wedge-caption" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          the session ends · the file stays
        </p>

        {/* the three promises · 04.1–04.3 · THE BLUE PLATE (wave W7). The page's
            one saturated field: the accent, quantized + gridded + grained (the
            survey register in blue), carrying three textured glyph cards. The
            hierarchy is the reference's: glyph → fig → title → body. */}
        <div
          ref={plateRef}
          className="v4pledge"
          data-rise
          style={{ ['--rise-delay' as string]: '260ms' }}
        >
          <p className="v4pledge-kick" aria-hidden>
            what the file buys you
          </p>
          <div className="v4pledge-grid">
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
      </div>
    </section>
  )
}
