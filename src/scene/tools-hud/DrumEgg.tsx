import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { usePlan3D } from '../use-plan3d'
import { DrumSchematic } from './DrumSchematic'
import './tool-drum.css'

/* three + fiber stay in the lazy shared vendor chunk — a static import here
   would pull WebGLRenderer into the initial bundle and trip the size-budget
   three-leak gate (the hard law in scripts/size-budget.mjs) */
const ToolDrum = lazy(() => import('./ToolDrum'))

/* ─── DrumEgg · the pin drum's gate + berth ───────────────────────────────────
   The stage is CSS-reserved from first paint and always carries the 2D
   DrumSchematic (prerendered — the poster, and the one truth on mobile ·
   reduced-motion · no-WebGL). When usePlan3D says the moment is worth its
   cost, the 3D layer mounts OVER it and stamps [data-drum3d] — the
   schematic dims under the canvas (the [data-machine] handshake law).

   The outer init watchdog is the hero-13.66 lesson: under starved GL the
   r3f Canvas can fail to init AT ALL (no inner frame ever runs), so the
   recovery lives OUT here — no [data-drum-painted] after 2500·(try+1)ms
   remounts the whole canvas via key, three tries with backoff, then the
   schematic keeps the room. No console noise at any step (the e2e belt's
   console-clean pass runs over these pages). */

export function DrumEgg({ mode, focus }: { mode: 'register' | 'room'; focus?: string }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const able = usePlan3D(stageRef)
  const [glTry, setGlTry] = useState(0)

  useEffect(() => {
    if (!able || glTry >= 3) return
    const t = setTimeout(
      () => {
        const el = stageRef.current
        if (el && !el.dataset.drumPainted) setGlTry((v) => v + 1)
      },
      2500 * (glTry + 1),
    )
    return () => clearTimeout(t)
  }, [able, glTry])

  return (
    <div
      ref={stageRef}
      className={`tdrum-stage tdrum-stage--${mode}`}
      data-tools-hud
      aria-hidden="true"
    >
      <DrumSchematic focus={focus} />
      {able && glTry < 3 ? (
        <Suspense fallback={null}>
          <ToolDrum key={glTry} mode={mode} focus={focus} stageRef={stageRef} />
        </Suspense>
      ) : null}
    </div>
  )
}
