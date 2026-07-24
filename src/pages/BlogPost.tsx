import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, REPO } from '../content'
import { BLOG_POSTS, BLOG_SERIES, type BlogToken } from '../content/blog.generated'
import { BlogBody } from '../lib/blog-render'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrBlogRails, loadBlogRails } from '../lib/blog-rails-access'
import { Component as NotFound } from './NotFound'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './blog-post.css'

/* the palette's kind vocabulary — same glyph, same meaning */
const REGISTER_GLYPH: Record<string, string> = { tool: '⌗', word: '·', code: '✕' }

/* the per-post rails slice rides a byte island (register-diet law): the
   data itself never joins the initial chunk — SSG computes it through the
   access door, hydration reads the island, SPA nav pulls the async chunk */
interface PostRails {
  mentions: { kind: string; id: string; label: string; url: string }[]
  related: { slug: string; title: string; date: string; shared: number }[]
}
const railsIslandId = (slug: string) => `bp-rails-${slug}`
const railsSlice = (rails: { POST_MENTIONS: Record<string, PostRails['mentions']>; RELATED_POSTS: Record<string, PostRails['related']> }, slug: string): PostRails => ({
  mentions: rails.POST_MENTIONS[slug] ?? [],
  related: rails.RELATED_POSTS[slug] ?? [],
})
function usePostRails(slug: string): PostRails {
  const ssr = ssrBlogRails()
  const payload = useIslandPayload(
    railsIslandId(slug),
    ssr ? JSON.stringify(railsSlice(ssr, slug)) : null,
    async () => JSON.stringify(railsSlice(await loadBlogRails(), slug)),
  )
  return payload ? (JSON.parse(payload) as PostRails) : { mentions: [], related: [] }
}

/* ─── /blog/<slug> · one post, one page ───────────────────────────────────────
   The reading surface for the markdown blog (content/blog/*.md — compiled at
   build time, prerendered per slug via PATHS). The register: the site's page
   chrome, a measured reading column, CodeFile panels for the yaml fences, and
   an honest foot — every post links its own source file on GitHub (the blog
   IS the folder; edits are PRs) plus the prev/next walk.

   Unknown slug (client-side nav only — bad paths are never prerendered):
   the crafted 404 register takes over. */

const CONTENT_DIR = 'https://github.com/supernovae-st/nika.sh/blob/main/content/blog'

/* ─── the body island · the initial-bundle diet (arc 13m) ─────────────────────
   The 31 post bodies (~85% of the old blog.generated mass) no longer ride the
   initial bundle. Three paths to the SAME tokens:

   · SSG — the bodies module is awaited HERE, in the SSR-only branch: the SSG
     module runner resolves it while loading the route graph (before any
     render — RR's static handler never awaits mid-render, routes.tsx's own
     law), and import.meta.env.SSR is compile-time false in the client build,
     so the branch is dead code and the module never enters the client graph.
   · client HYDRATION — the SSG serialized the doc into an inline JSON island
     (the <script> below); the first client render reads it back, so the
     hydrated tree matches the prerendered HTML byte for byte, zero fetch.
   · client SPA NAVIGATION — no island in the DOM (React builds the page from
     scratch): the bodies module loads as its OWN chunk (import() below), once
     per session, while the header (metadata — already here) paints.

   The island carries the RAW string both ways (re-serializing a parsed doc
   would flip the \u003c escapes and desync hydration). */
let SSR_BODIES: Record<string, BlogToken[]> | null = null
if (import.meta.env.SSR) {
  SSR_BODIES = (await import('../content/blog-bodies.generated')).BLOG_BODIES
}

const islandId = (slug: string) => `bp-doc-${slug}`
/* </script> inside the JSON would close the island early — \u003c survives
   JSON.parse unchanged in meaning and keeps the HTML inert */
const toIslandJson = (tokens: BlogToken[]) =>
  JSON.stringify(tokens).replace(/</g, '\\u003c')

function useBodyJson(slug: string): string | null {
  const [json, setJson] = useState<string | null>(() => {
    if (import.meta.env.SSR) return toIslandJson(SSR_BODIES?.[slug] ?? [])
    /* hydration: the island the SSG rendered is already in the DOM */
    return document.getElementById(islandId(slug))?.textContent ?? null
  })
  useEffect(() => {
    if (json != null) return
    /* SPA navigation: pull the bodies chunk (cached after the first post) */
    let live = true
    import('../content/blog-bodies.generated').then((m) => {
      if (live) setJson(toIslandJson(m.BLOG_BODIES[slug] ?? []))
    })
    return () => {
      live = false
    }
  }, [json, slug])
  return json
}

export function Component() {
  const { slug } = useParams()
  const idx = BLOG_POSTS.findIndex((p) => p.slug === slug)
  const post = idx >= 0 ? BLOG_POSTS[idx] : null
  const bodyJson = useBodyJson(slug ?? '')
  const rails = usePostRails(slug ?? '')

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
              '@type': 'Person',
              name: post.author,
              url: 'https://nika.sh/manifesto',
              sameAs: ['https://github.com/ThibautMelen'],
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
          link: [
            ...routeHead(`/blog/${post.slug}`).link,
            {
              rel: 'alternate',
              type: 'text/markdown',
              href: `https://nika.sh/blog/${post.slug}.md`,
              title: 'Markdown source',
            },
          ],
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
    /* the smooth-hijack law: a route-mount reset is an arrival — the naked
       two-arg form inherits html{scroll-behavior:smooth} and animates */
    window.scrollTo({ top: 0, behavior: 'instant' })
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
        <div className="bp-progress" aria-hidden />
        <div className="v4sec-wrap bp-wrap">
          {/* the way back + the register row */}
          <nav className="bp-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/blog" viewTransition className="bp-crumb-link">
              <span className="acue acue--l" aria-hidden>
                ←
              </span>{' '}
              blog
            </Link>
          </nav>
          <p className="bp-fig mono" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            <Link to="/manifesto" viewTransition className="bp-author">
              {post.author}
            </Link>{' '}
            ·{' '}
            {post.tag.split('|').map((t, i) => (
              <span key={t.trim()}>
                {i > 0 && ' | '}
                <Link to={`/blog/tags/${t.trim().toLowerCase()}`} className="bp-author" title="the tag's own register">
                  {t.trim()}
                </Link>
              </span>
            ))}{' '}
            · <time dateTime={post.date}>{post.date}</time> · {post.readingMin} min
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
                <Link
                  to={`/blog/series/${post.series}`}
                  className="bp-series-name"
                  title="the reading path's own page"
                >
                  {series.title}
                </Link>
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
            {bodyJson != null ? <BlogBody tokens={JSON.parse(bodyJson)} /> : null}
            {/* the island · the SSG writes it, hydration reads it back — the
                raw string round-trips so the node matches byte for byte */}
            <script
              type="application/json"
              id={islandId(post.slug)}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: bodyJson ?? '[]' }}
            />
          </article>

          {/* the honest foot · the post IS a file — read it, edit it, discuss it */}
          <Island id={railsIslandId(post.slug)} payload={JSON.stringify(rails)} />
          {rails.mentions.length > 0 && (
            <nav className="bp-register" aria-label="The register behind this post">
              <p className="bp-register-k mono">the register behind this</p>
              <ul className="td-chips">
                {rails.mentions.map((m) => (
                  <li key={`${m.kind}:${m.id}`}>
                    <Link className="td-chip" to={m.url} viewTransition data-node-id={`${m.kind}:${m.id}`}>
                      <span aria-hidden>{REGISTER_GLYPH[m.kind] ?? '·'}</span> {m.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {rails.related.length > 0 && (
            <nav className="bp-register" aria-label="Related posts">
              <p className="bp-register-k mono">keep reading · same register</p>
              <ul className="td-chips">
                {rails.related.map((r) => (
                  <li key={r.slug}>
                    <Link className="td-chip" to={`/blog/${r.slug}`} viewTransition>
                      {r.title} <span className="bp-register-date">· {r.date}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
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
