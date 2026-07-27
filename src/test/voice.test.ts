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

/* ── the page-copy ratchet (the perimeter's blind side) ───────────────────────
   The gates above guard four surfaces: content/blog, the OG cards, sets.yaml
   and llms.txt — the places the 2026-07 purge saw the class re-strike. They
   have never watched src/pages, src/sections or src/content, which is the
   LARGEST authored-copy surface on the site: every lede, every room blurb,
   every meta description.

   The population was 72 when this gate was written and is ZERO now: the
   conversion pass ran the same day (rupture becomes a period, apposition a
   colon, aside a parenthesis). What began as design-graph's « only ever
   shrinks » ratchet therefore lands on its floor, and the rule is simply:
   page copy carries no em dash.

   THE COUNT IS PROSE ONLY. The first measurement read 99 and was wrong three
   ways: trailing // comments were counted as copy (eight of them), so were
   verbatim terminal captures and engine-mirrored lint messages, and so were
   em dashes drawn as glyphs. Each is excluded below, by construction rather
   than by an allowlist — a ceiling that counted engine output would pressure
   someone into rewriting a quote to go green. */
describe('voice · page copy carries no NEW em dash (law 3 ratchet)', () => {
  const blank = (m: string) => m.replace(/[^\n]/g, '')

  /* Block comments, full-line // comments, AND trailing ones. The first cut
     forgot trailing (`const x = 1 // the body — recognition floor`) and
     counted eight dev comments as shipped copy. `://` is spared so a URL in
     a string never reads as a comment. */
  const stripComments = (src: string) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/^\s*\/\/.*$/gm, blank)
      .replace(/(?<!:)\/\/[^\n]*/g, blank)

  /* ── the two classes a rewrite must never touch ───────────────────────────
     VERBATIM · terminal captures and the lint diagnostics that mirror the
     engine's own wording. The existing gates put this class out of scope by
     construction for a reason: "rewriting a quote makes the post lie". A
     ceiling that counted them would pressure someone into editing engine
     output to go green — the worst outcome this gate could cause.
     GLYPH · an em dash standing for an empty value (`?? '—'`, `[ — ]`) or
     drawn as a mark (the aria-hidden list bullet in Wedge) is correct
     typography, not prose. A bare em dash alone on a line is never a
     sentence. */
  const VERBATIM = /kind:\s*'(?:dim|soft|out|err)'|diags\.push\(|↳\s*HINT|code:\s*'NIKA-/
  const GLYPH = /(['"`])\s*—\s*\1|\[\s*—\s*\]|\?\?\s*'—'|^\s*—\s*$/

  const isCountable = (line: string) => !VERBATIM.test(line) && !GLYPH.test(line)

  const shipped = (): string[] => {
    const out: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, dir))) {
        const rel = `${dir}/${name}`
        try {
          if (readdirSync(join(ROOT, rel)).length >= 0) {
            if (!rel.endsWith('/test')) walk(rel)
            continue
          }
        } catch {
          /* not a directory */
        }
        if (/\.(ts|tsx)$/.test(name) && !name.includes('.generated.') && !name.includes('.test.')) {
          out.push(rel)
        }
      }
    }
    walk('src')
    return out
  }

  it('the em dash population in shipped code only ever shrinks', () => {
    const files = shipped()
    expect(files.length, 'the scan found no source — a gate over nothing').toBeGreaterThan(80)
    const per = files
      .map((f) => {
        const n = stripComments(readFileSync(join(ROOT, f), 'utf8'))
          .split('\n')
          .filter(isCountable)
          .reduce((sum, line) => sum + (line.match(/—/g) ?? []).length, 0)
        return [f, n] as const
      })
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
    const total = per.reduce((n, [, c]) => n + c, 0)
    /* The population is ZERO. It was 72 when this gate was written and the
       conversion pass closed it the same day, so the ratchet has reached its
       floor: page copy carries no em dash at all, and the ceiling can never
       rise off it. If this goes red, read the names it prints — one of them
       is new prose, not a false positive (the verbatim and glyph classes are
       excluded above, by construction). */
    const CEILING = 0
    expect(
      total,
      `page copy grew em dashes: ${total} > ceiling ${CEILING}. Heaviest:\n${per
        .slice(0, 5)
        .map(([f, c]) => `  ${c}× ${f}`)
        .join('\n')}`,
    ).toBeLessThanOrEqual(CEILING)
  })
})
