/* ─── /catalog/models/:slug · one model, whole (the H.4 room contract) ───────
   Above the fold: what it is + the try-it + provenance. Below: the seats,
   the exact prices, the measured energy (source verbatim). The room never
   guesses: a pattern-priced model says so and points at the engine.
   The island id carries the slug · SPA nav between two rooms must never
   read the previous room's bytes. */
import { Link, useLocation } from 'react-router'
import { Island } from '../lib/ssg-island'
import { MODEL_SLUGS } from '../content/catalog-paths.generated'
import { MARKET_PROVIDER_IDS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, fmtUsd, useCatalogCargo, useCatalogHead } from './catalog-lib'

type CatalogModel = import('../content/catalog.generated').CatalogModel

/* EVERY seat is a door now (2026-08-02). It used to link only the 17 the
   SPEC names, so 39 of the 68 seats on these rooms were dead text and 36 of
   the 64 rooms had nothing clickable at all. All 38 vendors the catalog
   knows have a room; the market-only ones say what they are on arrival. */
const ROOMED_PROVIDERS = new Set(MARKET_PROVIDER_IDS)

export function Component() {
  const { pathname } = useLocation()
  const slug = pathname.split('/')[3] ?? ''
  const known = MODEL_SLUGS.includes(slug)
  const { payload, data: m } = useCatalogCargo<CatalogModel | null>(
    `cat-model-${slug}`,
    (mod) => mod.MODELS.find((x) => x.slug === slug) ?? null,
  )
  useCatalogHead(
    `/catalog/models/${slug}`,
    known ? (m?.id ?? slug) : 'Not a model',
    known
      ? `${m?.id ?? slug} in the released binary's catalog: serving seats, exact price rows and measured energy where the catalog carries them.`
      : `${slug} names no model in the released catalog.`,
  )
  if (!known) {
    return (
      <CatalogShell
        fig="the models"
        title="Not in this catalog."
        lede={
          <>
            `{slug}` names no model in the released binary's wire catalog.{' '}
            <Link to="/catalog/models">The register</Link> lists every one.
          </>
        }
        crumb={{ to: '/catalog/models', label: 'Models' }}
      >
        {null}
      </CatalogShell>
    )
  }
  const first = m?.served_by[0]
  return (
    <CatalogShell
      fig="the model"
      title={m?.id ?? slug}
      lede={
        <>
          Served by {(m?.served_by ?? []).map((s) => s.provider_name).join(' · ')}. Point a task at
          it and the audit prices the ceiling before a token is spent.
        </>
      }
      crumb={{ to: '/catalog/models', label: 'Models' }}
    >
      <CatalogSection id="try" title="Point a task at it">
        <pre className="src-cmd mono">
          <code>{`tasks:\n  ask:\n    infer:\n      model: "${first ? `${first.provider}/${first.alias}` : m?.id ?? slug}"\n      prompt: "…"`}</code>
        </pre>
      </CatalogSection>
      <CatalogSection id="seats" title={`The seats · ${m?.served_by.length ?? '·'}`}>
        <ol className="tp-list">
          {(m?.served_by ?? []).map((s) => (
            <li key={`${s.provider}/${s.alias}`} className="tp-row">
              <div className="pv-row-head">
                <span className="pv-id">
                  {s.provider}/{s.alias}
                </span>
                <span className="tp-cat">
                  {fmtTokens(s.context_window_tokens)} context · {fmtTokens(s.max_output_tokens)} out
                </span>
              </div>
              <p className="pv-desc">
                {s.provider_name}
                {ROOMED_PROVIDERS.has(s.provider) && (
                  <>
                    {' · '}
                    <Link to={`/catalog/providers/${s.provider}`}>the provider room</Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      </CatalogSection>
      <CatalogSection id="price" title="The price">
        {m && m.pricing.length === 0 ? (
          <p className="pv-desc">
            No exact-match row at this pin · the engine resolves pattern rules at run time and{' '}
            <code>nika check</code> prints the real ceiling. A local seat is unpriced, never free.
          </p>
        ) : (
          <ol className="tp-list">
            {(m?.pricing ?? []).map((p) => (
              <li key={p.provider} className="tp-row">
                <div className="pv-row-head">
                  <span className="pv-id">{p.provider}</span>
                  <span className="tp-cat">
                    {fmtUsd(p.input_per_million)} in · {fmtUsd(p.output_per_million)} out
                    {p.cache_read_per_million != null ? ` · ${fmtUsd(p.cache_read_per_million)} cache` : ''}
                    {p.open_weights ? ' · open weights' : ''}
                  </span>
                </div>
                <p className="pv-desc">per million tokens · {fmtTokens(p.context_window_tokens)} window</p>
              </li>
            ))}
          </ol>
        )}
      </CatalogSection>
      {m && m.energy.length > 0 && (
        <CatalogSection id="energy" title="The energy">
          <ol className="tp-list">
            {m.energy.map((e) => (
              <li key={e.provider} className="tp-row">
                <div className="pv-row-head">
                  <span className="pv-id">{e.wh_per_mtok_out} Wh / Mtok out</span>
                  <span className="tp-cat">{e.provenance ?? 'measured'}</span>
                </div>
                <p className="pv-desc">{e.source ?? ''}</p>
              </li>
            ))}
          </ol>
        </CatalogSection>
      )}
      <Island id={`cat-model-${slug}`} payload={payload} />
    </CatalogShell>
  )
}
