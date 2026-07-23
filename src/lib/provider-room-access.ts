/* ─── provider-room-access · the ONLY doors to the provider-room cargo ────────
   (register-diet law · the blog-rails-access precedent) The room's heavy
   cargo — the verbatim donor yaml, its audit, the authored meta — must
   reach the client only as an async chunk: the page feeds its FIRST
   render from a byte island (ssg-island.tsx) whose payload it computes
   via ssrProviderRoom() in the SSR-only branch. */

import type { ProviderUsage, ProviderAudit } from '../content/provider-usage.generated'
import type { ProviderMeta } from '../content/provider-meta'

export interface ProviderRoomCargo {
  meta: ProviderMeta
  usage: ProviderUsage
  audit: ProviderAudit
}

type UsageModule = typeof import('../content/provider-usage.generated')
type MetaModule = typeof import('../content/provider-meta')

let SSR_USAGE: UsageModule | null = null
let SSR_META: MetaModule | null = null
if (import.meta.env.SSR) {
  SSR_USAGE = await import('../content/provider-usage.generated')
  SSR_META = await import('../content/provider-meta')
}

const pick = (usage: UsageModule, meta: MetaModule, id: string): ProviderRoomCargo | null => {
  const u = usage.PROVIDER_USAGE[id]
  const a = usage.PROVIDER_AUDITS[id]
  const m = meta.PROVIDER_META[id]
  return u && a && m ? { meta: m, usage: u, audit: a } : null
}

/** the cargo at SSG time (null on the client by construction) */
export const ssrProviderRoom = (id: string): ProviderRoomCargo | null =>
  SSR_USAGE && SSR_META ? pick(SSR_USAGE, SSR_META, id) : null

/** the cargo on the client — the async chunks, once */
export const loadProviderRoom = async (id: string): Promise<ProviderRoomCargo | null> => {
  const [usage, meta] = await Promise.all([
    import('../content/provider-usage.generated'),
    import('../content/provider-meta'),
  ])
  return pick(usage, meta, id)
}
