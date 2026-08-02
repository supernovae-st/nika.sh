import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, SITE } from '../content'
import { StampStrip } from '../components/StampStrip'
import type { Adr } from '../content/adrs.generated'
import { ssrAdrs, loadAdrs } from '../lib/adrs-access'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { crumbLd, ldScript } from '../lib/ld'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './tool-detail.css'

/* ─── /city/decisions · the engine's architecture record ─────────────────────
   The 71 ADRs were vendored at the engine pin, digest-verified, and read by
   nobody: 44KB rode every deploy as dead payload behind an estate evidence
   string naming a consumer that did not exist. This page is the consumer.

   It is a REGISTER, not 71 rooms. The bodies are not vendored (573KB, median
   876 words each), so shipping rooms means a second vendoring lane and a
   policy call on the 12 decisions that are still `proposed` — publishing a
   proposal as an indexed room invites citation of a non-decision. The
   register carries every one of them with its status stated, which is the
   honest half we can ship today.

   Every count here derives from the record. Nothing is typed. */

const STATUS_ORDER = ['accepted', 'proposed', 'superseded', 'rejected']
const STATUS_GLOSS: Record<string, string> = {
  accepted: 'the decision holds · the engine is built this way',
  proposed: 'written, not settled · cite it as a proposal, never as canon',
  superseded: 'another decision replaced it · the chain is named on the row',
  rejected: 'considered and refused · the record keeps the reason',
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  /* the record rides a byte island (the register-diet law): 25KB of decisions
     in the entry bundle cost 6.6KB gz and left 200 bytes under the budget */
  const payload = useIslandPayload(
    'city-decisions',
    (() => {
      const m = ssrAdrs()
      return m ? JSON.stringify(m) : null
    })(),
    async () => JSON.stringify(await loadAdrs()),
  )
  const rec = useMemo(
    () =>
      payload
        ? (JSON.parse(payload) as {
            adrs: Adr[]
            pin: { release_tag: string; commit: string }
            counts: Record<string, number>
          })
        : null,
    [payload],
  )
  const ADRS = rec?.adrs ?? []
  const ADRS_PIN = rec?.pin ?? { release_tag: '', commit: '' }
  const ADR_STATUS_COUNTS = rec?.counts ?? {}
  const title = 'The decisions · The city · Nika'
  const description = `The ${ADRS.length} architecture decisions behind the Nika engine, read at ${ADRS_PIN.release_tag}: what was decided, when, which layers it binds, and which decisions cite it.`

  useHead({
    title,
    link: routeHead('/city/decisions').link,
    meta: [
      ...routeHead('/city/decisions').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [
      ldScript([
        crumbLd([{ name: 'The city', path: '/city' }, { name: 'The decisions' }]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${SITE}/city/decisions`,
          name: 'The Nika engine architecture decision record',
          description,
          numberOfItems: ADRS.length,
        },
      ]),
    ],
  })

  const superseded = ADRS.filter((a) => a.superseded_by.length > 0).length
  const cited = ADRS.filter((a) => a.cites > 0).length

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="dec-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id="city-decisions" payload={payload ?? ''} />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/city" className="td-crumb-link">
              ← the city
            </Link>
            <span className="tp-cat">read at {ADRS_PIN.release_tag}</span>
          </nav>

          <p className="v4sec-fig" data-rise>
            the decisions
          </p>
          <h1
            id="dec-title"
            className="v4sec-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Why the engine is built this way.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Every architectural choice in the engine is written down before it is built, kept in
            the repo beside the code it binds, and never quietly rewritten: a decision that stops
            holding is superseded by a named successor, and both stay. This is that record, read
            at the release pin, {ADRS.length} decisions deep.
          </p>

          <StampStrip
            items={[
              { n: ADRS.length, label: 'decisions', sub: `at ${ADRS_PIN.release_tag}` },
              {
                n: ADR_STATUS_COUNTS.accepted ?? 0,
                label: 'accepted',
                sub: 'the engine is built this way',
              },
              { n: cited, label: 'cite another', sub: 'the record is a graph' },
              { n: superseded, label: 'superseded', sub: 'replaced, never deleted' },
            ]}
          />

          {STATUS_ORDER.filter((s) => ADRS.some((a) => a.status === s)).map((status) => {
            const rows = ADRS.filter((a) => a.status === status)
            return (
              <div className="how-subs" data-rise key={status} id={status}>
                <p className="how-fig mono">{status}</p>
                <h2 className="how-h1">
                  {rows.length} {rows.length === 1 ? 'decision' : 'decisions'}
                </h2>
                <p className="how-body">{STATUS_GLOSS[status]}</p>
                <ol className="td-args tp-args">
                  {rows.map((a) => (
                    <li className="tp-arg" key={a.id} style={{ listStyle: 'none' }}>
                      <span className="tp-arg-name">
                        {/* a settled decision is a door · a proposal is a row,
                            and saying so is the point of the distinction */}
                        {a.room ? (
                          <Link to={`/city/decisions/${a.id.toLowerCase()}`}>{a.id}</Link>
                        ) : (
                          a.id
                        )}
                      </span>
                      <span className="tp-arg-desc">
                        {a.title}
                        <br />
                        <span className="mono">
                          {a.date}
                          {a.layers.length > 0 ? ` · ${a.layers.join(' ')}` : ''}
                          {a.cites > 0
                            ? ` · cites ${a.cites} ${a.cites === 1 ? 'other' : 'others'}`
                            : ''}
                          {a.superseded_by.length > 0
                            ? ` · superseded by ${a.superseded_by.join(', ')}`
                            : ''}
                          {a.supersedes.length > 0 ? ` · supersedes ${a.supersedes.join(', ')}` : ''}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}

          <div className="how-subs" data-rise>
            <p className="how-fig mono">read them whole</p>
            <h2 className="how-h1">The bodies live in the engine repo</h2>
            <p className="how-body">
              The {ADRS.length - ADRS.filter((a) => a.room).length} proposals above have no room
              of their own on purpose: a proposal published as an indexed page invites citation as
              though it were settled. They live in the repo until they are decided. The machine
              surfaces are served beside this one: <a href="/engine/adr/index.json">index.json</a>{' '}
              carries every cross-reference edge, verbatim at the pin, and{' '}
              <a href="/engine/adr/bodies.json">bodies.json</a> carries the settled decisions
              whole, lexed at the pin with each one's sha256 beside it.
            </p>
            <div className="v4doclinks">
              <a
                className="v4doclink"
                href="https://github.com/supernovae-st/nika/tree/main/docs/adr"
              >
                The decision record, in the repo
                <span aria-hidden className="v4doclink-arrow"> →</span>
              </a>
              <Link to="/city" className="v4doclink">
                Where every piece lives
                <span aria-hidden className="v4doclink-arrow"> →</span>
              </Link>
              <Link to="/changelog" className="v4doclink">
                What shipped, and when
                <span aria-hidden className="v4doclink-arrow"> →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
