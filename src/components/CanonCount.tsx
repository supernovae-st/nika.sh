import { ATLAS_SET_COUNTS } from '../content/atlas-meta.generated'
import './truth-line.css'

/* ─── CanonCount · every canonical figure is a link (atlas §4 convention) ────
   A number you cannot verify in one click is a marketing number. Every
   rendered canonical count goes through THIS: it reads the derived count
   (never a literal) and links the set's hub — the ratchet deducts any
   canonical figure rendered outside it once WO-3 arms the class. */

export function CanonCount({ setId, className }: { setId: string; className?: string }) {
  const row = ATLAS_SET_COUNTS[setId]
  if (!row) throw new Error(`CanonCount: unknown set ${setId} (sets.yaml is the registry)`)
  return (
    <a
      className={`canon-count${className ? ` ${className}` : ''}`}
      href={row.url}
      aria-label={`${row.count} ${row.title.toLowerCase()} · counted from the source, see the register`}
    >
      {row.count}
    </a>
  )
}
