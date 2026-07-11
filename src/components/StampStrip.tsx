import { CountUp } from './CountUp'

/* ─── StampStrip · the register's dimensions, at a glance ─────────────────────
   The 4-cell stat band every register page opens with (/use-cases ·
   /changelog · /errors): numbered fig, a CountUp figure (or a mono string —
   dates), the label, the sub. ONE component — the pattern used to be pasted
   per page with silently drifting cell backgrounds (the CopyRow lesson,
   again). Styles: .v4stamp in src/shell/shell.css (the shared-primitive
   home). Rides the section entrance (data-rise · the shared 140ms slot). */

export interface StampItem {
  /** the figure · a number rolls (CountUp) · a string renders mono verbatim */
  n: number | string
  label: string
  sub: string
}

export function StampStrip({ items }: { items: StampItem[] }) {
  return (
    <ul className="v4stamp" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
      {items.map((s, i) => (
        <li className="v4stamp-cell" key={s.label}>
          <span className="v4stamp-fig" aria-hidden>
            {String(i).padStart(2, '0')}
          </span>
          <span className={`v4stamp-n${typeof s.n === 'string' ? ' v4stamp-n--mono' : ''}`}>
            {typeof s.n === 'number' ? <CountUp n={s.n} /> : s.n}
          </span>
          <span className="v4stamp-label">{s.label}</span>
          <span className="v4stamp-sub">{s.sub}</span>
        </li>
      ))}
    </ul>
  )
}
