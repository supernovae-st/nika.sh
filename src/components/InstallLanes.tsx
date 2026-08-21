import { Link } from 'react-router'
import { PLATFORM_GUIDE_NAV } from '../content/platform-guides-nav'

export default function InstallLanes() {
  return (
    <nav className="ins-lanes" aria-label="Deployment guides" data-rise>
      <p className="ins-lanes-k mono">choose the machine</p>
      <div className="ins-lanes-grid">
        {PLATFORM_GUIDE_NAV.map(([id, title, eyebrow], index) => (
          <Link key={id} to={`/install/${id}`} className="ins-lane">
            <span className="ins-lane-n mono">{String(index + 1).padStart(2, '0')}</span>
            <span>
              <strong>{title}</strong>
              <small>{eyebrow}</small>
            </span>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
