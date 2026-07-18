import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TERMINAL_CAPTURES, TERMINAL_ENGINE } from '../content/terminal-captures.generated'
import { ENGINE_VERSION } from '../content'

/* ── the living terminal · whitelist honesty, held (WO-14 · W-A) ─────────────
   The /proof terminal is a RECORD PLAYER: it replays vendored captures of
   the released binary and never fakes a shell. The gates:

   · the record is real — every capture non-empty, in the CLI voice, and
     the engine stamp agrees with ENGINE_VERSION and the vendored catalogs
     (four surfaces, one release);
   · the dual voice is real — a json twin parses, and its graph_format is
     stamped (the WO-14 oracle gate reads this the day format 2 lands);
   · whitelist-only is STRUCTURAL — the component renders commands from
     the generated registry alone (no hand-typed `nika …` command string
     exists in its source) and carries the honest-miss teaching. */

const ROOT = join(__dirname, '../..')

describe('living terminal · the record is real', () => {
  it('carries at least the founding five, each with recorded lines', () => {
    expect(TERMINAL_CAPTURES.length).toBeGreaterThanOrEqual(5)
    for (const c of TERMINAL_CAPTURES) {
      expect(c.command.startsWith('nika '), c.id).toBe(true)
      expect(c.lines.length, c.id).toBeGreaterThan(0)
      // blank lines are part of the verbatim voice (explain's paragraphs) —
      // the record just has to SAY something
      expect(c.lines.some((l) => l.text.trim().length > 0), c.id).toBe(true)
    }
  })

  it('the version capture prints the displayed release (the honesty law)', () => {
    const v = TERMINAL_CAPTURES.find((c) => c.id === 'version')!
    expect(v.lines.map((l) => l.text).join('\n')).toContain(ENGINE_VERSION.replace(/^v/, ''))
  })

  it('the engine stamp agrees with the displayed release and the vendored catalogs', () => {
    expect(`v${TERMINAL_ENGINE}`).toBe(ENGINE_VERSION)
    const tools = JSON.parse(readFileSync(join(ROOT, 'public/tools/catalog.json'), 'utf8')) as {
      version: string
    }
    expect(TERMINAL_ENGINE).toBe(tools.version)
  })
})

describe('living terminal · the dual voice is real', () => {
  it('every json twin parses and stamps its graph format', () => {
    const duals = TERMINAL_CAPTURES.filter((c) => c.json != null)
    expect(duals.length).toBeGreaterThanOrEqual(1)
    for (const c of duals) {
      const doc = JSON.parse(c.json!) as { graph_format?: number }
      expect(doc.graph_format, c.id).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('living terminal · whitelist-only is structural', () => {
  const src = readFileSync(join(ROOT, 'src/components/LivingTerminal.tsx'), 'utf8')

  it('no hand-typed replayable command exists in the component', () => {
    /* the placeholder is presentation (never replayed by itself); beyond it,
       a `nika <verb>` string literal in the component would be a second
       command source — the registry must stay the only one */
    const withoutPlaceholder = src.replace(/placeholder="[^"]*"/, '')
    expect(/'nika [a-z]/.test(withoutPlaceholder)).toBe(false)
    expect(/`nika [a-z]/.test(withoutPlaceholder)).toBe(false)
  })

  it('the honest-miss teaching is present (off-list = the record-player truth)', () => {
    expect(src).toContain('not on this record')
    expect(src).toContain('brew install supernovae-st/tap/nika')
  })

  it('the face states the law (record player, not a sandbox)', () => {
    expect(src).toContain('record player, not a sandbox')
  })

  it('the engine-printed doors are walkable (U1 extended · linkify exists + a room to walk to)', () => {
    expect(src).toContain('lterm-door')
    const explains = TERMINAL_CAPTURES.filter((c) => c.id.startsWith('explain-'))
    expect(explains.length).toBeGreaterThanOrEqual(2)
    for (const c of explains) {
      expect(
        c.lines.some((l) => /https:\/\/nika\.sh\/errors\/NIKA-[A-Z]+-\d{3}/.test(l.text)),
        c.id,
      ).toBe(true)
    }
  })
})
