/* ─── /catalog/models · the model register (engine-release clock) ────────────
   Every model the wire catalog names, one room each. The context axis rides
   here (ModelAxis · the visual finally routed, D6): the axis is the fact the
   data actually holds. Register-diet: the rows ride the byte island, lean. */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { BENCH_WITNESSES } from '../content/bench.generated'
import { ModelAxis } from './ModelAxis'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'

const DESC = `The ${CATALOG_COUNTS.models} models the released binary's wire catalog names · who serves each one, its context window, its exact-match price and its measured energy where the catalog carries them.`

type Row = { id: string; slug: string; providers: string[]; ctx: number | null; priced: boolean; measured: boolean }

export function Component() {
  useCatalogHead('/catalog/models', 'Models', DESC, [
    collectionLd({ path: '/catalog/models', name: 'Models · Nika', description: DESC, total: CATALOG_COUNTS.models }),
  ])
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
      <CatalogSection id="bench" title="The bench">
        {/* testimonial-gated (the R7 law): the count below is the count of
            PUBLISHED receipts, projected from content/bench/ — never a
            leaderboard of numbers nobody can re-derive */}
        <p className="pv-desc">
          {BENCH_WITNESSES.length} published{' '}
          {BENCH_WITNESSES.length === 1 ? 'receipt' : 'receipts'}: a room shows a measured answer
          only when a receipt names its model, with the evidence pack served beside it. Every other
          seat: run it yourself · the <code>model-bench</code> workflow in the public registry
          measures YOUR machine, and{' '}
          <a href={`/bench/${BENCH_WITNESSES[0]?.id}/PROVENANCE.md`}>the first receipt</a> shows
          what an honest one looks like.
        </p>
      </CatalogSection>
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
