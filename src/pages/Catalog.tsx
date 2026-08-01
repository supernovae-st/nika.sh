/* ─── /catalog · the hub of what the released binary knows (D1) ──────────────
   The catalogue world: models · pricing · energy · MCP servers · embeddings ·
   capability rules — every figure derived from the vendored engine surfaces
   at the pin, never typed. The hub teaches the seam first (loi 3: the site
   explains how it works before listing members). Chrome-lean by law: the hub
   reads only the tiny counts module — the heavy cargo stays an async chunk. */
import { Link } from 'react-router'
import { StampStrip } from '../components/StampStrip'
import { CATALOG_COUNTS, CATALOG_ENGINE } from '../content/catalog-paths.generated'
import { PROVIDERS } from '../content/providers.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogHead } from './catalog-lib'

const C = CATALOG_COUNTS
const DESC = `What the released nika binary knows, page by page: ${C.models} models, ${C.pricing_rules} pricing rules, ${C.energy_rows} measured energy rows, ${C.mcp_servers} MCP servers, ${C.embeddings} embedding models — vendored from ${CATALOG_ENGINE.release_tag}, digest-verified.`

const DOORS: { to: string; title: string; count: number; unit: string; gloss: string }[] = [
  { to: '/catalog/models', title: 'Models', count: C.models, unit: 'models', gloss: 'Every model the wire catalog names — who serves it, what it costs, what it burns.' },
  { to: '/catalog/pricing', title: 'Pricing', count: C.pricing_rules, unit: 'rules', gloss: 'The USD-per-million table the audit reads. A local model is unpriced, never free.' },
  { to: '/catalog/energy', title: 'Energy', count: C.energy_rows, unit: 'rows', gloss: 'Measured watt-hours per million output tokens — provenance printed verbatim.' },
  { to: '/catalog/mcp', title: 'MCP servers', count: C.mcp_servers, unit: 'servers', gloss: 'The tool servers the binary can wire — registry-aligned, env vars named.' },
  { to: '/catalog/embeddings', title: 'Embeddings', count: C.embeddings, unit: 'models', gloss: 'Dimensions, windows, similarity metrics — vector compatibility as compile-time fact.' },
  { to: '/catalog/capabilities', title: 'Capability rules', count: C.capability_rules, unit: 'rules', gloss: 'How the engine decides what a model can do — first match wins, the engine resolves.' },
]

export function Component() {
  useCatalogHead('/catalog', 'The catalog', DESC)
  return (
    <CatalogShell
      fig="the catalog"
      title="What the released binary knows."
      lede={
        <>
          Two catalogs live in Nika and this page keeps them honest. The{' '}
          <Link to="/providers">{PROVIDERS.length} canonical providers</Link> are the standard — the
          seats the spec names. THIS world is the market facet: everything the downloadable binary
          ships knowledge of, vendored at the release pin — never HEAD, never a fetch. Each count
          names its clock.
        </>
      }
    >
      <StampStrip
        items={[
          { n: C.models, label: 'models', sub: 'the wire catalog' },
          { n: C.market_providers, label: 'market providers', sub: `${PROVIDERS.length} canonical seats` },
          { n: C.pricing_rules, label: 'pricing rules', sub: 'the audit reads these' },
          { n: C.clients, label: 'client doors', sub: 'wire yours' },
        ]}
      />
      <CatalogSection id="doors" title="The registers">
        <ol className="tp-list">
          {DOORS.map((d) => (
            <li key={d.to} className="tp-row">
              <div className="pv-row-head">
                <Link className="pv-id" to={d.to}>
                  {d.title}
                </Link>
                <span className="tp-cat">
                  {d.count} {d.unit}
                </span>
              </div>
              <p className="pv-desc">{d.gloss}</p>
            </li>
          ))}
        </ol>
      </CatalogSection>
      <CatalogSection id="doors-clients" title="Your client is a door">
        <p className="pv-desc">
          The kit ships once and {C.clients} clients load it — Claude Code, Codex, Cursor and the
          rest. Pick yours, run its one-line install, and the oracle, the skills and the commands
          arrive together. <Link to="/integrations">Wire your client →</Link>
        </p>
      </CatalogSection>
      <p className="hub-foot">
        <Link to="/nika-graph.json" reloadDocument>
          The machine twin
        </Link>{' '}
        · every fact on these pages, as evidence-bearing triples.
      </p>
    </CatalogShell>
  )
}
