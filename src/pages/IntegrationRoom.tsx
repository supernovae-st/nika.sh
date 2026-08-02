import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrIntegrations, loadIntegrations } from '../lib/integrations-access'
import { INTEGRATION_TABS } from '../content/integrations-tabs'
import type { IntegrationEntry } from '../content/integrations'
import type { ClientDoor } from '../content/catalog.generated'
import { CLIENT_DOOR_IDS } from '../content/client-doors'
import { CATALOG_ENGINE } from '../content/catalog-paths.generated'
import { useCatalogCargo } from './catalog-lib'
import { SITE, routeHead } from '../content'
import { appLd, crumbLd, ldScript } from '../lib/ld'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './providers-page.css'

/* ─── /integrations/:id · one lane or surface, one room (theme-dark) ──────────
   The room recipe applied to the product itself: what you get, how it
   works, the install ritual (verbatim from the repo's README), the
   « if you also run … » pairing for people with more than one lane, the
   doors into the site's registers, the external homes. */

const islandId = (id: string) => `int-room-${id}`

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { id: rawId } = useParams()
  const id = (rawId ?? '').toLowerCase()
  /* the walk rides the chrome-lean TABS (sync, tiny); the entry's BODY
     rides the byte island (register-diet law) */
  const at = useMemo(() => INTEGRATION_TABS.findIndex((t) => t.id === id), [id])
  const tab = at >= 0 ? INTEGRATION_TABS[at] : undefined
  const prev = at > 0 ? INTEGRATION_TABS[at - 1] : undefined
  const next = at >= 0 && at < INTEGRATION_TABS.length - 1 ? INTEGRATION_TABS[at + 1] : undefined

  const payload = useIslandPayload(
    islandId(id),
    (() => {
      const m = ssrIntegrations()
      return m ? JSON.stringify(m.INTEGRATION_INDEX[id] ?? null) : null
    })(),
    async () => JSON.stringify((await loadIntegrations()).INTEGRATION_INDEX[id] ?? null),
  )
  const hit = useMemo(
    () => (payload ? ((JSON.parse(payload) ?? undefined) as IntegrationEntry | undefined) : undefined),
    [payload],
  )

  /* THE DOOR FACET (2026-08-02) · 26 of the 31 rows in the coverage matrix
     had no room at all — four of them PROVEN live. A door room renders what
     the released binary proves and nothing else, so it needs no authored
     prose to exist and cannot drift from the engine. */
  const doorAt = CLIENT_DOOR_IDS.indexOf(id)
  const { payload: doorPayload, data: door } = useCatalogCargo<ClientDoor | null>(
    `int-door-${id}`,
    (m) => (doorAt >= 0 ? (m.CLIENTS.find((c) => c.id === id) ?? null) : null),
  )
  const doorPrev = doorAt > 0 ? CLIENT_DOOR_IDS[doorAt - 1] : undefined
  const doorNext =
    doorAt >= 0 && doorAt < CLIENT_DOOR_IDS.length - 1 ? CLIENT_DOOR_IDS[doorAt + 1] : undefined
  const comps = door ? Object.entries(door.components) : []

  const title = hit
    ? `${hit.title} · Nika`
    : tab
      ? `${tab.name} · Integrations · Nika`
      : door
        ? `${door.name} · Client coverage · Nika`
        : `${id} · Not an integration · Nika`
  const description = hit
    ? `${hit.what} License: ${hit.license}; source and claims live in the repo. This room is its projection.`
    : door
      ? `What ${CATALOG_ENGINE.release_tag} proves about ${door.name}: ${door.status}, class ${door.class}${
          door.wire ? `, wired with nika wire ${door.wire}` : ''
        }. The install line, the pieces the kit lands, and the gaps the coverage run names.`
      : `${id} is not a lane or surface the ecosystem ships.`

  useHead({
    title,
    link: routeHead(`/integrations/${id}`).link,
    meta: [
      ...routeHead(`/integrations/${id}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-integrations.png' },
      {
        property: 'og:image:alt',
        content: 'Nika integrations: your agent, your editor, your terminal: one kit.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    script: hit
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Integrations', item: `${SITE}/integrations` },
                  { '@type': 'ListItem', position: 2, name: hit.name },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                '@id': `${SITE}/integrations/${hit.id}`,
                name: hit.name,
                description: hit.what,
                url: `${SITE}/integrations/${hit.id}`,
                license: hit.license,
                codeRepository: hit.repo,
              },
            ]),
            processTemplateParams: false,
          },
        ]
      : door
        ? [
            ldScript([
              crumbLd([
                { name: 'Integrations', path: '/integrations' },
                { name: door.name },
              ]),
              appLd({
                path: `/integrations/${door.id}`,
                name: door.name,
                description,
              }),
            ]),
          ]
        : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="int-room-title" className="v4sec v4-in" data-integration={hit?.id}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/integrations" className="td-crumb-link">
              ← the integrations
            </Link>
            {hit && (
              <span className="tp-cat">
                {hit.kind === 'client' ? 'a client lane' : 'a public surface'} · {hit.license}
              </span>
            )}
            {!hit && door && (
              <span className="tp-cat">
                a client door · class {door.class} · {door.status}
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the integrations
          </p>
          <h1
            id="int-room-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {tab ? tab.name : (door?.name ?? id)}
          </h1>

          <Island id={islandId(id)} payload={payload ?? ''} />

          {!tab && doorAt < 0 && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{id}</p>
              <p>
                is not a lane or surface the ecosystem ships.{' '}
                <Link to="/integrations">The register</Link> lists every client and every public
                repo.
              </p>
            </div>
          )}

          <Island id={`int-door-${id}`} payload={doorPayload} />

          {/* ── the door facet · what the released binary proves ────────────
              No authored prose lives here on purpose: every line is a field
              of the coverage record, so the room cannot drift from the
              engine it describes. */}
          {!hit && door && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {door.status === 'proven'
                  ? 'Proven live: someone ran a real task through this client against the binary, and the pair is recorded.'
                  : door.status === 'wired'
                    ? 'Wired: the connection is written and lands, and no end-to-end run is recorded yet.'
                    : 'Recon: the client is mapped, and nothing is wired yet.'}{' '}
                Class {door.class}
                {door.class === 'A'
                  ? ': it loads a native plugin, so the skills, the commands and the oracle arrive together.'
                  : door.class === 'B'
                    ? ': no plugin loader, so MCP and the scaffold carry the teaching.'
                    : ': it speaks MCP and nothing else, so the oracle is the whole surface.'}
              </p>

              <StampStrip
                items={[
                  { n: door.status, label: 'the state', sub: `at ${CATALOG_ENGINE.release_tag}` },
                  { n: door.class, label: 'the class', sub: 'how much lands' },
                  { n: comps.length, label: comps.length === 1 ? 'piece lands' : 'pieces land', sub: 'named below' },
                  { n: door.gaps.length, label: door.gaps.length === 1 ? 'gap' : 'gaps', sub: door.gaps.length ? 'named, not hidden' : 'nothing missing' },
                ]}
              />

              {/* ── get set up ── */}
              {door.install && (
                <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                  <div className="cl-year-head">
                    <h2 className="td-h2">get set up</h2>
                    <span className="cl-year-rule" aria-hidden />
                  </div>
                  <p className="td-gloss">
                    <code>{door.install}</code>
                  </p>
                  {door.wire && (
                    <p className="td-gloss">
                      The binary writes that itself: <code>nika wire {door.wire}</code> puts the
                      oracle where this client looks for it, and <code>nika doctor</code> says so
                      when the two fall out of step.
                    </p>
                  )}
                </div>
              )}

              {/* ── what lands ── */}
              {comps.length > 0 && (
                <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                  <div className="cl-year-head">
                    <h2 className="td-h2">what lands, and how</h2>
                    <span className="cl-year-rule" aria-hidden />
                    <span className="cl-year-count">{comps.length}</span>
                  </div>
                  <ol className="td-args tp-args">
                    {comps.map(([piece, how]) => (
                      <li className="tp-arg" key={piece} style={{ listStyle: 'none' }}>
                        <span className="tp-arg-name">{piece}</span>
                        <span className="tp-arg-desc">{how}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* ── what does not land ── */}
              {(door.gaps.length > 0 || door.class_gap) && (
                <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '250ms' }}>
                  <div className="cl-year-head">
                    <h2 className="td-h2">what does not</h2>
                    <span className="cl-year-rule" aria-hidden />
                  </div>
                  {door.gaps.length > 0 && (
                    <ul className="td-chips">
                      {door.gaps.map((g) => (
                        <li key={g}>
                          <span className="td-chip" title="the kit carries this; this client cannot load it">
                            {g}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {door.class_gap && <p className="td-gloss">{door.class_gap}</p>}
                </div>
              )}

              {/* ── cross-references ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '270ms' }}>
                <div className="cl-year-head">
                  <h2 className="td-h2">cross-references</h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  <div>
                    <p className="td-ref-k">the rooms it touches</p>
                    <ul className="td-chips">
                      <li>
                        {/* the section's real id · #doors was a guess and the
                            link gate caught it on all 25 rooms at once */}
                        <Link className="td-chip" to="/integrations#int-doors">
                          the coverage matrix
                        </Link>
                      </li>
                      <li>
                        <Link className="td-chip" to="/integrations/mcp">
                          the oracle, any MCP client
                        </Link>
                      </li>
                      <li>
                        <Link className="td-chip" to="/install">
                          install the binary
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="td-ref-k">where this comes from</p>
                    <ul className="td-chips">
                      <li>
                        {/* the ship log is /changelog · « /releases » was a
                            url I invented, and it never existed */}
                        <Link className="td-chip" to="/changelog">
                          {CATALOG_ENGINE.release_tag}
                        </Link>
                      </li>
                      <li>
                        <span className="td-chip" title="the id the coverage run uses">
                          {door.id}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── the walk, among the door rooms ── */}
              <nav className="td-nav" aria-label="Client doors walk" data-rise>
                {doorPrev ? (
                  <Link className="td-nav-link" to={`/integrations/${doorPrev}`}>
                    <span className="td-nav-label">← previous</span>
                    {doorPrev}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/integrations">
                  <span className="td-nav-label">all {CLIENT_DOOR_IDS.length + INTEGRATION_TABS.length}</span>
                  the register
                </Link>
                {doorNext ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/integrations/${doorNext}`}>
                    <span className="td-nav-label">next →</span>
                    {doorNext}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            </>
          )}

          {hit && (
            <>
              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {hit.what} Source, license and claims live in <a href={hit.repo}>the repo</a>.
                this room is its projection, never its replacement.
              </p>

              <StampStrip
                items={[
                  { n: hit.kind === 'client' ? 'client' : 'surface', label: 'the kind', sub: hit.kind === 'client' ? 'plug it into your tool' : 'a repo behind the doors' },
                  { n: hit.license, label: 'the license', sub: 'read it in the repo' },
                  { n: hit.install.length, label: hit.install.length === 1 ? 'install step' : 'install steps', sub: 'the ritual below' },
                  { n: at + 1, label: `of ${INTEGRATION_TABS.length}`, sub: 'prev / next walk them' },
                ]}
              />

              {/* ── how it works ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <div className="cl-year-head">
                  <h2 id="int-how" className="td-h2">
                    how it works
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <p className="td-gloss">{hit.how}</p>
              </div>

              {/* ── get set up ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="int-setup" className="td-h2">
                    get set up
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <ol className="td-args tp-args">
                  {hit.install.map((s, i) => (
                    <li className="tp-arg" key={i} style={{ listStyle: 'none' }}>
                      <span className="tp-arg-name">{i + 1}</span>
                      <span className="tp-arg-desc">
                        {s.text}
                        {s.code && (
                          <>
                            {' '}
                            <code>{s.code}</code>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                {hit.kind === 'client' && (
                  <p className="td-gloss">
                    Out of sync · the binary moved and the kit stayed behind?{' '}
                    <code>nika doctor</code> names the lagging kit and prints the exact
                    per-client fix.
                  </p>
                )}
                {hit.also && (
                  <p className="td-gloss">
                    {hit.also.text} <Link to={hit.also.href}>{hit.also.label} →</Link>
                  </p>
                )}
              </div>

              {/* ── what lands in the agent · the kit, named (SSOT: the
                  agents repo ships ONE kit; the mcp tools own rooms) ── */}
              {hit.kit && (
                <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
                  <div className="cl-year-head">
                    <h2 id="int-kit-contents" className="td-h2">
                      what lands in the agent
                    </h2>
                    <span className="cl-year-rule" aria-hidden />
                    <span className="cl-year-count">
                      {hit.kit.skills.length} skills · {hit.kit.subagents.length} subagents ·{' '}
                      {hit.kit.commands.length} commands · {hit.kit.mcpTools.length} oracle tools
                    </span>
                  </div>
                  <div className="td-refs">
                    <div>
                      <p className="td-ref-k">the skills · when to reach for nika</p>
                      <ul className="td-chips">
                        {hit.kit.skills.map((s) => (
                          <li key={s}>
                            <span className="td-chip" title="loads when the task matches">
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="td-ref-k">the subagents · author, debug, migrate</p>
                      <ul className="td-chips">
                        {hit.kit.subagents.map((s) => (
                          <li key={s}>
                            <span className="td-chip" title="a focused worker with its own protocol">
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="td-ref-k">the commands · one keystroke each</p>
                      <ul className="td-chips">
                        {hit.kit.commands.map((c) => (
                          <li key={c}>
                            <span className="td-chip">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="td-ref-k">the oracle tools · read-only, one room each</p>
                      <ul className="td-chips">
                        {hit.kit.mcpTools.map((t) => (
                          <li key={t}>
                            <Link className="td-chip" to={`/how/oracle/${t}`}>
                              {t}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ── cross-references ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <div className="cl-year-head">
                  <h2 id="int-refs" className="td-h2">
                    cross-references
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  <div>
                    <p className="td-ref-k">the rooms it touches</p>
                    <ul className="td-chips">
                      {hit.doors.map((d) => (
                        <li key={d.href}>
                          <Link className="td-chip" to={d.href}>
                            {d.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="td-ref-k">where it lives</p>
                    <ul className="td-chips">
                      <li>
                        <a className="td-chip" href={hit.repo}>
                          the source
                        </a>
                      </li>
                      {(hit.external ?? []).map((x) => (
                        <li key={x.href}>
                          <a className="td-chip" href={x.href}>
                            {x.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── the walk ── */}
              <nav className="td-nav" aria-label="Integrations walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/integrations/${prev.id}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.name}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/integrations">
                  <span className="td-nav-label">all {INTEGRATION_TABS.length}</span>
                  the register
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/integrations/${next.id}`}>
                    <span className="td-nav-label">next →</span>
                    {next.name}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                Start local: <Link to="/install">install</Link>. The whole language lives in{' '}
                <Link to="/map">the map</Link>. <Link to="/language/spec">Read the spec →</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
