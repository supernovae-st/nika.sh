import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { articleLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { BlogBody } from '../lib/blog-render'
import type { BlogToken } from '../content/blog.generated'
import { Island } from '../lib/ssg-island'
import { islandJson } from '../lib/island-json'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrAdrs, loadAdrs } from '../lib/adrs-access'
import { ssrAdrTokens, loadAdrTokens } from '../lib/adr-bodies-access'
import type { Adr } from '../content/adrs.generated'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './blog-post.css'
import './tool-detail.css'

/* ─── /city/decisions/:id · one decision, whole ──────────────────────────────
   509 cross-reference edges run between these decisions and none of them had
   an address: the register could say « ADR-037 cites six others » and a
   reader had nowhere to click. This is the same case the specification was
   exploded for: you cite the chapter, not the document.

   The prose renders through the site's own token renderer (BlogBody), so a
   yaml fence inside a decision draws as the product's editor panel and no
   HTML is ever injected. */

const ENGINE_REPO = 'https://github.com/supernovae-st/nika/blob/main/docs/adr'

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const { pathname } = useLocation()
  const id = (pathname.split('/')[3] ?? '').toUpperCase()

  /* the record rides its island (register-diet) · the row carries the title,
     the status and the edges the room prints around the prose */
  const recPayload = useIslandPayload(
    `adr-rec-${id}`,
    (() => {
      const m = ssrAdrs()
      return m ? JSON.stringify({ row: m.adrs.find((a) => a.id === id) ?? null, pin: m.pin }) : null
    })(),
    async () => {
      const m = await loadAdrs()
      return JSON.stringify({ row: m.adrs.find((a) => a.id === id) ?? null, pin: m.pin })
    },
  )
  const rec = useMemo(
    () =>
      recPayload
        ? (JSON.parse(recPayload) as { row: Adr | null; pin: { release_tag: string } })
        : null,
    [recPayload],
  )
  const adr = rec?.row ?? undefined

  const payload = useIslandPayload(
    `adr-${id}`,
    (() => {
      const all = ssrAdrTokens()
      /* islandJson, not JSON.stringify: a decision record is full of regex,
         shell and `$&`-shaped strings, and the SSG assembly interprets those
         as replacement patterns (the chapter incident, one corpus later) */
      return all ? islandJson(all[id] ?? []) : null
    })(),
    async () => islandJson((await loadAdrTokens())[id] ?? []),
  )
  const tokens = useMemo<BlogToken[]>(
    () => (payload ? (JSON.parse(payload) as BlogToken[]) : []),
    [payload],
  )

  const known = Boolean(adr?.room)
  const title = known ? `${adr?.id} · ${adr?.title} · Nika` : `${id} · Not a decision room · Nika`
  const description = known
    ? `${adr?.title}. An architecture decision behind the Nika engine, ${adr?.status} on ${adr?.date}, read whole at the release pin.`
    : `${id} names no decision with a room. The register lists all of them.`

  useHead({
    title,
    link: routeHead(`/city/decisions/${id.toLowerCase()}`).link,
    meta: [
      ...routeHead(`/city/decisions/${id.toLowerCase()}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-city.png' },
      { property: 'og:image:alt', content: 'The Nika city: which repo ships each piece of the ecosystem, and at which pin this site read it.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-city.png' },
    ],
    script: known
      ? [
          ldScript([
            crumbLd([
              { name: 'The city', path: '/city' },
              { name: 'The decisions', path: '/city/decisions' },
              { name: adr?.id ?? id },
            ]),
            articleLd({
              path: `/city/decisions/${id.toLowerCase()}`,
              name: `${adr?.id} · ${adr?.title}`,
              description,
              partOfName: 'The Nika engine architecture decision record',
              partOfPath: '/city/decisions',
            }),
          ]),
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="adr-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id={`adr-rec-${id}`} payload={recPayload ?? ''} />
          <Island id={`adr-${id}`} payload={payload ?? ''} />

          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/city/decisions" className="td-crumb-link">
              ← the decisions
            </Link>
            {adr && (
              <span className="tp-cat">
                {adr.status} · {adr.date}
              </span>
            )}
          </nav>

          {!known ? (
            <>
              <h1 id="adr-title" className="v4sec-title" data-rise>
                Not a decision room.
              </h1>
              <p className="v4sec-lede" data-rise>
                <code>{id}</code>{' '}
                {adr
                  ? 'is a proposal, not a settled decision. It keeps its row in the register and lives in the repo until it is decided.'
                  : 'names no decision the record carries.'}{' '}
                <Link to="/city/decisions">The register</Link> lists every one, with its status.
              </p>
            </>
          ) : (
            <>
              <p className="v4sec-fig" data-rise>
                {adr?.id}
              </p>
              <h1
                id="adr-title"
                className="v4sec-title"
                data-rise
                style={{ ['--rise-delay' as string]: '60ms' }}
              >
                {adr?.title}
              </h1>
              <p className="wf-pin mono" data-rise>
                {adr?.status} · {adr?.date}
                {adr?.layers.length ? ` · ${adr.layers.join(' ')}` : ''}
                {adr?.cites ? ` · cites ${adr.cites}` : ''}
              </p>

              {(adr?.supersedes.length || adr?.superseded_by.length) && (
                <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '100ms' }}>
                  {adr.superseded_by.length > 0 && (
                    <>
                      Superseded by{' '}
                      {adr.superseded_by.map((x, i) => (
                        <span key={x}>
                          {i > 0 && ', '}
                          <Link to={`/city/decisions/${x.toLowerCase()}`}>{x}</Link>
                        </span>
                      ))}
                      . This decision is kept because its successor cites it.{' '}
                    </>
                  )}
                  {adr.supersedes.length > 0 && (
                    <>
                      Supersedes{' '}
                      {adr.supersedes.map((x, i) => (
                        <span key={x}>
                          {i > 0 && ', '}
                          <Link to={`/city/decisions/${x.toLowerCase()}`}>{x}</Link>
                        </span>
                      ))}
                      .
                    </>
                  )}
                </p>
              )}

              <div className="bp-body" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
                {tokens.length > 0 ? <BlogBody tokens={tokens} /> : <p>Loading the decision…</p>}
              </div>

              <p className="wf-pin mono" data-rise>
                read at {rec?.pin.release_tag} · the decision record ships with the engine
              </p>

              <div className="v4doclinks" data-rise>
                <Link to="/city/decisions" className="v4doclink">
                  Every decision, with its status
                  <span aria-hidden className="v4doclink-arrow"> →</span>
                </Link>
                <a className="v4doclink" href={`${ENGINE_REPO}/${adr?.file ?? ''}`}>
                  This one in the repo
                  <span aria-hidden className="v4doclink-arrow"> →</span>
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
