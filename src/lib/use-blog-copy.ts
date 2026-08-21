import { useMemo } from 'react'
import type { BlogPostCopy } from '../content/blog-bodies.generated'
import { loadBlogCopy, ssrBlogCopy } from './blog-copy-access'
import { useIslandPayload } from './use-island-payload'

type BlogCopy = Record<string, BlogPostCopy>

const slice = (copy: BlogCopy, slugs?: readonly string[]): BlogCopy => {
  if (!slugs) return copy
  return Object.fromEntries(slugs.flatMap((slug) => copy[slug] ? [[slug, copy[slug]]] : []))
}

export function useBlogCopy(id: string, slugs?: readonly string[]) {
  const payload = useIslandPayload(
    id,
    (() => {
      const copy = ssrBlogCopy()
      return copy ? JSON.stringify(slice(copy, slugs)) : null
    })(),
    async () => JSON.stringify(slice(await loadBlogCopy(), slugs)),
  )
  const copy = useMemo<BlogCopy>(() => payload ? JSON.parse(payload) as BlogCopy : {}, [payload])
  return { payload, copy }
}
