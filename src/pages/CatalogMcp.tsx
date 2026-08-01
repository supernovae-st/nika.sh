/* ─── /catalog/mcp · the MCP server register (engine-release clock) ──────────
   The tool servers the binary can wire — aligned to the upstream MCP
   registry, one room each. NOT the oracle: these are the third-party
   servers a workflow can invoke, not the site's own 9 tools. */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogCargo, useCatalogHead } from './catalog-lib'

type Row = { id: string; slug: string; category: string | null; pricing: string | null; env: number; desc: string | null }

const DESC = `The ${CATALOG_COUNTS.mcp_servers} MCP servers the released binary's catalog names — registry-aligned, packages and env vars declared, one room each.`

export function Component() {
  useCatalogHead('/catalog/mcp', 'MCP servers', DESC)
  const { payload, data } = useCatalogCargo<Row[]>('cat-mcp', (m) =>
    m.MCP_SERVERS.map((s) => ({
      id: s.id,
      slug: s.slug,
      category: s.category,
      pricing: s.pricing,
      env: s.env_vars.length,
      desc: s.description,
    })),
  )
  const cats = [...new Set((data ?? []).map((s) => s.category ?? 'other'))].sort()
  return (
    <CatalogShell
      fig={`the mcp servers · ${CATALOG_COUNTS.mcp_servers}`}
      title="The tools a workflow can wire."
      lede={
        <>
          Registry-aligned MCP servers, vendored with the release: what each one does, how it
          installs, which env vars it takes. In a workflow they answer to{' '}
          <code>invoke: "mcp:&lt;server&gt;.&lt;tool&gt;"</code> — the boundary still decides what
          runs.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
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
                    <span className="tp-cat">
                      {s.pricing ?? '·'}
                      {s.env ? ` · ${s.env} env` : ' · keyless'}
                    </span>
                  </div>
                  {s.desc && <p className="pv-desc">{s.desc}</p>}
                </li>
              ))}
            </ol>
          </CatalogSection>
        )
      })}
      <Island id="cat-mcp" payload={payload} />
    </CatalogShell>
  )
}
