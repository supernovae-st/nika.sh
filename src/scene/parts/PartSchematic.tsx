import { useMemo } from 'react'
import { buildPart } from './part-model'

/* ─── PartSchematic · the part's 2D truth (SSR-static SVG) ────────────────────
   The head-on engineering drawing of THE part — an orthographic XY
   projection of the same instance tables the GL layer renders (one module,
   two layers: they can never disagree). Prerenders with the page (the
   poster law) and STAYS the truth on mobile · reduced-motion · no-WebGL;
   the canvas fades in over it and stamps [data-part3d]. aria-hidden — the
   DOM contract carries the same facts as text.

   Rotated blocks draw as rotated rects (roll about Z IS the drawing
   plane's rotation — the builder's single-axis law makes the projection
   exact, not approximate). Ports read brighter; that is the data. */

export function PartSchematic({ id }: { id: string }) {
  const m = useMemo(() => buildPart(id), [id])
  const k = 86 / m.radius / 2 /* world → viewBox units, part fills ~86% */

  const rects = useMemo(() => {
    const out: {
      x: number
      y: number
      w: number
      h: number
      rot: number
      port: boolean
    }[] = []
    for (let i = 0; i < m.count; i++) {
      const w = m.scale[i * 3] * k
      const h = m.scale[i * 3 + 1] * k
      /* z-roll from the quat: angle = 2·atan2(z, w) */
      const rot = (2 * Math.atan2(m.quat[i * 4 + 2], m.quat[i * 4 + 3]) * 180) / Math.PI
      out.push({
        x: m.pos[i * 3] * k,
        y: -m.pos[i * 3 + 1] * k,
        w,
        h,
        rot,
        port: m.seed[i * 2 + 1] > 0.5,
      })
    }
    return out
  }, [m, k])

  return (
    <svg className="ptd-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
      {rects.map((r, i) => (
        <rect
          key={i}
          className={`ptd-block${r.port ? ' ptd-block--port' : ''}`}
          x={(-r.w / 2).toFixed(2)}
          y={(-r.h / 2).toFixed(2)}
          width={r.w.toFixed(2)}
          height={r.h.toFixed(2)}
          transform={`translate(${r.x.toFixed(2)} ${r.y.toFixed(2)}) rotate(${(-r.rot).toFixed(2)})`}
        />
      ))}
    </svg>
  )
}
