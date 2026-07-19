/* ─── i18n-copy-access · the L1 corpus' register-diet doors ──────────────────
   (the anatomy-access recipe) i18n-pages.generated carries EIGHT reviewed
   voices (~30K raw) — it reaches the client ONLY as an async chunk. SSG
   reads it through the SSR-only await (every locale page prerenders its
   whole copy); the page's first client render rides its byte island; a
   SPA hop between locales pulls the chunk once. */

import type { InstallCopy } from '../content/i18n-pages.generated'

let SSR_INSTALL: Record<string, InstallCopy> | null = null
if (import.meta.env.SSR) {
  SSR_INSTALL = (await import('../content/i18n-pages.generated')).I18N_PAGES.install
}

/** the whole install record at SSG time (null on the client) */
export const ssrInstallCopy = (): Record<string, InstallCopy> | null => SSR_INSTALL

/** one locale's copy on the client — the async chunk, once */
export const loadInstallCopy = async (locale: string): Promise<InstallCopy | null> => {
  const m = await import('../content/i18n-pages.generated')
  return m.I18N_PAGES.install[locale] ?? m.I18N_PAGES.install.en ?? null
}
