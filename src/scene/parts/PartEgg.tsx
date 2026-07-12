import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { usePlan3D } from '../use-plan3d'
import { PartSchematic } from './PartSchematic'
import './part-stage.css'

/* three + fiber stay in the shared lazy vendor chunk — a static import here
   would trip size-budget's three-leak gate (the hard law) */
const PartViewer = lazy(() => import('./PartViewer'))

/* ─── PartEgg · the part's gate + berth ───────────────────────────────────────
   The DrumEgg recipe, verbatim: a CSS-reserved stage carrying the 2D
   PartSchematic from first paint (the poster + the mobile/reduced/no-GL
   truth); usePlan3D mounts the GL layer over it; the outer init watchdog
   remounts a canvas that never stamps [data-part-painted] (3 tries with
   backoff, zero console noise), then the drawing keeps the room. */

export function PartEgg({ id }: { id: string }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const able = usePlan3D(stageRef)
  const [glTry, setGlTry] = useState(0)

  useEffect(() => {
    if (!able || glTry >= 3) return
    const t = setTimeout(
      () => {
        const el = stageRef.current
        if (el && !el.dataset.partPainted) setGlTry((v) => v + 1)
      },
      2500 * (glTry + 1),
    )
    return () => clearTimeout(t)
  }, [able, glTry])

  return (
    <div ref={stageRef} className="ptd-stage" data-part-stage={id} aria-hidden="true">
      <PartSchematic id={id} />
      {able && glTry < 3 ? (
        <Suspense fallback={null}>
          <PartViewer key={glTry} id={id} stageRef={stageRef} />
        </Suspense>
      ) : null}
    </div>
  )
}
