import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead } from '../content'
import { BLOG_POSTS } from '../content/blog.generated'
import { CANON } from '../canon.generated'
import '../sections/v4-home.css'
import './page-chrome.css'
import './blog-page.css'

/* ─── /blog · the journal (theme-dark · blueprint register) ──────────────────
   Long-form pedagogy on Intent as Code, brought up to the home + /spec register:
   the near-black blueprint plate, a FIG-numbered masthead, hairline-ruled
   articles (each a register entry), the premium CodeFile for any worked YAML, a
   HUD registration frame on the reading column, and a hairline grid of upcoming
   teasers. Same content as before — the divergent v3 cosmic chrome (.skeuo /
   .glass / cyan) is retired so the journal reads as the same product as the rest
   of the site.

   SSR-safe: pure DOM (the whole journal lives in the prerendered HTML for SEO +
   an instant paint); the reveal is one IntersectionObserver on mount, content
   fully visible by default (no-JS / reduced-motion). Per-route <head> via
   useHead → prerendered into dist/blog/index.html. */

/* the upcoming teasers · dated stubs of coming articles (unchanged content). */
const SOON: { slug: string; tag: string; date: string; title: string; teaser: string }[] = [
  {
    slug: 'the-chain-of-custody',
    tag: 'Engine',
    date: 'soon',
    title: 'The chain of custody',
    teaser: 'nika trace verify proves a recorded run intact: any edited, inserted, dropped or reordered line breaks every hash after it — tamper-evident, and honest about not being tamper-proof.',
  },
  {
    slug: 'the-run-that-never-runs',
    tag: 'Engine',
    date: 'soon',
    title: 'The run that never runs',
    teaser: 'nika run --dry-run shows the whole static plan and executes zero effects: waves, permits, models, the cost floor — the full rehearsal before anything is allowed to happen.',
  },
]

/* the tag registers · derived from the posts (a pipe-tagged post counts in
   each of its registers) — counts never hand-typed */
const TAGS = [...new Set(BLOG_POSTS.flatMap((p) => p.tag.split('|').map((t) => t.trim())))]
const tagCount = (t: string) => BLOG_POSTS.filter((p) => p.tag.includes(t)).length

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  /* the register filter · URL-reflected (?tag=Engine — deep-linkable, share-
     safe) without navigation; SSR prerenders the unfiltered archive (no
     window server-side), so crawlers and no-JS readers always get the whole
     shelf. Issue numbers are ABSOLUTE (a post keeps its number under any
     filter — the numbering is the archive's, not the view's). */
  const [tag, setTag] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all'
    const t = new URLSearchParams(window.location.search).get('tag')
    return t && TAGS.includes(t) ? t : 'all'
  })
  const pickTag = (t: string) => {
    setTag(t)
    const url = new URL(window.location.href)
    if (t === 'all') url.searchParams.delete('tag')
    else url.searchParams.set('tag', t)
    window.history.replaceState(null, '', url)
  }
  const shown = useMemo(
    () =>
      BLOG_POSTS.map((p, i) => ({ ...p, issue: BLOG_POSTS.length - i })).filter(
        (p) => tag === 'all' || p.tag.includes(tag),
      ),
    [tag],
  )
  /* the lead plate stays the ALL-view front page; a filtered view is the
     archive drawer — every match as a card, real issue numbers */
  const leadOn = tag === 'all'

  useHead({
    title: 'Blog · Nika',
    link: routeHead('/blog').link,
    meta: [
      ...routeHead('/blog').meta,
      {
        name: 'description',
        content:
          'Notes from the source: why agentic workflows belong in files you can run, review and keep. Intent as Code, the four verbs, guardrails and local-first.',
      },
      { property: 'og:title', content: 'Blog · Nika' },
      {
        property: 'og:description',
        content: 'Why useful AI work belongs in a file you can run, review and keep.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-blog.png' },
      {
        property: 'og:image:alt',
        content: 'Nika blog · notes from the source. Long-form pedagogy on Intent as Code.',
      },
      { name: 'twitter:title', content: 'Blog · Nika' },
      {
        name: 'twitter:description',
        content: 'Why useful AI work belongs in a file you can run, review and keep.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-blog.png' },
    ],
  })

  return (
    <main className="theme-dark v4page">
      <section ref={ref} aria-labelledby="blog-title" className="v4sec">
        {/* the HUD registration frame on the reading column (decorative) */}
        <div className="v4hud" aria-hidden>
          <span className="v4hud-mark v4hud-mark--tl" />
          <span className="v4hud-mark v4hud-mark--tr" />
          <span className="v4hud-mark v4hud-mark--bl" />
          <span className="v4hud-mark v4hud-mark--br" />
          <span className="v4hud-tick v4hud-tick--l" />
          <span className="v4hud-tick v4hud-tick--r" />
        </div>

        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            the journal
          </p>
          <h1
            id="blog-title"
            className="v4sec-title blog-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Notes from the source.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Long-form pedagogy on <b>Intent as Code</b>: why useful AI work belongs in a file,
            why the language locks at four verbs, and what local-first actually buys you. The
            archive runs from the spec opening to today.
          </p>
          <p className="v4page-stamp" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {BLOG_POSTS.length} live · {SOON.length} upcoming
          </p>

          {/* the register filter · plain toggles (aria-pressed), the /use-cases
              métier-bar grammar — filtering the shelf isn't a tab/tabpanel
              relationship */}
          <div
            className="blog-tags"
            role="group"
            aria-label="Filter posts by register"
            data-rise
            style={{ ['--rise-delay' as string]: '200ms' }}
          >
            <button
              type="button"
              className="blog-tag mono"
              aria-pressed={tag === 'all'}
              onClick={() => pickTag('all')}
            >
              All<span className="blog-tag-n">{BLOG_POSTS.length}</span>
            </button>
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className="blog-tag mono"
                aria-pressed={tag === t}
                onClick={() => pickTag(t)}
              >
                {t}
                <span className="blog-tag-n">{tagCount(t)}</span>
              </button>
            ))}
          </div>

          {/* ══ the lead · the latest entry as the issue front page ══════════
              Editorial hierarchy (the register every serious journal keeps):
              the newest post reads FIRST-class — full-width plate, its issue
              number as a giant watermark stamp — and the archive files below.
              Same Link semantics as a card; only the rendering is promoted. */}
          {leadOn && BLOG_POSTS.length > 0 && (
            <Link
              id={BLOG_POSTS[0].slug}
              to={`/blog/${BLOG_POSTS[0].slug}`}
              viewTransition
              className="blog-lead"
              data-rise
            >
              <span className="blog-lead-no mono" aria-hidden>
                {String(BLOG_POSTS.length).padStart(2, '0')}
              </span>
              <span className="blog-card-fig mono">
                latest · {BLOG_POSTS[0].tag} ·{' '}
                <time dateTime={BLOG_POSTS[0].date}>{BLOG_POSTS[0].date}</time>
              </span>
              <span className="blog-lead-title">{BLOG_POSTS[0].title}</span>
              <span className="blog-lead-teaser">{BLOG_POSTS[0].description}</span>
              <span className="blog-card-foot mono">
                {BLOG_POSTS[0].readingMin} min read
                <span className="blog-card-arrow" aria-hidden>
                  {' '}
                  →
                </span>
              </span>
            </Link>
          )}

          {/* ══ the shelf · one card per archived post (content/blog) ════════ */}
          <div className="blog-shelf" data-rise>
            {(leadOn ? shown.slice(1) : shown).map((p) => (
              <Link key={p.slug} id={p.slug} to={`/blog/${p.slug}`} viewTransition className="blog-card">
                <span className="blog-card-fig mono">
                  {String(p.issue).padStart(2, '0')} · {p.tag} ·{' '}
                  <time dateTime={p.date}>{p.date}</time>
                </span>
                <span className="blog-card-title">{p.title}</span>
                <span className="blog-card-teaser">{p.description}</span>
                <span className="blog-card-foot mono">
                  {p.readingMin} min read
                  <span className="blog-card-arrow" aria-hidden>
                    {' '}
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* the folder truth · the blog IS markdown in the public repo */}
          <p className="blog-folder mono" data-rise>
            this blog is a folder ·{' '}
            <a
              href="https://github.com/supernovae-st/nika.sh/tree/main/content/blog"
              target="_blank"
              rel="noreferrer"
              className="blog-folder-link"
            >
              content/blog on GitHub ↗
            </a>{' '}
            · PRs welcome ·{' '}
            <a href="/rss.xml" className="blog-folder-link">
              rss
            </a>
          </p>

          {/* ══ the upcoming register ═══════════════════════════════════════ */}
          <div className="blog-soon" data-rise>
            <div className="blog-soon-head">
              <span className="blog-soon-fig">03 · in the pipeline</span>
              <span className="blog-soon-count">{SOON.length} upcoming</span>
            </div>
            <div className="blog-soon-grid">
              {SOON.map((p) => (
                <div key={p.slug} className="blog-soon-tile">
                  <p className="blog-soon-meta">
                    <span className="blog-soon-tag">{p.tag}</span>
                    <span aria-hidden>·</span>
                    <span>{p.date}</span>
                  </p>
                  <p className="blog-soon-title">{p.title}</p>
                  <p className="blog-soon-teaser">{p.teaser}</p>
                </div>
              ))}
            </div>
          </div>

          {/* the close · the doc dimension line + the page footer */}
          <p className="v4docnote" data-rise>
            Intent as Code · {CANON.verbs} verbs · {CANON.builtins} builtins ·{' '}
            {CANON.providers} providers · written down, replayable, yours
          </p>

          <footer className="v4docfoot">
            <span className="v4docfoot-brand">
              <img src="/nika.svg" alt="" width={13} height={13} />
              nika · free software · AGPL-3.0-or-later
            </span>
            <a href="/rss.xml">rss</a>
            <Link to="/">← supernovae</Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
