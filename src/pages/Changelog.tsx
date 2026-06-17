import { useMemo } from 'react'
import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { useHead } from '@unhead/react'
import { CHANGELOG, TAG_LABEL, fmtDate, type ChangelogEntry } from '../content/changelog'
import { REPO, SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './changelog-page.css'

/* ─── /changelog · the full ship log (theme-dark · blueprint register) ─────────
   Design doc §7 (Routes · /changelog) + FIG 7.0. The HOME shows the latest few
   (ChangelogPreview); THIS page shows the WHOLE register: every dated entry,
   newest-first, grouped by year, in the same hairline-ruled ship-log register as
   the home preview (FIG numbering, mono register dates, 1px rules, theme-dark).

   Spec truth: the entries come from src/content/changelog.ts (CHANGELOG · counts
   interpolated from CANON) — never duplicated here, just imported. The page adds
   no new data; it re-presents the same source in full.

   SSR-safe: pure DOM (the register lives in the prerendered HTML for SEO + an
   instant paint); the reveal is an IntersectionObserver added on mount, content
   fully visible by default (no-JS / reduced-motion). Per-route <head> via
   useHead → prerendered into dist/changelog/index.html. */

/* group the flat, newest-first list into year buckets (still newest-first within
   each year), so the page reads like a real ship log spanning years. Derived
   from CHANGELOG with no extra data. */
interface YearGroup {
  year: string
  entries: ChangelogEntry[]
}

function groupByYear(entries: ChangelogEntry[]): YearGroup[] {
  const groups: YearGroup[] = []
  for (const e of entries) {
    const year = e.date.slice(0, 4)
    const last = groups[groups.length - 1]
    if (last && last.year === year) last.entries.push(e)
    else groups.push({ year, entries: [e] })
  }
  return groups
}

export function Component() {
  /* reveal the section once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const groups = useMemo(() => groupByYear(CHANGELOG), [])

  useHead({
    title: 'Changelog · Nika',
    link: routeHead('/changelog').link,
    meta: [
      ...routeHead('/changelog').meta,
      {
        name: 'description',
        content:
          'The Nika ship log: every dated release, tagged and described. The spec opened, the four verbs locked, the standard library and the provider catalog landed.',
      },
      { property: 'og:title', content: 'Changelog · Nika' },
      {
        property: 'og:description',
        content: 'The Nika ship log — every dated release, tagged and described.',
      },
      { name: 'twitter:title', content: 'Changelog · Nika' },
      {
        name: 'twitter:description',
        content: 'The Nika ship log — every dated release, tagged and described.',
      },
    ],
  })

  const total = CHANGELOG.length

  return (
    <main className="theme-dark cl-page">
      <section ref={ref} aria-labelledby="cl-title" className="v4sec">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            FIG 7.0 · the ship log
          </p>
          <h1
            id="cl-title"
            className="v4sec-title cl-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            Changelog.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            A workflow language earns trust by <b>moving</b> — and by not breaking what you
            wrote. Every public milestone, dated and tagged: the spec opened, the verbs locked,
            the standard library and the provider catalog landed.
          </p>

          {/* the full register · grouped by year, hairline-ruled, newest-first */}
          {groups.map((group, gi) => (
            <div
              className="cl-year"
              key={group.year}
              data-rise
              style={{ ['--rise-delay' as string]: `${160 + gi * 40}ms` }}
            >
              <div className="cl-year-head">
                <span className="cl-year-n">{group.year}</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {group.entries.length}{' '}
                  {group.entries.length === 1 ? 'release' : 'releases'}
                </span>
              </div>

              <ol className="v4log cl-log">
                {group.entries.map((e) => (
                  <li className="v4log-row" key={`${e.date}-${e.title}`}>
                    <div className="v4log-meta">
                      <time className="v4log-date" dateTime={e.date}>
                        {fmtDate(e.date)}
                      </time>
                      <span className="v4log-tag">{TAG_LABEL[e.tag]}</span>
                    </div>
                    <div className="v4log-body">
                      <h2 className="v4log-title">{e.title}</h2>
                      <p className="v4log-desc">{e.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {/* the close · the dimension line + a forward link back into the product */}
          <p
            className="cl-note"
            data-rise
            style={{ ['--rise-delay' as string]: '120ms' }}
          >
            {total} dated {total === 1 ? 'release' : 'releases'} · counts derive from{' '}
            <code>nika-spec</code> canon — never hand-typed
          </p>

          <div className="cl-links" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            <a href={SPEC} target="_blank" rel="noreferrer" className="cl-link">
              Read the spec
              <span aria-hidden className="cl-link-arrow">
                {' '}
                ↗
              </span>
            </a>
            <a href={REPO} target="_blank" rel="noreferrer" className="cl-link cl-link--dim">
              <span aria-hidden className="cl-link-glyph">
                ★
              </span>
              Star on GitHub
            </a>
            <Link to="/use-cases" className="cl-link cl-link--dim">
              See it in use
              <span aria-hidden className="cl-link-arrow">
                {' '}
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
