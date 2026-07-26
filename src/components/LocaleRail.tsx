import { Link } from 'react-router'
import { localeOf, variantsFor } from '../lib/i18n'
import './locale-rail.css'

/* ─── LocaleRail · one cluster, one grammar ───────────────────────────────────
   The visible twin of the hreflang cluster: every served variant of THIS
   page, as real crawlable links. Derived from variantsFor() — the WO-9a
   registry (src/lib/i18n.ts), the same seam that feeds hreflang, the footer
   switcher and the ⌘K locale actions. A hand list here would be a second
   producer with no gate; a registry row is how a cluster gains a voice.

   The anti-slop law applies: a page with no siblings renders NOTHING (never
   a rail of one). The rail owns its own rhythm — placement is the page's,
   the register is the rail's, so two pages can never drift apart visually.

   Precedent: /manifesto shipped this rail by hand (MANIFESTO_LOCALES); the
   values below are ITS values, lifted verbatim. /install had the cluster in
   its <head> and nothing on the page — seven translations a reader could
   only reach through ⌘K or the map. One component closes that. */

export function LocaleRail({ pathname }: { pathname: string }) {
  const variants = variantsFor(pathname)
  /* nothing to switch between is nothing to draw */
  if (variants.length < 2) return null
  const here = localeOf(pathname).bcp47

  return (
    <nav className="locale-rail mono" aria-label="Languages">
      {variants.map(({ locale, path }) => {
        const current = locale.bcp47 === here
        return (
          <Link
            key={locale.bcp47}
            to={path}
            lang={locale.bcp47}
            hrefLang={locale.bcp47}
            aria-current={current ? 'page' : undefined}
          >
            {locale.label}
          </Link>
        )
      })}
    </nav>
  )
}
