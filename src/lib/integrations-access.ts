/* ─── integrations-access · the ONLY doors to the integrations cargo ──────────
   (register-diet law · the blog-rails-access precedent) The authored
   register (what · how · install rituals) reaches the client only as an
   async chunk — the pages feed their FIRST render from a byte island
   whose payload they compute via ssrIntegrations() in the SSR-only
   branch. The chrome-lean TABS (id · name · kind) live in their own
   literal module (integrations-tabs.ts) for the map and the sitemap. */

type IntegrationsModule = typeof import('../content/integrations')

let SSR: IntegrationsModule | null = null
if (import.meta.env.SSR) {
  SSR = await import('../content/integrations')
}

/** the whole module at SSG time (null on the client by construction) */
export const ssrIntegrations = (): IntegrationsModule | null => SSR

/** the module on the client — the async chunk, once */
export const loadIntegrations = async (): Promise<IntegrationsModule> =>
  import('../content/integrations')
