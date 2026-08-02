/* ─── build-lessons · the spec's teaching path → catalog + typed projection ───
   The 13 numbered examples in nika-spec (01-hello … 12-failure-routing) are
   a PATH: each one adds exactly one idea to the one before it, and running
   them in order is how the language teaches itself. The site rendered zero
   of them — /use-cases carried the 26 real jobs and the path was invisible.

   Two stages, the build-templates convention with one law tightened:

     1 · THE PIN, NOT THE CHECKOUT → public/workflows/lessons.json. Every
         file is read with `git show <spec_commit>:examples/<name>` against
         the sibling nika-spec repo, so a moving sibling HEAD can never leak
         into the site (the vendor-tests sibling law: two tests already
         rewrite tracked files because they derive from HEAD instead of the
         pin, and this generator refuses to be the third). No sibling → the
         committed catalog stands, and CI never needs one.
     2 · catalog.json → src/content/lessons.generated.ts — the typed
         projection /workflows/path reads.

   The ORDER is the teaching order, and it is the file order: the leading
   number IS the curriculum. Two files share 10- (compose-child and
   compose-pipeline: a callable unit and its caller), so the sort is by
   FILENAME, never by parsed number.

   Determinism: same pin → byte-identical output. Every file carries its own
   sha256 (the copy-fidelity law: a copy is re-provable, never trusted).

   Run:   node scripts/build-lessons.mjs
   Check: node scripts/build-lessons.mjs --check   (exit 5 on drift) */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG = join(ROOT, 'public', 'workflows', 'lessons.json')
const OUT = join(ROOT, 'src', 'content', 'lessons.generated.ts')
/* the YAML rides its OWN module (the usecases-yaml.generated recipe): 48KB of
   workflow text must never enter the bundle, so the rooms reach it through
   lessons-access, and the lean metadata module above stays eagerly importable. */
const OUT_YAML = join(ROOT, 'src', 'content', 'lessons-yaml.generated.ts')
const PIN = JSON.parse(readFileSync(join(ROOT, '.github/nika-spec-pin.json'), 'utf8'))

/* the sibling checkout, if the monorepo layout gives us one */
const SPEC_ROOT = process.env.NIKA_SPEC_ROOT ?? join(ROOT, '..', 'spec', 'repo')

const sha256 = (s) => createHash('sha256').update(s).digest('hex')
/** codepoint order · never localeCompare (ICU varies per machine) */
const byCp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** every numbered example at the pin, in filename order */
function lessonsAtPin() {
  if (!existsSync(join(SPEC_ROOT, '.git'))) return null
  const git = (...args) =>
    execFileSync('git', ['-C', SPEC_ROOT, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  // the pin must be REACHABLE — a shallow or stale clone is not a source
  try {
    git('cat-file', '-e', PIN.spec_commit)
  } catch {
    return null
  }
  const names = git('ls-tree', '-r', '--name-only', PIN.spec_commit, 'examples/')
    .split('\n')
    .filter(Boolean)
    .map((p) => p.replace(/^examples\//, ''))
    .filter((n) => /^\d\d-.+\.nika\.yaml$/.test(n))
    .sort(byCp)
  return names.map((name) => {
    const yaml = git('show', `${PIN.spec_commit}:examples/${name}`)
    const slug = name.replace(/\.nika\.yaml$/, '')
    /* the description the file declares · the router reads this same line,
       and so does a human. Absent is honest: the earliest lessons carry
       their teaching in comments, not in a description key. */
    const description = yaml.match(/^\s{2}description:\s*"([^"]*)"/m)?.[1] ?? null
    /* the TITLE comment · every lesson opens `# TEMPLATE ·` or a `# NN ·`
       header line; the first non-SPDX comment sentence is the one-liner */
    const headline =
      yaml
        .split('\n')
        .slice(0, 8)
        .map((l) => l.replace(/^#\s?/, '').trim())
        .find((l) => l && !l.startsWith('SPDX') && !l.startsWith('yaml-language-server')) ?? null
    return {
      slug,
      file: name,
      step: Number(name.slice(0, 2)),
      description,
      /* the leading `NN · ` is dropped: the number is already its own field
         (step), so keeping it in the headline made every title repeat the
         figure printed beside it. Verbatim otherwise. */
      headline: headline ? headline.replace(/^\d\d\s*·\s*/, '') : null,
      sha256: sha256(yaml),
      yaml,
    }
  })
}

function render(lessons) {
  return (
    JSON.stringify(
      {
        lessons_format: 1,
        spec_commit: PIN.spec_commit,
        spec_tree: PIN.spec_tree,
        lessons,
      },
      null,
      2,
    ) + '\n'
  )
}

function project(catalog) {
  const rows = catalog.lessons.map((l) => ({
    slug: l.slug,
    file: l.file,
    step: l.step,
    description: l.description,
    headline: l.headline,
    sha256: l.sha256,
  }))
  return `// lessons.generated.ts — AUTO-GENERATED by scripts/build-lessons.mjs
// from nika-spec examples/NN-*.nika.yaml AT THE PIN (${PIN.spec_commit.slice(0, 12)}),
// read with \`git show <pin>:path\` — never from a moving checkout.
// DO NOT EDIT · regenerate: node scripts/build-lessons.mjs
// Drift gate: src/test/lessons.test.ts recompiles and byte-diffs.

/** one step of the teaching path · the whole file lives in the catalog */
export interface Lesson {
  slug: string
  file: string
  /** the leading number · 10 appears twice (a callable unit and its caller) */
  step: number
  /** the file's own description: line, when it declares one */
  description: string | null
  /** the first prose line of its header comment */
  headline: string | null
  sha256: string
}

/** the spec identity these lessons were read at */
export const LESSONS_PIN = ${JSON.stringify({ spec_commit: catalog.spec_commit, spec_tree: catalog.spec_tree }, null, 1)} as const

/** the path, in teaching order (filename order · the number IS the curriculum) */
export const LESSONS: Lesson[] = ${JSON.stringify(rows, null, 1)}
`
}

function projectYaml(catalog) {
  const entries = catalog.lessons
    .map((l) => `  ${JSON.stringify(l.slug)}: ${JSON.stringify(l.yaml)},`)
    .join('\n')
  return `// lessons-yaml.generated.ts — AUTO-GENERATED by scripts/build-lessons.mjs
// The whole teaching path, verbatim at the pin. HEAVY (one workflow file per
// entry): src/** reaches it ONLY through src/lib/lessons-access.ts.
// DO NOT EDIT · regenerate: node scripts/build-lessons.mjs

export const LESSON_YAML: Record<string, string> = {
${entries}
}
`
}

const check = process.argv.includes('--check')
const fresh = lessonsAtPin()

if (!fresh) {
  if (!existsSync(CATALOG)) {
    console.error('✗ no nika-spec checkout at the pin AND no committed catalog — nothing to derive from')
    process.exit(5)
  }
  console.log(`○ lessons · no reachable spec checkout at the pin · the committed catalog stands`)
  if (!check) {
    const c = JSON.parse(readFileSync(CATALOG, 'utf8'))
    writeFileSync(OUT, project(c))
    writeFileSync(OUT_YAML, projectYaml(c))
  }
  process.exit(0)
}

const catalogText = render(fresh)
const projected = project(JSON.parse(catalogText))
const projectedYaml = projectYaml(JSON.parse(catalogText))

if (check) {
  const drift = []
  if (!existsSync(CATALOG) || readFileSync(CATALOG, 'utf8') !== catalogText) drift.push('public/workflows/lessons.json')
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== projected) drift.push('src/content/lessons.generated.ts')
  if (!existsSync(OUT_YAML) || readFileSync(OUT_YAML, 'utf8') !== projectedYaml) drift.push('src/content/lessons-yaml.generated.ts')
  if (drift.length) {
    console.error(`✗ lessons drift · run node scripts/build-lessons.mjs\n  ${drift.join('\n  ')}`)
    process.exit(5)
  }
  console.log(`✓ lessons in sync with nika-spec@${PIN.spec_commit.slice(0, 9)} · ${fresh.length} steps`)
  process.exit(0)
}

mkdirSync(dirname(CATALOG), { recursive: true })
writeFileSync(CATALOG, catalogText)
writeFileSync(OUT, projected)
writeFileSync(OUT_YAML, projectedYaml)
console.log(`wrote ${fresh.length} lessons at nika-spec@${PIN.spec_commit.slice(0, 9)}`)
