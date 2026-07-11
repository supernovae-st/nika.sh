import { useEffect } from 'react'

/* ─── useAnchorScroll · the register deep-link scroll, re-aimed ───────────────
   Every register page (/errors/:code · /tools/:name · /providers/:id ·
   /templates/:name) scrolls its active row into view on mount. A ONE-SHOT
   scrollIntoView drifts on slow devices: it fires against the first layout,
   then fonts/late reveals grow the page above the row and the target ends
   below the fold again — the belt's own re-aim law, observed live (the
   e2e register pin failed 2/4 on a loaded machine: row highlighted,
   top 2202 vs viewport 1000 — the scroll had been outgrown).

   The fix is the aim, repeated until the layout is done moving: scroll now,
   re-aim after fonts settle, and re-aim once more a beat later. behavior:
   'instant', NOT 'auto' — 'auto' defers to the stylesheet, and the site's
   html{scroll-behavior:smooth} would turn three aims into three glides
   (the smooth-hijack law, swept site-wide in #196: an arrival is not a
   travel). Cleanup-guarded: a route change cancels the remaining aims. */
export function useAnchorScroll(id: string | undefined, block: ScrollLogicalPosition = 'center') {
  useEffect(() => {
    if (!id) {
      return
    }
    let alive = true
    const aim = () => {
      if (!alive) {
        return
      }
      document.getElementById(id)?.scrollIntoView({ block, behavior: 'instant' })
    }
    aim()
    document.fonts?.ready.then(() => {
      if (alive) {
        requestAnimationFrame(aim)
      }
    })
    const late = setTimeout(aim, 600)
    return () => {
      alive = false
      clearTimeout(late)
    }
  }, [id, block])
}
