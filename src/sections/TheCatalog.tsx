import { Link } from 'react-router'
import { CATALOG_COUNTS, CATALOG_ENGINE } from '../content/catalog-paths.generated'
import { SectionHead } from '../components/SectionHead'
import { useRevealOnce } from './use-reveal-once'
import './v4-home.css'

/* ─── FIG 07 · The catalog (theme-dark · what the released binary knows) ──────
   The reach chapter's second half: Toolbelt (06) says what the verbs may USE;
   this register says what the binary KNOWS · 64 models with a room each, the
   pricing and measured-energy tables, 105 MCP servers, the client doors. The
   operator's 2026-08-02 finding (« il est où le catalogue ? ») was that the
   site's richest register had no first-screen presence — this is its seat.

   Numbers-as-design (the ProofStrip law): every figure imports from
   CATALOG_COUNTS (the chrome-lean module · register-diet-exempt), recounted
   against the vendored TOML bytes by catalog.test — never typed here. Rows,
   not cards: the section renders like the catalog pages it opens. */

const C = CATALOG_COUNTS

const ROWS: { n: number; unit: string; gloss: string; to: string }[] = [
  {
    n: C.models,
    unit: 'models',
    gloss: `one room each · seats across ${C.market_providers} providers, prices and energy beside the seat`,
    to: '/catalog/models',
  },
  {
    n: C.pricing_rules,
    unit: 'pricing rules',
    gloss: 'resolved the way the engine bills · $ per 1M tokens, longest-prefix wins',
    to: '/catalog/pricing',
  },
  {
    n: C.energy_rows,
    unit: 'energy rows',
    gloss: 'measured Wh per 1k tokens · published verbatim, never modeled',
    to: '/catalog/energy',
  },
  {
    n: C.mcp_servers,
    unit: 'MCP servers',
    gloss: 'one room each · the invoke block ready to paste into your file',
    to: '/catalog/mcp',
  },
  {
    n: C.embeddings,
    unit: 'embedding models',
    gloss: 'the recall seats · dimensions and context windows',
    to: '/catalog/embeddings',
  },
  {
    n: C.capability_rules,
    unit: 'capability rules',
    gloss: 'what each seat may do · tools, vision, caching, gated by rule',
    to: '/catalog/capabilities',
  },
  {
    n: C.clients,
    unit: 'client doors',
    gloss: `pick your entry · Claude Code, Codex, Cursor and more · ${C.clients_proven} proven end-to-end`,
    to: '/integrations',
  },
]

export default function TheCatalog() {
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section
      ref={ref}
      id="catalog"
      aria-labelledby="catalog-title"
      className="theme-dark v4sec v4-cv scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <SectionHead fig="07" id="catalog-title" title={<>The catalog. What the released binary knows.</>}>
          Every seat <code>nika</code> can hold ships <i>inside</i> the binary: models, prices,
          measured energy, MCP servers. This site vendors those tables from the engine at{' '}
          <b>{CATALOG_ENGINE.release_tag}</b> and gives every member a room you can open · each
          number below derives from the vendored bytes, none is typed.
        </SectionHead>

        <ul className="v4cat-rows" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
          {ROWS.map((r) => (
            <li key={r.to}>
              <Link to={r.to} className="v4cat-row">
                <span className="v4cat-n">{r.n}</span>
                <span className="v4cat-unit">{r.unit}</span>
                <span className="v4cat-gloss">{r.gloss}</span>
                <span className="v4cat-go" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="v4cat-punch" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
          <Link to="/catalog" className="v4cat-hub">
            Walk the whole register · <b>/catalog</b>
            <span aria-hidden> →</span>
          </Link>
        </p>
      </div>
    </section>
  )
}
