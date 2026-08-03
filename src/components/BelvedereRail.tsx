import { Link } from 'react-router'
import './belvedere-rail.css'

/* ─── BelvedereRail · the three zooms, one gesture ────────────────────────────
   The belvédère is ONE viewpoint at three altitudes — the city (which repo
   ships each piece), the map (every page, one graph), the truth (the lanes
   and pins that carry it) — and until now its three pages never said so.
   The rail names the movement and rides the router's view transitions, so
   walking city → map → truth reads as one camera move, not three loads
   (V1 of the wave-2 arbitrage: the PERCEIVED camera before any 3D). */

const STOPS = [
  { to: '/city', label: 'the city', gloss: 'which repo' },
  { to: '/map', label: 'the map', gloss: 'every page' },
  { to: '/truth', label: 'the truth', gloss: 'the lanes' },
] as const

export function BelvedereRail({ at }: { at: '/city' | '/map' | '/truth' }) {
  return (
    <nav className="bv-rail" aria-label="The belvédère · three zooms">
      <span className="bv-name" aria-hidden>
        belvédère
      </span>
      {STOPS.map((s, i) => (
        <span key={s.to} className="bv-seg">
          {i > 0 && (
            <span className="bv-arrow" aria-hidden>
              →
            </span>
          )}
          {s.to === at ? (
            <span className="bv-stop bv-stop--here" aria-current="page">
              {s.label}
              <i>{s.gloss}</i>
            </span>
          ) : (
            <Link className="bv-stop" to={s.to} viewTransition>
              {s.label}
              <i>{s.gloss}</i>
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
