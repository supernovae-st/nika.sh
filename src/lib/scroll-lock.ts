import { useEffect } from 'react'

/* ─── scroll-lock · the ONE refcounted body lock (swarm finding [3]) ─────────
   Three overlays hand-rolled save/restore copies (Nav sheet · ⌘K · the
   Inspector's full detent); interleaved open/close restored stale values
   and could leave the page permanently unscrollable. One counter, one
   truth: the first acquire saves and hides, the last release restores. */

let holds = 0
let saved = ''

export function acquireScrollLock(): void {
  if (holds === 0) {
    saved = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  holds += 1
}

export function releaseScrollLock(): void {
  holds = Math.max(0, holds - 1)
  if (holds === 0) document.body.style.overflow = saved
}

/** lock while `active` — the hook form every overlay shares */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    acquireScrollLock()
    return releaseScrollLock
  }, [active])
}
