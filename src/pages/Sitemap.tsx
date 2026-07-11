import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { SITE_MAP, type MapLink } from '../content/sitemap'
import { BLOG_POSTS } from '../content/blog.generated'
import { ERROR_CODES } from '../content/errors.generated'
import { TOOLS } from '../content/tools.generated'
import { routeHead } from '../content'
import '../sections/v4-home.css'
import './sitemap-page.css'

/* ─── /sitemap · the human map (theme-dark) ───────────────────────────────────
   Everything the site serves, on one labeled page — the human twin of
   sitemap.xml. Six editorial groups (start · product · reference · writing ·
   machines · studio); the dense tails (27 tools · error codes · every post)
   derive from the same generated modules the register pages render.

   The structure lives in src/content/sitemap.ts, and the coverage gate
   (src/test/sitemap.test.ts) asserts it against site.config PATHS both
   ways: a page shipped without joining the map goes red in CI, and a map
   link to a route that doesn't prerender goes red too. This page just
   renders the registry.

   SSR-safe: static lists, no effects. */

function MapRow({ link }: { link: MapLink }) {
  const inner = (
    <>
      <span className="sm-link-label">{link.label}</span>
      {link.hint && <span className="sm-link-hint">{link.hint}</span>}
      {link.external && (
        <span className="sm-ext" aria-label="external" title="external">
          ↗
        </span>
      )}
    </>
  )
  return (
    <li className="sm-link">
      {link.external ? (
        <a href={link.href} target="_blank" rel="noreferrer">
          {inner}
        </a>
      ) : (
        <Link to={link.href}>{inner}</Link>
      )}
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })

  const title = 'Site map · Nika'
  const description = `Every page nika.sh serves, on one labeled map — ${TOOLS.length} builtins, ${ERROR_CODES.length} error codes, ${BLOG_POSTS.length} posts, the machine-readable twins. Crawler twin: /sitemap.xml.`

  useHead({
    title,
    link: routeHead('/sitemap').link,
    meta: [
      ...routeHead('/sitemap').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-sitemap.png' },
      {
        property: 'og:image:alt',
        content: 'The nika.sh site map. Every page, one labeled map, coverage-gated.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'nika.sh site map',
          itemListElement: SITE_MAP.flatMap((g) => g.links)
            .filter((l) => !l.external)
            .map((l, i) => ({
              '@type': 'SiteNavigationElement',
              position: i + 1,
              name: l.label,
              url: `https://nika.sh${l.href === '/' ? '' : l.href}`,
            })),
        }),
        // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
        processTemplateParams: false,
      },
    ],
  })

  return (
    <main className="theme-dark sm-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="sm-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the whole territory
          </p>
          <h1 id="sm-title" className="v4sec-title sm-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Site map.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Everything this site serves, on one page — <b>including the machine twins</b>. The
            registers (tools · providers · templates · errors) are projections of the binary and
            the spec; the map derives its tails from the same compiled catalogs, and CI fails when
            a page ships without joining it. Crawlers read <a href="/sitemap.xml">/sitemap.xml</a>;
            you read this.
          </p>

          {/* the territory's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: TOOLS.length, label: 'builtins', sub: 'the standard library' },
              { n: ERROR_CODES.length, label: 'error codes', sub: 'the typed registry' },
              { n: BLOG_POSTS.length, label: 'posts', sub: 'notes from the source' },
              { n: 8, label: 'languages', sub: 'the manifesto' },
            ]}
          />

          {SITE_MAP.map((group, gi) => (
            <div className="sm-group" key={group.kick} data-rise style={{ ['--rise-delay' as string]: `${180 + gi * 30}ms` }}>
              <div className="cl-year-head">
                <span className="cl-year-n sm-group-n">{group.kick}</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {group.links.length + (group.dense?.length ?? 0)}{' '}
                  {group.links.length + (group.dense?.length ?? 0) === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <p className="sm-group-gloss">{group.gloss}</p>
              <ul className="sm-links">
                {group.links.map((l) => (
                  <MapRow key={l.href} link={l} />
                ))}
              </ul>
              {group.dense && (
                <ul className="sm-dense">
                  {group.dense.map((l) => (
                    <li key={l.href}>
                      <Link to={l.href} className="sm-dense-link">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <p className="sm-foot" data-rise>
            You are here: <code>/sitemap</code>. If a page exists and this map misses it, that is
            a bug — the coverage gate in CI enforces the promise both ways.
          </p>
        </div>
      </section>
    </main>
  )
}
