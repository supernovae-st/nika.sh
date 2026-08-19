// cli-grammar.test.ts — the site never teaches a command that exits rc=2.
//
// A verb moves upstream, the site keeps printing it, and a first-time
// reader copies a line the shipped binary refuses. That reader does not
// debug it; they close the tab.
//
// The gate: every `nika <verb>` in a LIVE TEACHING surface must name a verb
// the pinned release actually has. The set below is AUTHORED and carries the
// pin it was measured against — a pin bump that changes the grammar makes
// this test red, which is the point: the re-verify is part of the ceremony,
// not an afterthought. Verbs are probed with `nika <verb> --help` (rc=0
// lives, rc=2 dies), which is why hidden-but-live verbs (catalog · inspect ·
// lsp — absent from the top-level help listing) are in the set.
//
// Scope is LIVE TEACHING only. Dated records (changelog · blog) keep the
// grammar of their day — history is not a lie — and generated projections
// answer to their own upstream gates.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../..')

/** measured against v0.109.2 with `nika <verb> --help` (rc=0 · re-probed 2026-08-19) */
const ENGINE_PIN = 'v0.109.2'
const LIVE_VERBS = new Set([
  'arm',
  'audit-workflow', // the repo name in prose paths, never a verb call
  'catalog',
  'check',
  'completions',
  'dap',
  'doctor',
  'explain',
  'guard',
  'init',
  'inspect',
  'key',
  'lsp',
  'mcp',
  'model',
  'new',
  'run',
  'sign',
  'spec',
  'test',
  'trace',
  'try',
  'welcome',
  'wire',
])

/** verbs and flags MEASURED dead at the pin — each with what to say instead */
const DEAD: Record<string, string> = {
  'nika examples': 'say `nika try <slug>` — the showroom door',
  'nika audit': 'say `nika check` — it prints the cost ceiling',
  '--from': 'say `nika new <template> <dest>.nika.yaml` — the template is positional',
}

/* live teaching surfaces · dated records and generated projections excluded */
const SURFACE_DIRS = ['src/pages', 'src/sections', 'src/components', 'src/shell', 'content/i18n']
const SURFACE_FILES = ['src/content/install.ts', 'public/llms.txt', 'AGENTS.md']

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (/\.(?:tsx?|yaml|md|txt)$/.test(name) && !name.includes('.generated.') && !name.includes('.test.'))
      out.push(path)
  }
  return out
}

const files = [
  ...SURFACE_DIRS.flatMap((d) => walk(join(ROOT, d))),
  ...SURFACE_FILES.map((f) => join(ROOT, f)),
]
const sources = files.map((f) => ({ path: f.slice(ROOT.length + 1), text: readFileSync(f, 'utf8') }))

describe(`cli grammar · the site speaks the ${ENGINE_PIN} binary`, () => {
  it('harvests a real surface population (the sweep is not vacuous)', () => {
    expect(sources.length).toBeGreaterThan(60)
    expect(sources.some((s) => s.text.includes('nika check'))).toBe(true)
  })

  it('every taught `nika <verb>` names a verb the pinned release has', () => {
    // a COMMAND call, not prose. The prefix is CAPTURED, never measured from
    // the text before m.index — the match starts AT the prefix, so slicing
    // backwards reads the wrong window (a refuter mutation planted
    // `<code>nika deploy</code>` and walked straight through this gate).
    // A call sits after a backtick, a `<code>` open, a shell prompt, or a
    // quote; prose (« the nika binary », « nika raised ») sits after a space.
    const call = /(^|[`'"$>])\s?nika ([a-z][a-z-]{1,20})\b/gm
    const offenders: string[] = []
    for (const { path, text } of sources) {
      for (const m of text.matchAll(call)) {
        const [, prefix, verb] = m
        if (LIVE_VERBS.has(verb)) continue
        if (prefix === '' && !/^\s*\$?\s*nika/.test(m[0])) continue
        offenders.push(`${path}: nika ${verb}`)
      }
    }
    expect(
      [...new Set(offenders)].sort(),
      `commands the pinned binary refuses (probe with \`nika <verb> --help\`; if it is alive, add it to LIVE_VERBS):\n${[...new Set(offenders)].sort().join('\n')}`,
    ).toEqual([])
  })

  it('no live surface teaches a grammar measured dead', () => {
    const found: string[] = []
    for (const { path, text } of sources) {
      for (const [needle, why] of Object.entries(DEAD)) {
        if (text.includes(needle)) found.push(`${path}: "${needle}" — ${why}`)
      }
    }
    expect(found.sort(), `dead grammar still taught:\n${found.sort().join('\n')}`).toEqual([])
  })

  it('the verb set names the pin it was measured against (the re-verify is the ceremony)', () => {
    const pin = JSON.parse(readFileSync(join(ROOT, '.github/nika-engine-pin.json'), 'utf8'))
    expect(
      ENGINE_PIN,
      'the engine pin moved: re-probe `nika <verb> --help` for the set above, then update ENGINE_PIN',
    ).toBe(pin.release_tag)
  })
})
