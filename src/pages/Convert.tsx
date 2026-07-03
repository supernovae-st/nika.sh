import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, REPO } from '../content'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './convert-page.css'

/* ─── /convert · the conversion funnel, as a full page ─────────────────────────
   The « send us a workflow » offer used to dump visitors straight into
   GitHub's issue chooser (account wall, register break mid-funnel). This page
   states the offer in the site's own register FIRST, then routes out. The
   offer is real: community-described tasks become runnable, credited
   .nika.yaml examples in the gallery.

   HONESTY: no form — there is no backend, and we don't pretend there is. The
   funnel is public, on the repo (an issue, or a discussion). No fabricated
   testimonials, no invented counts.

   SSR-safe: pure DOM; the reveal is the shared motion-safe data-rise. */

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: '01 · you describe',
    title: 'Tell us the task',
    body: 'One AI task you repeat — in ChatGPT, Claude, Cursor, Codex, or scripts. Plain words are enough: what goes in, what should come out, what it may touch.',
  },
  {
    n: '02 · we craft',
    title: 'We convert and check it clean',
    body: 'We write it as a runnable .nika.yaml — schema-true, audited before it runs (plan, cost, secrets), tested against the real engine.',
  },
  {
    n: '03 · it ships',
    title: 'It lands in the gallery, credited to you',
    body: 'The best conversions ship as public examples — your name on the file. Your ritual becomes something anyone can run.',
  },
]

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  useHead({
    title: 'Send us a workflow — Nika',
    link: routeHead('/convert').link,
    meta: [
      ...routeHead('/convert').meta,
      {
        name: 'description',
        content:
          'Describe one AI task you repeat — in ChatGPT, Claude, Cursor, Codex, or scripts. We convert the best ones into runnable .nika.yaml examples, credited to you.',
      },
      { property: 'og:title', content: 'Send us a workflow — Nika' },
      {
        property: 'og:description',
        content:
          'Your repeated AI task, converted into a runnable, credited .nika.yaml example.',
      },
      { name: 'twitter:title', content: 'Send us a workflow — Nika' },
      {
        name: 'twitter:description',
        content:
          'Your repeated AI task, converted into a runnable, credited .nika.yaml example.',
      },
    ],
  })

  return (
    <main className="theme-dark v4page">
      <section ref={ref} aria-labelledby="cv-title" className="v4sec">
        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            send a workflow · the offer
          </p>
          <h1
            id="cv-title"
            className="v4sec-title cv-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Send us a workflow.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Describe <b>one AI task you repeat</b> — in ChatGPT, Claude, Cursor, Codex, or
            scripts. We convert the best ones into runnable{' '}
            <code className="mono">.nika.yaml</code> examples, <b>credited to you</b>.
          </p>

          {/* what happens next · the three-step register */}
          <ol className="cv-steps" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            {STEPS.map((s) => (
              <li className="cv-step" key={s.n}>
                <p className="cv-step-n">{s.n}</p>
                <h2 className="cv-step-title">{s.title}</h2>
                <p className="cv-step-body">{s.body}</p>
              </li>
            ))}
          </ol>

          {/* the routing out · primary → the issue chooser · secondary → discussions */}
          <div className="cv-ctas" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
            <a
              href={`${REPO}/issues/new/choose`}
              target="_blank"
              rel="noreferrer"
              className="cv-cta"
            >
              Send a workflow
              <span aria-hidden className="cv-cta-arrow">
                →
              </span>
            </a>
            <a
              href={`${REPO}/discussions`}
              target="_blank"
              rel="noreferrer"
              className="cv-cta cv-cta--dim"
            >
              Or start a discussion
              <span aria-hidden className="cv-cta-arrow">
                →
              </span>
            </a>
          </div>

          {/* the honesty plate · why there is no form here */}
          <p className="cv-note" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
            no form here — the funnel is public, on the repo · a GitHub account is the only
            thing we ask for
          </p>
        </div>
      </section>
    </main>
  )
}
