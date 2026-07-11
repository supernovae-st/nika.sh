import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, REPO } from '../content'
import { BLOG_POSTS, BLOG_SERIES } from '../content/blog.generated'
import { BlogBody } from '../lib/blog-render'
import { Component as NotFound } from './NotFound'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './blog-post.css'

/* ─── /blog/<slug> · one post, one page ───────────────────────────────────────
   The reading surface for the markdown blog (content/blog/*.md — compiled at
   build time, prerendered per slug via PATHS). The register: the site's page
   chrome, a measured reading column, CodeFile panels for the yaml fences, and
   an honest foot — every post links its own source file on GitHub (the blog
   IS the folder; edits are PRs) plus the prev/next walk.

   Unknown slug (client-side nav only — bad paths are never prerendered):
   the crafted 404 register takes over. */

const CONTENT_DIR = 'https://github.com/supernovae-st/nika.sh/blob/main/content/blog'

export function Component() {
  const { slug } = useParams()
  const idx = BLOG_POSTS.findIndex((p) => p.slug === slug)
  const post = idx >= 0 ? BLOG_POSTS[idx] : null

  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  /* structured data · BlogPosting + the breadcrumb — honest fields only
     (real dates, the baked OG image, the org as author; no fabricated
     ratings/reviews). Prerendered into each post's static HTML. */
  const jsonld = post
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            '@id': `https://nika.sh/blog/${post.slug}#post`,
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            inLanguage: 'en',
            image: `https://nika.sh/og-blog-${post.slug}.png`,
            url: `https://nika.sh/blog/${post.slug}`,
            mainEntityOfPage: `https://nika.sh/blog/${post.slug}`,
            author: {
              '@type': 'Organization',
              name: 'SuperNovae Studio',
              url: 'https://supernovae.studio',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Nika',
              url: 'https://nika.sh',
              logo: { '@type': 'ImageObject', url: 'https://nika.sh/icon-512.png' },
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://nika.sh/blog' },
              { '@type': 'ListItem', position: 2, name: post.title, item: `https://nika.sh/blog/${post.slug}` },
            ],
          },
        ],
      }
    : null

  useHead(
    post
      ? {
          title: `${post.title} · Nika`,
          link: routeHead(`/blog/${post.slug}`).link,
          script: [
            {
              type: 'application/ld+json',
              innerHTML: JSON.stringify(jsonld),
              processTemplateParams: false,
            },
          ],
          meta: [
            ...routeHead(`/blog/${post.slug}`).meta,
            { name: 'description', content: post.description },
            { property: 'og:type', content: 'article' },
            { property: 'article:published_time', content: post.date },
            { property: 'og:title', content: `${post.title} · Nika` },
            { property: 'og:description', content: post.description },
            { property: 'og:image', content: `https://nika.sh/og-blog-${post.slug}.png` },
            { property: 'og:image:alt', content: `${post.title} · the Nika blog.` },
            { name: 'twitter:title', content: `${post.title} · Nika` },
            { name: 'twitter:description', content: post.description },
            { name: 'twitter:image', content: `https://nika.sh/og-blog-${post.slug}.png` },
          ],
        }
      : { title: '404 · Nika' },
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  /* center the lit station inside the strip's OWN scroller (phones: stations
     4-5 start off-screen right) — a scrollLeft write on the well, never the
     page (scrollIntoView would drag the viewport) */
  useEffect(() => {
    const line = document.querySelector<HTMLElement>('.bp-series-line')
    const here = line?.querySelector<HTMLElement>('.is-here')
    if (line && here) line.scrollLeft = here.offsetLeft - (line.clientWidth - here.offsetWidth) / 2
  }, [slug])

  if (!post) return <NotFound />
  const prev = BLOG_POSTS[idx + 1]
  const next = BLOG_POSTS[idx - 1]

  /* the reading path · when the post belongs to a series, the rail names the
     whole line in its EDITORIAL order (the registry's stops — a curriculum,
     not a changelog) with this station lit. Compiler gates guarantee the
     path is complete, so the lookups below cannot come up short. */
  const series = post.series ? BLOG_SERIES[post.series] : undefined
  const stations = series
    ? series.stops.map((stop) => ({
        stop,
        post: BLOG_POSTS.find((q) => q.series === post.series && q.seriesStop === stop)!,
      }))
    : []

  return (
    <main className="theme-dark v4page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts):
          on a one-section page the observer armed everything at hydration anyway;
          baking moves the arm to HTML time and the hero stops being a 4.7s LCP. */}
      <section ref={ref} aria-labelledby="bp-title" className="v4sec v4-in">
        <div className="v4sec-wrap bp-wrap">
          {/* the way back + the register row */}
          <nav className="bp-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/blog" viewTransition className="bp-crumb-link">
              <span className="bp-crumb-arrow" aria-hidden>
                ←
              </span>{' '}
              blog
            </Link>
          </nav>
          <p className="bp-fig mono" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            {post.tag} · <time dateTime={post.date}>{post.date}</time> · {post.readingMin} min
          </p>
          <h1 id="bp-title" className="v4sec-title bp-title">
            {post.title}
          </h1>
          {/* the title + lede + body do NOT ride the entrance — the reveal
              watchdog's 1.6s timer queues behind the bundle parse on a slow
              device (LH mobile: LCP 4.8s at 100% render delay, first on the
              body's lead paragraph, then on the freed title — the whole
              article hid behind the choreography). The crumb + fig still
              rise; the content people came for is just THERE. */}
          <p className="bp-lede">
            {post.description}
          </p>

          {series && (
            <nav className="bp-series" aria-label={`${series.title} reading path`}>
              <p className="bp-series-head mono">
                <span className="bp-series-name">{series.title}</span>
                <span className="bp-series-claim">{series.claim}</span>
                <span className="bp-series-count">
                  {stations.findIndex((st) => st.post.slug === post.slug) + 1}/{stations.length}
                </span>
              </p>
              <ol className="bp-series-line">
                {stations.map((st, i) => (
                  <li key={st.stop} className="bp-series-stop">
                    {st.post.slug === post.slug ? (
                      <span className="bp-series-tick is-here" aria-current="page">
                        <i className="mono" aria-hidden>{String(i + 1).padStart(2, '0')}</i> {st.stop}
                      </span>
                    ) : (
                      <Link
                        to={`/blog/${st.post.slug}`}
                        viewTransition
                        className="bp-series-tick"
                        aria-label={`${st.stop} · ${st.post.title}`}
                      >
                        <i className="mono" aria-hidden>{String(i + 1).padStart(2, '0')}</i> {st.stop}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <article className="bp-body">
            <BlogBody tokens={post.tokens} />
          </article>

          {/* the honest foot · the post IS a file — read it, edit it, discuss it */}
          <div className="bp-foot" data-rise>
            <p className="bp-foot-src mono">
              this post is a file ·{' '}
              <a
                href={`${CONTENT_DIR}/${post.file}`}
                target="_blank"
                rel="noreferrer"
                className="bp-foot-link"
              >
                read it on GitHub ↗
              </a>{' '}
              ·{' '}
              <a
                href={`${REPO}/discussions`}
                target="_blank"
                rel="noreferrer"
                className="bp-foot-link"
              >
                discuss ↗
              </a>
            </p>
            <nav className="bp-walk" aria-label="More posts">
              {prev ? (
                <Link to={`/blog/${prev.slug}`} viewTransition className="bp-walk-link">
                  ← {prev.title}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link to={`/blog/${next.slug}`} viewTransition className="bp-walk-link bp-walk-link--next">
                  {next.title} →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </div>

          <footer className="v4docfoot">
            <span className="v4docfoot-brand">
              <img src="/nika.svg" alt="" width={13} height={13} />
              nika · by SuperNovae · AGPL forever
            </span>
            <Link to="/blog">← all posts</Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
