import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'

/* ─── BrandMark · the logo + its context-menu (F-SENSATION-2) ─────────────────
   The Vercel/Linear detail only devs find: a right-click on the mark offers
   the assets they actually came for. The Link is the entry's only cost —
   the menu itself is a lazy chunk fetched at the first right-click (an egg
   nobody pays for until they find it). */

const BrandMenu = lazy(() => import('./BrandMenu'))

export function BrandMark() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  return (
    <>
      <Link
        to="/"
        viewTransition
        className="v4nav-brand"
        aria-label="Nika · home"
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <img src="/nika.svg" alt="" width={19} height={19} />
        nika
      </Link>
      {menu && (
        <Suspense fallback={null}>
          <BrandMenu at={menu} onClose={() => setMenu(null)} />
        </Suspense>
      )}
    </>
  )
}
