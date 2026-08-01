/* ─── /catalog/mcp/:slug · one MCP server, whole ─────────────────────────────
   The room contract: what it is + the try-it + provenance above the fold;
   packages and env vars below. Secrets stay names · a room never teaches
   pasting a key into a file. The island id carries the slug (SPA-nav law). */
import { Link, useLocation } from 'react-router'
import { Island } from '../lib/ssg-island'
import { MCP_SLUGS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { useCatalogCargo, useCatalogHead } from './catalog-lib'

type McpServerEntry = import('../content/catalog.generated').McpServerEntry

export function Component() {
  const { pathname } = useLocation()
  const slug = pathname.split('/')[3] ?? ''
  const known = MCP_SLUGS.includes(slug)
  const { payload, data: s } = useCatalogCargo<McpServerEntry | null>(
    `cat-mcp-${slug}`,
    (m) => m.MCP_SERVERS.find((x) => x.slug === slug) ?? null,
  )
  useCatalogHead(
    `/catalog/mcp/${slug}`,
    known ? `${s?.id ?? slug} · MCP` : 'Not a server',
    known
      ? `${s?.id ?? slug}: ${s?.description ?? 'an MCP server the released binary can wire.'}`
      : `${slug} names no MCP server in the released catalog.`,
  )
  if (!known) {
    return (
      <CatalogShell
        fig="the mcp servers"
        title="Not in this catalog."
        lede={
          <>
            `{slug}` names no MCP server here. <Link to="/catalog/mcp">The register</Link> lists
            every one.
          </>
        }
        crumb={{ to: '/catalog/mcp', label: 'MCP servers' }}
      >
        {null}
      </CatalogShell>
    )
  }
  return (
    <CatalogShell
      fig={`mcp · ${s?.category ?? 'server'}`}
      title={s?.title ?? slug}
      lede={<>{s?.description ?? 'An MCP server the released binary can wire.'}</>}
      crumb={{ to: '/catalog/mcp', label: 'MCP servers' }}
    >
      <CatalogSection id="try" title="Call it from a workflow">
        <pre className="src-cmd mono">
          <code>{`tasks:\n  work:\n    invoke: "mcp:${s?.id ?? slug}.<tool>"\npermits:\n  mcp: ["${s?.id ?? slug}"]`}</code>
        </pre>
        <p className="pv-desc">
          The permit names the server · absent means the empty boundary, and the run refuses before
          a call leaves.
        </p>
      </CatalogSection>
      {s && s.packages.length > 0 && (
        <CatalogSection id="packages" title={`Packages · ${s.packages.length}`}>
          <ul className="td-chips">
            {s.packages.map((p, i) => (
              <li key={i}>
                <span className="td-chip">
                  {p.registry ?? 'pkg'} · {p.identifier ?? '·'}
                </span>
              </li>
            ))}
          </ul>
        </CatalogSection>
      )}
      {s && s.env_vars.length > 0 && (
        <CatalogSection id="env" title={`Env vars · ${s.env_vars.length}`}>
          <ul className="td-chips">
            {s.env_vars.map((e) => (
              <li key={e}>
                <span className="td-chip">{e}</span>
              </li>
            ))}
          </ul>
          <p className="pv-desc">Names only · secrets ride the environment, never a file.</p>
        </CatalogSection>
      )}
      <Island id={`cat-mcp-${slug}`} payload={payload} />
    </CatalogShell>
  )
}
