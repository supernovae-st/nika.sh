import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useHead } from '@unhead/react'
import { useAnchorScroll } from '../lib/use-anchor-scroll'
import { useHydrated } from '../lib/use-hydrated'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import {
  PROVIDERS,
  PROVIDER_INDEX,
  EMBEDDED_EXTRA,
  type ProviderEntry,
} from '../content/providers.generated'
import { CANON } from '../canon.generated'
import { MARKET_VOCAB } from '../content/market-vocab.generated'
import { routeHead } from '../content'
import '../sections/v4-home.css'
import './providers-page.css'

/* ─── /providers · the provider register (theme-dark) ─────────────────────────
   Every spec-named provider as an anchored row — the prefix an author
   writes in the model line (`model: ollama/…`). One register page (the
   /errors · /tools precedent); each row's id is the DOOR to the
   provider's own room at /providers/<id> (dedicated pages · the ToolPage
   path), and the #id anchor stays the citable row. A deep-link scrolls
   to its row and highlights it. A hash that matches nothing gets an
   honest miss.

   Spec truth: rows come from src/content/providers.generated.ts — a
   compiled projection of public/providers/catalog.json, itself derived from
   the engine's own `nika catalog --json` filtered to the spec-named set
   (canon.yaml · ADR-104). The binary embeds a longer OpenAI-compatible tail;
   it stays a COUNT here (EMBEDDED_EXTRA) so the page and the sitewide CANON
   figures tell one story.

   Presentation order IS the operator law (supernovae-alignment Rule 3):
   local/open-weight first — the sovereign default path — then cloud with
   Mistral leading; the test harness closes. The order ships inside the
   generated module; this page just renders it. */

const KIND_ORDER = ['local', 'cloud', 'test'] as const
const KIND_GLOSS: Record<(typeof KIND_ORDER)[number], { title: string; gloss: string }> = {
  local: {
    title: 'local',
    gloss: 'the sovereign default: your hardware, no key, nothing leaves the machine',
  },
  cloud: {
    title: 'cloud',
    gloss: 'bring your own key; it rides an env var, never a config file, and stays yours',
  },
  test: {
    title: 'test',
    gloss: 'the harness: mock-first is how workflows are written before they cost anything',
  },
}

function fmtTokens(n?: number): string | undefined {
  if (typeof n !== 'number') {
    return undefined
  }
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)
}

function ProviderRow({ entry, active }: { entry: ProviderEntry; active: boolean }) {
  return (
    <li id={entry.id} className={`pv-row${active ? ' pv-row--active' : ''}`}>
      <div className="pv-row-head">
        <Link className="pv-id" to={`/providers/${entry.id}`} title="open the provider's room">
          {entry.id}
        </Link>
        <a className="pv-hash" href={`#${entry.id}`} aria-label={`anchor the ${entry.id} row`} title="cite this row">
          #
        </a>
        <span className="pv-name">{entry.name}</span>
        {entry.env_var ? (
          <code className="pv-env" title="the key rides this env var, never a config file">
            {entry.env_var}
          </code>
        ) : (
          <span className="pv-nokey" title="no key, nothing to leak">
            no key
          </span>
        )}
      </div>
      <p className="pv-desc">{entry.description}</p>
      <dl className="pv-facts">
        {entry.default_model && (
          <div className="pv-fact">
            <dt>default</dt>
            <dd>
              <code>{entry.default_model}</code>
            </dd>
          </div>
        )}
        {entry.cheap_model && entry.cheap_model !== entry.default_model && (
          <div className="pv-fact">
            <dt>cheap</dt>
            <dd>
              <code>{entry.cheap_model}</code>
            </dd>
          </div>
        )}
        <div className="pv-fact">
          <dt>dialect</dt>
          <dd>
            <code>{entry.api_dialect}</code>
          </dd>
        </div>
        {entry.aliases.length > 0 && (
          <div className="pv-fact">
            <dt>alias</dt>
            <dd>{entry.aliases.join(' · ')}</dd>
          </div>
        )}
      </dl>
      {entry.models.length > 0 && (
        <ul className="pv-models">
          {entry.models.map((m) => (
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
      )}
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  /* the register keeps its citable #id anchors; the rooms at /providers/:id
     are REAL dedicated pages (the WO-6 stubs died · verdict 2026-07-18) and
     every row's id links its room — the doors half of « chaque élément a sa
     page ». The hash still re-aims the row for citations. */
  const { hash } = useLocation()
  const id = hash ? hash.slice(1).toLowerCase() : undefined
  const hit = id ? PROVIDER_INDEX[id] : undefined
  /* the honest miss, post-hydration: a hash that names no provider AND no
     real element on the page (#pv-title stays a legit anchor, never a miss).
     useHydrated keeps SSR and the first client render agreeing on false —
     the server never sees a hash, hydration stays byte-true by construction. */
  const hydrated = useHydrated()
  const miss = hydrated && Boolean(id && !hit && !document.getElementById(id))

  const groups = useMemo(
    () =>
      KIND_ORDER.map((kind) => ({
        kind,
        entries: PROVIDERS.filter((p) => p.kind === kind),
      })).filter((g) => g.entries.length > 0),
    [],
  )

  // the market phrase rides the vocab bridge, never typed here (§6.5)
  const title = `Providers · ${MARKET_VOCAB['layer:reach'].term}, provider-agnostic · Nika`
  const description = `The ${CANON.providers} providers Nika names: ${CANON.providersLocal} local (the sovereign default), ${CANON.providersCloud} cloud (bring your own key), one test harness. Machine twin: /providers/catalog.json.`

  useHead({
    title,
    link: routeHead('/providers').link,
    meta: [
      ...routeHead('/providers').meta,
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
  })

  /* the deep-link lands ON its row — re-aimed until layout settles
     (the one-shot scroll drifted on slow devices · use-anchor-scroll) */
  useAnchorScroll(hit?.id)

  return (
    <main className="theme-dark pv-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="pv-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the provider catalog
          </p>
          <h1 id="pv-title" className="v4sec-title pv-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            {hit ? hit.name : 'Providers.'}
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            One <code>provider/model</code> line moves a workflow between models: local first,
            keys via env vars that stay yours, <b>no inference lock-in</b>. The same file runs on
            a laptop Ollama and a frontier API; swapping is a one-word diff. Every provider owns
            a room — the id in each row is its door. Machines read the catalog at{' '}
            <a href="/providers/catalog.json">/providers/catalog.json</a>; the binary answers{' '}
            <code>nika catalog</code>.
          </p>

          {miss && (
            <div className="pv-miss" role="status" data-rise>
              <p className="pv-miss-id">provider: {id}</p>
              <p>
                is not a spec-named provider. The engine also embeds a longer OpenAI-compatible
                tail; ask the binary (<code>nika catalog</code>) or check{' '}
                <a href="/providers/catalog.json">the machine catalog</a>.
              </p>
            </div>
          )}

          {/* the catalog's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: CANON.providers, label: 'named providers', sub: 'one provider: line' },
              { n: CANON.providersLocal, label: 'local', sub: 'the sovereign default' },
              { n: CANON.providersCloud, label: 'cloud', sub: 'your keys, your bill' },
              { n: EMBEDDED_EXTRA, label: 'embedded tail', sub: 'openai-compatible' },
            ]}
          />

          {groups.map((group, gi) => (
            <div className="pv-family" key={group.kind} data-rise style={{ ['--rise-delay' as string]: `${180 + gi * 30}ms` }}>
              <div className="cl-year-head">
                <span className="cl-year-n pv-family-n">{KIND_GLOSS[group.kind].title}</span>
                <span className="cl-year-rule" aria-hidden />
                <span className="cl-year-count">
                  {group.entries.length} {group.entries.length === 1 ? 'provider' : 'providers'}
                </span>
              </div>
              <p className="pv-family-gloss">{KIND_GLOSS[group.kind].gloss}</p>
              <ol className="pv-list">
                {group.entries.map((p) => (
                  <ProviderRow key={p.id} entry={p} active={p.id === id} />
                ))}
              </ol>
            </div>
          ))}

          <p className="pv-foot" data-rise>
            Beyond the named set, the engine embeds {EMBEDDED_EXTRA} more OpenAI-compatible
            endpoints; <code>nika catalog</code> lists every one. Models are aliases in the file
            (<code>model: sonnet</code>) pinned to exact upstream ids by the engine, so a run is
            reproducible even after a vendor rotates names. Try one in the{' '}
            <Link to="/play">playground</Link>, or <Link to="/install">install</Link> and go local
            first. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
