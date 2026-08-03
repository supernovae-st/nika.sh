/* ─── /catalog/models · the model register (engine-release clock) ────────────
   Every model the wire catalog names, one room each. The context axis rides
   here (ModelAxis · the visual finally routed, D6): the axis is the fact the
   data actually holds. Register-diet: the rows ride the byte island, lean. */
import { Link } from 'react-router'
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { BENCH_WITNESSES } from '../content/bench.generated'
import { ModelAxis } from './ModelAxis'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, fmtUsd, useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'
import './catalog-models.css'

const DESC = `The ${CATALOG_COUNTS.models} models the released binary's wire catalog names · who serves each one, its context window, its exact-match price and its measured energy where the catalog carries them.`

type Row = {
  id: string
  slug: string
  providers: string[]
  ctx: number | null
  priced: boolean
  measured: boolean
  /** the cheapest recorded OUTPUT seat, $/Mtok · null when unpriced */
  out: number | null
  /** any pricing row records open weights */
  open: boolean
}

export function Component() {
  useCatalogHead('/catalog/models', 'Models', DESC, [
    collectionLd({ path: '/catalog/models', name: 'Models · Nika', description: DESC, total: CATALOG_COUNTS.models }),
  ])
  const { payload, data } = useCatalogCargo<Row[]>('cat-models', (m) =>
    m.MODELS.map((x) => ({
      id: x.id,
      slug: x.slug,
      providers: x.served_by.map((s) => s.provider),
      ctx: x.served_by[0]?.context_window_tokens ?? null,
      priced: x.pricing.length > 0,
      measured: x.energy.length > 0,
      /* the recorded rows may carry null prices · only REAL numbers seat a tick */
      out: (() => {
        const outs = x.pricing
          .map((r) => r.output_per_million)
          .filter((v): v is number => v != null && v > 0)
        return outs.length ? Math.min(...outs) : null
      })(),
      open: x.pricing.some((r) => r.open_weights === true),
    })),
  )
  return (
    <CatalogShell
      fig={`the models · ${CATALOG_COUNTS.models}`}
      title="Every model, one room."
      lede={
        <>
          The union of the wire catalog: each model names the providers that serve it, the window it
          reads, the exact-match price rows and the measured energy rows. What the catalog does not
          carry, the room says plainly · a missing number is a fact, never a zero.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      <CatalogSection id="bench" title="The bench">
        {/* testimonial-gated (the R7 law): the count below is the count of
            PUBLISHED receipts, projected from content/bench/ — never a
            leaderboard of numbers nobody can re-derive */}
        <p className="pv-desc">
          {BENCH_WITNESSES.length} published{' '}
          {BENCH_WITNESSES.length === 1 ? 'receipt' : 'receipts'}: a room shows a measured answer
          only when a receipt names its model, with the evidence pack served beside it. Every other
          seat: run it yourself · the <code>model-bench</code> workflow in the public registry
          measures YOUR machine, and{' '}
          <a href={`/bench/${BENCH_WITNESSES[0]?.id}/PROVENANCE.md`}>the first receipt</a> shows
          what an honest one looks like.
        </p>
      </CatalogSection>
      <CatalogSection id="axis" title="The context axis">
        {/* the axis and the register COUNT DIFFERENT FACETS on purpose · say
            so, or the page reads as a contradiction (64 up top, 29 below) */}
        <p className="pv-desc">
          The axis draws the canonical catalog · the spec-named seats whose models declare a
          window. The register below is the wider wire union; each count names its facet.
        </p>
        <ModelAxis />
      </CatalogSection>
      <CatalogSection id="price-axis" title="The price axis">
        {/* the context axis's twin, cut from the /releases cadence cloth: every
            PRICED model a tick-LINK at its cheapest recorded output seat, log
            scale (the catalog spans three orders of magnitude), the accent on
            the open-weights rows · derived from the vendored pricing, never
            typed */}
        <p className="pv-desc">
          Every priced model, seated at its cheapest recorded output seat. The taller accent
          ticks are open weights: the seats you could also host yourself.
        </p>
        {(() => {
          const priced = (data ?? []).filter((m): m is Row & { out: number } => m.out != null && m.out > 0)
          if (priced.length < 2) return null
          const lo = Math.min(...priced.map((m) => m.out))
          const hi = Math.max(...priced.map((m) => m.out))
          const span = Math.log10(hi) - Math.log10(lo) || 1
          const nudge = new Map<number, number>()
          const openCount = priced.filter((m) => m.open).length
          return (
            <>
              <div
                className="cm-axis"
                role="img"
                aria-label={`${priced.length} priced models from ${fmtUsd(lo)} to ${fmtUsd(hi)} per million output tokens · ${openCount} open weights`}
              >
                {priced.map((m) => {
                  const base = ((Math.log10(m.out) - Math.log10(lo)) / span) * 100
                  const k = Math.round(base * 2)
                  const nth = nudge.get(k) ?? 0
                  nudge.set(k, nth + 1)
                  return (
                    <Link
                      key={m.slug}
                      to={`/catalog/models/${m.slug}`}
                      className={m.open ? 'cm-tick cm-tick--open' : 'cm-tick'}
                      style={{ left: `${Math.min(100, base + nth * 0.7)}%` }}
                      title={`${m.id} · ${fmtUsd(m.out)} out/Mtok${m.open ? ' · open weights' : ''}`}
                      aria-label={`${m.id} · ${fmtUsd(m.out)} per million output tokens${m.open ? ' · open weights' : ''}`}
                    >
                      <i aria-hidden />
                    </Link>
                  )
                })}
                <span className="cm-axis-label" style={{ left: '0%' }} aria-hidden>
                  {fmtUsd(lo)}
                </span>
                <span className="cm-axis-label" style={{ left: '100%' }} aria-hidden>
                  {fmtUsd(hi)}
                </span>
              </div>
              <p className="cm-axis-foot">
                {priced.length} priced · {fmtUsd(lo)} → {fmtUsd(hi)} out/Mtok · log scale ·{' '}
                {openCount} open weights
              </p>
            </>
          )
        })()}
      </CatalogSection>
      <CatalogSection id="register" title="The register">
        <ol className="tp-list">
          {(data ?? []).map((m) => (
            <li key={m.slug} className="tp-row">
              <div className="pv-row-head">
                <Link className="pv-id" to={`/catalog/models/${m.slug}`}>
                  {m.id}
                </Link>
                <span className="tp-cat cm-facts">
                  {m.providers.length} {m.providers.length === 1 ? 'seat' : 'seats'}
                  {m.ctx ? ` · ${fmtTokens(m.ctx)}` : ''}
                  {m.out != null ? ` · ${fmtUsd(m.out)} out` : ''}
                  {m.measured ? ' · measured' : ''}
                  {m.open && <span className="cm-open">⬡ open</span>}
                </span>
              </div>
              <p className="pv-desc">
                {m.providers.join(' · ')}
                {m.ctx ? ` · ${fmtTokens(m.ctx)} context` : ''}
              </p>
            </li>
          ))}
        </ol>
      </CatalogSection>
      <Island id="cat-models" payload={payload} />
    </CatalogShell>
  )
}
