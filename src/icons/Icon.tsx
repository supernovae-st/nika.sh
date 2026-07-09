import { NK_ICONS, type NikaIconId } from './manifest'

/* ── NikaIcon · the ontology-driven icon primitive ────────────────────────
   Renders an entity from the icon library (design/icons.yaml → manifest).
   INK LAW (BRAND.md): icons inherit the surrounding text ink (currentColor).
   Verb hues exist on the def (`hue`) but apply ONLY when `live` is set —
   a live-run surface (DAG run · replay) — never in static UI.
   The innerHTML sink is safe by construction: bodies are static build-time
   strings projected from our own committed SVGs (design/build.mjs) — no
   user input can reach it. */

type Props = {
  id: NikaIconId
  /** square size in px (default 16) */
  size?: number
  /** live-run surface → the entity's verb hue is allowed to speak */
  live?: boolean
  /** accessible name; omitted = decorative (aria-hidden) */
  title?: string
  className?: string
}

export function NikaIcon({ id, size = 16, live = false, title, className }: Props) {
  const def = NK_ICONS[id]
  const stroke = def.mode === 'stroke'
  const html = title ? `<title>${title}</title>${def.body}` : def.body
  return (
    <svg
      viewBox={def.viewBox}
      width={size}
      height={size}
      className={className}
      style={live && def.hue ? { color: def.hue } : undefined}
      fill={stroke ? 'none' : 'currentColor'}
      stroke={stroke ? 'currentColor' : undefined}
      strokeWidth={stroke ? def.strokeWidth : undefined}
      strokeLinecap={stroke ? 'round' : undefined}
      strokeLinejoin={stroke ? 'round' : undefined}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      data-nika={id}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
