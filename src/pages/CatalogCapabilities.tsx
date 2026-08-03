/* ─── /catalog/capabilities · how the engine knows what a model can do ───────
   The rule table behind model_capabilities(provider, model): first match
   wins, in file order. The page shows the rules; the RESOLUTION stays the
   engine's · the site never re-implements it (the join-honesty law). */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS, MARKET_PROVIDER_IDS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'

type Rule = { name: string; match_kind: string | null; providers: string[]; api_dialect: string | null }

const ROOMED_PROVIDERS = new Set(MARKET_PROVIDER_IDS)

const DESC = `The ${CATALOG_COUNTS.capability_rules} capability rules the released binary resolves models against · scope, match kind and order, first match wins.`

export function Component() {
  useCatalogHead('/catalog/capabilities', 'Capability rules', DESC, [
    collectionLd({ path: '/catalog/capabilities', name: 'Capability rules · Nika', description: DESC, total: CATALOG_COUNTS.capability_rules }),
  ])
  const { payload, data } = useCatalogCargo<Rule[]>('cat-caps', (m) =>
    m.CAPABILITY_RULES.map((r) => ({
      name: r.name,
      match_kind: r.match_kind,
      providers: [...r.providers],
      api_dialect: r.api_dialect,
    })),
  )
  return (
    <CatalogShell
      fig={`the capabilities · ${CATALOG_COUNTS.capability_rules} rules`}
      title="What a model can do, decided by rules."
      lede={
        <>
          Vision, reasoning budgets, token-limit parameter names, JSON modes · the engine reads them
          from this ordered rule table, first match wins. The order is load-bearing and the
          resolution belongs to the engine: this page shows the rules, the binary applies them.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      <CatalogSection id="rules" title="The rules, in resolution order">
        {/* the derived summary · this table's facts are ORDER and SCOPE, and
            order is already drawn by the list — the foot says the rest */}
        {data && data.length > 0 && (
          <p className="ax-foot" style={{ marginTop: 0 }}>
            {data.length} rules · {new Set(data.map((r) => r.api_dialect).filter(Boolean)).size}{' '}
            dialects · {data.filter((r) => r.providers.length > 0).length} provider-scoped · first
            match wins
          </p>
        )}
        <ol className="tp-list">
          {(data ?? []).map((r, i) => (
            <li key={r.name} className="tp-row">
              <div className="pv-row-head">
                <span className="pv-id">
                  {String(i + 1).padStart(2, '0')} · {r.name}
                </span>
                <span className="tp-cat">
                  {r.match_kind ?? '·'}
                  {r.api_dialect ? ` · ${r.api_dialect}` : ''}
                </span>
              </div>
              {r.providers.length > 0 && (
                <p className="pv-desc">
                  scope:{' '}
                  {r.providers.map((pv, j) => (
                    <span key={pv}>
                      {j > 0 && ' · '}
                      {ROOMED_PROVIDERS.has(pv) ? (
                        <Link to={`/catalog/providers/${pv}`}>{pv}</Link>
                      ) : (
                        pv
                      )}
                    </span>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CatalogSection>
      <Island id="cat-caps" payload={payload} />
    </CatalogShell>
  )
}
