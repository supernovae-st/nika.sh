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
import { ldScript } from '../lib/ld'

type CatalogModule = typeof import('../content/catalog.generated')

/** the page's slice of the heavy catalog, via the island (SSR bytes first,
    the async chunk on the client) · pick must return JSON-serializable data */
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

/* the 4th argument is the MACHINE layer (2026-08-02): every catalog room
   used to ship only the site-wide Organization + WebSite, so a crawler
   learned that a page existed and nothing about the model or the server it
   described. Rooms pass their entity here; ld.ts holds the shapes. */
export function useCatalogHead(
  path: string,
  titleHead: string,
  description: string,
  ld?: object[],
) {
  const title = `${titleHead} · Nika`
  useHead({
    title,
    link: routeHead(path).link,
    ...(ld && ld.length ? { script: [ldScript(ld)] } : {}),
    meta: [
      ...routeHead(path).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      /* the world card (2026-08-03 · the og-providers precedent): every
         catalog page shares the world's own share card — the providers
         pages keep their older dedicated card via their own heads */
      { property: 'og:image', content: 'https://nika.sh/og-catalog.png' },
      {
        property: 'og:image:alt',
        content:
          'What the released binary knows: models, exact prices, measured energy, MCP servers · the Nika catalog.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://nika.sh/og-catalog.png' },
    ],
  })
}

import { fmtTokens as fmtTokensBase } from './providers-shared'

/** tokens → a compact figure, absent = '·' (ONE producer: providers-shared
    computes; this façade only supplies the honest-dot for missing values) */
export function fmtTokens(n: number | null | undefined): string {
  return fmtTokensBase(n ?? undefined) ?? '·'
}

/** USD per 1M tokens · the honest empty is a dot, never a zero */
export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return '·'
  return `$${n}`
}
