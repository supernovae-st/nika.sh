import { useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router'
import { localeForLanguages, localeOf, variantsFor } from '../lib/i18n'
import { SUGGEST } from './locale-suggest-lines'

/* ─── LocaleSuggest · the Accept-Language suggestion (WO-9a · §4bis law 2) ────
   NEVER a redirect: the visitor's browser language only earns a quiet,
   dismissible suggestion when THIS page ships a variant in that language —
   the choice stays with the human and the crawlers. Dismiss is remembered
   (localStorage) and never asked again.

   SSG-safe by construction: everything here reads client state (navigator,
   storage), so the component renders null on the server AND on the first
   client render (the useSyncExternalStore snapshots), and only appears
   after hydration — no branch ever exists in the prerendered HTML. Goldens
   stay EN-headless-clean (an en-US browser on an EN page never matches). */

const DISMISS_KEY = 'nika-locale-suggest'

/* subscribe once to storage (another tab dismissing hides it here too) */
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}
const dismissedSnapshot = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'off'
  } catch {
    return true // storage blocked → never nag
  }
}

export default function LocaleSuggest() {
  const { pathname } = useLocation()
  /* server + first client render agree on "dismissed" → renders nothing,
     hydration byte-true; the live value arrives on the next render */
  const dismissed = useSyncExternalStore(subscribe, dismissedSnapshot, () => true)
  const browser = useSyncExternalStore(
    () => () => {},
    () => localeForLanguages(navigator.languages ?? [navigator.language]),
    () => undefined,
  )

  if (dismissed || !browser) return null
  if (browser.bcp47 === localeOf(pathname).bcp47) return null
  const target = variantsFor(pathname).find((v) => v.locale.bcp47 === browser.bcp47)
  if (!target) return null

  return (
    <div className="lsg" role="status">
      <Link to={target.path} lang={browser.bcp47} className="lsg-link">
        {SUGGEST[browser.bcp47]} →
      </Link>
      <button
        type="button"
        className="lsg-dismiss"
        aria-label="Dismiss language suggestion"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, 'off')
          } catch {
            /* storage blocked — the bar dies with the session */
          }
          window.dispatchEvent(new StorageEvent('storage', { key: DISMISS_KEY }))
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
