/* ─── catalog-lib · the /catalog world's non-component grammar ───────────────
   Split from catalog-shared.tsx by the react-refresh law (a component file
   exports only components): the head hook, the cargo hook (register-diet:
   the heavy data rides a byte island, never the main bundle) and the
   formatters live here. */
import { useMemo } from 'react'
import { useHead } from '@unhead/react'
import { routeHead } from '../content'
import { useIslandPayload } from '../lib/use-island-payload'
import { loadCatalog, ssrCatalog } from '../lib/catalog-access'

type CatalogModule = typeof import('../content/catalog.generated')

/** the page's slice of the heavy catalog, via the island (SSR bytes first,
    the async chunk on the client) — pick must return JSON-serializable data */
export function useCatalogCargo<T>(id: string, pick: (m: CatalogModule) => T): { payload: string; data: T | null } {
  const payload = useIslandPayload(
    id,
    (() => {
      const m = ssrCatalog()
      return m ? JSON.stringify(pick(m)) : null
    })(),
    async () => JSON.stringify(pick(await loadCatalog())),
  )
  const data = useMemo(() => (payload ? (JSON.parse(payload) as T) : null), [payload])
  return { payload: payload ?? '', data }
}

export function useCatalogHead(path: string, titleHead: string, description: string) {
  const title = `${titleHead} · Nika`
  useHead({
    title,
    link: routeHead(path).link,
    meta: [
      ...routeHead(path).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })
}

/** tokens → a compact human figure (128000 → 128k · 1048576 → 1m) */
export function fmtTokens(n: number | null | undefined): string {
  if (n == null) return '·'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}m`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(n)
}

/** USD per 1M tokens — the honest empty is a dot, never a zero */
export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return '·'
  return `$${n}`
}
