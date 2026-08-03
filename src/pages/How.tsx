import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { TermCapture } from '../components/TermCapture'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import type { LoopDoor } from '../content/learn-loop'
import { ssrLoopDoors, loadLoopDoors } from '../lib/learn-loop-access'
import { ROUTER } from '../content/how-router'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import { collectionLd, ldScript } from '../lib/ld'

/* ─── /how · the récit world (monde 2 of the target sitemap) ──────────────────
   « How Nika works: the doors, the router, the judge, the proof. » The
   target sitemap's second world, born 2026-08-02. It is the RÉCIT half of
   the site · /language is the reference half, and neither repeats the other.

   The loop moved here from /learn, where it was the eleventh chapter of a
   page about the FILE. The file walkthrough stays at /learn until /language
   can receive it (V3): killing it now to satisfy an ordering would have
   destroyed nine working chapters for nothing.

   The three lens-born hubs re-homed under /how by a descriptor flip on the
   same day: a hub RECOUNTS how a subsystem works, which is this world's
   definition. */

const LOOP_ISLAND_ID = 'how-loop-island'

const SUBSYSTEMS = [
  {
    to: '/how/router',
    key: 'the router',
    title: 'You describe the job. It finds the file.',
    body: `Plain words in, a real workflow out · ranked against the ${ROUTER.docs} workflows compiled into the binary, with published constants and an honest refusal. No model, no network.`,
  },
  {
    to: '/how/flow',
    key: 'the flow',
    title: 'Two doors, one graph.',
    body: 'How tasks link: with binds a value, after orders an effect. The engine reads those bindings and builds the run graph. Nothing else creates an edge.',
  },
  {
    to: '/how/boundary',
    key: 'the boundary',
    title: 'The blast radius, declared.',
    body: 'What a run may touch before it touches it: the permit families, the secret sources, and the floor that holds even when nothing is written down.',
  },
  {
    to: '/how/proof',
    key: 'the proof',
    title: 'Verifiable without trusting us.',
    body: 'The run graph, the receipt, the hash-chained journal. Everything a third party needs to check what happened, without taking our word for any of it.',
  },
]

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })

  const loopPayload = useIslandPayload(
    LOOP_ISLAND_ID,
    (() => {
      const d = ssrLoopDoors()
      return d ? JSON.stringify(d) : null
    })(),
    async () => JSON.stringify(await loadLoopDoors()),
  )
  const doors = useMemo<LoopDoor[]>(
    () => (loopPayload ? (JSON.parse(loopPayload) as LoopDoor[]) : []),
    [loopPayload],
  )

  const title = 'How Nika works · Nika'
  const description =
    'The loop the binary teaches: try, new, check, run, trace. Then the four subsystems underneath · the router that reads plain words, the graph that links tasks, the boundary that holds, the proof you can verify.'
  useHead({
    title,
    link: routeHead('/how').link,
    script: [
      ldScript([
        collectionLd({
          path: '/how',
          name: 'How Nika works',
          description,
          members: [
            { name: 'The router', path: '/how/router' },
            { name: 'The flow', path: '/how/flow' },
            { name: 'The boundary', path: '/how/boundary' },
            { name: 'The proof', path: '/how/proof' },
            { name: 'The MCP oracle', path: '/how/oracle' },
          ],
        }),
      ]),
    ],
    meta: [
      ...routeHead('/how').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-how.png' },
      { property: 'og:image:alt', content: 'How Nika works: the agent writes the file, the router routes it, the judge reads it back, the run leaves a trace.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-how.png' },
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="how-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            how it works
          </p>
          <h1 id="how-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Five commands, four subsystems, one file.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Nika is a loop you can hold in your head: see it work, make it yours, audit it, run
            it, read back what happened. Underneath sit four subsystems, and each one is
            explained here rather than assumed · how your words find a workflow, how tasks link,
            what a run may touch, and how anyone can verify what it did.
          </p>

          {/* THE LOOP · moved from /learn, where it was a chapter about a page
              about the file. It is the whole point of this world. */}
          <div className="how-loop" id="the-loop">
            <Island id={LOOP_ISLAND_ID} payload={loopPayload} />
            <p className="how-fig mono" data-rise>
              the loop
            </p>
            <h2 className="how-h1" data-rise>
              One arc, five doors
            </h2>
            <p className="how-body" data-rise>
              Captured from one real run, in one directory, in this order. Nothing below is
              illustrative: the cost warning is what an unpriced local model really earns, and
              the timing is what that machine really took.
            </p>
            <ol className="how-doors">
              {doors.map((d) => (
                <li className="how-door" key={d.verb} id={`door-${d.verb}`}>
                  <div className="how-door-copy">
                    <div className="how-beat-head">
                      <span className="how-beat-n">
                        {d.n} · nika {d.verb}
                      </span>
                      <h3 className="how-beat-title">{d.title}</h3>
                    </div>
                    <p className="how-beat-plain">{d.plain}</p>
                    <p className="how-door-proves">{d.proves}</p>
                  </div>
                  <div className="how-door-term">
                    <TermCapture title={`nika ${d.verb}`} lines={d.lines} command={d.command} />
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* the four subsystems · each its own room */}
          <div className="how-subs" data-rise>
            <p className="how-fig mono">underneath</p>
            <h2 className="how-h1">The four subsystems</h2>
            <ul className="how-sub-rows">
              {SUBSYSTEMS.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="how-sub-row">
                    <span className="how-sub-key">{s.key}</span>
                    <span className="how-sub-copy">
                      <span className="how-sub-title">{s.title}</span>
                      <span className="how-sub-body">{s.body}</span>
                    </span>
                    <span className="how-sub-go" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="v4doclinks" data-rise>
            <Link to="/learn" className="v4doclink">
              The file, line by line
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
            <Link to="/install" className="v4doclink">
              Install it
              <span aria-hidden className="v4doclink-arrow"> →</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
