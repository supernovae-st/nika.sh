/* ─── build-tool-usage · the per-builtin detail-room data ─────────────────────
   Every /tools/<name> room shows the tool IN A REAL FILE. This compiler
   assembles that evidence, one entry per builtin, from sources that are
   already gated elsewhere — it never invents YAML:

     1 · TEMPLATE EXCERPT — when a spec-pack skeleton invokes the tool
         (`tool: "nika:x"`) or grants it in an agent whitelist (`- "nika:x"`),
         the enclosing task block is excerpted VERBATIM from
         public/templates/catalog.json (conformance-gated upstream,
         sha256-pinned by the templates drift gate). firstLine keeps the
         excerpt's real position in the skeleton — the same body, partially
         shown, never a second version of the file (CodeFile's law).
     2 · CRAFTED FILE — tools no skeleton reaches get a complete minimal
         workflow at content/tool-usage/<bare>.nika.yaml, shown whole.
         Each is `nika check` green (authored against the real binary) and
         the drift gate re-validates every one against
         public/schema/workflow.json on every test run.

   Cross-refs ride along: which templates ship the tool (routing order) and
   which registered error codes name it (always the generic builtin gate;
   plus the tool-specific codes when the registry carries them — existence
   is asserted against public/errors/catalog.json, never assumed).

   Determinism: same inputs → byte-identical output (tools in bare-name
   order, no build stamps). The vitest drift gate (tool-usage.test.ts)
   recompiles and byte-diffs; a new builtin without usage evidence fails
   THIS compiler loudly, never ships an empty room.

   Run: node scripts/build-tool-usage.mjs
   Output: src/content/tool-usage.generated.ts */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'content', 'tool-usage.generated.ts')
const CRAFTED_DIR = join(ROOT, 'content', 'tool-usage')

const toolsCatalog = JSON.parse(readFileSync(join(ROOT, 'public/tools/catalog.json'), 'utf8'))
const templatesCatalog = JSON.parse(
  readFileSync(join(ROOT, 'public/templates/catalog.json'), 'utf8'),
)
const errorsCatalog = JSON.parse(readFileSync(join(ROOT, 'public/errors/catalog.json'), 'utf8'))

const errorCodeSet = new Set(errorsCatalog.codes.map((c) => c.code))
const crafted = new Set(readdirSync(CRAFTED_DIR).filter((f) => f.endsWith('.nika.yaml')))

/* ── the excerpt walker ──
   Given a skeleton's yaml and a builtin ref, find the first line that USES
   the tool (`tool: "nika:x"` beats a whitelist grant `- "nika:x"`), then
   slice the enclosing task item: up to its `  - id:` line (plus any
   contiguous task-level comment lines directly above — they carry the
   teaching), down to the next task or the next top-level key. */
function excerpt(yaml, ref) {
  const lines = yaml.split('\n')
  /* skeleton lines carry SLOT comments — the ref match tolerates a trailer */
  const isUse = (l) => new RegExp(`^\\s*tool:\\s*"${ref}"\\s*(#.*)?$`).test(l)
  const isGrant = (l) => new RegExp(`^\\s*-\\s*"${ref}"\\s*(#.*)?$`).test(l)
  let at = lines.findIndex(isUse)
  if (at === -1) at = lines.findIndex(isGrant)
  if (at === -1) return null
  let start = at
  while (start > 0 && !/^  - id:\s/.test(lines[start])) start--
  if (!/^  - id:\s/.test(lines[start])) return null
  while (start > 0 && /^  #/.test(lines[start - 1])) start--
  let end = at + 1
  while (end < lines.length && !/^  - id:\s/.test(lines[end]) && !/^[a-z_#]/.test(lines[end])) {
    end++
  }
  /* a comment block directly above the NEXT task belongs to the next task */
  while (end > at + 1 && (/^\s*$/.test(lines[end - 1]) || /^  #/.test(lines[end - 1]))) end--
  return { yaml: lines.slice(start, end).join('\n'), firstLine: start + 1 }
}

const entries = []
for (const tool of [...toolsCatalog.tools].sort((a, b) => (a.bare < b.bare ? -1 : 1))) {
  const ref = tool.name
  /* cross-refs: every skeleton that invokes OR grants the tool (routing order) */
  const uses = (t) =>
    new RegExp(`^\\s*(tool:|-)\\s*"${ref}"\\s*(#.*)?$`, 'm').test(t.yaml)
  const templates = templatesCatalog.templates.filter(uses).map((t) => t.name)

  /* the usage panel: a real skeleton excerpt, else the crafted whole file */
  let source
  let yaml
  const donor = templatesCatalog.templates.find(uses)
  const cut = donor ? excerpt(donor.yaml, ref) : null
  if (donor && cut) {
    source = { kind: 'template', template: donor.name, file: donor.file, firstLine: cut.firstLine }
    yaml = cut.yaml
  } else {
    const file = `${tool.bare}.nika.yaml`
    if (!crafted.has(file)) {
      console.error(
        `build-tool-usage: no skeleton reaches ${ref} and content/tool-usage/${file} is missing — every room needs real usage evidence`,
      )
      process.exit(1)
    }
    source = { kind: 'crafted', file }
    yaml = readFileSync(join(CRAFTED_DIR, file), 'utf8').replace(/\n$/, '')
  }

  /* error codes that name this tool: the generic gate + specific registrations */
  const specific = [...errorCodeSet]
    .filter((c) => c.startsWith(`NIKA-BUILTIN-${tool.bare.toUpperCase()}-`))
    .sort()
  const errorCodes = ['NIKA-BUILTIN-001', ...specific]
  for (const c of errorCodes) {
    if (!errorCodeSet.has(c)) {
      console.error(`build-tool-usage: ${c} is not a registered error code`)
      process.exit(1)
    }
  }

  entries.push({ bare: tool.bare, yaml, source, templates, errorCodes })
}

const banner = `// tool-usage.generated.ts — AUTO-GENERATED by scripts/build-tool-usage.mjs
// from public/templates/catalog.json (skeleton excerpts · verbatim, real
// line numbers), content/tool-usage/*.nika.yaml (crafted minimal files ·
// nika-check green) and public/errors/catalog.json (code existence).
// DO NOT EDIT · regenerate: node scripts/build-tool-usage.mjs
// Drift gate: src/test/tool-usage.test.ts recompiles and byte-diffs, and
// schema-validates every crafted file against public/schema/workflow.json.

export interface ToolUsageEntry {
  /** bare tool name — the /tools/:name slug */
  bare: string
  /** the usage yaml: a skeleton task excerpt, or a complete crafted file */
  yaml: string
  /** where the yaml comes from (template excerpts keep their real firstLine) */
  source:
    | { kind: 'template'; template: string; file: string; firstLine: number }
    | { kind: 'crafted'; file: string }
  /** templates that invoke or grant this tool (README routing order) */
  templates: string[]
  /** registered error codes that name this tool (the generic gate first) */
  errorCodes: string[]
}

/** Usage evidence for every builtin, keyed by bare name. */
export const TOOL_USAGE: Record<string, ToolUsageEntry> = `

writeFileSync(OUT, `${banner}${JSON.stringify(Object.fromEntries(entries.map((e) => [e.bare, e])), null, 2)}\n`)
console.log(`tool-usage → ${entries.length} rooms (${entries.filter((e) => e.source.kind === 'template').length} skeleton excerpts · ${entries.filter((e) => e.source.kind === 'crafted').length} crafted files)`)
