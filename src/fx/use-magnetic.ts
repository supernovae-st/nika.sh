import { useEffect, type RefObject } from 'react'
import './magnetic.css'

/* ─── useMagnetic · the CTA leans toward the hand (wave-I VFX) ────────────────
   Registered elements translate ≤6px toward the cursor inside a 90px field
   around their box (rect-edge distance, squared ramp — the pull wakes softly
   and peaks when the hand arrives). The write channel is the CSS `translate`
   LONGHAND via --mag-x/--mag-y: it composes with each button's existing
   `transform` press physics (the :active dips stay byte-identical) and the
   spring-back is a transition on `translate` alone (magnetic.css).

   ONE window pointermove serves every magnet: attached lazily when the first
   element registers, detached with the last. Event-driven only (no rAF),
   passive, transform-channel writes only. The measured rect is compensated
   by the current pull so the anchor never drifts (no feedback loop).
   Fine hover pointers with motion allowed only — the CSS gates match, so
   coarse/reduced contexts never see a pixel move. */

const FIELD = 90 /* px · the reach around the button's box */
const PULL = 6 /* px · max lean at contact */

type Mag = { mx: number; my: number }
const registry = new Map<HTMLElement, Mag>()
let attached = false

function write(el: HTMLElement, st: Mag, mx: number, my: number) {
  if (Math.abs(mx - st.mx) < 0.1 && Math.abs(my - st.my) < 0.1) return
  st.mx = mx
  st.my = my
  if (mx === 0 && my === 0) {
    el.style.removeProperty('--mag-x')
    el.style.removeProperty('--mag-y')
  } else {
    el.style.setProperty('--mag-x', `${mx.toFixed(2)}px`)
    el.style.setProperty('--mag-y', `${my.toFixed(2)}px`)
  }
}

function releaseAll() {
  for (const [el, st] of registry) write(el, st, 0, 0)
}

function onMove(e: PointerEvent) {
  for (const [el, st] of registry) {
    const r = el.getBoundingClientRect()
    /* subtract the pull we already applied — the field anchors to the
       button's resting box, not its translated one */
    const cx = r.left + r.width / 2 - st.mx
    const cy = r.top + r.height / 2 - st.my
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const ex = Math.max(0, Math.abs(dx) - r.width / 2)
    const ey = Math.max(0, Math.abs(dy) - r.height / 2)
    const dist = Math.hypot(ex, ey)
    if (dist >= FIELD) {
      write(el, st, 0, 0) /* spring home (no-op when already home) */
      continue
    }
    /* clamped-delta pull · NEVER a normalized direction: with the spring
       transition the rect lags the written target, so the compensated anchor
       carries a transient ±px error — a unit vector amplifies that noise to
       the full 6px at dead-center (probed live: -6.00px at rest). The clamp
       is proportional near zero (error in → at most error out · contraction)
       and identical to the old profile at every verified field point. */
    const k = (1 - dist / FIELD) ** 2
    const cap = (v: number) => Math.max(-PULL, Math.min(PULL, v))
    write(el, st, cap(dx) * k, cap(dy) * k)
  }
}

function attach() {
  if (attached) return
  attached = true
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('blur', releaseAll)
  window.addEventListener('pointerout', maybeLeave, { passive: true })
}
function detach() {
  if (!attached || registry.size > 0) return
  attached = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('blur', releaseAll)
  window.removeEventListener('pointerout', maybeLeave)
}
/* pointer leaves the page → every magnet sets down */
function maybeLeave(e: PointerEvent) {
  if (e.relatedTarget === null) releaseAll()
}

export function useMagnetic(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return
    registry.set(el, { mx: 0, my: 0 })
    attach()
    return () => {
      const st = registry.get(el)
      if (st) write(el, st, 0, 0)
      registry.delete(el)
      detach()
    }
  }, [ref])
}
