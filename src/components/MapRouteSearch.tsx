import { useEffect, useRef, useState } from 'react'

export default function MapRouteSearch({ doors, groups }: { doors: number; groups: number }) {
  const [query, setQuery] = useState('')
  const statusRef = useRef<HTMLParagraphElement>(null)
  const emptyRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const root = document.getElementById('every-page')
    if (!root) return
    const normalized = query.trim().toLocaleLowerCase()
    let visibleDoors = 0
    let visibleGroups = 0

    for (const group of root.querySelectorAll<HTMLElement>('.mp-group')) {
      const heading = `${group.querySelector('.mp-kick')?.textContent ?? ''} ${group.querySelector('.mp-gloss')?.textContent ?? ''}`.toLocaleLowerCase()
      const groupHit = normalized.length === 0 || heading.includes(normalized)
      let groupDoors = 0
      for (const item of group.querySelectorAll<HTMLElement>('.mp-link, .mp-dense-chips > li')) {
        const anchor = item.querySelector('a')
        const haystack = `${item.textContent ?? ''} ${anchor?.getAttribute('href') ?? ''}`.toLocaleLowerCase()
        item.hidden = !groupHit && !haystack.includes(normalized)
        if (!item.hidden) groupDoors += 1
      }
      group.hidden = groupDoors === 0
      if (!group.hidden) {
        visibleGroups += 1
        visibleDoors += groupDoors
      }
      const details = group.querySelector<HTMLDetailsElement>('.mp-more')
      if (details) details.open = Boolean(normalized && groupDoors > 0)
    }
    if (statusRef.current) {
      statusRef.current.textContent = `${visibleDoors} ${visibleDoors === 1 ? 'door' : 'doors'} · ${visibleGroups} ${visibleGroups === 1 ? 'group' : 'groups'}`
    }
    if (emptyRef.current) emptyRef.current.hidden = visibleGroups !== 0

    return () => {
      for (const item of root.querySelectorAll<HTMLElement>('.mp-group, .mp-link, .mp-dense-chips > li')) {
        item.hidden = false
      }
    }
  }, [doors, groups, query])

  return (
    <>
      <div className="mp-directory" role="search">
        <div className="mp-directory-copy">
          <span className="mp-directory-k mono">route index</span>
          <strong>Find the room, not the menu.</strong>
          <span>Search models, providers, MCP servers, guides, errors, posts and machine surfaces.</span>
        </div>
        <label className="mp-search">
          <span className="mp-visually-hidden">Search every page</span>
          <span className="mp-search-mark" aria-hidden>⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search routes, models, providers…"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear route search">
              clear
            </button>
          )}
        </label>
        <p ref={statusRef} className="mp-search-status mono" aria-live="polite">
          {doors} doors · {groups} groups
        </p>
      </div>
      <p ref={emptyRef} className="mp-empty" hidden>
        No room matches “{query}”. Try a provider, model, verb or error code.
      </p>
    </>
  )
}
