import { Link } from 'react-router'
import { ERROR_CODES, ERROR_NAMESPACES } from '../content/errors.generated'
import { useLamp } from '../lib/use-lamp'

/* ─── the refusal shelf · 23 namespaces at a glance ───────────────────────────
   The register below already groups by namespace, so a second grouped view
   would be a copy of the data rather than a design. What was missing is the
   OVERVIEW: ninety-six codes stacked as full-width sections is a long scroll,
   and nobody arrives wanting to read it. They arrive holding a code, or
   wanting to know what one subsystem can refuse.

   So this is a shelf you take in with one look and jump from. Twenty-three
   plates, each carrying its count and its dominant family, so the wall reads
   before anything is opened: mostly shape, with a few dark bands where the
   namespaces that guard REACH sit. Both facts derive from errors.generated;
   nothing here is authored.

   The plates are the site's shared object (styles/plate.css, projected from
   nika-spec design/tokens.yaml), lit by the one lamp. */

/* a refusal about REACH is not the same event as one about SHAPE, and the eye
   should get that for free */
const REACH = new Set([
  'security_error',
  'budget_error',
  'timeout_error',
  'process_error',
  'tool_error',
  'provider_error',
])

const SHELF = ERROR_NAMESPACES.map((ns) => {
  const codes = ERROR_CODES.filter((e) => e.code.startsWith(`${ns}-`))
  const counts = new Map<string, number>()
  for (const c of codes) counts.set(c.category, (counts.get(c.category) ?? 0) + 1)
  const dominant = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'validation_error'
  return { ns, n: codes.length, dominant, families: counts.size }
}).filter((d) => d.n > 0)

export function ErrorCabinet() {
  const { ref: lampRef, props: lampProps } = useLamp<HTMLDivElement>()
  const reach = SHELF.filter((d) => REACH.has(d.dominant)).length

  return (
    <div className="ec" ref={lampRef} {...lampProps}>
      <p className="ec-head">
        <b>{ERROR_CODES.length} codes</b> across <b>{SHELF.length} namespaces</b>, of which{' '}
        <b>{reach}</b> mostly refuse a <em>reach</em> rather than a <em>shape</em>. Jump to the one
        you are holding.
      </p>

      <ul className="ec-shelf cabinet">
        {SHELF.map(({ ns, n, dominant, families }) => (
          <li key={ns}>
            <Link
              to={`/language/error-namespaces/${ns}`}
              className="plate ec-front"
              data-tone={REACH.has(dominant) ? 'reach' : 'shape'}
            >
              <span className="plate-title ec-ns">{ns.replace('NIKA-', '')}</span>
              <span className="ec-n">{n}</span>
              <span className="ec-cat">
                {dominant.replace('_error', '')}
                {families > 1 && <span className="ec-more"> +{families - 1}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
