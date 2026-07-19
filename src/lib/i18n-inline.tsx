import type { ReactNode } from 'react'

/* ─── i18n-inline · the markdown-lite renderer for the L1 corpus ─────────────
   The reviewed yaml speaks three inline marks (`code` · **bold** · *italic*)
   plus LINK TOKENS: named phrases every translation keeps verbatim (the
   voice contract) that the renderer turns into the page's real anchors —
   copy stays translatable, hrefs stay code. Deterministic, tiny, no lib. */

export interface LinkToken {
  /** the exact phrase as it appears in the copy (any locale keeps it) */
  match: RegExp
  href: string
  external?: boolean
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g

function renderPlain(text: string, links: LinkToken[], keyBase: string): ReactNode[] {
  /* link tokens first (they never nest with the marks in this corpus) */
  for (const t of links) {
    const m = t.match.exec(text)
    t.match.lastIndex = 0
    if (m) {
      return [
        ...renderPlain(text.slice(0, m.index), links, `${keyBase}a`),
        t.external ? (
          <a key={`${keyBase}l`} href={t.href} target="_blank" rel="noreferrer" className="ins-link">
            {m[0]}
          </a>
        ) : (
          <a key={`${keyBase}l`} href={t.href} className="ins-link">
            {m[0]}
          </a>
        ),
        ...renderPlain(text.slice(m.index + m[0].length), links, `${keyBase}b`),
      ]
    }
  }
  return text ? [text] : []
}

/** yaml copy → React children (marks + link tokens) */
export function inline(text: string, links: LinkToken[] = []): ReactNode[] {
  return text.split(INLINE).flatMap((part, i): ReactNode[] => {
    if (part.startsWith('`') && part.endsWith('`')) return [<code key={i}>{part.slice(1, -1)}</code>]
    if (part.startsWith('**') && part.endsWith('**')) return [<b key={i}>{part.slice(2, -2)}</b>]
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return [<i key={i}>{part.slice(1, -1)}</i>]
    return renderPlain(part, links, String(i))
  })
}
