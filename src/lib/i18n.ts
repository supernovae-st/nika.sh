/* ─── i18n seam · the one locale registry + pure derivations (WO-9a) ──────────
   THE ANTI-SLOP LAW (§4bis): a page exists in a locale ONLY if its authored
   content exists and its route is served. LOCALIZED below is the single
   declaration; site.config SPREADS it into PATHS (so a registry row IS a
   served route by construction) and i18n.test pins the other direction
   (every locale-prefixed route in PATHS traces back to a registry row).
   hreflang clusters, the footer switcher and the Accept-Language suggestion
   all derive from here — none can announce a page that does not exist.

   The locale SET is locked (mega-plan §4bis: en + 7, no additions in this
   plan). This module is presentation-class — at the L7 rebase it folds into
   nika-lens-presentation.yaml next to nav/footer authored intent (NIKA LENS
   pause: no normative facts live here; the language of record stays EN).

   Bundle note: this module is ~1KB and client-safe (the banner + switcher
   read it). PATHS must NEVER enter the client graph — everything here
   derives from the registry, not from the route list. */

export interface Locale {
  /** BCP 47 tag — drives hreflang + <html lang> */
  bcp47: string
  /** URL prefix segment ('' for the EN root) */
  prefix: string
  /** the switcher label (the manifesto rail precedent) */
  label: string
}

/* order is the cluster order everywhere (head links · sitemap · switcher) —
   EN root first, then the manifesto-established sequence. The Accept-Language
   suggestion lines live with the lazy banner (LocaleSuggest.tsx) — this
   module rides the initial bundle and stays lean. */
export const LOCALES: Locale[] = [
  { bcp47: 'en', prefix: '', label: 'EN' },
  { bcp47: 'fr', prefix: 'fr', label: 'FR' },
  { bcp47: 'es', prefix: 'es', label: 'ES' },
  { bcp47: 'de', prefix: 'de', label: 'DE' },
  { bcp47: 'pt-BR', prefix: 'pt-br', label: 'PT' },
  { bcp47: 'ja', prefix: 'ja', label: '日本語' },
  { bcp47: 'ko', prefix: 'ko', label: '한국어' },
  { bcp47: 'zh-Hans', prefix: 'zh-hans', label: '中文' },
]

/* ── the localized-pages registry · THE declaration ──────────────────────────
   base EN path → locale prefixes whose authored variant ships. site.config
   spreads localizedPaths() of each row into PATHS; a prefix listed here
   without a page (or the reverse) goes red in i18n.test naming the path.
   L1 pages join at WO-10 by adding rows — nothing else moves. */
export const LOCALIZED: Record<string, string[]> = {
  '/manifesto': ['fr', 'es', 'de', 'pt-br', 'ja', 'ko', 'zh-hans'],
}

const PREFIXES = new Map(LOCALES.filter((l) => l.prefix).map((l) => [l.prefix, l]))

/** the locale a pathname lives in (by URL prefix · EN for the root tree) */
export function localeOf(pathname: string): Locale {
  const seg = pathname.split('/')[1]
  return PREFIXES.get(seg) ?? LOCALES[0]
}

/** the EN base path of any pathname (identity for root-tree paths) */
export function baseOf(pathname: string): string {
  const l = localeOf(pathname)
  return l.prefix ? pathname.slice(l.prefix.length + 1) || '/' : pathname
}

/** localized path for a base (the EN base itself when prefix is '') */
export function localePath(base: string, locale: Locale): string {
  return locale.prefix ? `/${locale.prefix}${base}` : base
}

/** the localized route list a registry row contributes to PATHS */
export function localizedPaths(base: string): string[] {
  const prefixes = new Set(LOCALIZED[base] ?? [])
  return LOCALES.filter((l) => l.prefix && prefixes.has(l.prefix)).map((l) => localePath(base, l))
}

/** every registered variant of the page, in cluster order — the page itself
    included; length > 1 means "localized" */
export function variantsFor(pathname: string): { locale: Locale; path: string }[] {
  const base = baseOf(pathname)
  const prefixes = new Set(LOCALIZED[base] ?? [])
  return LOCALES.filter((l) => !l.prefix || prefixes.has(l.prefix)).map((locale) => ({
    locale,
    path: localePath(base, locale),
  }))
}

/** the bidirectional hreflang cluster for a page (self + every sibling +
    x-default on the EN base) — empty when the page has no variants, so a
    consumer can spread it unconditionally (announce only what exists) */
export function hreflangLinks(pathname: string): { hreflang: string; href: string }[] {
  const variants = variantsFor(pathname)
  if (variants.length < 2) return []
  return [
    ...variants.map((v) => ({ hreflang: v.locale.bcp47, href: v.path })),
    { hreflang: 'x-default', href: baseOf(pathname) },
  ]
}

/** the locale a visitor's Accept-Language list points at, inside OUR set —
    primary-subtag match (fr-CA → fr); pt maps to the one pt we serve,
    zh to the one zh (Hans · the only variant in the locked set) */
export function localeForLanguages(languages: readonly string[]): Locale | undefined {
  for (const lang of languages) {
    const primary = lang.toLowerCase().split('-')[0]
    const hit = LOCALES.find((l) => l.bcp47.toLowerCase().split('-')[0] === primary)
    if (hit) return hit
  }
  return undefined
}
