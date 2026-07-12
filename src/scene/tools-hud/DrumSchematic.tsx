import { useMemo } from 'react'
import { TOOLS, TOOL_CATEGORIES } from '../../content/tools.generated'
import { layoutDrum } from './slot-layout'

/* ─── DrumSchematic · the 2D truth of the drum (SSR-static SVG) ───────────────
   The instrument's poster layer: a head-on cross-section of the closed drum —
   27 slot ticks in 6 family arcs, 6 divider blades, the focused chamber lit
   at the apex. It prerenders with the page (crawlable, paints with the text,
   zero CLS) and STAYS the truth wherever the 3D never mounts (mobile ·
   prefers-reduced-motion · no WebGL — the TheDrumSphere handshake law: the
   canvas fades in OVER this and stamps [data-hud3d]; CSS dims the schematic
   only then).

   Pure render — geometry from slot-layout (the same module the 3D reads, so
   the two layers can never disagree), no hooks beyond memo, no effects.
   Monochrome blueprint: the hue arrives with the 3D layer; here the focused
   chamber is simply the brightest mark. aria-hidden — the DOM register/args
   carry the same facts as text. */

const R_TICK = 74 /* slot tick outer radius */
const R_ARC = 88 /* family arc rail radius */
const TICK_LEN = 12
const BLADE_LEN = 20

/* SVG y grows downward — θ=0 at the apex, clockwise positive */
function pt(angle: number, r: number): [number, number] {
  return [Math.sin(angle) * r, -Math.cos(angle) * r]
}

function arcPath(start: number, end: number, r: number): string {
  const [x0, y0] = pt(start, r)
  const [x1, y1] = pt(end, r)
  const large = end - start > Math.PI ? 1 : 0
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

export function DrumSchematic({ focus }: { focus?: string }) {
  const layout = useMemo(() => layoutDrum(TOOLS, TOOL_CATEGORIES), [])
  const focused = focus ? layout.slots.find((s) => s.bare === focus) : undefined
  /* aim the focused chamber at the apex — the whole drum rotates, the
     chamber never moves (the 3D layer speaks the same convention) */
  const spin = focused ? -focused.angle : 0

  return (
    <svg
      className="tdrum-svg"
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={`rotate(${((spin * 180) / Math.PI).toFixed(3)})`}>
        {/* the family arc rails */}
        {layout.arcs.map((a) => (
          <path
            key={a.category}
            className="tdrum-arc"
            d={arcPath(a.startAngle - layout.step * 0.35, a.endAngle + layout.step * 0.35, R_ARC)}
          />
        ))}
        {/* the divider blades — the drum is CLOSED, the blades say where */}
        {layout.dividers.map((d) => {
          const [x0, y0] = pt(d.angle, R_TICK - BLADE_LEN)
          const [x1, y1] = pt(d.angle, R_TICK + 4)
          return (
            <line
              key={d.afterCategory}
              className="tdrum-blade"
              x1={x0.toFixed(2)}
              y1={y0.toFixed(2)}
              x2={x1.toFixed(2)}
              y2={y1.toFixed(2)}
            />
          )
        })}
        {/* one tick per builtin — never an empty chamber */}
        {layout.slots.map((s) => {
          const active = focused?.bare === s.bare
          const [x0, y0] = pt(s.angle, R_TICK - TICK_LEN)
          const [x1, y1] = pt(s.angle, R_TICK)
          return (
            <line
              key={s.bare}
              className={`tdrum-tick${active ? ' tdrum-tick--focus' : ''}`}
              x1={x0.toFixed(2)}
              y1={y0.toFixed(2)}
              x2={x1.toFixed(2)}
              y2={y1.toFixed(2)}
            />
          )
        })}
      </g>
      {/* the fixed chamber sight at the apex — the drum turns under it */}
      {focused && (
        <g className="tdrum-sight">
          <path d="M -5 -95 L 0 -88 L 5 -95" />
        </g>
      )}
      {/* the hub — axial, the machine's quiet center */}
      <circle className="tdrum-hub" r="10" />
      <circle className="tdrum-hub tdrum-hub--in" r="3.2" />
    </svg>
  )
}
