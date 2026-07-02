import { useRevealOnce } from './use-reveal-once'
import { REPO, SPEC } from '../content'
import { CANON } from '../canon.generated'
import './v4-home.css'

/* ─── FIG 5.0 · The procedure is yours (theme-LIGHT · the rhythm break) ─────────
   Design doc §6 (FIG 5.0) — sovereignty, reframed to control. The local-first
   statement, on a warm off-white surface with near-black ink (the page's light
   rhythm break — same typography, only surfaces + ink invert via .theme-light).
   The plan an agent writes is YOURS: reviewable before it acts, portable off any
   platform, versioned like code, runs on your machine, AGPL forever. The file
   outlives the vendor.

   A confident editorial column, NOT a card grid: a large sovereignty sentence +
   a body line + a hairline-ruled FACTS LEDGER. Every count is tabular-nums and
   comes from CANON (canon.generated.ts → spec canon.yaml) — never hand-typed.
   Provider order follows the studio convention: local/open-weight first.

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount with
   content visible by default (no-JS / reduced-motion). */

/* the sovereign facts · counts read off CANON (the spec single source of truth).
   value carries a <b> for the bold number so the ledger reads tabular + ranked. */
const LEDGER: { fig: string; name: string; value: React.ReactNode }[] = [
  {
    fig: 'A',
    name: 'The runtime',
    value: (
      <>
        one Rust binary<span className="v4own-sep"> · </span>zero daemons
      </>
    ),
  },
  {
    fig: 'B',
    name: 'The verbs',
    value: (
      <>
        <b>{CANON.verbs}</b>, locked forever
      </>
    ),
  },
  {
    fig: 'C',
    name: 'The builtins',
    value: (
      <>
        <b>{CANON.builtins}</b> tools<span className="v4own-sep"> · </span>nothing to install
      </>
    ),
  },
  {
    fig: 'D',
    name: 'The models',
    value: (
      <>
        <b>{CANON.providers}</b> providers<span className="v4own-sep"> · </span>
        {CANON.providersLocal} local
      </>
    ),
  },
  {
    fig: 'E',
    name: 'Your data',
    value: <>stays on your machine</>,
  },
  {
    fig: 'F',
    name: 'The license',
    value: (
      <>
        <b>AGPL-3.0</b>, forever
      </>
    ),
  },
]

export default function OwnWorkflows() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="own" aria-labelledby="own-title" className="theme-light v4sec v4-cv scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 7.5
        </p>

        <h2 id="own-title" className="v4own-statement" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          The procedure is <span className="v4own-dim">yours.</span>
        </h2>

        <p className="v4own-body" data-rise style={{ ['--rise-delay' as string]: '130ms' }}>
          <b>Reviewable before it acts.</b> Portable off any platform, versioned like
          code, runs on your machine. Nothing leaves unless you say so, nothing meters
          your runs, nothing rots when a vendor pivots. The spec is open and the
          license is <b>AGPL, forever</b>.
        </p>

        {/* the facts ledger · hairline-ruled · counts from CANON (tabular-nums) */}
        <dl className="v4own-ledger" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          {LEDGER.map((row) => (
            <div className="v4own-row" key={row.fig}>
              <dt className="v4own-row-label">
                <span className="v4own-row-fig" aria-hidden>
                  5.{row.fig}
                </span>
                <span className="v4own-row-name">{row.name}</span>
              </dt>
              <dd className="v4own-row-value">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="v4own-license" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
          <img src="/nika.svg" alt="" aria-hidden />
          <span>
            <b>nika</b> · free software · AGPL-3.0-or-later
          </span>
          <span className="v4own-sep" aria-hidden>
            ·
          </span>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span className="v4own-sep" aria-hidden>
            ·
          </span>
          <a href={SPEC} target="_blank" rel="noreferrer">
            Read the spec
          </a>
        </p>
      </div>
    </section>
  )
}
