/* ─── idle-flag · the root [data-idle] convention (wave-I VFX) ────────────────
   EdgeAurora parks its ambient animations when the tab hides (its own
   data-idle). This is the SHARED root-level expression of the same law for
   pure-CSS ambient effects (panel-sheen.css): one visibilitychange listener
   flips `data-idle="on"` on <html>; any ambient animation pauses via
   `html[data-idle='on'] …`. Idempotent · SSR-safe · never detached (the
   document outlives every consumer). */

let armed = false

export function armIdleFlag() {
  if (armed || typeof document === 'undefined') return
  armed = true
  const sync = () => {
    if (document.hidden) document.documentElement.dataset.idle = 'on'
    else delete document.documentElement.dataset.idle
  }
  document.addEventListener('visibilitychange', sync)
  sync()
}
