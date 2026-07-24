import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrShowcaseYaml, loadShowcaseYaml } from '../sections/showcase-yaml-access'
import { buildLibrary, verbsOf, BROWSE_SLUGS } from '../flagships/library'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './providers-page.css'

/* ─── /library · the workflow shelf (theme-dark) ──────────────────────────────
   The hero's picking corpus as a register of its own: ten real files —
   seven with recorded traces, three browse-only from the spec pack — each
   linking its room (/library/:id). The honesty contract renders per row.
   The browse yamls ride the showcase island (register-diet law). */

const browseSubset = (all: Record<string, string>): Record<string, string> =>
  Object.fromEntries(BROWSE_SLUGS.map((s) => [s, all[s] ?? '']).filter(([, y]) => y))

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const ssrDict = ssrShowcaseYaml()
  const browseJson = useIslandPayload(
    'lib-index',
    ssrDict && JSON.stringify(browseSubset(ssrDict)),
    async () => JSON.stringify(browseSubset(await loadShowcaseYaml())),
  )
  const library = useMemo(
    () => buildLibrary(browseJson ? (JSON.parse(browseJson) as Record<string, string>) : {}),
    [browseJson],
  )
  const recordedCount = library.filter((x) => x.flagship).length

  const title = 'The library · real workflow files, recorded runs · Nika'
  const description = `The files the home page picks from: ${library.length} real workflows — ${recordedCount} with recorded traces the site replays honestly, the rest straight from the spec pack to read and run.`

  useHead({
    title,
    link: routeHead('/library').link,
    meta: [
      ...routeHead('/library').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-library.png' },
      {
        property: 'og:image:alt',
        content: 'The Nika library: real files, recorded runs, the honesty contract.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${SITE}/library`,
          name: 'The Nika workflow library',
          description,
        }),
        processTemplateParams: false,
      },
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="lb-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id="lib-index" payload={browseJson ?? ''} />

          <p className="v4sec-fig" data-rise>
            the workflow library
          </p>
          <h1 id="lb-title" className="v4sec-title tp-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            The shelf.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            The files the <Link to="/">home page</Link> picks from — every one real, every claim
            honest: a file with a recorded trace replays from the record; a browse-only file is
            shown to read, with <code>nika run</code> as the affordance. Each owns a room.
          </p>

          <StampStrip
            items={[
              { n: library.length, label: 'files', sub: 'one room each' },
              { n: recordedCount, label: 'recorded', sub: 'real traces, replayed' },
              { n: library.length - recordedCount, label: 'browse-only', sub: 'read, then run yourself' },
              { n: 4, label: 'verbs at most', sub: 'the whole grammar' },
            ]}
          />

          <ol className="tp-list" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            {library.map((item) => (
              <li key={item.id} className="tp-row" id={item.id}>
                <div className="tp-row-head" style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                  <Link className="pv-id" to={`/library/${item.id}`} title="open the file's room">
                    {item.filename}
                  </Link>
                  <span className="tp-cat">
                    {item.flagship ? 'recorded' : 'browse-only'} ·{' '}
                    {verbsOf(item.plan).join(' · ') || 'loading'}
                  </span>
                </div>
                <p className="pv-desc">{item.blurb}.</p>
              </li>
            ))}
          </ol>

          <p className="tp-foot" data-rise>
            The wider gallery lives in <Link to="/use-cases">the showcase</Link> — every entry
            conformance-gated upstream. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
