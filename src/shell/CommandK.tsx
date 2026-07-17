import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { PALETTE, type PaletteEntry } from '../content/palette.generated'
import { PATHS, BLOG_PATHS } from '../../site.config'
import { parseQuery, mergePageHits, type PageTextHit } from '../lib/palette-query'
import { actionEntries, runAction, type ActionEntry, type PaletteCtx } from '../lib/palette-actions'
import { track } from '../lib/track'
import { acquireScrollLock, releaseScrollLock } from '../lib/scroll-lock'
import { useFocusTrap, useFocusReturn } from '../lib/focus'
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

/* stage 2 · the page index (pagefind · built from the SSG dist by the
   postbuild step). Loaded once at first use; dev or a missing index
   degrades to the register stage alone — by design, never an error. */
type Pagefind = {
  init?: () => void
  debouncedSearch: (q: string) => Promise<{ results: { data: () => Promise<{ url: string; meta: { title?: string }; excerpt: string }> }[] } | null>
}
const SERVED_ROUTES: ReadonlySet<string> = new Set([...PATHS, ...BLOG_PATHS])

let pagefindOnce: Promise<Pagefind | null> | null = null
const loadPagefind = () => {
  pagefindOnce ??= import(/* @vite-ignore */ `${location.origin}/pagefind/pagefind.js`)
    .then((m: Pagefind) => {
      m.init?.()
      return m
    })
    .catch(() => {
      /* never cache a transient failure (swarm finding [5]) — the next
         query retries the import instead of losing search for the tab */
      pagefindOnce = null
      return null
    })
  return pagefindOnce
}

const KIND_GLYPH: Record<PaletteEntry['kind'], string> = {
  page: '▸',
  post: '¶',
  error: '✕',
  tool: '⌗',
  provider: '◇',
  template: '⎘',
  verb: '›',
  word: '·',
  usecase: '▣',
  set: '≡',
}

export default function CommandK({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  /* the overlay duties (focus.ts · WO-12): give focus back to the opener on
     close — BEFORE the autofocus effect below steals it (mount order) — and
     keep Tab inside the dialog (it used to escape into the page). Escape
     stays below with the combobox keys. */
  useFocusReturn(true)
  useFocusTrap(dialogRef, true)

  /* the open-time context (round-2B): the palette mounts on open, so the
     page state is simply read once — every action.when stays pure over it */
  const [feedback, setFeedback] = useState<string | null>(null)
  const ctx = useMemo<PaletteCtx>(
    () => ({
      path: window.location.pathname,
      hasSnippet: document.querySelector('.cf-pre') !== null,
    }),
    [],
  )
  const actions = useMemo(() => actionEntries(ctx), [ctx])

  const hits = useMemo(() => {
    /* the prefix grammar (WO-12): `e:` scopes to error codes, `t:` to tools…
       — the corpus narrows BEFORE scoring; an unknown prefix stays a plain
       query (palette-query.ts, unit-gated) */
    const { kind, needle } = parseQuery(q)
    if (kind === 'action') {
      const text = needle.trim()
      if (!text) return actions.slice(0, 9)
      return actions
        .map((e) => ({ e, s: Math.max(fuzzyScore(text, e.label), fuzzyScore(text, e.hint) - 20) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 9)
        .map((x) => x.e)
    }
    const corpus: (PaletteEntry | ActionEntry)[] = kind
      ? PALETTE.filter((e) => e.kind === kind)
      : [...PALETTE, ...actions]
    if (!needle.trim()) return corpus.filter((e) => e.kind !== 'action').slice(0, 9)
    return corpus.map((e) => ({
      e,
      s: Math.max(fuzzyScore(needle, e.label), fuzzyScore(needle, e.hint) - 20),
    }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 9)
      .map((x) => x.e)
  }, [q, actions])

  /* stage 2 · « in pages »: past two characters the palette also asks the
     full-text index — rows land BELOW the registers, deduped by url. A
     kind-scoped query is a register question; it never triggers the index. */
  const [pageHits, setPageHits] = useState<PageTextHit[]>([])
  useEffect(() => {
    const { kind, needle } = parseQuery(q)
    const text = needle.trim()
    const registerOnly = Boolean(kind) || text.length < 2
    let live = true
    /* every state write rides the timer (never synchronous in the effect
       body) — the clear fires immediately, a real query waits the debounce */
    const t = setTimeout(() => {
      if (registerOnly) {
        if (live) setPageHits((prev) => (prev.length ? [] : prev))
        return
      }
      void loadPagefind().then(async (pf) => {
        const res = pf ? await pf.debouncedSearch(text) : null
        if (!res || !live) return
        const rows = await Promise.all(
          res.results.slice(0, 12).map(async (r) => {
            const d = await r.data()
            return { url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt }
          }),
        )
        const taken = new Set(hits.flatMap((h) => (h.kind === 'action' ? [] : [h.href.split('#')[0]])))
        if (live) setPageHits(mergePageHits(taken, rows, 8, SERVED_ROUTES))
      })
    }, registerOnly ? 0 : 130)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [q, hits])

  const list: (PaletteEntry | ActionEntry | PageTextHit)[] = useMemo(
    () => [...hits, ...pageHits],
    [hits, pageHits],
  )

  /* the cursor follows the list, never exceeds it */
  const cur = Math.min(cursor, Math.max(0, list.length - 1))

  /* the ctx (path · hasSnippet) is captured at mount — a history
     navigation under the open palette would run actions against a stale
     page (swarm finding [7]): Back simply closes */
  useEffect(() => {
    window.addEventListener('popstate', onClose)
    return () => window.removeEventListener('popstate', onClose)
  }, [onClose])

  useEffect(() => {
    inputRef.current?.focus()
    /* scroll lock while open */
    acquireScrollLock()
    return releaseScrollLock
  }, [])

  /* keep the active option in view as the cursor moves */
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [cur, list])

  const go = (e: PaletteEntry | ActionEntry | PageTextHit) => {
    if (e.kind === 'action') {
      track('palette-action')
      void runAction(e, ctx, (to) => {
        onClose()
        void navigate(to, { viewTransition: true })
      })
        .then((label) => {
          if (label) {
            setFeedback(`${e.label} · ${label}`)
            setTimeout(onClose, 700)
          }
        })
        .catch(() => {
          /* clipboard denial / fetch refusal: name it, never crash */
          setFeedback(`${e.label} · failed`)
          setTimeout(onClose, 900)
        })
      return
    }
    onClose()
    navigate(e.href, { viewTransition: true })
  }

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      onClose()
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault()
      setCursor((c) => Math.min(c + 1, list.length - 1))
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (ev.key === 'Enter' && list[cur]) {
      ev.preventDefault()
      go(list[cur])
    }
  }

  return (
    <div className="ck-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="ck" role="dialog" aria-modal="true" aria-label="Site search">
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
            aria-activedescendant={list[cur] ? `ck-opt-${cur}` : undefined}
            aria-label="Search pages, posts and error codes"
            placeholder="pages · posts · error codes… (e: t: scope · > actions)"
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
          {list.map((e, i) => (
            <li
              key={e.kind === 'action' ? e.id : e.href}
              id={`ck-opt-${i}`}
              role="option"
              aria-selected={i === cur}
              className="ck-opt"
              data-kind={e.kind}
              onPointerMove={() => setCursor(i)}
              onPointerDown={(ev) => ev.preventDefault()}
              onClick={() => go(e)}
            >
              <span className="ck-opt-glyph mono" aria-hidden>
                {e.kind === 'pagetext' ? '⌕' : e.kind === 'action' ? '»' : KIND_GLYPH[e.kind]}
              </span>
              <span className="ck-opt-label">{e.label}</span>
              <span className="ck-opt-hint mono">{e.hint}</span>
            </li>
          ))}
          {list.length === 0 && (
            <li className="ck-empty mono" role="option" aria-selected={false} aria-disabled="true">
              nothing matches; try a page, a post title, a NIKA- code
            </li>
          )}
        </ul>
        <p className="ck-foot mono" aria-hidden>
          {feedback ?? `↑↓ move · ↵ open · > actions · ${PALETTE.length} surfaces`}
        </p>
        <p className="ck-sr" role="status">
          {feedback ?? ''}
        </p>
      </div>
    </div>
  )
}
