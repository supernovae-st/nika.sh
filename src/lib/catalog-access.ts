/* ─── catalog-access · the ONLY doors to the catalog cargo ────────────────────
   (register-diet law · the integrations-access precedent) The heavy engine
   catalog (64 models with joins · 633 pricing rules · 105 MCP servers · the
   31-door client matrix) reaches the client only as an async chunk — the
   pages feed their FIRST render from a byte island whose payload they
   compute via ssrCatalog() in the SSR-only branch. The chrome-lean half
   (slugs · ids · counts · the pin identity) lives in
   catalog-paths.generated.ts and is the only catalog module the main
   bundle may import — src/test/catalog.test.ts pins that structurally. */

type CatalogModule = typeof import('../content/catalog.generated')

let SSR: CatalogModule | null = null
if (import.meta.env.SSR) {
  SSR = await import('../content/catalog.generated')
}

/** the whole module at SSG time (null on the client by construction) */
export const ssrCatalog = (): CatalogModule | null => SSR

/** the module on the client — the async chunk, once */
export const loadCatalog = async (): Promise<CatalogModule> => import('../content/catalog.generated')
