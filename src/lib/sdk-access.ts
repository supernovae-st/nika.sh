/* ─── sdk-access · the ONLY door to the guide cargo ─────────────────────────
   The guide registry's routing half stays in sdk-nav.ts. Full tutorial prose,
   facts and code examples reach the browser as one async chunk. SSG reads the
   same module through this SSR-only branch, then SdkGuide carries the selected
   guide in a byte island for a byte-identical first render. */

type SdkModule = typeof import('../content/sdk')

let SSR: SdkModule | null = null
if (import.meta.env.SSR) {
  SSR = await import('../content/sdk')
}

/** The complete SDK guide module at SSG time; null in the client graph. */
export const ssrSdk = (): SdkModule | null => SSR

/** The complete SDK guide module on SPA navigation; fetched once. */
export const loadSdk = async (): Promise<SdkModule> => import('../content/sdk')
