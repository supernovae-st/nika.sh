import { REPO, SPEC, DOCS } from '../content'
import type { LanguageWord } from './language.generated'

/* ─── sources · WHERE THE LANGUAGE LIVES, one registry ────────────────────────
   Every element of the language exists in several places at once — the
   normative spec chapter, the served schema editors validate against, the
   machine catalogs, the docs, the MCP oracle agents load, the editor
   extension, the engine itself. This registry is the ONE map of those
   surfaces; the rooms (word · verb · tool), the /spec reading and the 3D
   berths all render slices of it — never their own copies (the CopyRow
   law, applied to provenance).

   EVERY LINK IS VERIFIED REALITY (2026-07-13 · gh api + HTTP 200):
   the spec chapter filenames are the repo's actual tree (00→08); the
   ecosystem repos exist under supernovae-st; docs.nika.sh serves. The
   drift gate (src/test/sources.test.ts) pins internal hrefs to real
   routes/files and external hrefs to the allowlisted homes — a renamed
   chapter goes red here, never a dead link on every room. */

export type SourceKind =
  | 'spec'
  | 'schema'
  | 'catalog'
  | 'docs'
  | 'mcp'
  | 'editor'
  | 'engine'
  | 'registry'

export interface SourceLink {
  kind: SourceKind
  label: string
  href: string
  /** the one-line teaching hint (title attr) */
  hint: string
}

/** the kind's mono glyph — the sources rail's register */
export const SOURCE_GLYPH: Record<SourceKind, string> = {
  spec: '§',
  schema: '{}',
  catalog: '⌗',
  docs: '¶',
  mcp: '◇',
  editor: '⌨',
  engine: '▣',
  registry: '⎘',
}

/* ── the normative chapters (the spec repo's REAL tree · 00→08) ── */
export const SPEC_CHAPTERS = [
  '00-overview.md',
  '01-envelope.md',
  '02-verbs.md',
  '03-dag.md',
  '04-variables.md',
  '05-errors.md',
  '06-stdlib-contract.md',
  '07-conformance.md',
  '08-out-of-scope.md',
] as const

const chapter = (file: (typeof SPEC_CHAPTERS)[number], hint: string): SourceLink => ({
  kind: 'spec',
  label: `spec ${file.slice(0, 2)} · ${file.slice(3).replace('.md', '').replace('-contract', '')}`,
  href: `${SPEC}/blob/main/spec/${file}`,
  hint,
})

/* ── the ecosystem surfaces (shared tails, one definition each) ── */
export const SRC = {
  schema: {
    kind: 'schema',
    label: 'workflow.schema.json',
    href: '/schema/workflow.json',
    hint: 'the served contract — the same file your editor validates against',
  } as SourceLink,
  schemaPinned: {
    kind: 'schema',
    label: 'spec/v1 schema',
    href: '/spec/v1/workflow.schema.json',
    hint: 'the versioned twin the yaml-language-server line points at',
  } as SourceLink,
  docs: {
    kind: 'docs',
    label: 'docs.nika.sh',
    href: DOCS,
    hint: 'guides · examples · the full reference',
  } as SourceLink,
  patterns: {
    kind: 'docs',
    label: 'the patterns guide',
    href: `${DOCS}/guides/patterns`,
    hint: 'the eight authoring patterns, taught long-form',
  } as SourceLink,
  mcp: {
    kind: 'mcp',
    label: 'the MCP oracle',
    href: 'https://github.com/supernovae-st/nika-agents',
    hint: 'nika_schema · nika_explain · nika_check … — 8 read-only tools your agent loads',
  } as SourceLink,
  editor: {
    kind: 'editor',
    label: 'the editor extension',
    href: 'https://github.com/supernovae-st/nika-vscode',
    hint: 'VS Code · Cursor · Windsurf — syntax, diagnostics, DAG view (nika-lang)',
  } as SourceLink,
  engine: {
    kind: 'engine',
    label: 'the engine',
    href: REPO,
    hint: 'the AGPL runtime — nika check enforces everything these pages describe',
  } as SourceLink,
  registry: {
    kind: 'registry',
    label: 'the registry',
    href: 'https://github.com/supernovae-st/nika-registry',
    hint: 'share workflows — every entry content-pinned and re-proven by CI',
  } as SourceLink,
  toolsCatalog: {
    kind: 'catalog',
    label: 'tools/catalog.json',
    href: '/tools/catalog.json',
    hint: 'the stdlib vocabulary, as the machines read it',
  } as SourceLink,
  errorsCatalog: {
    kind: 'catalog',
    label: 'errors/catalog.json',
    href: '/errors/catalog.json',
    hint: 'the typed registry, as the machines read it',
  } as SourceLink,
  templatesCatalog: {
    kind: 'catalog',
    label: 'templates/catalog.json',
    href: '/templates/catalog.json',
    hint: 'the skeleton pack, sha256-pinned',
  } as SourceLink,
  providersCatalog: {
    kind: 'catalog',
    label: 'providers/catalog.json',
    href: '/providers/catalog.json',
    hint: 'the spec-named provider set',
  } as SourceLink,
} as const

/* ── the whole map · WHERE THE LANGUAGE LIVES (the /spec sources block) ── */
export const ECOSYSTEM: SourceLink[] = [
  {
    kind: 'spec',
    label: 'nika-spec',
    href: SPEC,
    hint: 'the normative source — Apache-2.0, nine chapters, conformance-gated',
  },
  SRC.schema,
  SRC.engine,
  SRC.docs,
  SRC.mcp,
  SRC.editor,
  SRC.registry,
]

/* ── per-scope normative chapter (the schema's own structure → the prose) ── */
const SCOPE_CHAPTER: Record<string, SourceLink> = {
  envelope: chapter('01-envelope.md', 'the container — every top-level key'),
  task: chapter('03-dag.md', 'the task shape and the plan it hangs on'),
  infer: chapter('02-verbs.md', 'the four verbs — one execution model each'),
  exec: chapter('02-verbs.md', 'the four verbs — one execution model each'),
  invoke: chapter('02-verbs.md', 'the four verbs — one execution model each'),
  agent: chapter('02-verbs.md', 'the four verbs — one execution model each'),
  retry: chapter('05-errors.md', 'failures, typed — and the leash that retries them'),
  on_error: chapter('05-errors.md', 'failures, typed — the catch side'),
  on_finally: chapter('03-dag.md', 'the cleanup lane rides the task shape'),
}

/* words whose PROSE home differs from their scope's default */
const WORD_CHAPTER: Record<string, SourceLink> = {
  vars: chapter('04-variables.md', 'inputs, interpolation and the ${{ }} grammar'),
  env: chapter('04-variables.md', 'runtime config — may appear in logs'),
  secrets: chapter('04-variables.md', 'masked references — never inline literals'),
  with: chapter('04-variables.md', 'task-level scope injection'),
  output: chapter('04-variables.md', 'named jq bindings over a task result'),
  outputs: chapter('04-variables.md', 'the workflow return value — symmetric to vars'),
  tool: chapter('06-stdlib-contract.md', 'the closed nika: set + the mcp: lane'),
  args: chapter('06-stdlib-contract.md', 'validated against the builtin contract'),
}

/** the sources rail for one language word — spec prose · schema · the lanes */
export function sourcesForWord(w: LanguageWord): SourceLink[] {
  const chapters: SourceLink[] = []
  const seen = new Set<string>()
  const push = (l: SourceLink | undefined) => {
    if (l && !seen.has(l.href)) {
      seen.add(l.href)
      chapters.push(l)
    }
  }
  push(WORD_CHAPTER[w.word])
  for (const d of w.decls) push(SCOPE_CHAPTER[d.scope])
  return [...chapters, SRC.schema, SRC.docs, SRC.mcp, SRC.editor]
}

/** the sources rail for a builtin room */
export const TOOL_SOURCES: SourceLink[] = [
  chapter('06-stdlib-contract.md', 'the stdlib contract — one closed namespace'),
  SRC.toolsCatalog,
  SRC.docs,
  SRC.mcp,
  SRC.editor,
]

/** the sources rail for a verb room */
export const VERB_SOURCES: SourceLink[] = [
  chapter('02-verbs.md', 'the four verbs — one execution model each'),
  SRC.schema,
  SRC.patterns,
  SRC.mcp,
  SRC.editor,
]
