import { variantsFor } from './i18n'

/* ─── palette-actions · the ⌘K action register (round-2B) ────────────────────
   An action is real value or it does not exist: copy the graph twin URL
   (everywhere), copy the visible snippet WITH its provenance header (the
   §2bis law made actionable, on pages that show one), copy a post's
   markdown twin (LEGAL since §2c shipped the source), switch locale (one
   action per served variant, derived from the i18n registry — never a
   hand list). Every `when` is a pure function over the open-time context;
   the unit gate proves each one. */

export interface PaletteCtx {
  path: string
  /** a CodeFile is visible on the page (computed at open) */
  hasSnippet: boolean
}

export interface PaletteAction {
  id: string
  label: string
  hint: string
  when: (ctx: PaletteCtx) => boolean
  /** returns the feedback label (« copied ») or null for navigations */
  run: (ctx: PaletteCtx, navigate: (to: string) => void) => Promise<string | null>
}

const TWIN_URL = 'https://nika.sh/ontology/language.json'

export const blogSlugOf = (path: string): string | null =>
  path.match(/^\/blog\/([a-z0-9-]+)$/)?.[1] ?? null

/* the visible snippet + its provenance, straight from the served DOM —
   the same bytes the reader sees, stamped with where they come from */
export function snippetWithProvenance(doc: Document, path: string): string | null {
  const pre = doc.querySelector('.cf-pre')
  const text = pre?.textContent
  if (!text) return null
  const source = doc.querySelector<HTMLAnchorElement>('.cf-src')?.href
  const header = [`# from nika.sh${path}`, ...(source ? [`# source: ${source}`] : [])].join('\n')
  return `${header}\n${text.replace(/\n?$/, '\n')}`
}

export const ACTIONS: PaletteAction[] = [
  {
    id: 'copy-twin-url',
    label: 'Copy the graph twin URL',
    hint: 'the whole language as served data · /ontology/language.json',
    when: () => true,
    run: async () => {
      await navigator.clipboard.writeText(TWIN_URL)
      return 'copied'
    },
  },
  {
    id: 'copy-snippet',
    label: 'Copy snippet with provenance',
    hint: 'the visible yaml, stamped with where it comes from (§2bis)',
    when: (ctx) => ctx.hasSnippet,
    run: async (ctx) => {
      const body = snippetWithProvenance(document, ctx.path)
      if (!body) return null
      await navigator.clipboard.writeText(body)
      return 'copied'
    },
  },
  {
    id: 'copy-post-md',
    label: 'Copy post as markdown',
    hint: 'the served twin · canon markers resolved (§2c)',
    when: (ctx) => blogSlugOf(ctx.path) !== null,
    run: async (ctx) => {
      const slug = blogSlugOf(ctx.path)
      if (!slug) return null
      const res = await fetch(`/blog/${slug}.md`)
      if (!res.ok) return null
      await navigator.clipboard.writeText(await res.text())
      return 'copied'
    },
  },
]

export interface ActionEntry {
  kind: 'action'
  id: string
  label: string
  hint: string
}

/** the rows for the open palette — static actions filtered by `when`, plus
    one « switch to » per OTHER served locale of the page (registry-derived) */
export function actionEntries(ctx: PaletteCtx): ActionEntry[] {
  const rows: ActionEntry[] = ACTIONS.filter((a) => a.when(ctx)).map((a) => ({
    kind: 'action',
    id: a.id,
    label: a.label,
    hint: a.hint,
  }))
  for (const v of variantsFor(ctx.path)) {
    if (v.path === ctx.path) continue
    rows.push({
      kind: 'action',
      id: `locale:${v.locale.bcp47}`,
      label: `Switch to ${v.locale.label}`,
      hint: `this page in ${v.locale.bcp47} · ${v.path}`,
    })
  }
  return rows
}

/** run an entry (static action or a locale switch) — the caller navigates */
export async function runAction(
  entry: ActionEntry,
  ctx: PaletteCtx,
  navigate: (to: string) => void,
): Promise<string | null> {
  if (entry.id.startsWith('locale:')) {
    const target = variantsFor(ctx.path).find((v) => `locale:${v.locale.bcp47}` === entry.id)
    if (target) navigate(target.path)
    return null
  }
  const action = ACTIONS.find((a) => a.id === entry.id)
  return action ? action.run(ctx, navigate) : null
}
