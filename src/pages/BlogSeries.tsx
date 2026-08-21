import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { BLOG_POSTS, BLOG_SERIES } from '../content/blog.generated'
import type { BlogPostCopy } from '../content/blog-bodies.generated'
import { SITE, routeHead } from '../content'
import { Island } from '../lib/ssg-island'
import { useBlogCopy } from '../lib/use-blog-copy'
import { isRetrospective, storyDateLabel } from '../lib/blog-dates'
import '../sections/v4-home.css'
import './blog-page.css'
import './tools-page.css'
import './tool-detail.css'

/* ─── /blog/series/:id · one reading path, one page (theme-dark) ──────────────
   A series is a claim with an ORDER — the journal's reading paths were
   citable only as rails on the posts themselves. One page per series:
   the claim, the stops in reading order, every post at its stop. The
   posts' own series rail keeps its job. Unknown ids get the honest miss. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { id: rawId } = useParams()
  const id = (rawId ?? '').toLowerCase()
  const hit = BLOG_SERIES[id]
  const members = useMemo(() => BLOG_POSTS.filter((p) => p.series === id), [id])
  const { payload: copyPayload, copy } = useBlogCopy(
    `blog-series-copy-${id}`,
    members.map((post) => post.slug),
  )

  /* the stops carry the reading order; each post names its stop */
  type RichPost = (typeof BLOG_POSTS)[number] & BlogPostCopy
  const legs = useMemo(() => {
    if (!hit) return []
    return hit.stops
      .map((stop) => {
        const post = members.find((p) => p.seriesStop === stop)
        return { stop, post: post && copy[post.slug] ? { ...post, ...copy[post.slug] } : undefined }
      })
      .filter((l): l is { stop: string; post: RichPost } => Boolean(l.post))
  }, [copy, hit, members])

  const totalMinutes = legs.reduce((total, leg) => total + leg.post.readingMin, 0)
  const receiptCount = new Set(legs.flatMap((leg) => leg.post.receipts ?? [])).size
  const firstStop = legs[0]?.stop ?? 'start'
  const lastStop = legs[legs.length - 1]?.stop ?? 'finish'
  const seriesLede =
    id === 'origin-ledger'
      ? 'Start with the objection. End with the name. Each record changes what the next one can honestly claim.'
      : 'Follow the records in order. Each one stands alone; together they complete the argument.'

  const title = hit ? `${hit.title} · a reading path · Nika` : 'Not a reading path · Nika'
  const description = hit
    ? `${hit.claim}. ${legs.length} ${legs.length === 1 ? 'stop' : 'stops'}, in reading order: a path through the journal.`
    : `${id} is not a reading path the journal keeps.`

  useHead({
    title,
    link: routeHead(`/blog/series/${id}`).link,
    meta: [
      ...routeHead(`/blog/series/${id}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-blog.png' },
      { property: 'og:image:alt', content: 'The Nika journal: essays on intent as code.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: hit
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              '@id': `${SITE}/blog/series/${id}`,
              name: hit.title,
              description: hit.claim,
              itemListOrder: 'https://schema.org/ItemListOrderAscending',
              itemListElement: legs.map((l, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: l.post.title,
                url: `${SITE}/blog/${l.post.slug}`,
              })),
            }),
            processTemplateParams: false,
          },
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page blog-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="bs-title" className="v4sec v4-in" data-series={hit ? id : undefined}>
        <div className="v4sec-wrap">
          <Island id={`blog-series-copy-${id}`} payload={copyPayload} />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/blog" className="td-crumb-link">
              ← the journal
            </Link>
            {hit && (
              <span className="tp-cat">
                {legs.length} {legs.length === 1 ? 'stop' : 'stops'} · in reading order
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the journal · a reading path
          </p>
          <h1
            id="bs-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.title : id}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{id}</p>
              <p>
                is not a reading path the journal keeps. The paths:{' '}
                {Object.entries(BLOG_SERIES).map(([sid, s], i) => (
                  <span key={sid}>
                    {i > 0 && ' · '}
                    <Link to={`/blog/series/${sid}`}>{s.title}</Link>
                  </span>
                ))}
                . Or walk <Link to="/blog">the whole journal</Link>.
              </p>
            </div>
          )}

          {hit && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                <b>{hit.claim}.</b> {seriesLede}
              </p>

              <StampStrip
                items={[
                  { n: legs.length, label: legs.length === 1 ? 'stop' : 'stops', sub: 'in reading order' },
                  { n: totalMinutes, label: 'minutes end to end', sub: 'the complete path' },
                  receiptCount > 0
                    ? { n: receiptCount, label: receiptCount === 1 ? 'source commit' : 'source commits', sub: 'cited across the path' }
                    : { n: BLOG_POSTS.length, label: 'posts in the journal', sub: 'the wider record' },
                  { n: `${firstStop} → ${lastStop}`, label: 'the arc', sub: 'from first record to last' },
                ]}
              />

              <div className="bs-register-head mono" aria-hidden data-rise>
                <span>sequence</span>
                <span>the record</span>
                <span>evidence</span>
              </div>
              <ol className="bs-ledger" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                {legs.map((l, i) => (
                  <li key={l.post.slug} className="bs-ledger-row">
                    <Link to={`/blog/${l.post.slug}`} viewTransition className="bs-ledger-link">
                      <span className="bs-ledger-sequence mono" aria-hidden>
                        <span className="bs-ledger-node" />
                        <span className="bs-ledger-number">{String(i + 1).padStart(2, '0')}</span>
                        <span className="bs-ledger-stop">{l.stop}</span>
                      </span>
                      <span className="bs-ledger-record">
                        <span className="bs-ledger-meta mono">
                          <time dateTime={l.post.date}>{storyDateLabel(l.post)}</time>
                          {isRetrospective(l.post) && <span>retrospective</span>}
                        </span>
                        <span className="bs-ledger-title">{l.post.title}</span>
                        <span className="bs-ledger-teaser">{l.post.description}</span>
                      </span>
                      <span className="bs-ledger-evidence mono">
                        <span>
                          {l.post.receipts?.length
                            ? `${l.post.receipts.length} ${l.post.receipts.length === 1 ? 'receipt' : 'receipts'}`
                            : 'recollection'}
                        </span>
                        <span>{l.post.readingMin} min</span>
                        <span className="bs-ledger-open" aria-hidden>
                          read →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              <p className="tp-foot" data-rise>
                <Link to="/blog">The whole journal →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
