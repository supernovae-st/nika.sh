import { CANON } from '../canon.generated'
import { REPO } from '../content'
import './v4-home.css'

/* ─── FIG 3.5 · Proof strip (theme-dark · the honest numbers) ──────────────────
   A slim, headingless band of mono stat plates right after the Living File —
   the Raycast numbers-as-design / Vercel status register. Every count comes
   from CANON (the spec single source of truth), never hand-typed; the rest are
   structural facts (one binary · AGPL). No logos, no testimonials, no invented
   metrics — the strip earns trust by being boringly verifiable.

   Register: 1px hairline lattice (the container paints the lines through a 1px
   gap; each plate paints the section background + BRAND-11 grain back on top),
   12.5px mono, dim ink with the key figure in white. The last plate is the
   GitHub link — the only interactive cell.

   SSR-safe: pure DOM, no window at render, no reveal choreography (the strip is
   quiet by design — it should read as chrome, not as a moment). */

/* one plate · the key token renders white, the gloss stays dim. */
type Plate = { key: string; gloss?: string }

const PLATES: Plate[] = [
  { key: String(CANON.verbs), gloss: 'verbs · locked forever' },
  { key: String(CANON.builtins), gloss: 'builtins' },
  { key: String(CANON.providers), gloss: 'providers · local-first' },
  { key: 'one', gloss: 'Rust binary' },
  { key: 'AGPL-3.0', gloss: 'forever' },
]

export default function ProofStrip() {
  return (
    <section aria-label="Nika, in numbers" className="theme-dark v4strip">
      <ul className="v4strip-row">
        {PLATES.map((p) => (
          <li className="v4strip-plate" key={`${p.key}-${p.gloss}`}>
            <span className="v4strip-key">{p.key}</span>
            {p.gloss && <span className="v4strip-gloss"> {p.gloss}</span>}
          </li>
        ))}
        <li className="v4strip-plate v4strip-plate--link">
          <a href={REPO} target="_blank" rel="noreferrer" className="v4strip-link">
            supernovae-st/nika
            <span className="v4strip-arrow" aria-hidden>
              {' '}
              ↗
            </span>
          </a>
        </li>
      </ul>
    </section>
  )
}
