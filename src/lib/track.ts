/* track · the sovereign funnel events (W12a · FRONT F).
   Thin no-op-safe wrapper over self-hosted umami (stats.nika.sh — MIT,
   cookieless, IP-anonymized, EU; per the studio telemetry canon: no vendor,
   no PII, no cookies). The script tag lives in index.html behind a prod-
   hostname + configured-id gate — everywhere else (dev, previews, script
   blocked, instance down) `window.umami` is absent and track() is a no-op.

   The five funnel events (the ONLY ones — resist event sprawl):
     install-copy · play-run · learn-done · github-out · convert-open

   Declarative wiring: put data-track="event-name" on an interactive element
   and RootLayout's single delegated listener fires it — zero per-component
   handlers. Imperative track() is for non-click moments (learn-done). */

declare global {
  interface Window {
    umami?: { track: (event: string) => void }
  }
}

export type FunnelEvent =
  | 'install-copy'
  | 'play-run'
  | 'play-break'
  | 'play-share'
  | 'play-seed'
  | 'learn-done'
  | 'github-out'
  | 'convert-open'

export function track(event: FunnelEvent): void {
  try {
    window.umami?.track(event)
  } catch {
    /* analytics must never break the site */
  }
}
