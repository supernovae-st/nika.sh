import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { TIMELINE } from '../content/timeline.generated'
import { routeHead } from '../content'
import './timeline-page.css'

/* ─── /timeline · the one verifiable record ──────────────────────────────────
   Three eras, dated entries, forward gates. The page renders the
   vendored projection of nika-spec timeline/timeline.yaml — the SSOT
   whose provable claims are re-proven by the spec's own CI. Every
   proof badge links to the public source (crates.io keeps yanked
   versions listed forever · GitHub keeps commits and releases).
   Unprovable claims are labeled, never dressed as proof. The future
   carries conditions, never dates. */

const CLASS_LABEL: Record<string, string> = {
  'crates-io': 'crates.io',
  'github-release': 'release',
  'github-commit': 'commit',
  'github-pr': 'PR',
  'git-tag': 'tag',
  scorecard: 'scorecard',
  'private-archive': 'private archive',
  testimony: 'testimony',
}

function Proof({ evidence }: { evidence: (typeof TIMELINE.eras)[number]['entries'][number]['evidence'] }) {
  const label = CLASS_LABEL[evidence.class] ?? evidence.class
  if (evidence.provable && evidence.href) {
    return (
      <a className="tl-proof tl-proof-proved" href={evidence.href} target="_blank" rel="noreferrer">
        ✓ {label}
      </a>
    )
  }
  if (evidence.class === 'scorecard' && evidence.href) {
    return (
      <a className="tl-proof tl-proof-recorded" href={evidence.href} target="_blank" rel="noreferrer">
        · {label}
      </a>
    )
  }
  return (
    <span className="tl-proof tl-proof-unprovable" title="labeled honestly — no mechanical proof exists or is claimed">
      ○ {label}
    </span>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const head = routeHead('/timeline')
  useHead({
    title: 'Timeline · the one verifiable record · Nika',
    meta: [
      {
        name: 'description',
        content:
          'Born January 1, 2026 · 79 versions in a 103-day exploration era · rewritten from scratch April 13. Every dated claim re-proven in CI — the future carries conditions, never dates.',
      },
      ...head.meta,
    ],
    link: head.link,
  })

  return (
    <main className="theme-dark hub-page tl-page" style={{ ['--hub-hue' as string]: '#f0b429' }}>
      <section ref={ref} aria-labelledby="tl-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <header>
            <p className="v4-kick">the timeline</p>
            <h1 id="tl-title" className="v4-h2">
              The one verifiable record
            </h1>
            <p className="hub-opener">
              Three eras, one continuous version line. Every provable claim on this page is
              re-proven in CI against its public source — crates.io keeps yanked versions
              listed forever, GitHub keeps commits and releases. What cannot be proven is
              labeled, never dressed as proof. The future carries conditions, never dates.
            </p>
            <p className="hub-authority">
              Source of truth ·{' '}
              <a href="https://github.com/supernovae-st/nika-spec/blob/main/timeline/timeline.yaml">
                timeline/timeline.yaml
              </a>{' '}
              · verified by{' '}
              <a href="https://github.com/supernovae-st/nika-spec/blob/main/timeline/verify.py">
                verify.py
              </a>
            </p>
          </header>

          {TIMELINE.eras.map((era) => (
            <section className="hub-sec tl-era" id={era.id} key={era.id} aria-labelledby={`${era.id}-title`}>
              <h2 className="hub-sec-title" id={`${era.id}-title`}>
                {era.title}
              </h2>
              <p className="tl-span">{era.span}</p>
              <p className="hub-sec-note">{era.story}</p>
              {era.entries.length > 0 && (
                <ol className="tl-entries">
                  {era.entries.map((e, i) => (
                    <li className="tl-entry" key={i}>
                      <span className="tl-date">{e.precision === 'month' ? e.date.slice(0, 7) : e.date}</span>
                      <span className="tl-body">
                        <span className="tl-title">
                          {e.type === 'release' && e.version ? <code className="tl-ver">{e.version}</code> : null}
                          {e.title}
                        </span>
                        {e.detail ? <span className="tl-detail">{e.detail}</span> : null}
                      </span>
                      <Proof evidence={e.evidence} />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          <section className="hub-sec tl-gates" id="gates" aria-labelledby="gates-title">
            <h2 className="hub-sec-title" id="gates-title">
              What comes next — gates, never dates
            </h2>
            <p className="hub-sec-note">
              Forward motion is expressed as conditions that must hold. A gate flips when its
              conditions are true — and the timeline gains a dated, proven entry at that
              moment. No promised dates exist to slip.
            </p>
            <ol className="tl-entries tl-gate-list">
              {TIMELINE.gates.map((g) => (
                <li className="tl-entry tl-gate" key={g.id}>
                  <span className="tl-date tl-gate-mark">gate</span>
                  <span className="tl-body">
                    <span className="tl-title">{g.title}</span>
                    <ul className="tl-conditions">
                      {g.conditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                    {g.note ? <span className="tl-detail">{g.note}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </main>
  )
}
