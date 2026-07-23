import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router'
import { GATE_GRID, type HubSet } from './hub-data.generated'
import { TruthLine } from '../components/TruthLine'
import '../sections/v4-home.css'
import './hubs-page.css'

/* ─── the atlas hubs' shared pieces (/flow · /boundary · /proof) ──────────────
   Everything derived rides hub-data.generated (chrome-lean · the pages
   never import the 344-node graph — our own bundle-safety law). Authored
   prose on the pages stays opener-and-transitions thin: the sections
   PROJECT the descriptor's sets. */

/** one anchored definition row per member (the register grammar) */
export function MemberRows({ set }: { set: HubSet }) {
  return (
    <ul className="hub-members">
      {set.members.map((m) => (
        <li key={m.id} className="hub-member" id={`${set.anchor_prefix}${m.id}`}>
          <span className="hub-member-id">
            {/* the member OWNS a page (rooms universelles) — its id is the
                DOOR to the room; the hover card keeps the readout preview.
                Anchor-only members keep the inspector-open behavior. */}
            {m.url ? (
              <Link to={m.url} data-node-id={`${set.node_prefix}:${m.id}`} title="open the member's page">
                {m.id}
              </Link>
            ) : (
              <a
                href={`#${set.anchor_prefix}${m.id}`}
                data-node-id={`${set.node_prefix}:${m.id}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                  e.preventDefault()
                  window.dispatchEvent(
                    new CustomEvent('insp:open', { detail: { id: `${set.node_prefix}:${m.id}` } }),
                  )
                }}
              >
                {m.id}
              </a>
            )}
            {m.slot && (
              <span className="hub-member-slot" title={`ships with the ${m.slot} wave`}>
                {m.slot}
              </span>
            )}
          </span>
          <span className="hub-member-gloss">{m.one_liner}</span>
        </li>
      ))}
    </ul>
  )
}

export function Rails({ rails }: { rails: { kind: string; label: string; href: string }[] }) {
  return (
    <div className="hub-rails">
      {rails.map((r) => (
        <a key={r.href + r.label} className="hub-rail" href={r.href}>
          <span className="hub-rail-kind">{r.kind}</span>
          {r.label}
        </a>
      ))}
    </div>
  )
}

export function HubFoot({ nodeId }: { nodeId: string }) {
  return (
    <footer className="hub-foot">
      <TruthLine nodeId={nodeId} />
    </footer>
  )
}

/* ─── I1 · the gate-matrix explorable (legal form (a): pure replay) ──────────
   The 40-cell verdict plane renders STATICALLY (hub-data carries it — no
   yaml, tiny); selecting a cell shows its teaching line + the fixture
   witness link. A3 roving law from birth: ONE tab stop, arrows/Home/End
   walk the plane, Enter/Space selects (aria-pressed) — never a 40-stop
   tab wall. The full matrix module (yamls) stays out of every bundle
   until WO-14's deep inspector needs it. */
export function GateMatrix() {
  const { producers, forms, cells } = GATE_GRID
  const cellOf = (p: string, f: string) => cells.find((c) => c.producer === p && c.form === f)!
  const [sel, setSel] = useState<{ p: string; f: string } | null>(null)
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 0, c: 0 })
  const gridRef = useRef<HTMLTableElement>(null)

  const move = useCallback(
    (e: React.KeyboardEvent) => {
      const R = producers.length
      const C = forms.length
      let { r, c } = focus
      if (e.key === 'ArrowRight') c = (c + 1) % C
      else if (e.key === 'ArrowLeft') c = (c - 1 + C) % C
      else if (e.key === 'ArrowDown') r = (r + 1) % R
      else if (e.key === 'ArrowUp') r = (r - 1 + R) % R
      else if (e.key === 'Home') c = 0
      else if (e.key === 'End') c = C - 1
      else return
      e.preventDefault()
      setFocus({ r, c })
      gridRef.current
        ?.querySelector<HTMLButtonElement>(`[data-rc="${r}-${c}"]`)
        ?.focus()
    },
    [focus, producers.length, forms.length],
  )

  const selected = sel ? cellOf(sel.p, sel.f) : null
  return (
    <div className="gm-well">
      <table className="gm-grid" ref={gridRef} onKeyDown={move} aria-label="The gate matrix: producer state by consumer edge form, every verdict fixture-proven">
        <thead>
          <tr>
            <th scope="col">producer ↓ · form →</th>
            {forms.map((f) => (
              <th key={f} scope="col">
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {producers.map((p, r) => (
            <tr key={p}>
              <th scope="row">{p}</th>
              {forms.map((f, c) => {
                const cell = cellOf(p, f)
                const isSel = sel?.p === p && sel?.f === f
                return (
                  <td key={f} className="gm-cell">
                    <button
                      type="button"
                      className="gm-btn"
                      data-rc={`${r}-${c}`}
                      data-verdict={cell.verdict}
                      aria-pressed={isSel}
                      tabIndex={focus.r === r && focus.c === c ? 0 : -1}
                      onFocus={() => setFocus({ r, c })}
                      onClick={() => setSel(isSel ? null : { p, f })}
                    >
                      {cell.verdict}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="gm-detail" role="status" hidden={!selected}>
        {selected && (
          <>
            <span className="gm-detail-line">
              {selected.producer} × {selected.form} → <b>{selected.verdict}</b>
              {selected.code ? ` · ${selected.code}` : ''}
            </span>
            <br />
            {selected.dead ? (
              <>statically dead: the spec refuses this edge at parse (the deep corpus witnesses it).</>
            ) : (
              <>
                verdict authored by the reference model, engine-proven upstream ·{' '}
                <a href={`https://github.com/supernovae-st/nika-spec/tree/main/${selected.fixture}`}>
                  the fixture ↗
                </a>
              </>
            )}
          </>
        )}
      </p>
    </div>
  )
}
