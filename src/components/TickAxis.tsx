import { Link } from 'react-router'
import './tick-axis.css'

/* ─── TickAxis · the shared instrument ────────────────────────────────────────
   ONE recipe for every axis the registers draw (born twice in a day — the
   /releases cadence and the /models price axis shipped as two copies of the
   same cloth, and the third consumer made extraction the design-system move):
   2px ticks on a single hairline, anchored lo/hi labels, a derived foot
   line, and the site's lone accent reserved for the ticks that mean
   something (the serving release · the open weights · the frugal seat).

   The PAGE owns the semantics: it computes each tick's position (linear or
   log — the axis must be the fact the data actually holds), decides which
   ticks carry the accent, and hands ready geometry down. A tick with a `to`
   is a real door (Link · ≥24px hit area); without one it renders as a plain
   span with no hover affordance — an instrument mark, never a fake button. */

export interface AxisTick {
  key: string
  /** 0..100 · position on the axis (the page owns the scale) */
  left: number
  /** px · bar height (default 18) */
  h?: number
  /** the lone accent · reserved for meaning, never decoration */
  accent?: boolean
  /** title + aria-label · the tick's whole fact in one line */
  label: string
  /** a real room to walk to · absent = a mark, not a door */
  to?: string
}

export function TickAxis({
  ticks,
  ariaLabel,
  lo,
  hi,
  foot,
}: {
  ticks: AxisTick[]
  /** the whole instrument's derived summary, for the accessibility tree */
  ariaLabel: string
  /** the two anchored labels · the rest speak via title/aria */
  lo: string
  hi: string
  foot: string
}) {
  if (ticks.length < 2) return null
  return (
    <>
      <div className="ax-strip" role="img" aria-label={ariaLabel}>
        {ticks.map((t) =>
          t.to ? (
            <Link
              key={t.key}
              to={t.to}
              className={t.accent ? 'ax-tick ax-tick--accent' : 'ax-tick'}
              style={{ left: `${t.left}%`, ['--h' as string]: `${t.h ?? 18}px` }}
              title={t.label}
              aria-label={t.label}
            >
              <i aria-hidden />
            </Link>
          ) : (
            <span
              key={t.key}
              className={t.accent ? 'ax-tick ax-tick--mark ax-tick--accent' : 'ax-tick ax-tick--mark'}
              style={{ left: `${t.left}%`, ['--h' as string]: `${t.h ?? 18}px` }}
              title={t.label}
            >
              <i aria-hidden />
            </span>
          ),
        )}
        <span className="ax-label" style={{ left: '0%' }} aria-hidden>
          {lo}
        </span>
        <span className="ax-label ax-label--hi" style={{ left: '100%' }} aria-hidden>
          {hi}
        </span>
      </div>
      <p className="ax-foot">{foot}</p>
    </>
  )
}
