import { useMemo, type CSSProperties } from 'react'
import { NK_ANIMS, type NikaAnimId } from '../../icons/manifest'
import { GRID, LOOP_STEPS, pattern } from './patterns'
import './dotmatrix.css'

/* ─── NikaDots · the ontology's motion primitive ──────────────────────────
   Renders an `anim/*` entity from the icon ontology: a 9×9 dot grid whose
   firing order IS the verb's execution model (patterns.ts). Pure CSS after
   mount — opacity-only keyframes, negative delays (no warm-up), alternate
   direction for the request/response + wing-beat figures. INK LAW: the verb
   hue speaks only with `live` (run surfaces); static surfaces keep the dim
   text ink. reduced-motion → the resting figure, no animation. */

type Props = {
  id: NikaAnimId
  /** square size in px (default 72) */
  size?: number
  /** live-run surface → the verb hue is allowed to speak */
  live?: boolean
  /** one beat, in ms (default 110) */
  step?: number
  /** accessible name; omitted = decorative */
  title?: string
  className?: string
}

export function NikaDots({ id, size = 72, live = false, step = 110, title, className }: Props) {
  const def = NK_ANIMS[id]
  const cells = useMemo(
    () =>
      Array.from({ length: GRID * GRID }, (_, i) => pattern(def.pattern, i % GRID, Math.floor(i / GRID))),
    [def.pattern],
  )
  const rootStyle = {
    '--nkdm-n': GRID,
    '--nkdm-size': `${size}px`,
    '--nkdm-loop': `${LOOP_STEPS[def.pattern] * step}ms`,
    ...(live && def.hue ? { color: def.hue } : null),
  } as CSSProperties
  return (
    <span
      className={className ? `nkdm ${className}` : 'nkdm'}
      style={rootStyle}
      data-nkdm={def.pattern}
      data-alt={def.alternate ? '' : undefined}
      data-live={live && def.hue ? '' : undefined}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {cells.map((c, i) => (
        <span
          key={i}
          className="nkdm-dot"
          style={{ '--d': `${-c.delay * step}ms`, '--rest': c.on ? 0.5 : 0.07 } as CSSProperties}
        />
      ))}
    </span>
  )
}
