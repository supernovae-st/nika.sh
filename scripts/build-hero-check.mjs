#!/usr/bin/env node
// build-hero-check.mjs — capture the FINDINGS the engine emits on a file that
// carries two authored typos, and the green verdict of its fixed twin.
//
//   node scripts/build-hero-check.mjs           # capture (needs `nika`)
//   node scripts/build-hero-check.mjs --check   # drift gate
//
// WHY. build-check-verdicts.mjs closed half of « audited before a token is
// spent »: it captures the SUMMARY of `nika check` for every workflow in
// public/library — tasks, waves, permits, hints — and all seven come back
// clean. An auditor only exists at the moment something is WRONG, and this
// site has never rendered a single finding. The hero is a transaction: a
// broken file, the real diagnostics, the two fixes, the audit green. That
// needs the findings themselves, verbatim from the binary, not a count.
//
// THE HONESTY LINE, the same one the sibling draws, and the reason this is not
// a blind copy of the report: some findings are facts about THE FILE (a task
// that does not exist, a tool that names no builtin) and some are facts about
// THE MACHINE CHECK RAN ON — a `kind: inputs` finding says "./notes/today.md
// does not exist HERE", true on a CI runner, false on the author's laptop, and
// a claim about the READER's disk once it ships on a page. Only file-intrinsic
// kinds are captured. The hero pair binds no context files today; the filter is
// what keeps the page honest the day somebody adds one.
//
// THE SPAN, and it is what a renderer will get wrong. `span` is a pair of BYTE
// offsets into the file — not JS string indices, and this file has 3 bytes of
// `©`/`·` in its header before the first finding, so the two already disagree.
// It is also ZERO-WIDTH: start === end, a caret, never a range to underline.
// line/col are derived here the way the CLI derives them for its `-->` line:
// the line by counting newlines, the column by counting CHARACTERS from the
// line start (a `é` left of the caret moves the byte column and not the printed
// one). Only expression-scoped findings carry a span at all — the task-scoped
// ones carry `task`, and a graph-scoped one (a cycle) carries neither.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const HERO = `${ROOT}public/hero`
const BROKEN = 'pr-review.broken.nika.yaml'
const FIXED = 'pr-review.nika.yaml'

/* a finding whose truth depends on the filesystem check ran against, not on
   the file — never baked (see the honesty line above) */
const ENVIRONMENTAL = new Set(['inputs'])

let engine
try {
  engine = execFileSync('nika', ['--version'], { encoding: 'utf8' }).trim().split(/\s+/).pop()
} catch {
  console.error('build-hero-check: `nika` is not on PATH — the capture needs the real binary')
  process.exit(2)
}

function audit(name) {
  let out
  try {
    out = execFileSync('nika', ['check', '--json', `${HERO}/${name}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch (e) {
    /* rc=2 IS the broken twin's whole point — the report is on stdout anyway */
    out = e.stdout || ''
  }
  try {
    return JSON.parse(out)
  } catch {
    console.error(`build-hero-check: ${name} produced no json`)
    process.exit(2)
  }
}

/* 1-based line + CHARACTER column for a byte offset, the CLI's own arithmetic */
function place(bytes, at) {
  const head = bytes.subarray(0, at).toString('utf8')
  return { line: head.split('\n').length, col: [...head.slice(head.lastIndexOf('\n') + 1)].length + 1 }
}

const broken = audit(BROKEN)
const fixed = audit(FIXED)
const bytes = readFileSync(`${HERO}/${BROKEN}`)

const brokenLines = bytes.toString('utf8').split('\n')

const findings = (broken.findings ?? [])
  .filter((f) => !ENVIRONMENTAL.has(f.kind))
  .map((f) => {
    const at = f.span ? place(bytes, f.span.start) : null
    return {
      code: f.code,
      gate: f.gate,
      kind: f.kind,
      severity: f.severity,
      message: f.message,
      docsUrl: f.docs_url,
      task: f.task ?? null,
      line: at?.line ?? null,
      col: at?.col ?? null,
      span: f.span ? [f.span.start, f.span.end] : null,
      /* the offending line, verbatim from the served twin — a renderer must
         never re-slice the file by byte span in JS (3 header bytes already
         split the two arithmetics), so the capture hands it the line whole */
      sourceLine: at ? brokenLines[at.line - 1] : null,
    }
  })

/* THE REPAIRS · the exact line pairs the twins disagree on. Both files are
   served and committed, and hero-check.test.ts proves the fixed twin IS
   nika check --fix applied to the broken one — so this diff is a captured
   fact about two public artifacts, not an authored claim. */
const fixedLines = readFileSync(`${HERO}/${FIXED}`, 'utf8').split('\n')
const repairs = brokenLines
  .map((before, i) => ({ line: i + 1, before, after: fixedLines[i] }))
  .filter((r) => r.before !== r.after)

/* the green verdict the repair lands on, for the ladder's last stop */
const fixedVerdict = {
  tasks: (fixed.certificate?.derivation ?? []).length,
  waves: Array.isArray(fixed.waves) ? fixed.waves.length : 0,
  permitsDeclared: (fixed.permits?.source ?? 'floor') === 'declared',
}

/* the two things that would make the page lie if they ever stopped holding:
   a hero that shows no diagnostics, or a fix that does not land */
if (broken.clean !== false || findings.length === 0) {
  console.error(`build-hero-check: ${BROKEN} audits clean — the hero would show a transaction with nothing in it`)
  process.exit(2)
}
if (fixed.clean !== true) {
  console.error(`build-hero-check: ${FIXED} is not clean — the fixed twin does not land the fix`)
  process.exit(2)
}

const body = `// hero-check.generated.ts — AUTO-GENERATED by scripts/build-hero-check.mjs
// Captured from the REAL binary: nika ${engine} · nika check --json.
// DO NOT EDIT · re-capture: node scripts/build-hero-check.mjs
// Drift gate: src/test/hero-check.test.ts (skips where nika is absent).
//
// Environmental findings (kind: inputs) are dropped at capture: they describe
// the filesystem check ran against, not the file, and would read on the page as
// a claim about the reader's own disk.
//
// span is a pair of BYTE offsets and it is zero-width (start === end) — a
// caret, not a range. line/col are derived from it the way the CLI derives its
// \`-->\` line: newlines for the line, CHARACTERS for the column. A finding
// carries a span OR a task OR neither; nothing carries both.
import type { NIKA_AUDIT_SEVERITY } from '../design-tokens.generated'

/** the engine that produced these findings — the hero states it */
export const HERO_ENGINE = '${engine}'

/** the two served twins the hero renders · same file, two typos apart */
export const HERO_BROKEN_FILE = '/hero/${BROKEN}'
export const HERO_FIXED_FILE = '/hero/${FIXED}'

export interface HeroFinding {
  /** the error code · its page is docsUrl */
  code: string
  /** the gate that spoke (CONFORM · TOOLS · PERMITS · …) */
  gate: string
  /** what class of fact this is (conformance · unknown_tool · capability_escape) */
  kind: string
  severity: (typeof NIKA_AUDIT_SEVERITY)[number]
  /** the engine's own sentence — never rewritten, never summarised */
  message: string
  docsUrl: string
  /** the task the gate names · the only anchor a span-less finding has */
  task: string | null
  /** 1-based, from the byte span · null where the gate points at no place */
  line: number | null
  /** 1-based CHARACTERS from the line start (what the CLI prints) */
  col: number | null
  /** BYTE offsets into the file, zero-width · not JS string indices */
  span: readonly [number, number] | null
  /** the offending line, verbatim — never re-derive it from span in JS */
  sourceLine: string | null
}

/* NOT packed into one delimited string like its check-verdicts sibling: those
   rows are six numbers, these carry the engine's own prose — every delimiter
   worth choosing already appears inside a message. A literal costs a few
   hundred bytes and cannot be corrupted by an engine that rewords a sentence. */
export const HERO_FINDINGS: readonly HeroFinding[] = ${JSON.stringify(findings, null, 2).replace(/\[\s+(\d+),\s+(\d+)\s+\]/g, '[$1, $2]')}

/** the twin with both typos fixed · what the hero lands on */
export const HERO_FIXED_CLEAN = ${fixed.clean === true}

/** the exact line pairs the twins disagree on · a captured diff of two served
 *  files, whose pair law (fixed twin == nika check --fix on the broken one)
 *  hero-check.test.ts proves byte for byte */
export const HERO_REPAIRS: readonly { line: number; before: string; after: string }[] =
  ${JSON.stringify(repairs, null, 2)}

/** the green verdict the repair lands on */
export const HERO_FIXED_VERDICT = ${JSON.stringify(fixedVerdict)}
`

const OUT = `${ROOT}src/content/hero-check.generated.ts`
if (process.argv.includes('--check')) {
  if (readFileSync(OUT, 'utf8') !== body) {
    console.error('hero-check: DRIFT · re-capture with node scripts/build-hero-check.mjs')
    process.exit(1)
  }
  console.log(`✓ hero check in sync · ${findings.length} findings · nika ${engine}`)
} else {
  writeFileSync(OUT, body)
  console.log(`captured ${findings.length} findings from nika ${engine}`)
}
