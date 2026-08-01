/* ─── /catalog/energy · the measured rows, provenance verbatim ───────────────
   Born with v0.107.0: the catalog carries independently measured energy for
   the seats research has weighed. The provenance line ships EXACTLY as the
   TOML carries it (ml.energy · arXiv · measured_at) · the site prints the
   receipt, it never rounds a claim. */
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogCargo, useCatalogHead } from './catalog-lib'

type Row = import('../content/catalog.generated').EnergyRow

const DESC = `The ${CATALOG_COUNTS.energy_rows} measured energy rows the released binary carries · watt-hours per million output tokens, each with its measurement source printed verbatim.`

export function Component() {
  useCatalogHead('/catalog/energy', 'Energy', DESC)
  const { payload, data } = useCatalogCargo<Row[]>('cat-energy', (m) => [...m.ENERGY_ROWS])
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
      <CatalogSection id="rows" title="The measured rows">
        <ol className="tp-list">
          {(data ?? []).map((e) => (
            <li key={`${e.provider}/${e.model_pattern}`} className="tp-row">
              <div className="pv-row-head">
                <span className="pv-id">{e.model_pattern}</span>
                <span className="tp-cat">
                  {e.wh_per_mtok_out} Wh/Mtok · {e.provider} · {e.provenance ?? 'measured'}
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
