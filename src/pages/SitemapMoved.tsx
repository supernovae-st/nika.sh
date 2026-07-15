import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useHead } from '@unhead/react'

/* ─── /sitemap → /map · the human map moved (§0.12b · the 301-as-static) ─────
   Static hosting cannot emit real 301s, so the moved page IS the redirect:
   meta refresh for everything that reads HTML, rel=canonical pointing at
   /map so equity consolidates there, noindex so this shell never ranks,
   and a client-side navigate for SPA arrivals. The crawler twin stays
   /sitemap.xml (untouched). public/redirects.json carries this move as
   data (live: true) — the e2e replay judges it from the manifest. */

export function Component() {
  const navigate = useNavigate()

  useHead({
    title: 'Moved · the map lives at /map · Nika',
    meta: [
      { name: 'robots', content: 'noindex' },
      { 'http-equiv': 'refresh', content: '0;url=/map' },
    ],
    link: [{ rel: 'canonical', href: 'https://nika.sh/map' }],
  })

  useEffect(() => {
    navigate('/map', { replace: true })
  }, [navigate])

  return (
    <main className="theme-dark" style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>
        The map moved · <Link to="/map">nika.sh/map</Link>
      </p>
    </main>
  )
}
