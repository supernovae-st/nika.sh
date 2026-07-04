/* ─── use-scroll-well · the keyboard law for horizontal scroll wells ──────────
   A scrollable region must be REACHABLE to be scrolled: the element earns a
   tab stop exactly when its content overflows (either axis, zero tolerance —
   axe's judgment), and gives it back when everything fits. Pair the call-site
   with a `:focus-visible` outline and an accessible name (aria-label).
   CodeFile's pre applies the same rule inline (fused with its fade measurer). */
import { useEffect, type RefObject } from 'react'

export function useScrollWellTab(ref: RefObject<HTMLElement | null>, dep?: unknown) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) el.tabIndex = 0
      else el.removeAttribute('tabindex')
    }
    update()
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [ref, dep])
}
