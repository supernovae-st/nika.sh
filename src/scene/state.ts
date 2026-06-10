/* ─── shared mutable scene state ───────────────────────────────────────────
   Written by the page (App: smooth-scroll rAF, pointermove) and by the
   clock-driven intro; read every frame inside the R3F scene. Module-level
   mutable objects on purpose — zero React re-renders on the hot path. */

/** cinematic intro timeline (clock-driven in the scene) ·
    bfly = butterfly-shape morph (1 = the logo · 0 = the galaxy) ·
    bflyA = butterfly phase opacity (electric flicker window) */
export const intro = { reveal: 0, bloom: 3.0, dolly: 0, born: 0, bfly: 0, bflyA: 0 }

/** smoothed page scroll (rAF-lerped in App) ·
    progress 0..1 over the WHOLE page (drives the camera curve = the film) ·
    y = smoothed pixels · vh = viewport height (drive viewport-anchored beats:
    title suck, stargate burst — stable however many sections the page grows) */
export const scroll = { progress: 0, y: 0, vh: 800 }

/** normalized pointer −1..1 (global listener in App — canvas sits behind the DOM) */
export const mouse = { x: 0, y: 0 }

/** stargate journey: warp intensity + scroll velocity (drives dust + CRT chroma) */
export const journey = { stargate: 0, vel: 0 }

/** easter eggs · type « nika » anywhere → the butterfly re-forms (epoch ms) */
export const egg = { bflyUntil: 0 }

/** dev: ?it=2.6 freezes every clock-driven film beat (intro film + headline
    glitch cycle) at t=2.6s — deterministic frame-by-frame verification */
export const IT_FREEZE: number | null = (() => {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('it')
  return v == null ? null : Number(v)
})()
