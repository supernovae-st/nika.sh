import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

/* the panel half of the brand context-menu — its own module so the entry
   never pays for an egg: the chunk loads at the first right-click */

const MARK_URL = '/nika.svg'

const ITEMS = [
  { id: 'copy', label: 'Copy mark as SVG' },
  { id: 'download', label: 'Download mark' },
  { id: 'brand', label: 'Brand guidelines' },
] as const

export default function BrandMenu({ at, onClose }: { at: { x: number; y: number }; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!listRef.current?.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
        const at = items.indexOf(document.activeElement as HTMLElement)
        const next = e.key === 'ArrowDown' ? (at + 1) % items.length : (at - 1 + items.length) % items.length
        items[next]?.focus()
      }
    }
    listRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])

  const act = async (id: (typeof ITEMS)[number]['id']) => {
    if (id === 'copy') {
      const svg = await (await fetch(MARK_URL)).text()
      await navigator.clipboard.writeText(svg)
      setCopied(true)
      setTimeout(onClose, 900)
      return
    }
    if (id === 'download') {
      const a = document.createElement('a')
      a.href = MARK_URL
      a.download = 'nika.svg'
      a.click()
    }
    onClose()
  }

  return (
    <div
      ref={listRef}
      className="v4nav-brandmenu mono"
      role="menu"
      aria-label="Brand assets"
      style={{ left: at.x, top: at.y }}
    >
      {ITEMS.map((item) =>
        item.id === 'brand' ? (
          <Link key={item.id} to="/brand" viewTransition role="menuitem" className="v4nav-brandmenu-item" onClick={onClose}>
            {item.label} <span aria-hidden>→</span>
          </Link>
        ) : (
          <button key={item.id} type="button" role="menuitem" className="v4nav-brandmenu-item" onClick={() => void act(item.id)}>
            {item.id === 'copy' && copied ? '✓ copied' : item.label}
          </button>
        ),
      )}
    </div>
  )
}
