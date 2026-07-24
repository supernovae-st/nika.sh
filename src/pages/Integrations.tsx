import { useMemo } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrIntegrations, loadIntegrations } from '../lib/integrations-access'
import { INTEGRATION_TABS } from '../content/integrations-tabs'
import type { IntegrationEntry } from '../content/integrations'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './providers-page.css'

/* ─── /integrations · get Nika into your stack (theme-dark) ───────────────────
   Named for how people actually search (Ahrefs 2026-07-24: « claude
   skills » · « mcp server » · « claude code plugins » — nobody types
   « ecosystem »), organized for how people actually install: BY CLIENT
   first (Claude Code · Codex · Cursor · VS Code · Hermes · any MCP
   client), the full kit for someone with all three lanes, then the
   public repos as the reference wing. README-true by law
   (integrations.ts header). */

type Cargo = { list: IntegrationEntry[]; kit: { text: string; code: string }[] }

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  /* the cargo rides a byte island (register-diet law): the authored
     register is an async chunk, the prerendered HTML carries it whole */
  const payload = useIslandPayload(
    'int-hub',
    (() => {
      const m = ssrIntegrations()
      return m ? JSON.stringify({ list: m.INTEGRATIONS, kit: m.FULL_KIT }) : null
    })(),
    async () => {
      const m = await loadIntegrations()
      return JSON.stringify({ list: m.INTEGRATIONS, kit: m.FULL_KIT })
    },
  )
  const cargo = useMemo(() => (payload ? (JSON.parse(payload) as Cargo) : null), [payload])
  const clients = cargo?.list.filter((e) => e.kind === 'client') ?? []
  const surfaces = cargo?.list.filter((e) => e.kind === 'surface') ?? []
  const clientCount = INTEGRATION_TABS.filter((t) => t.kind === 'client').length
  const surfaceCount = INTEGRATION_TABS.filter((t) => t.kind === 'surface').length

  const title = 'Integrations · Claude Code, Codex, Cursor, VS Code, MCP · Nika'
  const description = `Plug Nika into what you already run: the agent plugin (Claude Code · Codex · Cursor · Hermes), the editor extension (VS Code · Cursor · Windsurf), the MCP server in the binary — and the ${INTEGRATION_TABS.length} public surfaces behind them.`

  useHead({
    title,
    link: routeHead('/integrations').link,
    meta: [
      ...routeHead('/integrations').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-integrations.png' },
      {
        property: 'og:image:alt',
        content: 'Nika integrations: your agent, your editor, your terminal — one kit.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': `${SITE}/integrations`,
          name: 'Nika integrations',
          description,
        }),
        processTemplateParams: false,
      },
    ],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="int-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id="int-hub" payload={payload ?? ''} />
          <p className="v4sec-fig" data-rise>
            the integrations
          </p>
          <h1 id="int-title" className="v4sec-title tp-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            In your stack.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Nika meets you where you work: your agent gets the plugin kit, your editor gets the
            live DAG, your terminal gets the binary — and they compose. Every room below is
            README-true: the commands are the repos' own, never invented.
          </p>

          <StampStrip
            items={[
              { n: clientCount, label: 'client lanes', sub: 'agent · editor · MCP' },
              { n: surfaceCount, label: 'public repos', sub: 'the reference wing' },
              { n: 'v1', label: 'one envelope', sub: 'the same file everywhere' },
              { n: 'read-only', label: 'the oracle', sub: 'agents audit before they spend' },
            ]}
          />

          {/* ── the full kit · all three lanes in one sitting ── */}
          <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            <div className="cl-year-head">
              <h2 id="int-kit" className="td-h2">
                the full kit
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">terminal + editor + agent · they compose</span>
            </div>
            <p className="td-gloss">
              Most people run all three. The binary does the work, the extension draws the file,
              the plugin teaches the agent to delegate — one sitting installs the lot.
            </p>
            <dl className="pv-facts">
              {(cargo?.kit ?? []).map((s) => (
                <div className="pv-fact" key={s.text}>
                  <dt>{s.text}</dt>
                  <dd>
                    <code>{s.code}</code>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── by client · how you actually arrive ── */}
          <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            <div className="cl-year-head">
              <h2 id="int-clients" className="td-h2">
                pick your client
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {clientCount} lanes · one room each
              </span>
            </div>
            <ol className="tp-list">
              {clients.map((e) => (
                <li key={e.id} className="tp-row" id={e.id}>
                  <div className="pv-row-head">
                    <Link className="pv-id" to={`/integrations/${e.id}`} title="open the integration's room">
                      {e.name}
                    </Link>
                    <span className="tp-cat">{e.license}</span>
                  </div>
                  <p className="pv-desc">{e.what}</p>
                  {e.install[0]?.code && (
                    <dl className="pv-facts">
                      <div className="pv-fact">
                        <dt>{e.install[0].text.toLowerCase()}</dt>
                        <dd>
                          <code>{e.install[0].code}</code>
                        </dd>
                      </div>
                    </dl>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* ── the reference wing · the repos behind the doors ── */}
          <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
            <div className="cl-year-head">
              <h2 id="int-surfaces" className="td-h2">
                the public surfaces
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {surfaceCount} repos · every claim README-true
              </span>
            </div>
            <ol className="tp-list">
              {surfaces.map((e) => (
                <li key={e.id} className="tp-row" id={e.id}>
                  <div className="pv-row-head">
                    <Link className="pv-id" to={`/integrations/${e.id}`} title="open the surface's room">
                      {e.name}
                    </Link>
                    <span className="tp-cat">{e.license}</span>
                  </div>
                  <p className="pv-desc">{e.what}</p>
                </li>
              ))}
            </ol>
          </div>

          <p className="tp-foot" data-rise>
            Start local: <Link to="/install">install the binary</Link>. The whole language lives
            in <Link to="/map">the map</Link>. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
