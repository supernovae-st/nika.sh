import { useEffect, useRef } from 'react'
import { CANON } from '../canon.generated'
import './v4-home.css'

/* ─── FIG 9.0 · Proof (theme-LIGHT · the control close) ────────────────────────
   Design doc §6 (FIG 9.0). We have NO quotable users yet, so we do NOT fabricate
   testimonials, names, companies or star counts. Instead this is proof BY THE
   NUMBERS + the CONTROL GUARANTEES: the real CANON counts as big tabular-nums
   stats, then a hairline-ruled ledger of what the engine actually guarantees —
   review before it acts · enforced permissions · replayable trace · portable off
   any platform · versioned like code. Closes on the punch line:
   "A README is documentation. Nika is an executable contract."

   Every count derives from CANON (canon.generated.ts → spec canon.yaml, the
   SSOT) — never hand-typed. Declarative, confident, honest. This is the authority
   close before the final CTA — light surface (the page's last rhythm break).

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount,
   content fully visible by default (no-JS / reduced-motion). */

/* the headline stats · the real, verifiable CANON counts (tabular-nums). */
const STATS: { fig: string; n: React.ReactNode; label: React.ReactNode }[] = [
  {
    fig: '9.A',
    n: <>{CANON.verbs}</>,
    label: <>verbs · every action explicit, declared not hidden</>,
  },
  {
    fig: '9.B',
    n: <>{CANON.builtins}</>,
    label: <>builtin tools · allow-listed, nothing to install</>,
  },
  {
    fig: '9.C',
    n: (
      <>
        {CANON.providers}
        <span className="v4belt-count-unit">/{CANON.providersLocal} local</span>
      </>
    ),
    label: <>model providers · any model, cloud or fully offline</>,
  },
  {
    fig: '9.D',
    n: <>1</>,
    label: <>Rust binary · zero daemons, zero background services</>,
  },
]

/* the control guarantees · declarative, honest, no testimonial. Each is a
   plain-English promise the architecture actually keeps. Lead with control. */
const GUARANTEES: { fig: string; claim: string; detail: string }[] = [
  {
    fig: 'I',
    claim: 'Review before it acts.',
    detail: 'The agent writes its plan as a file first — every step, tool and permission. A human reads it before a single action runs.',
  },
  {
    fig: 'II',
    claim: 'Enforced permissions.',
    detail: `The file's permits: block is the blast radius — files, hosts, programs, tools. The runtime denies anything outside it (${CANON.providersLocal} local providers mean PII never has to leave).`,
  },
  {
    fig: 'III',
    claim: 'Replayable trace.',
    detail: 'Every run emits a typed NDJSON stream — the audit trail. Same file, same steps, same order, run again and diff it like code.',
  },
  {
    fig: 'IV',
    claim: 'Portable off any platform.',
    detail: `One binary, ${CANON.providers} model providers, AGPL-3.0 forever. The file outlives the vendor — it still runs the day the company that made it is gone.`,
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
          FIG 9.0
        </p>
        <h2
          id="proof-title"
          className="v4sec-title"
          data-rise
          style={{ ['--rise-delay' as string]: '60ms' }}
        >
          The control is the proof.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          No logos to borrow, no quotes to dress up. Just what the engine{' '}
          <b>guarantees</b>: review before it acts · enforced permissions ·
          replayable trace · portable off any platform · versioned like code —
          verifiable in the open spec and the one binary you install.
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
                  9.{g.fig}
                </span>
                {g.claim}
              </dt>
              <dd className="v4proof-detail">{g.detail}</dd>
            </div>
          ))}
        </dl>

        <p className="v4proof-punch" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
          A README is documentation. <b>Nika is an executable contract.</b>
        </p>

        <p className="v4proof-note" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          every number derives from the spec&apos;s <code>canon.yaml</code> — verifiable, never hand-typed
        </p>
      </div>
    </section>
  )
}
