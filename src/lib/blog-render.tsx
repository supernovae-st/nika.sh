import type { ReactNode } from 'react'
import { CodeFile } from '../components/CodeFile'
import type { BlogInline, BlogToken } from '../content/blog.generated'

/* ─── blog-render · compiled tokens → the site's own elements ─────────────────
   The markdown never reaches the client: scripts/build-blog.mjs lexes it at
   build time and this maps the serializable tokens to React. The payoff of
   owning the mapper: a ```yaml fence renders as the product's editor panel
   (CodeFile — window chrome, gutter, syntax, copy), not a grey <pre>; inline
   code keeps the mono chip register; headings carry anchor ids. Pure function
   of the token array — SSG and hydration always agree. */

function inline(nodes: BlogInline[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.k === 'strong') return <b key={i}>{n.text}</b>
    if (n.k === 'em') return <em key={i}>{n.text}</em>
    if (n.k === 'code') return <code key={i}>{n.text}</code>
    if (n.k === 'link')
      return n.href?.startsWith('/') ? (
        <a key={i} href={n.href}>
          {n.text}
        </a>
      ) : (
        <a key={i} href={n.href} target="_blank" rel="noreferrer">
          {n.text}
        </a>
      )
    return n.text
  })
}

export function BlogBody({ tokens }: { tokens: BlogToken[] }) {
  return (
    <>
      {tokens.map((t, i) => {
        if (t.k === 'p') return <p key={i}>{inline(t.inline)}</p>
        if (t.k === 'h') {
          const H = t.depth <= 2 ? 'h2' : 'h3'
          return (
            <H key={i} id={t.id} className="bp-h">
              {t.text}{' '}
              {/* the permalink affordance · pure HTML (SSG-exact, zero JS):
                  hidden at rest, revealed on heading hover or its own focus */}
              <a href={`#${t.id}`} className="bp-h-anchor mono" aria-label={`Link to “${t.text}”`}>
                #
              </a>
            </H>
          )
        }
        if (t.k === 'code')
          return (
            <div key={i} className="bp-code v4-frame-canvas">
              <CodeFile yaml={t.text} filename={t.filename} lang={t.lang} wrap />
            </div>
          )
        if (t.k === 'quote') return <blockquote key={i}>{inline(t.inline)}</blockquote>
        if (t.k === 'list') {
          const L = t.ordered ? 'ol' : 'ul'
          return (
            <L key={i}>
              {t.items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </L>
          )
        }
        return <hr key={i} />
      })}
    </>
  )
}
