import { useCallback, useEffect, useRef, useState } from 'react'
import { prefersLiteData } from './save-data'

/* ─── the lamp · one light for a whole cabinet ────────────────────────────────
   There is one light in the room and every plate obeys it. The bevel brightens
   as a plate turns toward it, the shadow lengthens away from it. A plate alone
   cannot know where the light is, so this sets two custom properties on the
   CABINET and a single gradient (styles/plate.css) lights every plate under it
   at once — one composited layer whatever the count, which is what makes
   ninety-six plates affordable.

   IT COSTS ONE rAF AND TWO PROPERTY WRITES. No per-plate listener, no
   measurement per card; pointer coordinates go straight to percentages of the
   cabinet's own box. Moves are coalesced into a frame, so a fast drag across
   the grid is one write per paint rather than one per event.

   AND IT ASKS BEFORE IT MOVES. Reduced motion leaves the CSS drift animation
   off and the lamp resting at its default angle — the relief stays, the
   movement goes. Save-Data never attaches at all. Without JS the cabinet keeps
   the resting light, which is what the initial-value is for. */

export function useLamp<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const raf = useRef(0)
  const next = useRef<{ x: number; y: number } | null>(null)
  const [held, setHeld] = useState(false)

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    },
    [],
  )

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current
    if (!el || prefersLiteData()) return
    const r = el.getBoundingClientRect()
    next.current = {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    }
    if (raf.current) return
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      const p = next.current
      const node = ref.current
      if (!p || !node) return
      node.style.setProperty('--lamp-x', `${p.x.toFixed(2)}%`)
      node.style.setProperty('--lamp-y', `${p.y.toFixed(2)}%`)
    })
  }, [])

  const onPointerEnter = useCallback(() => {
    if (!prefersLiteData()) setHeld(true)
  }, [])

  /* the drift resumes where the pointer left it — no snap back to centre, the
     lamp simply carries on from the angle you handed it */
  const onPointerLeave = useCallback(() => {
    setHeld(false)
    const el = ref.current
    if (!el) return
    el.style.removeProperty('--lamp-x')
    el.style.removeProperty('--lamp-y')
  }, [])

  return {
    ref,
    props: {
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      ...(held ? { 'data-lamp': 'held' as const } : {}),
    },
  }
}
