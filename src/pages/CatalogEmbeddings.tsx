/* ─── /catalog/embeddings · vector compatibility as compile-time fact ────────
   The embedding models the released binary names: dimensions, windows,
   similarity metric, price · the whole table on one honest page. */
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, fmtUsd, useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'
import { TickAxis } from '../components/TickAxis'
import './catalog-models.css'

type Row = {
  id: string
  dimensions: number
  max_input_tokens: number
  similarity: string | null
  input_per_million: number | null
}

const DESC = `The ${CATALOG_COUNTS.embeddings} embedding models the released binary's catalog carries · dimensions, input windows, similarity metrics and price per million input tokens.`

export function Component() {
  useCatalogHead('/catalog/embeddings', 'Embeddings', DESC, [
    collectionLd({ path: '/catalog/embeddings', name: 'Embeddings · Nika', description: DESC, total: CATALOG_COUNTS.embeddings }),
  ])
  const { payload, data } = useCatalogCargo<Row[]>('cat-emb', (m) =>
    m.EMBEDDINGS.map((e) => ({
      id: e.id,
      dimensions: e.dimensions,
      max_input_tokens: e.max_input_tokens,
      similarity: e.similarity,
      input_per_million: e.input_per_million,
    })),
  )
  return (
    <CatalogShell
      fig={`the embeddings · ${CATALOG_COUNTS.embeddings}`}
      title="Vectors, with their shapes declared."
      lede={
        <>
          Vector-store compatibility is a compile-time fact: every row carries its dimensions, its
          input window and its similarity metric, so a mismatched store fails at check time, never
          at query time.
        </>
      }
      crumb={{ to: '/catalog', label: 'The catalog' }}
    >
      <CatalogSection id="axis" title="The dimension axis">
        {/* the page's own thesis, drawn: store compatibility is a compile-time
            fact, and the DIMENSION is that fact. Every embedding seated at its
            vector width (linear · the families cluster and the clusters ARE
            the story) · marks, not doors: embeddings have no rooms. */}
        <p className="pv-desc">
          Every embedding at its vector width. Models sharing a column share a store shape; a
          mismatch across columns is exactly what <code>nika check</code> refuses at compile time.
        </p>
        {(() => {
          const rows = (data ?? []).filter(
            (e): e is Row & { dimensions: number } => e.dimensions != null && e.dimensions > 0,
          )
          if (rows.length < 2) return null
          const lo = Math.min(...rows.map((e) => e.dimensions))
          const hi = Math.max(...rows.map((e) => e.dimensions))
          const span = hi - lo || 1
          const nudge = new Map<number, number>()
          return (
            <TickAxis
              ticks={rows.map((e) => {
                const base = ((e.dimensions - lo) / span) * 100
                const nth = nudge.get(e.dimensions) ?? 0
                nudge.set(e.dimensions, nth + 1)
                return {
                  key: e.id,
                  left: Math.min(100, base + nth * 0.9),
                  h: 18,
                  label: `${e.id} · ${e.dimensions}d · ${e.max_input_tokens} in${e.input_per_million != null ? ` · $${e.input_per_million}/M` : ''}`,
                }
              })}
              ariaLabel={`${rows.length} embedding models from ${lo} to ${hi} dimensions`}
              lo={`${lo}d`}
              hi={`${hi}d`}
              foot={`${rows.length} models · ${lo}d → ${hi}d · a shared column is a shared store shape`}
            />
          )
        })()}
      </CatalogSection>
      <CatalogSection id="rows" title="The register">
        <ol className="tp-list">
          {(data ?? []).map((e) => (
            <li key={e.id} className="tp-row">
              <div className="pv-row-head">
                <span className="pv-id">{e.id}</span>
                <span className="tp-cat cm-facts">
                  {e.dimensions}d · {fmtTokens(e.max_input_tokens)} in · {e.similarity ?? '·'} ·{' '}
                  {fmtUsd(e.input_per_million)}/M
                </span>
              </div>
            </li>
          ))}
        </ol>
      </CatalogSection>
      <Island id="cat-emb" payload={payload} />
    </CatalogShell>
  )
}
