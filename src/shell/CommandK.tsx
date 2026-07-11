import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { PALETTE, type PaletteEntry } from '../content/palette.generated'
import './command-k.css'

/* ─── CommandK · the site as an instrument (arc 13 W2) ────────────────────────
   One field over the whole surface: 12 core pages, every post, every typed
   error code (86 entries, labels+hrefs only — palette.generated.ts stays
   lean by construction; the corpus compiles from the same sources the site
   already trusts). Lazy chunk: RootLayout mounts this only after the first
   ⌘K / nav-button press — the initial bundle carries one keydown listener.

   APG combobox: the input keeps focus for the whole life of the dialog
   (aria-activedescendant carries the visual cursor), arrows move, Enter
   navigates, Esc closes. The dialog itself is aria-modal with a scrim
   click-close; body scroll locks while open (overscroll containment). */

/* subsequence fuzzy · consecutive-run + word-start bonuses, label > hint.
   Returns -1 when the needle does not subsequence-match at all. */
function fuzzyScore(needle: string, hay: string): number {
  if (!needle) return 0
  const n = needle.toLowerCase()
  const h = hay.toLowerCase()
  let score = 0
  let hi = 0
  let run = 0
  for (let ni = 0; ni < n.length; ni++) {
    const c = n[ni]
    if (c === ' ') {
      run = 0
      continue
    }
    let found = -1
    for (let j = hi; j < h.length; j++) {
      if (h[j] === c) {
        found = j
        break
      }
    }
    if (found === -1) return -1
    run = found === hi ? run + 1 : 1
    score += 1 + run * 2 + (found === 0 || /[\s\-·/]/.test(h[found - 1] ?? '') ? 4 : 0)
    hi = found + 1
  }
  /* shorter targets rank higher on equal evidence */
  return score * 100 - h.length
}

const KIND_GLYPH: Record<PaletteEntry['kind'], string> = {
  page: '▸',
  post: '¶',
  error: '✕',
  tool: '⌗',
  provider: '◇',
  template: '⎘',
}

export default function CommandK({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const hits = useMemo(() => {
    if (!q.trim()) return PALETTE.slice(0, 9)
    return PALETTE.map((e) => ({
      e,
      s: Math.max(fuzzyScore(q, e.label), fuzzyScore(q, e.hint) - 20),
    }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 9)
      .map((x) => x.e)
  }, [q])

  /* the cursor follows the list, never exceeds it */
  const cur = Math.min(cursor, Math.max(0, hits.length - 1))

  useEffect(() => {
    inputRef.current?.focus()
    /* scroll lock while open */
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  /* keep the active option in view as the cursor moves */
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cur, hits])

  const go = (e: PaletteEntry) => {
    onClose()
    navigate(e.href, { viewTransition: true })
  }

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      onClose()
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault()
      setCursor((c) => Math.min(c + 1, hits.length - 1))
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (ev.key === 'Enter' && hits[cur]) {
      ev.preventDefault()
      go(hits[cur])
    }
  }

  return (
    <div className="ck-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ck" role="dialog" aria-modal="true" aria-label="Site search">
        <div className="ck-field">
          <span className="ck-glyph mono" aria-hidden>
            ❯
          </span>
          <input
            ref={inputRef}
            className="ck-input mono"
            role="combobox"
            aria-expanded="true"
            aria-controls="ck-list"
            aria-activedescendant={hits[cur] ? `ck-opt-${cur}` : undefined}
            aria-label="Search pages, posts and error codes"
            placeholder="pages · posts · error codes…"
            value={q}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value)
              setCursor(0)
            }}
            onKeyDown={onKey}
          />
          <kbd className="ck-esc mono" aria-hidden>
            esc
          </kbd>
        </div>
        <ul id="ck-list" ref={listRef} className="ck-list" role="listbox" aria-label="Results">
          {hits.map((e, i) => (
            <li
              key={e.href}
              id={`ck-opt-${i}`}
              role="option"
              aria-selected={i === cur}
              className="ck-opt"
              data-kind={e.kind}
              onPointerMove={() => setCursor(i)}
              onPointerDown={(ev) => {
                ev.preventDefault()
                go(e)
              }}
            >
              <span className="ck-opt-glyph mono" aria-hidden>
                {KIND_GLYPH[e.kind]}
              </span>
              <span className="ck-opt-label">{e.label}</span>
              <span className="ck-opt-hint mono">{e.hint}</span>
            </li>
          ))}
          {hits.length === 0 && (
            <li className="ck-empty mono" role="option" aria-selected={false} aria-disabled="true">
              nothing matches — try a page, a post title, a NIKA- code
            </li>
          )}
        </ul>
        <p className="ck-foot mono" aria-hidden>
          ↑↓ move · ↵ open · {PALETTE.length} surfaces
        </p>
      </div>
    </div>
  )
}
