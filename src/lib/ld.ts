/* ─── ld · the machine layer, said once ──────────────────────────────────────
   A room that carries only the site-wide Organization + WebSite tells a
   crawler « a page exists here » and nothing about WHAT it is. 246 of the
   715 served rooms were in that state on 2026-08-02: every model, every MCP
   server, every spec chapter, every teaching step, and the two families born
   that same day (the market providers and the client doors).

   These builders are the shared shape. They exist so a room declares its
   entity in one line, and so the crumb a reader walks and the crumb a
   crawler reads can never disagree — both come from the same call.

   The url a room declares is the url it is SERVED at. When a family moves
   worlds the @id must move with it; a stale @id points a machine at a
   redirect forever (the /providers → /catalog/providers move left exactly
   that behind, and this file is where it got fixed). */
import { SITE } from '../content'

type Crumb = { name: string; path?: string }

/** the trail, machine-side · the last crumb is the room itself (no item) */
export function crumbLd(trail: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: `${SITE}${c.path}` } : {}),
    })),
  }
}

/** an entry in a vocabulary: a model, a provider, a word the language knows */
export function termLd(o: {
  path: string
  name: string
  description: string
  setName: string
  setPath: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${SITE}${o.path}`,
    name: o.name,
    description: o.description,
    url: `${SITE}${o.path}`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: o.setName,
      url: `${SITE}${o.setPath}`,
    },
  }
}

/** a piece of software a reader can point their tool at */
export function appLd(o: {
  path: string
  name: string
  description: string
  category?: string
  url?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE}${o.path}`,
    name: o.name,
    description: o.description,
    url: o.url ?? `${SITE}${o.path}`,
    applicationCategory: o.category ?? 'DeveloperApplication',
  }
}

/** a chapter, a lesson, a piece of writing that teaches */
export function articleLd(o: {
  path: string
  name: string
  description: string
  partOfName?: string
  partOfPath?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${SITE}${o.path}`,
    headline: o.name,
    description: o.description,
    url: `${SITE}${o.path}`,
    ...(o.partOfName && o.partOfPath
      ? {
          isPartOf: {
            '@type': 'CreativeWork',
            name: o.partOfName,
            url: `${SITE}${o.partOfPath}`,
          },
        }
      : {}),
  }
}

/** a file a reader can run · the workflow rooms */
export function codeLd(o: {
  path: string
  name: string
  description: string
  language?: string
  text?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    '@id': `${SITE}${o.path}`,
    name: o.name,
    description: o.description,
    url: `${SITE}${o.path}`,
    programmingLanguage: o.language ?? 'Nika workflow YAML',
    ...(o.text ? { text: o.text } : {}),
  }
}

/** the one script entry a room hands useHead · unhead must not escape it */
export function ldScript(blocks: object[]) {
  return {
    /* the literal, not the widened string: unhead types the script slot */
    type: 'application/ld+json' as const,
    innerHTML: JSON.stringify(blocks),
    // unhead: don't HTML-escape JSON (keeps it valid ld+json, not &quot;)
    processTemplateParams: false,
  }
}
