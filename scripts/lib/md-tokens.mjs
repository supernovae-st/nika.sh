/* ─── md-tokens · markdown → the blog's block vocabulary, once ───────────────
   Lifted out of build-chapters.mjs on 2026-08-02 when a SECOND corpus of
   authored prose (the engine's decision record) needed the same lexer. A
   lexer copied is a lexer that drifts: the two would have rendered the same
   markdown two ways the first time either one learned a token.

   The vocabulary is the blog's BlogToken (p · h · code · quote · list · hr),
   and anything outside it fails LOUDLY rather than dropping prose silently.

   The slugger is GITHUB's, not the blog's: both corpora are authored as
   GitHub markdown and write their own cross-references against GitHub
   anchors. */
import { marked } from 'marked'

/* the block vocabulary is the blog's (BlogToken in src/content/blog.generated):
   p · h · code · quote · list · hr. A chapter that uses anything else fails
   LOUDLY rather than silently dropping prose from the specification. */
export const flatText = (toks) => toks.map((t) => t.raw ?? t.text ?? '').join('')
export function inlineOf(toks) {
  const out = []
  for (const t of toks ?? []) {
    if (t.type === 'strong') out.push({ k: 'strong', text: flatText(t.tokens) })
    else if (t.type === 'em') out.push({ k: 'em', text: flatText(t.tokens) })
    else if (t.type === 'codespan') out.push({ k: 'code', text: t.text })
    else if (t.type === 'link') out.push({ k: 'link', text: flatText(t.tokens), href: t.href })
    else if (t.type === 'br') out.push({ k: 'text', text: ' ' })
    else out.push({ k: 'text', text: t.text ?? t.raw ?? '' })
  }
  return out
}
/* GITHUB's slugger, not the blog's. The spec is authored as GitHub markdown
   and its own cross-references are written against GitHub anchors: strip
   punctuation (an apostrophe VANISHES, it does not become a dash), then turn
   each remaining space into one dash — which is why « outputs (optional) ·
   the workflow's return value » anchors as `outputs--optional--the-workflows-
   return-value` with the doubles intact. Using the blog's collapsing slugger
   broke every internal link the specification makes to itself.
   Repeats get GitHub's -1 · -2 suffix, per chapter (the spec reuses « Fields »
   and « Syntax » under different parents). */
export function makeSlugger() {
  const seen = new Map()
  return (s) => {
    const base = s
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s/g, '-')
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return n === 0 ? base : `${base}-${n}`
  }
}
export function lex(body, file) {
  const anchorOf = makeSlugger()
  const tokens = []
  for (const t of marked.lexer(body)) {
    if (t.type === 'space') continue
    else if (t.type === 'paragraph') tokens.push({ k: 'p', inline: inlineOf(t.tokens) })
    else if (t.type === 'heading')
      tokens.push({ k: 'h', depth: t.depth, text: flatText(t.tokens), id: anchorOf(flatText(t.tokens)) })
    else if (t.type === 'code')
      tokens.push({ k: 'code', lang: (t.lang ?? '').split(/\s+/)[0] || 'text', text: t.text })
    else if (t.type === 'blockquote')
      tokens.push({
        k: 'quote',
        inline: (t.tokens ?? []).filter((x) => x.type === 'paragraph').flatMap((p) => inlineOf(p.tokens)),
      })
    else if (t.type === 'list')
      tokens.push({
        k: 'list',
        ordered: Boolean(t.ordered),
        items: t.items.map((it) => inlineOf((it.tokens ?? []).flatMap((x) => x.tokens ?? [x]))),
      })
    else if (t.type === 'hr') tokens.push({ k: 'hr' })
    /* an HTML COMMENT block is authoring margin, not prose (the engine's
       decision record annotates its own history in comments · adr-111 first,
       2026-08-06) · it renders nothing on GitHub and nothing here. Any OTHER
       html block still fails loudly — the vocabulary stays closed. */
    else if (t.type === 'html' && /^\s*<!--[\s\S]*?-->\s*$/.test(t.raw)) continue
    else if (t.type === 'table') {
      /* the spec uses tables the blog never did · rendered as a list of rows
         rather than dropped: losing a normative table would be a lie. */
      const rows = [t.header.map((c) => flatText(c.tokens)), ...t.rows.map((r) => r.map((c) => flatText(c.tokens)))]
      tokens.push({ k: 'list', ordered: false, items: rows.map((r) => [{ k: 'text', text: r.filter(Boolean).join(' · ') }]) })
    } else throw new Error(`${file}: unsupported block token "${t.type}"`)
  }
  return tokens
}
