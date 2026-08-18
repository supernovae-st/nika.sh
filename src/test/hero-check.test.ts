import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NIKA_AUDIT_SEVERITY } from '../design-tokens.generated'
import {
  HERO_BROKEN_FILE,
  HERO_ENGINE,
  HERO_FINDINGS,
  HERO_FIXED_CLEAN,
  HERO_FIXED_FILE,
} from '../content/hero-check.generated'

/* ── the hero's gates ─────────────────────────────────────────────────────────
   The hero is a transaction: a broken file, the real diagnostics, two fixes,
   the audit green. Three things make it a receipt rather than a picture.

   1. The diagnostics are the binary's, and cannot drift from it.
   2. The broken twin STAYS broken and the fixed twin stays clean — a hero
      whose file quietly starts passing shows a transaction with nothing in it.
   3. THE PAIR LAW. The two files differ by exactly the fixes the checker
      suggested. Nothing else moved. Without it, « we fixed what it told us »
      is a claim about a diff nobody checked — the engine holds its own media
      fixtures to the same law (scripts/media/validate-media.sh).

   The re-capture gate skips where `nika` is absent (a fresh CI checkout has no
   engine on PATH) — the same skipIf shape the check-verdicts sibling uses. The
   pair law needs no binary: it reads the captured messages and the two files. */

const ROOT = join(__dirname, '../..')
const served = (url: string) => join(ROOT, 'public', url.replace(/^\//, ''))
const broken = readFileSync(served(HERO_BROKEN_FILE), 'utf8')
const fixed = readFileSync(served(HERO_FIXED_FILE), 'utf8')

const hasNika = (() => {
  try {
    execFileSync('nika', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

/** every `backticked` name the engine put in a sentence */
const named = (message: string) => [...message.matchAll(/`([^`]+)`/g)].map((m) => m[1])
/** the fix the engine spelled out, where it spelled one out */
const suggested = (message: string) => /did you mean `([^`]+)`\?/.exec(message)?.[1] ?? null

/* whole-token occurrence. `dif` must not match inside `diff`, and a builtin
   name carries a colon, so `:` counts as a token character alongside \w. */
const token = (t: string) =>
  new RegExp(`(?<![\\w:])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w:])`, 'g')

describe('hero check · the transaction cannot drift from the binary', () => {
  it('the broken twin has diagnostics and the fixed twin is clean', () => {
    expect(HERO_FINDINGS.length).toBeGreaterThan(0)
    expect(HERO_FIXED_CLEAN).toBe(true)
    expect(HERO_ENGINE).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('every finding carries what a renderer needs to place it', () => {
    for (const f of HERO_FINDINGS) {
      expect(NIKA_AUDIT_SEVERITY as readonly string[], `${f.code} severity`).toContain(f.severity)
      expect(f.docsUrl, `${f.code} docs url`).toBe(`https://nika.sh/language/errors/${f.code}`)
      expect(f.message.length, `${f.code} message`).toBeGreaterThan(0)
      /* anchorable, or unplaceable: a span points at a character, a task points
         at a block. A finding with neither has nowhere to render — the engine
         does emit those (a dependency cycle names the ring, not a place). */
      expect(f.span ?? f.task, `${f.code} anchors nowhere`).not.toBeNull()
      if (!f.span) {
        expect(f.line, `${f.code} line without span`).toBeNull()
        expect(f.col, `${f.code} col without span`).toBeNull()
        continue
      }
      /* the caret law: the span is zero-width, so a renderer treating it as a
         range to underline underlines nothing */
      expect(f.span[0], `${f.code} span is a range`).toBe(f.span[1])
      const line = broken.split('\n')[f.line! - 1]
      expect(line, `${f.code} points past the end of the file`).toBeDefined()
      expect(f.col!, `${f.code} col overshoots its line`).toBeLessThanOrEqual([...line].length + 1)
      /* and the line it points at must show what the sentence talks about, or
         the highlight is decoration */
      expect(named(f.message).some((t) => line.includes(t)), `${f.code} points at ${line.trim()}`).toBe(true)
    }
  })

  /* THE PAIR LAW. Take every fix the checker spelled out; for each, the wrong
     token is the name it quoted that lives in the broken file and nowhere in
     the fixed one. Apply exactly those substitutions. The result must BE the
     fixed file, byte for byte — no tidying, no second thought, nothing the
     reader is not being shown. */
  it('the twins differ by exactly the fixes the checker suggested', () => {
    const fixes = HERO_FINDINGS.flatMap((f) => {
      const fix = suggested(f.message)
      if (!fix) return []
      const wrong = named(f.message).filter((t) => token(t).test(broken) && !token(t).test(fixed))
      expect(wrong, `${f.code}: no single token vanished between the twins`).toHaveLength(1)
      return [{ wrong: wrong[0], fix }]
    })
    expect(fixes.length, 'the checker suggested no fix at all').toBeGreaterThan(0)

    let patched = broken
    for (const { wrong, fix } of fixes) patched = patched.replace(token(wrong), fix)
    expect(patched).toBe(fixed)
  })

  it('the twins are two typos apart and nothing else', () => {
    const a = broken.split('\n')
    const b = fixed.split('\n')
    expect(a.length).toBe(b.length)
    expect(a.filter((line, i) => line !== b[i])).toHaveLength(2)
  })

  it.skipIf(!hasNika)('the capture is exactly what the binary emits today', () => {
    const OUT = join(ROOT, 'src/content/hero-check.generated.ts')
    const before = readFileSync(OUT, 'utf8')
    execFileSync('node', [join(ROOT, 'scripts/build-hero-check.mjs')], { stdio: 'pipe' })
    expect(readFileSync(OUT, 'utf8')).toBe(before)
  })

  it.skipIf(!hasNika)('the broken twin still breaks and the fixed twin still passes', () => {
    const audit = (url: string) => {
      try {
        return JSON.parse(execFileSync('nika', ['check', '--json', served(url)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
      } catch (e) {
        return JSON.parse((e as { stdout?: string }).stdout || '{}')
      }
    }
    expect(audit(HERO_BROKEN_FILE).clean, 'the broken twin audits clean').toBe(false)
    expect(audit(HERO_FIXED_FILE).clean, 'the fixed twin does not audit clean').toBe(true)
  })

  it.skipIf(!hasNika)('the pinned engine is the engine on PATH', () => {
    const live = execFileSync('nika', ['--version'], { encoding: 'utf8' }).trim().split(/\s+/)[1] ?? ''
    expect(HERO_ENGINE).toBe(live)
  })
})
