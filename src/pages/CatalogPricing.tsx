/* ─── /catalog/pricing · the full rule table (engine-release clock) ──────────
   All the rules, grouped by provider · the table `nika check` prices against.
   Rules are rows and edges, never pages (§I.2-4). Register-diet: the heavy
   table rides the byte island. */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS, MARKET_PROVIDER_IDS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, fmtUsd, useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'

type Rule = import('../content/catalog.generated').PricingRule
type Cargo = {
  meta: { source: string | null; as_of: string | null }
  rules: Rule[]
  /** exact model id → room slug · a PATTERN rule matches nothing here and
      stays text: a rule is a rule, a room is a room (no fake doors) */
  rooms: Record<string, string>
}

/* every one of the 38 vendors has a room (the 2026-08-02 ruling) */
const ROOMED_PROVIDERS = new Set(MARKET_PROVIDER_IDS)

const DESC = `The ${CATALOG_COUNTS.pricing_rules} pricing rules the released binary resolves · USD per million tokens, grouped by provider, snapshot carried inside the release.`

export function Component() {
  useCatalogHead('/catalog/pricing', 'Pricing', DESC, [
    collectionLd({ path: '/catalog/pricing', name: 'Pricing · Nika', description: DESC, total: CATALOG_COUNTS.pricing_rules }),
  ])
  const { payload, data } = useCatalogCargo<Cargo>('cat-pricing', (m) => ({
    meta: m.PRICING_META,
    rules: m.PRICING_RULES,
    rooms: Object.fromEntries(m.MODELS.map((x) => [x.id, x.slug])),
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
      {/* the jump rail · 633 rules is a WALK, not a glance — one door per
          provider section (the SSOT interlink pass, 2026-08-03) */}
      {groups.length > 1 && (
        <nav className="pv-desc cm-facts" aria-label="Jump to a provider" style={{ lineHeight: 2 }}>
          {groups.map((g, i) => (
            <span key={g}>
              {i > 0 && ' · '}
              <a href={`#p-${g}`}>{g}</a>
            </span>
          ))}
        </nav>
      )}
      {groups.map((g) => {
        const rows = (data?.rules ?? []).filter((r) => r.provider === g)
        return (
          <CatalogSection key={g} id={`p-${g}`} title={`${g} · ${rows.length}`}>
            {ROOMED_PROVIDERS.has(g) && (
              <p className="pv-desc">
                <Link to={`/catalog/providers/${g}`}>the {g} room</Link> · what it serves, what it
                does with your data
              </p>
            )}
            <ol className="tp-list">
              {rows.map((r, i) => (
                <li key={`${r.model_pattern}-${i}`} className="tp-row">
                  <div className="pv-row-head">
                    {/* an EXACT id is a door to its model room · a pattern is a
                        RULE the engine resolves, and a rule is not a page */}
                    {data?.rooms[r.model_pattern] ? (
                      <Link className="pv-id" to={`/catalog/models/${data.rooms[r.model_pattern]}`}>
                        {r.model_pattern}
                      </Link>
                    ) : (
                      <span className="pv-id" title="a pattern rule · the engine resolves it at run">
                        {r.model_pattern}
                      </span>
                    )}
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
