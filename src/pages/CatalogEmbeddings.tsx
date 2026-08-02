/* ─── /catalog/embeddings · vector compatibility as compile-time fact ────────
   The embedding models the released binary names: dimensions, windows,
   similarity metric, price · the whole table on one honest page. */
import { Island } from '../lib/ssg-island'
import { CATALOG_COUNTS } from '../content/catalog-paths.generated'
import { CatalogSection, CatalogShell } from './catalog-shared'
import { fmtTokens, fmtUsd, useCatalogCargo, useCatalogHead } from './catalog-lib'
import { collectionLd } from '../lib/ld'

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
      <CatalogSection id="rows" title="The register">
        <ol className="tp-list">
          {(data ?? []).map((e) => (
            <li key={e.id} className="tp-row">
              <div className="pv-row-head">
                <span className="pv-id">{e.id}</span>
                <span className="tp-cat">
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
