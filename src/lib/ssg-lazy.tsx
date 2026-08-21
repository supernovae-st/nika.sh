import { Suspense, type ReactNode } from 'react'
import { useHydrated } from './use-hydrated'

/* A route must be synchronous for vite-plugin-react-ssg, but its authored
   surface does not have to ride the browser entry. At SSG time the caller
   passes the real, server-only component as `poster`. During the client's
   first render we preserve those exact bytes with dangerouslySetInnerHTML,
   so React has nothing inside the poster to reconcile. One settled render
   later, the lazy client component takes over.

   This is the page-scale twin of ssg-island.tsx: static HTML is the transport
   here, rather than JSON. It keeps rich no-JS/SEO output, route-level code
   splitting and byte-identical hydration at the same time. */
function Poster({ id, children }: { id: string; children?: ReactNode }) {
  if (import.meta.env.SSR) {
    return <div id={id} style={{ display: 'contents' }}>{children}</div>
  }

  const html = document.getElementById(id)?.innerHTML ?? ''
  return (
    <div
      id={id}
      style={{ display: 'contents' }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function SsgLazy({ id, poster, children }: {
  id: string
  poster?: ReactNode
  children: ReactNode
}) {
  const hydrated = useHydrated()
  const fallback = <Poster id={id}>{poster}</Poster>
  return hydrated ? <Suspense fallback={fallback}>{children}</Suspense> : fallback
}

/* renderToString cannot settle a React.lazy boundary. Render its authored
   fallback directly for SSG and the first client pass, then introduce the
   real Suspense boundary only after hydration. This is the small-island form
   of SsgLazy: no poster transport, one shared guard against React #419. */
export function SsgSuspense({ fallback, children }: {
  fallback: ReactNode
  children: ReactNode
}) {
  const hydrated = useHydrated()
  return hydrated ? <Suspense fallback={fallback}>{children}</Suspense> : fallback
}
