import { Link } from 'react-router'

import './record-rail.css'

/* The three views of one record, named on all three of them.
 *
 * Before this, only /releases pointed at a sibling (a one-way « ← the
 * narrative twin » crumb), and the relation between the three was
 * explained in a prose paragraph at the bottom of that one page. A
 * reader landing on /timeline or /changelog had no way to learn the
 * other two exist, let alone which question each one answers.
 *
 * One source, three readings: WHEN it happened · WHAT it meant · WHAT
 * you install. The rail states the question each view answers, because
 * a name alone ("Releases") does not tell a stranger why they would go
 * there. */

export type RecordView = 'timeline' | 'changelog' | 'releases'

const VIEWS: { id: RecordView; to: string; label: string; answers: string }[] = [
  { id: 'timeline', to: '/timeline', label: 'Timeline', answers: 'when it happened' },
  { id: 'changelog', to: '/changelog', label: 'Changelog', answers: 'what each version means' },
  { id: 'releases', to: '/releases', label: 'Releases', answers: 'what you install' },
]

export function RecordRail({ current }: { current: RecordView }) {
  return (
    <nav className="rec-rail" aria-label="The record · three views">
      <p className="rec-rail-fig mono">one record, three readings</p>
      <ul className="rec-rail-list">
        {VIEWS.map((v) => {
          const here = v.id === current
          return (
            <li key={v.id} className={here ? 'rec-rail-item is-here' : 'rec-rail-item'}>
              {here ? (
                /* The current view is stated, never linked: a link that
                   reloads the page you are on is a dead affordance. */
                <span className="rec-rail-cell" aria-current="page">
                  <span className="rec-rail-label">{v.label}</span>
                  <span className="rec-rail-answers mono">{v.answers}</span>
                </span>
              ) : (
                <Link to={v.to} className="rec-rail-cell" viewTransition>
                  <span className="rec-rail-label">{v.label}</span>
                  <span className="rec-rail-answers mono">{v.answers}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
