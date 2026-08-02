import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { StampStrip } from '../components/StampStrip'
import { TermCapture } from '../components/TermCapture'
import { ROUTER, ROUTER_BEATS, ROUTE_HIT, ROUTE_UNSURE, ROUTE_LIMIT } from '../content/how-router'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'

/* ─── /how/router · the intent router, told ──────────────────────────────────
   Typing plain words at `nika new` and getting a real workflow back is the
   most magical thing the binary does, and the site explained it nowhere.
   This page is the explanation, and it is deliberately unmagical: a closed
   lexicon, a classical ranking function with published constants, a floor,
   and a refusal when the floor is not cleared.

   The page ends on the limit rather than the feature, because the limit is
   real and a reader hits it in their second sentence if they write French. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const title = 'The router · How Nika works · Nika'
  const description =
    'How `nika new "plain words"` finds a workflow: a deterministic contract, BM25 over the 49 workflows compiled into the binary, a floor, and an honest refusal. No model, no network, no index to download.'
  useHead({
    title,
    link: routeHead('/how/router').link,
    meta: [
      ...routeHead('/how/router').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="rt-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/how" className="td-crumb-link">
              ← how Nika works
            </Link>
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the router
          </p>
          <h1 id="rt-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            You describe the job. It finds the file.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            <code>nika new</code> takes plain words and hands back a real workflow. There is no
            model behind it, no network call, and no index to download: the answer is ranked
            against the {ROUTER.docs} workflows compiled into the binary you installed, by a
            function whose constants are published below. When it is not sure, it says so.
          </p>

          <StampStrip
            items={[
              { n: ROUTER.docs, label: 'workflows ranked', sub: 'compiled in' },
              { n: ROUTER.jobs, label: 'real jobs', sub: 'the answers' },
              { n: ROUTER.skeletons, label: 'skeletons', sub: 'the drafts' },
              { n: ROUTER.stopwords, label: 'stopwords', sub: 'ours included' },
            ]}
          />

          {/* the arc · five beats, the register grammar */}
          <ol className="how-beats" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {ROUTER_BEATS.map((b) => (
              <li className="how-beat" key={b.n} id={`beat-${b.n}`}>
                <div className="how-beat-head">
                  <span className="how-beat-n">{b.n}</span>
                  <h2 className="how-beat-title">{b.title}</h2>
                </div>
                <p className="how-beat-plain">{b.plain}</p>
                <p className="how-beat-detail">{b.detail}</p>
              </li>
            ))}
          </ol>

          {/* the two answers, both real */}
          <div className="how-pair" data-rise>
            <div>
              <h2 className="how-h2">When it is sure</h2>
              <p className="how-body">
                The file lands beside you and the next command is named. A skeleton arrives as a
                draft with its slots to fill; a real job arrives whole, with its fixtures.
              </p>
              <TermCapture
                title="a confident route"
                lines={ROUTE_HIT}
                command='nika new "summarize a csv every monday" x.nika.yaml'
              />
            </div>
            <div>
              <h2 className="how-h2">When it is not</h2>
              <p className="how-body">
                Nothing is written. You get the closest candidates with their own descriptions,
                and the shortest way to get unstuck: name one, or say more.
              </p>
              <TermCapture
                title="an honest refusal"
                lines={ROUTE_UNSURE}
                command='nika new "make it good" out.nika.yaml'
              />
            </div>
          </div>

          {/* the limit · published, not buried */}
          <div className="how-limit" data-rise>
            <h2 className="how-h2">The limit, said out loud</h2>
            <p className="how-body">
              Plain-word routing is an English-first door today. The same job described in French
              does not route:
            </p>
            <p className="how-limit-probe">
              <span className="how-limit-key">does not route</span>
              <span>{ROUTE_LIMIT.probe}</span>
            </p>
            <p className="how-limit-probe">
              <span className="how-limit-key how-limit-key--ok">routes</span>
              <span>{ROUTE_LIMIT.control}</span>
            </p>
            <p className="how-body">{ROUTE_LIMIT.says}</p>
          </div>

          <div className="v4doclinks" data-rise>
            <Link to="/how" className="v4doclink">
              The whole loop
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <Link to="/use-cases" className="v4doclink">
              What it ranks against
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
