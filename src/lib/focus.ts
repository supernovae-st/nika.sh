import { useEffect, type RefObject } from 'react'

/* ─── focus.ts · the house focus system (WO-12 §4quater.11 · round 1) ─────────
   EXTRACTED from the shipped precedents, not invented: useFocusTrap is the
   Nav sheet's Tab-cycle machinery, useFocusReturn is the burger-return the
   sheet already practiced — both generalized so every overlay pays the same
   three duties (trap + return + Escape · Escape stays owner-side, its close
   semantics differ per surface). First consumers: the Nav sheet (machinery
   moved, behavior identical) and ⌘K (its TWO named debts paid — Tab used to
   escape the dialog, and closing returned focus nowhere; the e2e assertion
   that codified `focus === body` inverts with this).

   Round-1 scope: trap + return only. useRovingGrid (the Hero tablist /
   GateMatrix lift) and the announce() singleton land with their first pack
   consumers (Inspector · chords overlay) — no primitive ships unconsumed. */

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Tab/Shift-Tab cycle inside `ref` while `active` — the sheet's trap.
    Visibility filter: offsetParent (display:none subtrees drop out) with the
    activeElement exception the sheet carried. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return
    const focusables = () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (activeEl === first || !ref.current?.contains(activeEl)) {
          e.preventDefault()
          last.focus()
        }
      } else if (activeEl === last || !ref.current?.contains(activeEl)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [ref, active])
}

/** Remember the element focused when the overlay opened; give focus back
    when it closes (unmount or `active` → false). No-ops when the opener
    left the DOM. MOUNT ORDER MATTERS: call this before any effect that
    moves focus into the overlay, so the capture sees the real opener. */
export function useFocusReturn(active: boolean) {
  useEffect(() => {
    if (!active) return
    const opener = document.activeElement as HTMLElement | null
    return () => {
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus()
    }
  }, [active])
}
