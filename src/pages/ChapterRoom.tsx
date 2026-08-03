import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { articleLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, SPEC } from '../content'
import { BlogBody } from '../lib/blog-render'
import type { BlogToken } from '../content/blog.generated'
import { Island } from '../lib/ssg-island'
import { islandJson } from '../lib/island-json'
import { useIslandPayload } from '../lib/use-island-payload'
import { CHAPTERS, CHAPTERS_PIN } from '../content/chapters.generated'
import { ssrChapterTokens, loadChapterTokens } from '../lib/chapters-access'
import '../sections/v4-home.css'
import './page-chrome.css'
import './how-page.css'
import './workflows-page.css'
import './chapter-page.css'

/* ─── /language/spec/:chapter · one chapter of the specification ─────────────
   /spec was ONE page for a whole specification: eighteen chapters flattened
   into a single scroll with no citable address for any of them. A reference
   you cannot cite by chapter is a document, not a reference.

   Every chapter is now its own room with its sections, its sha256, and the
   two chapters on either side. The prose renders through the site's own
   token renderer (BlogBody), so a yaml fence in the spec draws as the
   product's editor panel rather than a grey pre — and no HTML is injected. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02 })
  const { pathname } = useLocation()
  const slug = pathname.split('/')[3] ?? ''
  const at = CHAPTERS.findIndex((c) => c.slug === slug)
  const ch = at >= 0 ? CHAPTERS[at] : undefined
  const prev = at > 0 ? CHAPTERS[at - 1] : undefined
  const next = at >= 0 && at < CHAPTERS.length - 1 ? CHAPTERS[at + 1] : undefined

  const payload = useIslandPayload(
    `chapter-${slug}`,
    (() => {
      const all = ssrChapterTokens()
      /* islandJson, not JSON.stringify: the SSG assembly interprets `$&` in a
         string replacement, and a SPECIFICATION is full of them — it teaches
         regex anchors. Four chapter islands shipped with a live replacement
         pattern before this (the /errors incident, one year of prose later). */
      return all ? islandJson(all[slug] ?? []) : null
    })(),
    async () => islandJson((await loadChapterTokens())[slug] ?? []),
  )
  const tokens = useMemo<BlogToken[]>(
    () => (payload ? (JSON.parse(payload) as BlogToken[]) : []),
    [payload],
  )

  const known = at >= 0
  const title = known ? `${ch?.title} · The spec · Nika` : 'Not a chapter · Nika'
  const description = known
    ? (ch?.lede ?? `Chapter ${ch?.n} of the Nika specification, whole and citable.`)
    : `${slug} names no chapter of the specification.`
  useHead({
    title,
    link: routeHead(`/language/spec/${slug}`).link,
    meta: [
      ...routeHead(`/language/spec/${slug}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      /* a chapter room shares the REFERENCE card, not the home card — the
         family message is the share message (2026-08-04 og arbitrage) */
      { property: 'og:image', content: 'https://nika.sh/og-spec.png' },
      { property: 'og:image:alt', content: 'The nika language reference: the contract an agent must satisfy before it acts.' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    /* a chapter says what it is a chapter OF · the spec is the work, the
       chapter is the part (2026-08-02: all 18 shipped bare) */
    script: known
      ? [
          ldScript([
            crumbLd([
              { name: 'The language', path: '/language' },
              { name: 'The specification', path: '/language/spec' },
              { name: ch?.title ?? slug },
            ]),
            articleLd({
              path: `/language/spec/${slug}`,
              name: ch?.title ?? slug,
              description,
              partOfName: 'The Nika workflow language specification',
              partOfPath: '/language/spec',
            }),
          ]),
        ]
      : [],
  })

  if (!known) {
    return (
      <main className="theme-dark tp-page td-page">
        <section className="v4sec v4-in">
          <div className="v4sec-wrap">
            <nav className="td-crumb" aria-label="Breadcrumb">
              <Link to="/language/spec" className="td-crumb-link">
                ← the specification
              </Link>
            </nav>
            <h1 className="v4sec-title">Not a chapter.</h1>
            <p className="v4sec-lede">
              <code>{slug}</code> names no chapter.{' '}
              <Link to="/language/spec">The specification</Link> lists all {CHAPTERS.length}.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="theme-dark tp-page td-page">
      <section ref={ref} aria-labelledby="ch-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id={`chapter-${slug}`} payload={payload} />
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/language/spec" className="td-crumb-link">
              ← the specification
            </Link>
            <span className="tp-cat" title="where this chapter sits in the pack">
              chapter {at + 1} of {CHAPTERS.length}
            </span>
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the spec · {String(ch?.n).padStart(2, '0')}
          </p>
          <h1 id="ch-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            {ch?.title}
          </h1>
          {ch?.lede && (
            <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
              {ch.lede}
            </p>
          )}

          {ch && ch.sections.length > 0 && (
            <nav className="ch-toc" aria-label="In this chapter" data-rise>
              <p className="ch-toc-key mono">in this chapter</p>
              <ul>
                {ch.sections.map((s) => (
                  <li key={s.anchor}>
                    <a href={`#${s.anchor}`}>{s.title}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="ch-prose" data-rise>
            <BlogBody tokens={tokens} />
          </div>

          <p className="wf-pin mono" data-rise>
            nika-spec@{CHAPTERS_PIN.spec_commit.slice(0, 9)} · {ch?.file} · sha256{' '}
            {ch?.sha256.slice(0, 16)}… ·{' '}
            <a href={SPEC} target="_blank" rel="noreferrer">
              the pack upstream
            </a>
          </p>

          <nav className="wf-walk" aria-label="The pack" data-rise>
            {prev ? (
              <Link to={`/language/spec/${prev.slug}`} className="wf-walk-link">
                <span className="wf-walk-key mono">← before</span>
                <span>{prev.title}</span>
              </Link>
            ) : (
              <span className="wf-walk-link wf-walk-link--none">
                <span className="wf-walk-key mono">← before</span>
                <span>this is where the pack opens</span>
              </span>
            )}
            {next ? (
              <Link to={`/language/spec/${next.slug}`} className="wf-walk-link wf-walk-link--next">
                <span className="wf-walk-key mono">after →</span>
                <span>{next.title}</span>
              </Link>
            ) : (
              <span className="wf-walk-link wf-walk-link--next wf-walk-link--none">
                <span className="wf-walk-key mono">after →</span>
                <span>the pack ends here</span>
              </span>
            )}
          </nav>
        </div>
      </section>
    </main>
  )
}
