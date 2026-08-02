// learn-loop.test.ts — the loop chapter tells the truth and stays off the bundle.
//
// Two laws. (1) REGISTER DIET: learn-loop.ts carries five verbatim terminal
// captures; importing it directly cost 2.1 KB gz on every page load and the
// size budget refused (407.0 over 406). src/** reaches it ONLY through
// learn-loop-access. (2) HONESTY: every command shown is one the pinned
// binary answers, and every transcript opens with the command it claims —
// a capture whose first line disagrees with its own `command` field is a
// caption over the wrong photograph.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOOP_DOORS } from '../content/learn-loop'

const ROOT = join(__dirname, '../..')

describe('the loop chapter (G-6)', () => {
  it('teaches the five doors, in the arc order', () => {
    expect(LOOP_DOORS.map((d) => d.verb)).toEqual(['try', 'new', 'check', 'run', 'trace'])
    expect(LOOP_DOORS.map((d) => d.n)).toEqual(['01', '02', '03', '04', '05'])
  })

  it('every transcript opens with the command it claims (the caption fits the photo)', () => {
    for (const d of LOOP_DOORS) {
      const first = d.lines[0]
      expect(first.kind, `${d.verb}: a capture must open on its command`).toBe('cmd')
      expect(first.text, `${d.verb}: the opening line differs from the declared command`).toBe(
        d.command,
      )
    }
  })

  it('the prose carries no markdown backticks (they render literally here)', () => {
    // caught on the first screenshot: `plain` is rendered as TEXT, so a
    // markdown backtick shows up as a backtick. The house style (the nine
    // STEPS above) carries zero of them in prose — code belongs in the
    // transcript beside it, not in the sentence.
    for (const d of LOOP_DOORS) {
      expect(d.plain, `${d.verb}: a backtick in prose renders as a backtick`).not.toContain('`')
      expect(d.proves, `${d.verb}: a backtick in prose renders as a backtick`).not.toContain('`')
      expect(d.title, `${d.verb}: a backtick in prose renders as a backtick`).not.toContain('`')
    }
  })

  it('every door states what its transcript proves, in prose', () => {
    for (const d of LOOP_DOORS) {
      expect(d.proves.length, `${d.verb}: the proves line is too thin to mean anything`).toBeGreaterThan(40)
      expect(d.plain.length, `${d.verb}: the plain gloss is too thin`).toBeGreaterThan(40)
      expect(d.lines.length, `${d.verb}: a transcript of one line proves nothing`).toBeGreaterThan(1)
    }
  })

  it('the commands name live verbs only (cli-grammar holds the full set)', () => {
    // the loop is the site's most copied surface — a dead verb here is the
    // worst possible place for one
    const LIVE = new Set(['try', 'new', 'check', 'run', 'trace'])
    for (const d of LOOP_DOORS) {
      const verb = d.command.split(/\s+/)[1]
      expect(LIVE.has(verb), `${d.command}: '${verb}' is not one of the five doors`).toBe(true)
    }
  })

  it('register diet holds: only the access door imports the transcripts', () => {
    const out = spawnSync(
      'grep',
      ['-rl', "content/learn-loop'", join(ROOT, 'src'), '--include=*.ts', '--include=*.tsx'],
      { encoding: 'utf8' },
    )
    const offenders = out.stdout
      .split('\n')
      .filter(Boolean)
      .map((p) => p.slice(ROOT.length + 1))
      .filter((p) => p !== 'src/lib/learn-loop-access.ts' && !p.startsWith('src/test/'))
      .filter((p) => {
        // type-only imports are erased at build — they cost nothing
        const src = readFileSync(join(ROOT, p), 'utf8')
        return src
          .split('\n')
          .some((l) => l.includes("content/learn-loop'") && !/^\s*import type\b/.test(l))
      })
    expect(
      offenders,
      `eager transcript imports (use learn-loop-access):\n${offenders.join('\n')}`,
    ).toEqual([])
  })
})
