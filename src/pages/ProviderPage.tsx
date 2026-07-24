import { useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
/* lz-string is CJS — named ESM imports break the Node prerender (SSG);
   the default import is the law (Play.tsx · ScrollMorph.tsx) */
import lz from 'lz-string'
import { PlanMap } from '../components/PlanMap'
import { deriveWorkflow } from '../flagships/derive'
import { SourcesRail } from '../components/SourcesRail'
import { TruthLine } from '../components/TruthLine'
import { Island } from '../lib/ssg-island'
import { useIslandPayload } from '../lib/use-island-payload'
import { ssrBlogRails, loadBlogRails } from '../lib/blog-rails-access'
import { ssrProviderRoom, loadProviderRoom, type ProviderRoomCargo } from '../lib/provider-room-access'
import { PROVIDERS, PROVIDER_INDEX, EMBEDDED_EXTRA, type ProviderEntry } from '../content/providers.generated'
import { PROVIDER_SOURCES } from '../content/sources'
import { SITE, routeHead } from '../content'
import '../sections/v4-home.css'
import './tools-page.css'
import './tool-detail.css'
import './providers-page.css'
import './hubs-page.css'

/* ─── /providers/:id · one provider, one room (theme-dark) ────────────────────
   The WordPage recipe applied to the provider catalog: everything DERIVED
   rides providers.generated.ts (the engine's own catalog, byte-diff gated),
   everything AUTHORED rides provider-meta.ts (the angle · the setup ritual ·
   the verified console link), and the room's evidence is a crafted donor
   from content/provider-usage/ shown whole, with the audit the released
   binary gave it (provider-usage.generated.ts — the honest-evidence law:
   a cataloged-but-not-yet-runnable vendor says so, never pretends).

   The heavy cargo (yaml · audit · meta) reaches the client only as an
   async chunk (provider-room-access · the register-diet law); the
   prerendered HTML carries it whole via the byte island below, so deep
   links land on content and hydration stays byte-true.

   SSR-safe: every room prerenders (ATLAS_PATHS). Unknown ids get the
   honest miss. */

const KIND_GLOSS: Record<ProviderEntry['kind'], string> = {
  local: 'local · the sovereign default: your hardware, no key',
  cloud: 'cloud · bring your own key; it rides an env var and stays yours',
  test: 'test · the harness: rehearse before anything costs',
}

function fmtTokens(n?: number): string | undefined {
  if (typeof n !== 'number') {
    return undefined
  }
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}

/* the audit verdict, rendered honestly — the states a donor can be in.
   The kind matters: the harness's null ceiling is $0 BY CONSTRUCTION
   (mock never bills), while a local/cloud null ceiling stays an open
   price (unpriced, never free). */
function auditLine(a: ProviderRoomCargo['audit'], kind: ProviderEntry['kind']): string {
  if (!a.models_resolve) {
    return 'conform to the served contract · the vendor is cataloged ahead of the runtime: this binary names it, a coming release runs it'
  }
  const shape = `${a.tasks} ${a.tasks === 1 ? 'task' : 'tasks'} · ${a.waves} ${a.waves === 1 ? 'wave' : 'waves'}`
  if (a.cost_ceiling_usd != null) {
    return `check-green against the released engine · ${shape} · worst-case ceiling $${a.cost_ceiling_usd.toFixed(4)}`
  }
  if (kind === 'test') {
    return `check-green against the released engine · ${shape} · ceiling $0.0000 by construction: the harness never bills`
  }
  return `check-green against the released engine · ${shape} · no closed ceiling: an unpriced model is unpriced, never free`
}

const islandId = (id: string) => `pvr-${id}`

/* the room's « from the blog » slice rides its own byte island (the
   register-diet law) — the rails module never joins the initial chunk */
type BlogRef = { slug: string; title: string; date: string }
const blogIslandId = (id: string) => `pvr-blog-${id}`
function useProviderBlogRefs(id: string): BlogRef[] {
  const ssr = ssrBlogRails()
  const payload = useIslandPayload(
    blogIslandId(id),
    ssr ? JSON.stringify(ssr.FROM_BLOG[`provider:${id}`] ?? []) : null,
    async () => JSON.stringify((await loadBlogRails()).FROM_BLOG[`provider:${id}`] ?? []),
  )
  return payload ? (JSON.parse(payload) as BlogRef[]) : []
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { id: rawId } = useParams()
  const id = (rawId ?? '').toLowerCase()
  const hit = PROVIDER_INDEX[id]

  const blogRefs = useProviderBlogRefs(hit?.id ?? '')
  const load = useCallback(
    async () => JSON.stringify(await loadProviderRoom(id)),
    [id],
  )
  const payload = useIslandPayload(
    islandId(id),
    hit ? JSON.stringify(ssrProviderRoom(id)) : null,
    load,
  )
  const cargo = useMemo(
    () => (payload ? ((JSON.parse(payload) ?? null) as ProviderRoomCargo | null) : null),
    [payload],
  )
  /* the plan grammar on the donor when it has shape (two tasks or more) —
     derived from the file, the library's own deriveWorkflow */
  const donorPlan = useMemo(
    () => (cargo?.usage.yaml ? deriveWorkflow(cargo.usage.yaml) : null),
    [cargo],
  )

  /* the catalog walk (presentation-law order: local first, mistral leads) */
  const at = useMemo(() => PROVIDERS.findIndex((p) => p.id === id), [id])
  const prev = at > 0 ? PROVIDERS[at - 1] : undefined
  const next = at >= 0 && at < PROVIDERS.length - 1 ? PROVIDERS[at + 1] : undefined
  const kin = useMemo(
    () => (hit ? PROVIDERS.filter((p) => p.kind === hit.kind && p.id !== hit.id) : []),
    [hit],
  )

  const title = cargo
    ? `${cargo.meta.title} · Nika`
    : hit
      ? `${hit.name} · The providers · Nika`
      : 'Not a spec-named provider · Nika'
  const description = hit
    ? `${cargo?.meta.angle ?? hit.description} The file names it as model: ${hit.id}/…; ${
        hit.env_var ? `the key rides ${hit.env_var}, never a config file.` : 'no key, nothing to leak.'
      }`
    : `${id} is not a spec-named provider. The register lists all of them.`

  useHead({
    title,
    link: routeHead(`/providers/${id}`).link,
    meta: [
      ...routeHead(`/providers/${id}`).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-providers.png' },
      {
        property: 'og:image:alt',
        content: 'Nika providers. Local first, bring your own keys, no lock-in.',
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
                  { '@type': 'ListItem', position: 1, name: 'The providers', item: `${SITE}/providers` },
                  { '@type': 'ListItem', position: 2, name: hit.name },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'DefinedTerm',
                '@id': `${SITE}/providers/${hit.id}`,
                name: hit.name,
                description,
                url: `${SITE}/providers/${hit.id}`,
                inDefinedTermSet: {
                  '@type': 'DefinedTermSet',
                  name: 'The Nika provider catalog',
                  url: `${SITE}/providers`,
                },
              },
            ]),
            // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
            processTemplateParams: false,
          },
        ]
      : [],
  })

  return (
    <main className="theme-dark tp-page td-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="pvr-title" className="v4sec v4-in" data-provider={hit?.id}>
        <div className="v4sec-wrap">
          <nav className="td-crumb" aria-label="Breadcrumb" data-rise>
            <Link to="/providers" className="td-crumb-link">
              ← the provider catalog
            </Link>
            {hit && (
              <span className="tp-cat" title="the family this provider sits in">
                {hit.kind} · {hit.api_dialect}
              </span>
            )}
          </nav>

          <p className="v4sec-fig" data-rise style={{ ['--rise-delay' as string]: '40ms' }}>
            the provider catalog
          </p>
          <h1
            id="pvr-title"
            className="v4sec-title tp-title"
            data-rise
            style={{ ['--rise-delay' as string]: '80ms' }}
          >
            {hit ? hit.name : id}
          </h1>

          {!hit && (
            <div className="tp-miss" role="status" data-rise>
              <p className="tp-miss-name">{id}</p>
              <p>
                is not a spec-named provider. The engine also embeds an OpenAI-compatible tail;
                ask the binary (<code>nika catalog</code>), check{' '}
                <a href="/providers/catalog.json">the machine catalog</a>, or walk{' '}
                <Link to="/providers">the register</Link>.
              </p>
            </div>
          )}

          {hit && (
            <>
              <Island id={islandId(id)} payload={payload} />

              <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
                {cargo?.meta.angle ?? hit.description} One <code>provider/model</code> line moves a
                workflow here or away again: the same file runs on every provider the catalog
                names, and swapping is a one-word diff. Machines read{' '}
                <a href="/providers/catalog.json">the catalog</a>; the binary answers{' '}
                <code>nika catalog</code>.
              </p>

              {/* the room's dimensions, at a glance — every figure derived */}
              <StampStrip
                items={[
                  {
                    n: hit.models.length,
                    label: hit.models.length === 1 ? 'pinned model' : 'pinned models',
                    sub: 'aliases pin exact upstream ids',
                  },
                  { n: hit.kind, label: 'family', sub: KIND_GLOSS[hit.kind].split(' · ')[1] },
                  hit.env_var
                    ? { n: hit.env_var, label: 'the key rides here', sub: 'an env var, never a config file' }
                    : { n: 'no key', label: 'nothing to leak', sub: 'the sovereign path' },
                  { n: hit.api_dialect, label: 'wire dialect', sub: 'the adapter speaks it' },
                ]}
              />

              {/* ── the wire · what the file writes, what the adapter speaks ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
                <div className="cl-year-head">
                  <h2 id="pvr-wire" className="td-h2">
                    the wire
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">{KIND_GLOSS[hit.kind]}</span>
                </div>
                <p className="td-gloss">
                  A workflow names this provider in the model line —{' '}
                  <code>
                    model: {hit.id}/{hit.default_model ?? '…'}
                  </code>{' '}
                  — and the engine speaks <code>{hit.api_dialect}</code> on the wire.{' '}
                  {hit.env_var ? (
                    <>
                      The key rides <code>{hit.env_var}</code> in the environment, never a config
                      file, never the workflow.
                    </>
                  ) : (
                    <>No key exists on this path: nothing to rotate, nothing to leak.</>
                  )}
                  {hit.aliases.length > 0 && (
                    <>
                      {' '}
                      The provider id also answers to {hit.aliases.map((a, i) => (
                        <span key={a}>
                          {i > 0 && ' · '}
                          <code>{a}</code>
                        </span>
                      ))}
                      .
                    </>
                  )}
                </p>
                <dl className="pv-facts">
                  {hit.default_model && (
                    <div className="pv-fact">
                      <dt>default</dt>
                      <dd>
                        <code>{hit.default_model}</code>
                      </dd>
                    </div>
                  )}
                  {hit.cheap_model && hit.cheap_model !== hit.default_model && (
                    <div className="pv-fact">
                      <dt>cheap</dt>
                      <dd>
                        <code>{hit.cheap_model}</code>
                      </dd>
                    </div>
                  )}
                  <div className="pv-fact">
                    <dt>dialect</dt>
                    <dd>
                      <code>{hit.api_dialect}</code>
                    </dd>
                  </div>
                  {hit.tags.length > 0 && (
                    <div className="pv-fact">
                      <dt>tags</dt>
                      <dd>{hit.tags.join(' · ')}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* ── the models · alias → exact pin, capabilities ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '220ms' }}>
                <div className="cl-year-head">
                  <h2 id="pvr-models" className="td-h2">
                    the models
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">
                    {hit.models.length} {hit.models.length === 1 ? 'pin' : 'pins'}
                  </span>
                </div>
                <p className="td-gloss">
                  Aliases are what the file may write; the engine pins each one to an exact
                  upstream id, so a run stays reproducible after a vendor rotates names.
                </p>
                <ul className="pv-models">
                  {hit.models.map((m) => (
                    <li className="pv-model" key={m.id}>
                      <code className="pv-model-id">{m.id}</code>
                      <span className="pv-model-pin">{m.model}</span>
                      <span className="pv-model-caps">
                        {fmtTokens(m.context_window_tokens) && `ctx ${fmtTokens(m.context_window_tokens)}`}
                        {m.capabilities.reasoning && ' · reasoning'}
                        {m.capabilities.vision && ' · vision'}
                        {m.capabilities.json_mode && ` · json:${m.capabilities.json_mode}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── the provider in a real file · the crafted donor, audited ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
                <div className="cl-year-head">
                  <h2 id="pvr-usage" className="td-h2">
                    in a real file
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  {cargo && (
                    <span className="cl-year-count">
                      a complete workflow · shown whole
                    </span>
                  )}
                </div>
                {cargo ? (
                  <>
                    {donorPlan && donorPlan.tasks.length >= 2 && (
                      <PlanMap
                        tasks={donorPlan.tasks.map((t) => ({ id: t.id, verb: t.verb, wave: t.wave, gate: t.when }))}
                        waves={donorPlan.waveCount}
                        well={`pvr-${hit.id}`}
                      />
                    )}
                    <div className="td-usage">
                      <CodeFile yaml={cargo.usage.yaml} filename={cargo.usage.file} />
                    </div>
                    <p className="td-pin">
                      {auditLine(cargo.audit, hit.kind)} · the drift gate re-proves this copy on every test
                      run ·{' '}
                      <Link to={`/play?y=${lz.compressToEncodedURIComponent(cargo.usage.yaml)}`}>
                        open it in the playground →
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="td-gloss">loading the donor…</p>
                )}
              </div>

              {/* ── get set up · the authored ritual, verified links ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
                <div className="cl-year-head">
                  <h2 id="pvr-setup" className="td-h2">
                    get set up
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  {cargo?.meta.console && (
                    <span className="cl-year-count">
                      keys at{' '}
                      <a href={cargo.meta.console.href} target="_blank" rel="noreferrer">
                        {cargo.meta.console.label}
                      </a>
                    </span>
                  )}
                </div>
                {cargo ? (
                  <>
                    <ol className="td-args tp-args">
                      {cargo.meta.setup.map((s, i) => (
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
                    <p className="td-gloss">
                      Pick it for {cargo.meta.pick} {cargo.meta.note && <em>{cargo.meta.note}</em>}{' '}
                      Then prove the seat: <code>nika doctor</code> names every provider this
                      binary can reach.
                    </p>
                  </>
                ) : (
                  <p className="td-gloss">loading the ritual…</p>
                )}
              </div>

              {/* ── swap it · the one-word diff + the family ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '340ms' }}>
                <div className="cl-year-head">
                  <h2 id="pvr-swap" className="td-h2">
                    swap it
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                  <span className="cl-year-count">
                    {kin.length} more {hit.kind} {kin.length === 1 ? 'seat' : 'seats'}
                  </span>
                </div>
                <p className="td-gloss">
                  Moving off {hit.name} is editing one line: the rest of the file — tasks, permits,
                  outputs, the trace — does not change. The register orders the catalog local
                  first; beyond it the engine embeds {EMBEDDED_EXTRA} more OpenAI-compatible
                  endpoints.
                </p>
                {/* the one-word diff, DRAWN — the product's signature gesture.
                    The target crosses the sovereignty line on purpose: a local
                    room swaps toward the first cloud seat (mistral · the
                    presentation law), a cloud room swaps home to the first
                    local seat (ollama) — both directions of the same freedom. */}
                {(() => {
                  const target =
                    hit.kind === 'cloud'
                      ? PROVIDERS.find((p) => p.kind === 'local')
                      : PROVIDERS.find((p) => p.kind === 'cloud')
                  if (!target?.default_model || !hit.default_model) return null
                  return (
                    <div className="pv-swap mono" role="img" aria-label={`the one-line diff: model ${hit.id} becomes model ${target.id}`}>
                      <span className="pv-swap-del">
                        <span className="pv-swap-sign" aria-hidden>−</span> model: {hit.id}/{hit.default_model}
                      </span>
                      <span className="pv-swap-add">
                        <span className="pv-swap-sign" aria-hidden>+</span> model: {target.id}/{target.default_model}
                      </span>
                      <span className="pv-swap-cap">the whole migration · nothing else moves</span>
                    </div>
                  )
                })()}
                {kin.length > 0 && (
                  <ul className="td-chips">
                    {kin.map((p) => (
                      <li key={p.id}>
                        <Link className="td-chip" to={`/providers/${p.id}`}>
                          {p.id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* ── cross-references ── */}
              <div className="td-sec" data-rise style={{ ['--rise-delay' as string]: '380ms' }}>
                <div className="cl-year-head">
                  <h2 id="pvr-refs" className="td-h2">
                    cross-references
                  </h2>
                  <span className="cl-year-rule" aria-hidden />
                </div>
                <div className="td-refs">
                  <div>
                    <p className="td-ref-k">the words that meet it</p>
                    <ul className="td-chips">
                      <li>
                        <Link className="td-chip" to="/verbs/infer">
                          infer
                        </Link>
                      </li>
                      <li>
                        <Link className="td-chip" to="/language/model">
                          model
                        </Link>
                      </li>
                      <li>
                        <Link className="td-chip" to="/language/max_tokens">
                          max_tokens
                        </Link>
                      </li>
                      <li>
                        <Link className="td-chip" to="/boundary">
                          the boundary
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <Island id={blogIslandId(hit.id)} payload={JSON.stringify(blogRefs)} />
                  {blogRefs.length > 0 && (
                    <div>
                      <p className="td-ref-k">from the blog</p>
                      <ul className="td-chips">
                        {blogRefs.map((b) => (
                          <li key={b.slug}>
                            <a className="td-chip" href={`/blog/${b.slug}`}>
                              {b.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="td-ref-k">where it lives</p>
                    <SourcesRail links={PROVIDER_SOURCES} />
                  </div>
                </div>
              </div>

              {/* ── the walk ── */}
              <nav className="td-nav" aria-label="Provider catalog walk" data-rise>
                {prev ? (
                  <Link className="td-nav-link" to={`/providers/${prev.id}`}>
                    <span className="td-nav-label">← previous</span>
                    {prev.id}
                  </Link>
                ) : (
                  <span />
                )}
                <Link className="td-nav-link td-nav-link--all" to="/providers">
                  <span className="td-nav-label">all {PROVIDERS.length}</span>
                  the register
                </Link>
                {next ? (
                  <Link className="td-nav-link td-nav-link--next" to={`/providers/${next.id}`}>
                    <span className="td-nav-label">next →</span>
                    {next.id}
                  </Link>
                ) : (
                  <span />
                )}
              </nav>

              <p className="tp-foot" data-rise>
                Try it in the <Link to="/play">playground</Link>, or{' '}
                <Link to="/install">install</Link> and go local first.{' '}
                <Link to="/spec">Read the spec →</Link>
              </p>

              <footer className="hub-foot">
                <TruthLine nodeId={`provider:${hit.id}`} />
              </footer>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
