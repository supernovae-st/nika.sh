/* ─── /catalog/pricing · the full rule table (engine-release clock) ──────────
   All the rules, grouped by provider · the table `nika check` prices against.
   Rules are rows and edges, never pages (§I.2-4). Register-diet: the heavy
   table rides the byte island. */
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, fmtUsd, useCatalogCargo, useCatalogHead } from './catalog-lib'

type Rule = import('../content/catalog.generated').PricingRule
type Cargo = { meta: { source: string | null; as_of: string | null }; rules: Rule[] }

const DESC = `The ${CATALOG_COUNTS.pricing_rules} pricing rules the released binary resolves · USD per million tokens, grouped by provider, snapshot carried inside the release.`

export function Component() {
  useCatalogHead('/catalog/pricing', 'Pricing', DESC)
  const { payload, data } = useCatalogCargo<Cargo>('cat-pricing', (m) => ({
    meta: m.PRICING_META,
    rules: m.PRICING_RULES,
  }))
  const groups = [...new Set((data?.rules ?? []).map((r) => r.provider))].sort()
  return (
    <CatalogShell
      fig={`the pricing · ${CATALOG_COUNTS.pricing_rules} rules`}
      title="What a token costs, before you spend it."
      lede={
        <>
          The exact table the audit reads: first matching rule wins, the engine resolves patterns,
          and a run prints its ceiling before a token moves. A local model is unpriced · which is
          not the same word as free. Snapshot {data?.meta.as_of ?? '·'} from{' '}
          {data?.meta.source ? new URL(data.meta.source).hostname : 'the vendored table'}, carried
          inside the release.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      {groups.map((g) => {
        const rows = (data?.rules ?? []).filter((r) => r.provider === g)
        return (
          <CatalogSection key={g} id={`p-${g}`} title={`${g} · ${rows.length}`}>
            <ol className="tp-list">
              {rows.map((r, i) => (
                <li key={`${r.model_pattern}-${i}`} className="tp-row">
                  <div className="pv-row-head">
                    <span className="pv-id">{r.model_pattern}</span>
                    <span className="tp-cat">
                      {fmtUsd(r.input_per_million)} in · {fmtUsd(r.output_per_million)} out
                      {r.cache_read_per_million != null ? ` · ${fmtUsd(r.cache_read_per_million)} cache` : ''}
                      {r.context_window_tokens ? ` · ${fmtTokens(r.context_window_tokens)}` : ''}
                      {r.open_weights ? ' · open' : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </CatalogSection>
        )
      })}
      <Island id="cat-pricing" payload={payload} />
    </CatalogShell>
  )
}
