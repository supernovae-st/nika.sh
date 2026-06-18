import { useRevealOnce } from './use-reveal-once'
import './v4-home.css'

/* ─── FIG 3.6 · Where Nika fits (theme-LIGHT · the positioning beat) ───────────
   v4.1 control narrative · a cold visitor with LangGraph / n8n / Cursor / Claude
   Code asks "why does this exist?". This is the CONCISE, honest answer — NOT a
   competitive teardown. Nika is orthogonal: the layer between "the model wants to
   act" and "the system lets it act". A tight block, not a huge section: a one-line
   thesis, a small 3-row "they do X · Nika does Y" register, and the punch line.

   Honest + complementary by construction: every row says what the other tools are
   GOOD at, then what Nika adds underneath. The close — "Run a Nika plan from any
   of them; it's a portable file, not a platform." — frames Nika as the substrate,
   never the rival.

   theme-light (warm off-white surface, near-black ink) gives the page a rhythm
   break after the dark Permits section. SSR-safe: pure DOM; the reveal is an
   IntersectionObserver added on mount, content visible by default (no-JS /
   reduced-motion). */

/* the three honest contrasts · what each layer is FOR, then what Nika adds.
   Fair: the "them" line credits the other tools; "nika" states the orthogonal add. */
const ROWS: { fig: string; them: string; themDoes: string; nika: string }[] = [
  {
    fig: 'i',
    them: 'Frameworks',
    themDoes: 'LangGraph, n8n — help you wire and orchestrate the steps.',
    nika: 'makes the wired steps a reviewable, enforceable file — not glue code.',
  },
  {
    fig: 'ii',
    them: 'Assistants',
    themDoes: 'Cursor, Claude Code — help an agent decide and act in the moment.',
    nika: 'turns that intent into a plan you review and the runtime enforces.',
  },
  {
    fig: 'iii',
    them: 'Protocols & tools',
    themDoes: 'MCP servers expose capabilities an agent can call.',
    nika: 'runs them through invoke — allow-listed, permission-bound, traced.',
  },
]

export default function WhereItFits() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="where-it-fits" aria-labelledby="where-it-fits-title" className="theme-light v4sec v4-flip scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 3.6
        </p>
        <h2 id="where-it-fits-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          Not another agent framework. The layer underneath.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          Frameworks and assistants help an agent <b>decide</b> and <b>act</b>. Nika is
          orthogonal: it makes what the agent does <b>reviewable</b> and <b>enforceable</b>{' '}
          — the layer between <i>the model wants to act</i> and <i>the system lets it act</i>.
        </p>

        {/* the 3-row register · "they do X · Nika does Y", hairline-ruled */}
        <dl className="v4fits-rows" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          {ROWS.map((r) => (
            <div className="v4fits-row" key={r.fig}>
              <dt className="v4fits-them">
                <span className="v4fits-fig" aria-hidden>
                  {r.fig}
                </span>
                <span className="v4fits-them-name">{r.them}</span>
                <span className="v4fits-them-does">{r.themDoes}</span>
              </dt>
              <dd className="v4fits-nika">
                <img src="/nika.svg" alt="" aria-hidden />
                <span>
                  <b>Nika</b> {r.nika}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="v4fits-punch" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
          Run a Nika plan from any of them. <b>It&apos;s a portable file, not a platform.</b>
        </p>
      </div>
    </section>
  )
}
