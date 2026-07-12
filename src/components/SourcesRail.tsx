import type { SourceLink } from '../content/sources'
import { SOURCE_GLYPH } from '../content/sources'

/* ─── SourcesRail · where this element lives, as chips ────────────────────────
   One renderer for the sources registry (sources.ts) — the rooms, the spec
   reading and the 3D berths all call THIS, never their own copies. Chips
   ride the td-chip register; the kind glyph is the mono prefix; the hint
   teaches on hover. External links open a tab (the mega-menu convention);
   internal ones stay soft navigations. */

export function SourcesRail({ links, dense }: { links: SourceLink[]; dense?: boolean }) {
  return (
    <ul className={`td-chips${dense ? ' src-rail--dense' : ''}`}>
      {links.map((l) => {
        const external = l.href.startsWith('http')
        return (
          <li key={l.href + l.label}>
            <a
              className="td-chip src-chip"
              href={l.href}
              title={l.hint}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              <span className="src-glyph" aria-hidden>
                {SOURCE_GLYPH[l.kind]}
              </span>
              {l.label}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
