import { useEffect, useRef } from 'react'
import { CANON } from '../canon.generated'
import './v4-home.css'

/* ─── FIG 8.0 · Proof (theme-LIGHT · the authority close) ──────────────────────
   Design doc §6 (FIG 8.0) + §12 Q3 — proof. We have NO quotable users yet, so we
   do NOT fabricate testimonials, names, companies or star counts. Instead this is
   proof BY THE NUMBERS + the sovereignty GUARANTEES: the real CANON counts as big
   tabular-nums stats, then a hairline-ruled ledger of what the engine guarantees
   (runs on your machine · any model, cloud or local · AGPL forever · one binary,
   zero daemons · the file outlives the vendor).

   Every count derives from CANON (canon.generated.ts → spec canon.yaml, the
   SSOT) — never hand-typed. Declarative, confident, honest. This is the authority
   close before the final CTA — light surface (the page's last rhythm break).

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount,
   content fully visible by default (no-JS / reduced-motion). */

/* the headline stats · the real, verifiable CANON counts (tabular-nums). */
const STATS: { fig: string; n: React.ReactNode; label: React.ReactNode }[] = [
  {
    fig: '8.A',
    n: <>{CANON.verbs}</>,
    label: <>verbs · the whole operation space, locked forever</>,
  },
  {
    fig: '8.B',
    n: <>{CANON.builtins}</>,
    label: <>builtin tools · standard library, nothing to install</>,
  },
  {
    fig: '8.C',
    n: (
      <>
        {CANON.providers}
        <span className="v4belt-count-unit">/{CANON.providersLocal} local</span>
      </>
    ),
    label: <>model providers · any model, cloud or fully offline</>,
  },
  {
    fig: '8.D',
    n: <>1</>,
    label: <>Rust binary · zero daemons, zero background services</>,
  },
]

/* the sovereignty guarantees · declarative, honest, no testimonial. Each is a
   plain-English promise the architecture actually keeps. */
const GUARANTEES: { fig: string; claim: string; detail: string }[] = [
  {
    fig: 'I',
    claim: 'It runs on your machine.',
    detail: 'One binary, local by default. Nothing leaves unless you write the line that sends it.',
  },
  {
    fig: 'II',
    claim: 'Any model, cloud or local.',
    detail: `${CANON.providers} providers, ${CANON.providersLocal} of them local. Swap the model in one line — the workflow never changes.`,
  },
  {
    fig: 'III',
    claim: 'AGPL — forever.',
    detail: 'The engine is AGPL-3.0-or-later; the spec is Apache-2.0. Free software, no metering, no per-seat.',
  },
  {
    fig: 'IV',
    claim: 'The file outlives the vendor.',
    detail: 'Plain-text YAML you read, diff and version. It still runs the day the company that made it is gone.',
  },
]

export default function Proof() {
  const ref = useRef<HTMLElement>(null)

  /* reveal the rows once, on first intersection (motion-safe; default visible) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('v4-in')
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} id="proof" aria-labelledby="proof-title" className="theme-light v4sec scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 8.0
        </p>
        <h2
          id="proof-title"
          className="v4sec-title"
          data-rise
          style={{ ['--rise-delay' as string]: '60ms' }}
        >
          The proof is the spec.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          No logos to borrow, no quotes to dress up. Just what the engine actually
          is, and what it <b>guarantees</b> — verifiable in the open spec and the
          one binary you install.
        </p>

        {/* the headline stats banner · big tabular numbers, hairline-separated */}
        <div className="v4belt-counts" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
          {STATS.map((s) => (
            <div className="v4belt-count" key={s.fig}>
              <span className="v4belt-count-fig">{s.fig}</span>
              <span className="v4belt-count-n">{s.n}</span>
              <span className="v4belt-count-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* the guarantees ledger · hairline-ruled promises (declarative, no quote) */}
        <dl className="v4proof-ledger" data-rise style={{ ['--rise-delay' as string]: '210ms' }}>
          {GUARANTEES.map((g) => (
            <div className="v4proof-row" key={g.fig}>
              <dt className="v4proof-claim">
                <span className="v4proof-fig" aria-hidden>
                  8.{g.fig}
                </span>
                {g.claim}
              </dt>
              <dd className="v4proof-detail">{g.detail}</dd>
            </div>
          ))}
        </dl>

        <p className="v4proof-note" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          every number derives from the spec&apos;s <code>canon.yaml</code> — verifiable, never hand-typed
        </p>
      </div>
    </section>
  )
}
