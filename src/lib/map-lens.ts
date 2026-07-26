/* ─── map-lens · the depth lens flag, one home ───────────────────────────────
   /map's constellation has a second register: the same twin in three.js,
   seven layers as seven floors (pages/Map3dScene.tsx). It stays OFF by
   default — an opt-in, per the WO-13 verdict — but « off by default » and
   « unreachable » are different things, and until this module the only way
   in was to type localStorage.setItem in a console. A flag nobody can flip
   is a surface nobody has.

   So: one key, one reader, one toggle, and a live subscription — the ⌘K
   action flips it and the page answers in the same frame, no reload. The
   reduced-motion refusal is NOT stored here; it is a separate, permanent
   veto read at the mount (a preference is not a setting to overwrite). */

export const MAP_LENS_KEY = 'nika-map-3d'
const EVENT = 'nika:map-lens'

/** the stored opt-in alone — the motion veto is applied by the reader */
export function mapLensStored(): boolean {
  try {
    return localStorage.getItem(MAP_LENS_KEY) === '1'
  } catch {
    return false
  }
}

/** a visitor who asked for less motion never gets the lens, flag or not */
export function motionAllowsLens(): boolean {
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return true
  }
}

/** the flag as the page reads it: asked for, and allowed */
export function mapLensOn(): boolean {
  return mapLensStored() && motionAllowsLens()
}

/** flip it · returns the new state (the caller reports it) */
export function toggleMapLens(): boolean {
  const next = !mapLensStored()
  try {
    if (next) localStorage.setItem(MAP_LENS_KEY, '1')
    else localStorage.removeItem(MAP_LENS_KEY)
  } catch {
    return mapLensStored()
  }
  window.dispatchEvent(new CustomEvent(EVENT))
  return next
}

/** live: the toggle lands without a reload · storage covers other tabs */
export function subscribeMapLens(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}
