/* ─── /catalog/mcp · the MCP server register (engine-release clock) ──────────
   The tool servers the binary can wire · aligned to the upstream MCP
   registry, one room each. NOT the oracle: these are the third-party
   servers a workflow can invoke, not the site's own 9 tools. */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'
import './catalog-models.css'

type Row = {
  id: string
  slug: string
  category: string | null
  pricing: string | null
  env: number
  desc: string | null
  ro: boolean
  del: boolean
  off: boolean
}

const DESC = `The ${CATALOG_COUNTS.mcp_servers} MCP servers the released binary's catalog names · registry-aligned, packages and env vars declared, one room each.`

export function Component() {
  useCatalogHead('/catalog/mcp', 'MCP servers', DESC, [
    collectionLd({ path: '/catalog/mcp', name: 'MCP servers · Nika', description: DESC, total: CATALOG_COUNTS.mcp_servers }),
  ])
  const { payload, data } = useCatalogCargo<Row[]>('cat-mcp', (m) =>
    m.MCP_SERVERS.map((s) => ({
      id: s.id,
      slug: s.slug,
      category: s.category,
      pricing: s.pricing,
      env: s.env_vars.length,
      desc: s.description,
      ro: s.tags.includes('read-only'),
      del: s.tags.includes('destructive'),
      off: s.tags.includes('official'),
    })),
  )
  const cats = [...new Set((data ?? []).map((s) => s.category ?? 'other'))].sort()
  /* the trust ledger · every number DERIVED from the vendored register —
     read-only vs destructive is the boundary's own partition of the list */
  const nRo = (data ?? []).filter((s) => s.ro).length
  const nDel = (data ?? []).filter((s) => s.del).length
  const nOff = (data ?? []).filter((s) => s.off).length
  const nKeyless = (data ?? []).filter((s) => s.env === 0).length
  return (
    <CatalogShell
      fig={`the mcp servers · ${CATALOG_COUNTS.mcp_servers}`}
      title="The tools a workflow can wire."
      lede={
        <>
          Registry-aligned MCP servers, vendored with the release: what each one does, how it
          installs, which env vars it takes. In a workflow they answer to <code>invoke</code> with{' '}
          <code>tool: "mcp:&lt;server&gt;/&lt;tool&gt;"</code> · the boundary still decides what
          runs.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      {/* the jump rail · 17 categories is a WALK, not a glance — one door per
          section (the pricing-rail grammar · categorical registers get a rail,
          only measured quantities get an axis) */}
      {cats.length > 1 && (
        <nav className="pv-desc cm-facts" aria-label="Jump to a category" style={{ lineHeight: 2 }}>
          {cats.map((c, i) => (
            <span key={c}>
              {i > 0 && ' · '}
              <a href={`#c-${c}`}>{c}</a>
            </span>
          ))}
        </nav>
      )}
      {cats.map((c) => {
        const rows = (data ?? []).filter((s) => (s.category ?? 'other') === c)
        return (
          <CatalogSection key={c} id={`c-${c}`} title={`${c} · ${rows.length}`}>
            <ol className="tp-list">
              {rows.map((s) => (
                <li key={s.slug} className="tp-row">
                  <div className="pv-row-head">
                    <Link className="pv-id" to={`/catalog/mcp/${s.slug}`}>
                      {s.id}
                    </Link>
                    <span className="tp-cat cm-facts">
                      {s.pricing ?? '·'}
                      {s.env ? ` · ${s.env} env` : ' · keyless'}
                      {/* the registry's own trust tags · the glyph seconds the
                          word, never colour alone · untagged shows nothing */}
                      {s.del && ' · ⚠ destructive'}
                      {s.off && ' · official'}
                      {s.ro && <span className="cm-open">◇ read-only</span>}
                    </span>
                  </div>
                  {s.desc && <p className="pv-desc">{s.desc}</p>}
                </li>
              ))}
            </ol>
          </CatalogSection>
        )
      })}
      {/* the trust ledger · derived from the vendored register, never typed */}
      <p className="pv-desc cm-facts">
        {CATALOG_COUNTS.mcp_servers} servers · {cats.length} categories · {nDel} tagged destructive
        · {nRo} read-only · {nOff} official · {nKeyless} keyless · the permit decides what runs
      </p>
      <Island id="cat-mcp" payload={payload} />
    </CatalogShell>
  )
}
