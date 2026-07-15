import { ATLAS_SET_COUNTS } from '../content/atlas-meta.generated'
import './truth-line.css'

/* ─── CanonCount · every canonical figure is a link (atlas §4 convention) ────
   A number you cannot verify in one click is a marketing number. Every
   rendered canonical count goes through THIS: it reads the derived count
   (never a literal) and links the set's hub — the ratchet deducts any
   canonical figure rendered outside it once WO-3 arms the class.

   `plain`: when the PARENT element is already the link to this very
   register (the /map chips: the whole chip navigates to row.url), the
   count renders as a span — an <a> inside an <a> is illegal HTML, the
   parser splits it, and hydration throws #418 (probe-bisected on /map:
   three island theories fell before this one line). The one-click law
   holds either way: the figure stays one click from its source. */

export function CanonCount({
  setId,
  className,
  plain,
}: {
  setId: string
  className?: string
  plain?: boolean
}) {
  const row = ATLAS_SET_COUNTS[setId]
  if (!row) throw new Error(`CanonCount: unknown set ${setId} (sets.yaml is the registry)`)
  const label = `${row.count} ${row.title.toLowerCase()} · counted from the source, see the register`
  if (plain) {
    return (
      <span className={`canon-count${className ? ` ${className}` : ''}`} aria-label={label}>
        {row.count}
      </span>
    )
  }
  return (
    <a className={`canon-count${className ? ` ${className}` : ''}`} href={row.url} aria-label={label}>
      {row.count}
    </a>
  )
}
