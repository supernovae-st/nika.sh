/* ─── /catalog/models · the model register (engine-release clock) ────────────
   Every model the wire catalog names, one room each. The context axis rides
   here (ModelAxis · the visual finally routed, D6): the axis is the fact the
   data actually holds. Register-diet: the rows ride the byte island, lean. */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { ModelAxis } from './ModelAxis'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, useCatalogCargo, useCatalogHead } from './catalog-lib'

const DESC = `The ${CATALOG_COUNTS.models} models the released binary's wire catalog names · who serves each one, its context window, its exact-match price and its measured energy where the catalog carries them.`

type Row = { id: string; slug: string; providers: string[]; ctx: number | null; priced: boolean; measured: boolean }

export function Component() {
  useCatalogHead('/catalog/models', 'Models', DESC)
  const { payload, data } = useCatalogCargo<Row[]>('cat-models', (m) =>
    m.MODELS.map((x) => ({
      id: x.id,
      slug: x.slug,
      providers: x.served_by.map((s) => s.provider),
      ctx: x.served_by[0]?.context_window_tokens ?? null,
      priced: x.pricing.length > 0,
      measured: x.energy.length > 0,
    })),
  )
  return (
    <CatalogShell
      fig={`the models · ${CATALOG_COUNTS.models}`}
      title="Every model, one room."
      lede={
        <>
          The union of the wire catalog: each model names the providers that serve it, the window it
          reads, the exact-match price rows and the measured energy rows. What the catalog does not
          carry, the room says plainly · a missing number is a fact, never a zero.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      <CatalogSection id="axis" title="The context axis">
        {/* the axis and the register COUNT DIFFERENT FACETS on purpose · say
            so, or the page reads as a contradiction (64 up top, 29 below) */}
        <p className="pv-desc">
          The axis draws the canonical catalog · the spec-named seats whose models declare a
          window. The register below is the wider wire union; each count names its facet.
        </p>
        <ModelAxis />
      </CatalogSection>
      <CatalogSection id="register" title="The register">
        <ol className="tp-list">
          {(data ?? []).map((m) => (
            <li key={m.slug} className="tp-row">
              <div className="pv-row-head">
                <Link className="pv-id" to={`/catalog/models/${m.slug}`}>
                  {m.id}
                </Link>
                <span className="tp-cat">
                  {m.providers.length} {m.providers.length === 1 ? 'seat' : 'seats'}
                  {m.priced ? ' · priced' : ''}
                  {m.measured ? ' · measured' : ''}
                </span>
              </div>
              <p className="pv-desc">
                {m.providers.join(' · ')}
                {m.ctx ? ` · ${fmtTokens(m.ctx)} context` : ''}
              </p>
            </li>
          ))}
        </ol>
      </CatalogSection>
      <Island id="cat-models" payload={payload} />
    </CatalogShell>
  )
}
