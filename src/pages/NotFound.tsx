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

/* the joke file OBEYS the law (operator 2026-07-13: every yaml on the site
   is schema-true — even this one): a complete workflow that would check
   green, gated with the rest in onpage-yaml.test.ts */
export const NOT_FOUND_YAML = `nika: v1
workflow:
  id: not-found
  description: "404 · nothing at this path parses"

tasks:
  recover:
    invoke: { tool: "nika:log", args: { message: "go home ↓" } }
`

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
          yaml={NOT_FOUND_YAML}
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
