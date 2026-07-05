import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, REPO } from '../content'
import { BLOG_POSTS } from '../content/blog.generated'
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
            { property: 'og:image:alt', content: `${post.title} — the Nika blog.` },
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

  if (!post) return <NotFound />
  const prev = BLOG_POSTS[idx + 1]
  const next = BLOG_POSTS[idx - 1]

  return (
    <main className="theme-dark v4page">
      <section ref={ref} aria-labelledby="bp-title" className="v4sec">
        <div className="v4sec-wrap bp-wrap">
          {/* the way back + the register row */}
          <nav className="bp-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/blog" viewTransition className="bp-crumb-link">
              ← blog
            </Link>
          </nav>
          <p className="bp-fig mono" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            {post.tag} · <time dateTime={post.date}>{post.date}</time> · {post.readingMin} min
          </p>
          <h1
            id="bp-title"
            className="v4sec-title bp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {post.title}
          </h1>
          <p className="bp-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            {post.description}
          </p>

          <article className="bp-body" data-rise style={{ ['--rise-delay' as string]: '170ms' }}>
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
