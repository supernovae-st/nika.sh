import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { StampStrip } from '../components/StampStrip'
import { LESSONS, LESSONS_PIN } from '../content/lessons.generated'
import { TEMPLATES } from '../content/templates.generated'
import { UC_TABS } from '../sections/usecases-data'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './workflows-page.css'
import { collectionLd, ldScript } from '../lib/ld'

/* ─── /workflows · the corpus world (monde 5 of the target sitemap) ───────────
   « The path that teaches, the jobs that prove, the skeletons that start. »
   Three shelves, one world, born 2026-08-02:

     path      the 13 numbered examples, in order · each adds ONE idea to the
               one before it. They were invisible on this site until now: the
               spec shipped them, /use-cases carried only the real jobs.
     jobs      the 26 whole workflows that pass the conformance gate
     skeletons the 10 instantiable starters `nika new` can hand you

   The three counts derive from three different sources at two different
   clocks, so none of them is typed here. */

/* the job count DERIVES from the tab registry (the same source /use-cases
   renders), never typed: a new showcase must move this number by itself */
const JOBS = new Set(UC_TABS.flatMap((tab) => tab.cases.map((c) => c.slug))).size

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const title = 'Workflows · Nika'
  const description =
    'The Nika corpus: the teaching path (13 numbered steps, each adding one idea), the real jobs that pass the conformance gate, and the skeletons a single command hands you.'
  useHead({
    title,
    link: routeHead('/workflows').link,
    script: [
      ldScript([
        collectionLd({
          path: '/workflows',
          name: 'The Nika workflow corpus',
          description,
          total: LESSONS.length + JOBS + TEMPLATES.length,
          members: [
            { name: 'The teaching path', path: '/workflows' },
            { name: 'Real jobs', path: '/workflows/jobs' },
            { name: 'Skeletons', path: '/workflows/skeletons' },
          ],
        }),
      ]),
    ],
    meta: [
      ...routeHead('/workflows').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-workflows.png' },
      { property: 'og:image:alt', content: 'The Nika corpus: the path that teaches, the jobs that prove, the skeletons that start yours.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-workflows.png' },
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="wf-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the corpus
          </p>
          <h1 id="wf-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Every workflow we ship, and why each one exists.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Three shelves. A <b>path</b> that teaches the language one idea at a time, the real{' '}
            <b>jobs</b> that prove it on work worth doing, and the <b>skeletons</b> a single
            command hands you. Every file here is spec-correct by construction: they are the
            same files the conformance gate runs on, read at the pin, never retyped.
          </p>

          <StampStrip
            items={[
              { n: LESSONS.length, label: 'teaching steps', sub: 'in order' },
              { n: JOBS, label: 'real jobs', sub: 'gate-passing' },
              { n: TEMPLATES.length, label: 'skeletons', sub: 'one command away' },
            ]}
          />

          {/* THE PATH · the shelf that was invisible until this world existed */}
          <div className="how-subs" data-rise id="path">
            <p className="how-fig mono">the path</p>
            <h2 className="how-h1">Thirteen steps, in order</h2>
            <p className="how-body">
              Each step adds exactly one idea to the step before it, and running them in order
              is how the language teaches itself. Start at the smallest complete workflow there
              is and end at the paths a run takes when it breaks.
            </p>
            <ol className="wf-path">
              {LESSONS.map((l) => (
                <li key={l.slug}>
                  <Link to={`/workflows/path/${l.slug}`} className="wf-step">
                    <span className="wf-step-n">{String(l.step).padStart(2, '0')}</span>
                    <span className="wf-step-copy">
                      <span className="wf-step-title">{l.headline ?? l.slug}</span>
                      <span className="wf-step-file mono">{l.file}</span>
                    </span>
                    <span className="how-sub-go" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="wf-pin mono">
              read at nika-spec@{LESSONS_PIN.spec_commit.slice(0, 9)} · every file carries its own
              sha256
            </p>
          </div>

          {/* the other two shelves · they keep their own pages */}
          <div className="how-subs" data-rise>
            <p className="how-fig mono">and</p>
            <h2 className="how-h1">The other two shelves</h2>
            <ul className="how-sub-rows">
              <li>
                <Link to="/workflows/jobs" className="how-sub-row">
                  <span className="how-sub-key">the jobs</span>
                  <span className="how-sub-copy">
                    <span className="how-sub-title">Real work, whole files.</span>
                    <span className="how-sub-body">
                      {JOBS} workflows that do a job someone actually has: a Monday
                      brief that assembles itself, a contract review where the contract never
                      leaves, a release train. Each one passes the spec conformance gate and
                      ships with its graph.
                    </span>
                  </span>
                  <span className="how-sub-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/workflows/skeletons" className="how-sub-row">
                  <span className="how-sub-key">the skeletons</span>
                  <span className="how-sub-copy">
                    <span className="how-sub-title">Start from a shape, not a blank file.</span>
                    <span className="how-sub-body">
                      {TEMPLATES.length} starters with their slots marked. Name one and{' '}
                      <code>nika new</code> writes it beside you; describe the job in plain words
                      and the router picks for you.
                    </span>
                  </span>
                  <span className="how-sub-go" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="v4doclinks" data-rise>
            <Link to="/how/router" className="v4doclink">
              How the router picks
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <Link to="/install" className="v4doclink">
              Install it and run one
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
