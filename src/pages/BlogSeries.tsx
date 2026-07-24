import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { BLOG_POSTS, BLOG_SERIES } from '../content/blog.generated'
import { SITE, routeHead } from '../content'
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

  /* the stops carry the reading order; each post names its stop */
  const legs = useMemo(() => {
    if (!hit) return []
    const members = BLOG_POSTS.filter((p) => p.series === id)
    return hit.stops
      .map((stop) => ({ stop, post: members.find((p) => p.seriesStop === stop) }))
      .filter((l): l is { stop: string; post: (typeof members)[number] } => Boolean(l.post))
  }, [hit, id])

  const title = hit ? `${hit.title} · a reading path · Nika` : 'Not a reading path · Nika'
  const description = hit
    ? `${hit.claim}. ${legs.length} ${legs.length === 1 ? 'stop' : 'stops'}, in reading order — a path through the journal.`
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
                <b>{hit.claim}.</b> Read the stops in order — each one stands alone, together they
                make the argument. The posts carry the same rail on their own pages.
              </p>

              <StampStrip
                items={[
                  { n: legs.length, label: legs.length === 1 ? 'stop' : 'stops', sub: 'in reading order' },
                  { n: legs.reduce((n, l) => n + l.post.readingMin, 0), label: 'minutes end to end', sub: 'the whole path' },
                  { n: Object.keys(BLOG_SERIES).length, label: Object.keys(BLOG_SERIES).length === 1 ? 'path' : 'paths', sub: 'the journal keeps' },
                  { n: BLOG_POSTS.length, label: 'posts in the journal', sub: 'the wider shelf' },
                ]}
              />

              <div className="blog-shelf" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                {legs.map((l, i) => (
                  <Link key={l.post.slug} to={`/blog/${l.post.slug}`} viewTransition className="blog-card">
                    <span className="blog-card-fig mono">
                      {String(i + 1).padStart(2, '0')} · {l.stop}
                    </span>
                    <span className="blog-card-title">{l.post.title}</span>
                    <span className="blog-card-teaser">{l.post.description}</span>
                    <span className="blog-card-foot mono">
                      {l.post.date} · {l.post.readingMin} min
                      <span className="blog-card-arrow acue acue--r" aria-hidden>
                        →
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

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
