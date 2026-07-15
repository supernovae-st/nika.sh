import { useHead } from '@unhead/react'
import { HUBS } from './hub-data.generated'
import { SITE, SPEC, routeHead } from '../content'

/* ─── hub-lib · the hubs' non-component seams (react-refresh law) ────────────
   chapterHref + useHubHead live OUTSIDE the component file so fast refresh
   keeps working on the shared pieces. */

export const chapterHref = (ch: string) => `${SPEC}/blob/main/${ch}`

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
            ...hub.sets.map((set) => ({
              '@type': 'DefinedTermSet',
              '@id': `${SITE}${hub.hub}#set-${set.id}`,
              name: `Nika ${set.title.toLowerCase()}`,
              description: set.opener,
              license: 'https://www.apache.org/licenses/LICENSE-2.0',
              hasDefinedTerm: set.members.map((m) => ({
                '@type': 'DefinedTerm',
                '@id': `${SITE}${hub.hub}#${set.anchor_prefix}${m.id}`,
                termCode: m.id,
                description: m.one_liner,
              })),
            })),
          ],
        }),
        // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
        processTemplateParams: false,
      },
    ],
  })
  return hub
}

