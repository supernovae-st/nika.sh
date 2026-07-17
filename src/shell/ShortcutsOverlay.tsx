import { useRef } from 'react'
import { useFocusTrap, useFocusReturn } from '../lib/focus'
import { shortcutGroups } from '../lib/chords'
import './shortcuts-overlay.css'

/* ─── the `?` overlay · the shortcuts card (round-2A) ────────────────────────
   A TRUE modal (blocking, ephemeral, read-only) — the focus.ts trio applies
   whole: trap + return + Escape. It renders the registered table from
   chords.ts, never a second list; real <kbd> elements carry the keys. */

export default function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, true)
  useFocusReturn(true)
  return (
    <div
      className="sk-scrim"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }}
    >
      <div ref={ref} className="sk" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
        <div className="sk-head mono">
          <span>keyboard</span>
          <button type="button" className="sk-close mono" onClick={onClose}>
            esc
          </button>
        </div>
        {shortcutGroups().map((g) => (
          <section key={g.id} className="sk-group" aria-label={g.title}>
            <h2 className="sk-title mono">{g.title.toLowerCase()}</h2>
            <dl className="sk-rows">
              {g.rows.map((r) => (
                <div key={r.keys} className="sk-row">
                  <dt>
                    {r.keys.split(' ').map((k, i) => (
                      <kbd key={i} className="mono">
                        {k}
                      </kbd>
                    ))}
                  </dt>
                  <dd>{r.does}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}
