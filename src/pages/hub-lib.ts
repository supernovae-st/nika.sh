import { useHead } from '@unhead/react'
import { HUBS, type HubData } from './hub-data.generated'
import { ATLAS_PROVENANCE } from '../content/atlas-meta.generated'
import { SITE, SPEC, routeHead } from '../content'

/* ─── hub-lib · the hubs' non-component seams (react-refresh law) ────────────
   chapterHref + useHubHead live OUTSIDE the component file so fast refresh
   keeps working on the shared pieces. */

export const chapterHref = (ch: string) => `${SPEC}/blob/main/${ch}`

/* the hubs' DefinedTermSets, DERIVED from HubData already in the bundle —
   never a second shipped copy (jsonld.generated is a lazy-page corpus; the
   hubs are sync routes and its 80K would ride the initial chunk). One truth
   held by gate, not by hand: atlas.test pins this derivation toEqual the
   compiler's JSONLD_TERMSETS per hub page (the derived-inverses law). */
/* the /sources termset, derived from the chrome-safe TRUTH_WORDS (same
   derived-inverses law: atlas.test pins this equal to the twin's
   JSONLD_TERMSETS['/sources']) */
export function sourcesJsonldSets(words: {
  title: string
  opener: string
  members: { id: string; one_liner: string }[]
}): unknown[] {
  return [
    {
      '@type': 'DefinedTermSet',
      '@id': `${SITE}/sources#set-truth-words`,
      name: `Nika ${words.title.toLowerCase()}`,
      description: words.opener,
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      version: ATLAS_PROVENANCE.engine_version,
      hasDefinedTerm: [...words.members]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((m) => ({
          '@type': 'DefinedTerm',
          '@id': `${SITE}/sources#${m.id}`,
          termCode: m.id,
          name: m.id,
          description: m.one_liner,
        })),
    },
  ]
}

export function hubJsonldSets(hub: HubData): unknown[] {
  return hub.sets
    .filter((set) => set.members.length > 0)
    .map((set) => ({
      '@type': 'DefinedTermSet',
      '@id': `${SITE}${hub.hub}#set-${set.id}`,
      name: `Nika ${set.title.toLowerCase()}`,
      description: set.opener.trim(),
      license: 'https://www.apache.org/licenses/LICENSE-2.0',
      version: ATLAS_PROVENANCE.engine_version,
      hasDefinedTerm: [...set.members]
        .sort((a, b) => a.id.localeCompare(b.id)) // the twin rides node-id order
        .map((m) => ({
          '@type': 'DefinedTerm',
          '@id': `${SITE}${hub.hub}#${set.anchor_prefix}${m.id}`,
          termCode: m.id,
          name: m.id,
          ...(m.one_liner ? { description: m.one_liner } : {}),
        })),
    }))
    .sort((a, b) => a['@id'].localeCompare(b['@id']))
}

export function useHubHead(hubId: string, marketTitle: string, description: string) {
  const hub = HUBS[hubId]
  useHead({
    title: marketTitle,
    link: routeHead(hub.hub).link,
    meta: [
      ...routeHead(hub.hub).meta,
      { name: 'description', content: description },
      { property: 'og:title', content: marketTitle },
      { property: 'og:description', content: description },
      { property: 'og:image', content: `https://nika.sh/og-${hubId}.png` },
      { property: 'og:image:alt', content: description },
      { name: 'twitter:title', content: marketTitle },
      { name: 'twitter:description', content: description },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'TechArticle', '@id': `${SITE}${hub.hub}`, name: marketTitle, description },
            /* derived from the bundle-resident HubData · gate-pinned equal
               to the compiler's JSONLD_TERMSETS (a hand copy here had
               already drifted from the twin once) */
            ...hubJsonldSets(hub),
          ],
        }),
        // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
        processTemplateParams: false,
      },
    ],
  })
  return hub
}

