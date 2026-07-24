import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { BLOG_POSTS } from '../content/blog.generated'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './blog-page.css'
import './tools-page.css'
import './tool-detail.css'

/* ─── /blog/tags/:tag · one register per journal tag (theme-dark) ─────────────
   The journal's tags were citable facets with no page (the 2026-07-24
   projection audit): the ?tag= filter on /blog is a great lens but a
   query string is not a citable surface. One room per tag — the shelf,
   filtered, prerendered (BLOG_TAG_PATHS) — and the filter keeps its job
   for browsing. Slugs are lowercase; the display tag keeps its case.
   Unknown tags get the honest miss. */

/* the tag registry · derived from the posts (a pipe-tagged post counts in
   every register it names) — the same derivation Blog.tsx uses */
const TAGS = [...new Set(BLOG_POSTS.flatMap((p) => p.tag.split('|').map((t) => t.trim())))]
const bySlug = Object.fromEntries(TAGS.map((t) => [t.toLowerCase(), t]))

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { tag: rawTag } = useParams()
  const slug = (rawTag ?? '').toLowerCase()
  const tag = bySlug[slug]
  const posts = useMemo(
    () => (tag ? BLOG_POSTS.filter((p) => p.tag.split('|').map((t) => t.trim()).includes(tag)) : []),
    [tag],
  )

  const title = tag ? `${tag} · the journal, by tag · Nika` : 'Not a journal tag · Nika'
  const description = tag
    ? `Every journal post filed under ${tag} — ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}, newest first. The whole journal lives at /blog.`
    : `${slug} is not a tag the journal uses.`

  useHead({
    title,
    link: routeHead(`/blog/tags/${slug}`).link,
    meta: [
      ...routeHead(`/blog/tags/${slug}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-blog.png' },
      { property: 'og:image:alt', content: 'The Nika journal: essays on intent as code.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: tag
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              '@id': `${SITE}/blog/tags/${slug}`,
              name: `${tag} · the Nika journal`,
              description,
              isPartOf: { '@type': 'Blog', '@id': `${SITE}/blog` },
            }),
            processTemplateParams: false,
          },
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page blog-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="bt-title" className="v4sec v4-in" data-tag={tag}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/blog" className="td-crumb-link">
              ← the journal
            </Link>
            {tag && <span className="tp-cat">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the journal · by tag
          </p>
          <h1
            id="bt-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {tag ?? slug}
          </h1>

          {!tag && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{slug}</p>
              <p>
                is not a tag the journal uses. The registers:{' '}
                {TAGS.map((t, i) => (
                  <span key={t}>
                    {i > 0 && ' · '}
                    <Link to={`/blog/tags/${t.toLowerCase()}`}>{t}</Link>
                  </span>
                ))}
                . Or walk <Link to="/blog">the whole journal</Link>.
              </p>
            </div>
          )}

          {tag && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                Every post filed under <b>{tag}</b>, newest first — one register of{' '}
                {TAGS.length} the journal keeps. The shelf lens on{' '}
                <Link to={`/blog?tag=${encodeURIComponent(tag)}`}>the journal</Link> filters the
                same set in place.
              </p>

              <StampStrip
                items={[
                  { n: posts.length, label: posts.length === 1 ? 'post' : 'posts', sub: 'in this register' },
                  { n: TAGS.length, label: 'tags', sub: 'the journal keeps' },
                  { n: BLOG_POSTS.length, label: 'posts in the journal', sub: 'all registers together' },
                  { n: posts[0]?.date ?? '—', label: 'latest', sub: 'newest first below' },
                ]}
              />

              <div className="blog-shelf" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                {posts.map((p, i) => (
                  <Link key={p.slug} to={`/blog/${p.slug}`} viewTransition className="blog-card">
                    <span className="blog-card-fig mono">{String(posts.length - i).padStart(2, '0')}</span>
                    <span className="blog-card-title">{p.title}</span>
                    <span className="blog-card-teaser">{p.description}</span>
                    <span className="blog-card-foot mono">
                      {p.date} · {p.readingMin} min
                      <span className="blog-card-arrow acue acue--r" aria-hidden>
                        →
                      </span>
                    </span>
                  </Link>
                ))}
              </div>

              <p className="tp-foot" data-rise>
                The other registers:{' '}
                {TAGS.filter((t) => t !== tag).map((t, i) => (
                  <span key={t}>
                    {i > 0 && ' · '}
                    <Link to={`/blog/tags/${t.toLowerCase()}`}>{t}</Link>
                  </span>
                ))}
                . <Link to="/blog">The whole journal →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
