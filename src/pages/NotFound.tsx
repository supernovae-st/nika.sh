import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { CodeFile } from '../components/CodeFile'
import './not-found.css'

/* ─── the SPA catch-all 404 (client-side twin of public/404.html) ─────────────
   Hard misses (a fresh request to a bad URL) are served the static, zero-JS
   public/404.html by the platform (.do/app.yaml error_document) — that
   contract is untouched. This route covers the OTHER path: a client-side
   navigation to a URL that matches no route used to render React Router's
   default error boundary (a register break); now it renders the same crafted
   404 composition inside the app shell. noindex — never a crawl target. */

export function Component() {
  useHead({
    title: '404 · This file doesn’t parse · Nika',
    meta: [{ name: 'robots', content: 'noindex' }],
  })

  return (
    <main className="theme-dark nf-page">
      <p className="nf-tag">Nika · Intent as Code</p>
      <h1 className="nf-title">
        <span className="nf-four">404</span> · this page doesn&rsquo;t exist
      </h1>
      <p className="nf-lede">
        This file doesn&rsquo;t parse: there&rsquo;s nothing at this path. Head
        back to a file that runs.
      </p>
      {/* the joke file wears the SAME editor register as every yaml on the
          site (loop T4 · one voice law) — real chrome, gutter, syntax. */}
      <div className="nf-file" aria-hidden>
        <CodeFile
          yaml={'nika: v1\nworkflow: not-found\ndescription: "404 · nothing at this path parses"\n'}
          filename="not-found.nika.yaml"
          wrap
        />
      </div>
      <nav className="nf-nav" aria-label="Recover">
        <Link className="nf-btn nf-btn--primary" to="/">
          Back to nika.sh
        </Link>
        <Link className="nf-btn" to="/spec">
          Read the spec
        </Link>
      </nav>
    </main>
  )
}
