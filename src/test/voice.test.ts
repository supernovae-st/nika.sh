import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/* ── voice.test · the em-dash ratchet (G.5) ─────────────────────────────────
   The purge of 2026-07 was an arc; the class re-struck within days (three
   posts, thirty-nine OG subs). Per the ratchet doctrine, discipline converts
   to structure: this gate scans the AUTHORED SOURCES — never the rendered
   HTML — so the verbatim class (spec catalogs, engine output) stays out of
   scope by construction.

   Authored perimeter:
     · content/blog/*.md          (posts + frontmatter · README is repo-doc)
     · build-og-card.mjs CARDS    (the text baked into OG pixels)
     · scripts/atlas/sets.yaml    (openers · titles · roles · nav/footer)
     · public/llms.txt            (the agents front door)

   Tolerated inside posts: fenced code, inline code, and *"..."* italic-quote
   spans — the house marker for verbatim engine/spec output (rewriting a
   quote makes the post lie; the two live refusals carry the engine's own
   em dash, verified against permits_infer.rs). */

const ROOT = join(__dirname, '../..')

type Hit = { where: string; line: number; excerpt: string }

function scanLines(
  where: string,
  lines: string[],
  clean: (line: string, index: number) => string | null,
  pattern: RegExp,
): Hit[] {
  const hits: Hit[] = []
  lines.forEach((raw, i) => {
    const line = clean(raw, i)
    if (line !== null && pattern.test(line)) {
      hits.push({ where, line: i + 1, excerpt: raw.trim().slice(0, 100) })
    }
  })
  return hits
}

/* blog: track fence state · drop inline code + italic-quoted verbatim */
function blogCleaner(): (line: string) => string | null {
  let fenced = false
  return (line) => {
    if (line.trimStart().startsWith('```')) {
      fenced = !fenced
      return null
    }
    if (fenced) return null
    return line
      .replace(/`[^`]*`/g, '')
      .replace(/\*"[^"]*"\*/g, '')
      .replace(/\*“[^”]*”\*/g, '')
  }
}

function blogSources(): Array<{ where: string; lines: string[] }> {
  const dir = join(ROOT, 'content/blog')
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
    .map((name) => ({
      where: `content/blog/${name}`,
      lines: readFileSync(join(dir, name), 'utf8').split('\n'),
    }))
}

/* og cards: the CARDS array region only · strip line comments */
function ogCardLines(): { lines: string[]; offset: number } {
  const source = readFileSync(join(ROOT, 'scripts/build-og-card.mjs'), 'utf8')
  const start = source.indexOf('const CARDS = [')
  expect(start, 'CARDS array present in build-og-card.mjs').toBeGreaterThan(-1)
  let depth = 0
  let end = -1
  for (let i = source.indexOf('[', start); i < source.length; i += 1) {
    if (source[i] === '[') depth += 1
    else if (source[i] === ']') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  return {
    lines: source.slice(start, end).split('\n'),
    offset: source.slice(0, start).split('\n').length - 1,
  }
}

function corpus(): Array<{ where: string; lines: string[]; clean: (l: string, i: number) => string | null; offset?: number }> {
  const og = ogCardLines()
  return [
    ...blogSources().map((post) => ({ ...post, clean: blogCleaner() })),
    {
      where: 'scripts/build-og-card.mjs (CARDS)',
      lines: og.lines,
      clean: (line: string) => line.replace(/\/\/.*$/, ''),
      offset: og.offset,
    },
    {
      where: 'scripts/atlas/sets.yaml',
      lines: readFileSync(join(ROOT, 'scripts/atlas/sets.yaml'), 'utf8').split('\n'),
      clean: (line: string) => (line.trimStart().startsWith('#') ? null : line),
    },
    {
      where: 'public/llms.txt',
      lines: readFileSync(join(ROOT, 'public/llms.txt'), 'utf8').split('\n'),
      clean: (line: string) => line,
    },
  ]
}

function report(hits: Hit[]): string {
  return hits.map((h) => `${h.where}:${h.line} · ${h.excerpt}`).join('\n')
}

describe('voice · authored sources hold the register', () => {
  it('no em dash in authored prose', () => {
    const hits = corpus().flatMap((src) =>
      scanLines(src.where, src.lines, src.clean, /—/).map((h) => ({
        ...h,
        line: h.line + (src.offset ?? 0),
      })),
    )
    expect(hits, `em dash in authored prose:\n${report(hits)}`).toEqual([])
  })

  it('no intensifier slop in authored prose', () => {
    const slop
      = /\b(?:blazingly|revolutionary|game-chang\w*|cutting-edge|supercharged?|effortless(?:ly)?|seamless(?:ly)?|incredibly|magical(?:ly)?)\b/i
    const hits = corpus().flatMap((src) =>
      scanLines(src.where, src.lines, src.clean, slop).map((h) => ({
        ...h,
        line: h.line + (src.offset ?? 0),
      })),
    )
    expect(hits, `intensifier in authored prose:\n${report(hits)}`).toEqual([])
  })
})
