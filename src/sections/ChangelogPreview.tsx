import { useRevealOnce } from './use-reveal-once'
import { Link } from 'react-router'
import { CHANGELOG, TAG_LABEL, entryDate, entryDateTime } from '../content/changelog'
import './v4-home.css'
import { SectionHead } from '../components/SectionHead'

/* ─── FIG 8.0 · Changelog (theme-dark · the ship log) ──────────────────────────
   Design doc §6 (FIG 8.0) — "alive / shipping" (Cursor/Linear steal). A dated,
   monochrome, hairline-ruled SHIP-LOG REGISTER: the latest few REAL milestones,
   each a date + a tag + a one-line description. No invented features, no fake
   metrics — the entries live in src/content/changelog.ts (counts from CANON).

   The HOME section shows the latest 4 with a "Full changelog →" link to the
   /changelog page (built in Phase 4). Same blueprint register as the rest:
   FIG numbering, mono register dates, 1px hairline rules.

   SSR-safe: pure DOM; the reveal is an IntersectionObserver added on mount,
   content fully visible by default (no-JS / reduced-motion). */

/* the home preview shows the latest few; the /changelog page shows them all. */
const PREVIEW_COUNT = 4
const ENTRIES = CHANGELOG.slice(0, PREVIEW_COUNT)

export default function ChangelogPreview() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section
      ref={ref}
      id="changelog"
      aria-labelledby="changelog-title"
      className="theme-dark v4sec v4-cv scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <SectionHead fig="FIG 8.0" id="changelog-title" title={<>Shipping in the open.</>}>
          A workflow language earns trust by <b>moving</b> — and by not breaking what
          you wrote. Here is the recent ship log: the spec opened, the verbs locked —
          and the engine shipped, one <code className="mono">brew install</code> away.
        </SectionHead>

        {/* the ship-log register · a dated, hairline-ruled list (newest first) */}
        <ol className="v4log" data-rise style={{ ['--rise-delay' as string]: '170ms' }}>
          {ENTRIES.map((e) => (
            <li className="v4log-row" key={`${e.date}-${e.title}`}>
              <div className="v4log-meta">
                {/* releases day-true · milestones month-true (see changelog.ts) */}
                <time className="v4log-date" dateTime={entryDateTime(e)}>
                  {entryDate(e)}
                </time>
                <span className="v4log-tag">{TAG_LABEL[e.tag]}</span>
              </div>
              <div className="v4log-body">
                <h3 className="v4log-title">{e.title}</h3>
                <p className="v4log-desc">{e.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* the close · the link forward to the full register (Phase 4 page) */}
        <p className="v4log-more" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          <Link to="/changelog" className="v4log-more-link">
            Full changelog
            <span aria-hidden> →</span>
          </Link>
          <span className="v4log-more-note" aria-hidden>
            every release and milestone, dated
          </span>
        </p>
      </div>
    </section>
  )
}
