import { useEffect, type RefObject } from 'react'

/* ─── useSlabTilt · the slab answers the hand (wave-I VFX) ────────────────────
   ONE delegated pointermove on the container writes --vfx-tx/--vfx-ty (deg)
   onto the hovered card; slab-sweep.css turns them into a ≤2.5deg perspective
   tilt toward the cursor and springs the card flat on release (the transition
   does the spring — clearing the props is the whole release path).

   Event-driven only (no rAF of its own, passive listeners, transform-only
   writes). Attaches ONLY for fine hover pointers with motion allowed — the
   matching CSS lives behind the same media gates, so coarse/reduced contexts
   never see a transform at all. */
export function useSlabTilt(ref: RefObject<HTMLElement | null>, selector: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = ref.current
    if (!root) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let card: HTMLElement | null = null
    const release = () => {
      if (!card) return
      card.style.removeProperty('--vfx-tx')
      card.style.removeProperty('--vfx-ty')
      card = null
    }
    const onMove = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(selector)
      const next = hit instanceof HTMLElement ? hit : null
      if (next !== card) release()
      if (!next) return
      card = next
      const r = next.getBoundingClientRect()
      const dx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5 /* -0.5..0.5 */
      const dy = (e.clientY - r.top) / Math.max(1, r.height) - 0.5
      next.style.setProperty('--vfx-ty', `${(dx * 5).toFixed(2)}deg`) /* ≤±2.5deg */
      next.style.setProperty('--vfx-tx', `${(-dy * 4).toFixed(2)}deg`) /* ≤±2deg */
    }
    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerleave', release, { passive: true })
    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', release)
      release()
    }
  }, [ref, selector])
}
