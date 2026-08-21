/* ─── /catalog/energy · the measured rows, provenance verbatim ───────────────
   Born with v0.107.0: the catalog carries independently measured energy for
   the seats research has weighed. The provenance line ships EXACTLY as the
   TOML carries it (ml.energy · arXiv · measured_at) · the site prints the
   receipt, it never rounds a claim. */
import { lazy } from 'react'
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { SsgSuspense } from '../lib/ssg-lazy'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'
import './catalog-models.css'

const TickAxis = lazy(() => import('../components/TickAxis').then((m) => ({ default: m.TickAxis })))

type Row = import('../content/catalog.generated').EnergyRow
type Cargo = { rows: Row[]; rooms: Record<string, string> }

const DESC = `The ${CATALOG_COUNTS.energy_rows} measured energy rows the released binary carries · watt-hours per million output tokens, each with its measurement source printed verbatim.`

export function Component() {
  useCatalogHead('/catalog/energy', 'Energy', DESC, [
    collectionLd({ path: '/catalog/energy', name: 'Energy · Nika', description: DESC, total: CATALOG_COUNTS.energy_rows }),
  ])
  const { payload, data: cargo } = useCatalogCargo<Cargo>('cat-energy', (m) => ({
    rows: [...m.ENERGY_ROWS],
    rooms: Object.fromEntries(m.MODELS.map((x) => [x.id, x.slug])),
  }))
  const data = cargo?.rows
  return (
    <CatalogShell
      fig={`the energy · ${CATALOG_COUNTS.energy_rows} rows`}
      title="What a token burns."
      lede={
        <>
          Independently measured watt-hours per million output tokens, for the seats research has
          actually weighed · no extrapolation, no fleet average. Every row prints its measurement
          source verbatim. Absence is honest: a model without a row has not been measured, which is
          a fact, not a zero.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      <CatalogSection id="axis" title="The energy axis">
        {/* the instrument (the shared TickAxis recipe): every measured seat at
            its watt-hours per million output tokens, log scale, the accent on
            the most frugal recorded seat. The ticks are MARKS, not doors — a
            measurement row belongs to a pattern, not a room, and the register
            below carries every receipt verbatim. */}
        <p className="pv-desc">
          Every measured seat, seated at what a million output tokens burns. The accent marks the
          most frugal recorded measurement; the register below prints each receipt verbatim.
        </p>
        {(() => {
          const rows = (data ?? []).filter(
            (e): e is Row & { wh_per_mtok_out: number } =>
              e.wh_per_mtok_out != null && e.wh_per_mtok_out > 0,
          )
          if (rows.length < 2) return null
          const lo = Math.min(...rows.map((e) => e.wh_per_mtok_out))
          const hi = Math.max(...rows.map((e) => e.wh_per_mtok_out))
          const span = Math.log10(hi) - Math.log10(lo) || 1
          const nudge = new Map<number, number>()
          return (
            <SsgSuspense fallback={<p className="ax-foot">Loading the energy axis…</p>}>
              <TickAxis
              ticks={rows.map((e) => {
                const base = ((Math.log10(e.wh_per_mtok_out) - Math.log10(lo)) / span) * 100
                const k = Math.round(base * 2)
                const nth = nudge.get(k) ?? 0
                nudge.set(k, nth + 1)
                return {
                  key: `${e.provider}/${e.model_pattern}`,
                  left: Math.min(100, base + nth * 0.7),
                  h: e.wh_per_mtok_out === lo ? 26 : 18,
                  accent: e.wh_per_mtok_out === lo,
                  label: `${e.model_pattern} · ${e.wh_per_mtok_out} Wh/Mtok · ${e.provider}`,
                }
              })}
              ariaLabel={`${rows.length} measured seats from ${lo} to ${hi} watt-hours per million output tokens`}
              lo={`${lo} Wh`}
              hi={`${hi} Wh`}
              foot={`${rows.length} measured · ${lo} → ${hi} Wh/Mtok · log scale · provenance printed per row`}
              />
            </SsgSuspense>
          )
        })()}
      </CatalogSection>
      <CatalogSection id="rows" title="The measured rows">
        <ol className="tp-list">
          {(data ?? []).map((e) => (
            <li key={`${e.provider}/${e.model_pattern}`} className="tp-row">
              <div className="pv-row-head">
                {cargo?.rooms[e.model_pattern] ? (
                  <Link className="pv-id" to={`/catalog/models/${cargo.rooms[e.model_pattern]}`}>
                    {e.model_pattern}
                  </Link>
                ) : (
                  <span className="pv-id">{e.model_pattern}</span>
                )}
                <span className="tp-cat cm-facts">
                  {e.wh_per_mtok_out} Wh/Mtok ·{' '}
                  {/* the vendor is a door: every one of the 38 has a room */}
                  <Link to={`/catalog/providers/${e.provider}`}>{e.provider}</Link> ·{' '}
                  {e.provenance ?? 'measured'}
                  {/* the clock the measurement was taken on · a number without
                      its date is a claim without a clock, and the catalog has
                      carried this field since v0.107.0 without printing it */}
                  {e.measured_at ? ` · measured ${e.measured_at}` : ''}
                </span>
              </div>
              <p className="pv-desc">{e.source ?? ''}</p>
            </li>
          ))}
        </ol>
      </CatalogSection>
      <Island id="cat-energy" payload={payload} />
    </CatalogShell>
  )
}
