import { useMemo } from 'react'
import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { useHead } from '@unhead/react'
import {
  CHANGELOG,
  TAGS,
  type ChangelogTag,
  entryDate,
  entryDateTime,
  isRelease,
  type ChangelogEntry,
} from '../content/changelog'
import { REPO, SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './changelog-page.css'

/* ─── /changelog · the full ship log (theme-dark · blueprint register) ─────────
   Design doc §7 (Routes · /changelog) · masthead FIG C (the letter-masthead
   convention of every routed page · J/L/C…). The HOME shows the latest few
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

/* per-tag register hue — the changelog's only colour, whispered on the timeline
   node + the tag chip seam. Maps the ship-log classes onto the v4 hue vocabulary
   (the 4 verb hues + the teal "live-wiring" ref tone), so a security ship reads
   in the exec-orange "effect" tone, a language ship in the infer-blue, etc. */
const TAG_HUE: Record<ChangelogTag, string> = {
  release: 'var(--v4-accent)', // the ONE blue accent · the engine itself ships
  spec: 'var(--cf-ref)', // teal · the contract / live-wiring
  language: 'var(--verb-infer)', // blue · the model verb
  stdlib: 'var(--verb-invoke)', // cyan · the tool verb
  providers: 'var(--verb-agent)', // violet · the catalog
  security: 'var(--verb-exec)', // orange · enforcement / effect
  tooling: 'var(--cf-ref)', // teal · playground / mcp
  site: 'var(--v4-text-dim)', // neutral · the site itself
}
const tagHue = (tag: ChangelogTag) => TAG_HUE[tag]

/* two-tone title · the Raycast sentence register (white claim + grey
   elaboration on the same line). Presentation-only: entries whose title
   carries a « · » split at the FIRST one; single-clause titles stay whole. */
function TwoToneTitle({ title }: { title: string }) {
  const i = title.indexOf(' · ')
  if (i === -1) return <>{title}</>
  return (
    <>
      {title.slice(0, i)}
      <span className="cl-tl-title-dim"> · {title.slice(i + 3)}</span>
    </>
  )
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
          'Every Nika release and public milestone, dated and tagged: the spec opened, the four verbs locked, the tools and the model providers landed.',
      },
      { property: 'og:title', content: 'Changelog · Nika' },
      {
        property: 'og:description',
        content: 'The Nika ship log: every release and public milestone, dated and tagged.',
      },
      { property: 'og:image', content: 'https://nika.sh/og-changelog.png' },
      {
        property: 'og:image:alt',
        content: 'Nika changelog · moving without breaking. Every public milestone, dated and tagged.',
      },
      { name: 'twitter:title', content: 'Changelog · Nika' },
      {
        name: 'twitter:description',
        content: 'The Nika ship log: every release and public milestone, dated and tagged.',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-changelog.png' },
    ],
  })

  const total = CHANGELOG.length
  const releases = CHANGELOG.filter(isRelease).length
  const tagCount = new Set(CHANGELOG.map((e) => e.tag)).size
  /* the newest ship date, compact (e.g. "06·17") — derived, never hand-typed */
  const latestDate = useMemo(() => {
    const top = CHANGELOG[0]?.date ?? ''
    const [, m, d] = top.split('-')
    return m && d ? `${m}·${d}` : '·'
  }, [])

  return (
    <main className="theme-dark cl-page">
      <section ref={ref} aria-labelledby="cl-title" className="v4sec">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the ship log
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
            A workflow language earns trust by <b>moving</b>, and by not breaking what you
            wrote. Every public milestone, dated and tagged: the spec opened, the verbs locked,
            the <code>permits:</code> boundary (what a plan is allowed to touch), the tool
            library and the playground landed.
          </p>

          {/* the ship-log register · the log's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: releases, label: releases === 1 ? 'release' : 'releases', sub: 'shipped' },
              { n: total, label: 'milestones', sub: 'logged' },
              { n: tagCount, label: 'registers', sub: 'tags' },
              { n: latestDate, label: 'latest', sub: CHANGELOG[0].tag },
            ]}
          />

          {/* the register legend · the tag vocabulary with its hue */}
          <ul className="cl-legend" data-rise style={{ ['--rise-delay' as string]: '160ms' }} aria-hidden>
            {TAGS.map((t) => (
              <li className="cl-legend-item" key={t} style={{ ['--th' as string]: tagHue(t) }}>
                <span className="cl-legend-dot" />
                {t}
              </li>
            ))}
          </ul>

          {/* the full register · a hairline timeline, grouped by year, newest-first.
              Each entry is a timeline node (its register hue) + a register card. */}
          {groups.map((group, gi) => (
            <div
              className="cl-year"
              key={group.year}
              data-rise
              style={{ ['--rise-delay' as string]: `${180 + gi * 40}ms` }}
            >
              <div className="cl-year-head">
                <span className="cl-year-n">{group.year}</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {group.entries.length}{' '}
                  {group.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <ol className="cl-timeline">
                {group.entries.map((e) => (
                  <li
                    className="cl-tl-row"
                    key={`${e.date}-${e.title}`}
                    style={{ ['--th' as string]: tagHue(e.tag) }}
                  >
                    <span className="cl-tl-spine" aria-hidden>
                      <span className="cl-tl-node" />
                    </span>
                    <div className="cl-tl-meta">
                      {/* releases are day-true (GitHub dates); milestones render
                          at month precision — honest recall, never an invented day */}
                      <time className="cl-tl-date" dateTime={entryDateTime(e)}>
                        {entryDate(e)}
                      </time>
                      <span className="cl-tl-tag">{e.tag}</span>
                    </div>
                    <div className="cl-tl-body">
                      <h2 className="cl-tl-title">
                        <TwoToneTitle title={e.title} />
                      </h2>
                      <p className="cl-tl-desc">{e.body}</p>
                      {e.gh ? (
                        <a
                          href={e.gh}
                          target="_blank"
                          rel="noreferrer"
                          className="cl-tl-gh mono"
                        >
                          release notes on GitHub ↗
                        </a>
                      ) : null}
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
            {releases} {releases === 1 ? 'release' : 'releases'} · {total - releases} public
            milestones · spec counts derive from <code>nika-spec</code> canon
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
