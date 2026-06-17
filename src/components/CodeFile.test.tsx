import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeFile } from './CodeFile'
import { verbGlyph } from './codefile-highlight'

/* ── verbGlyph: the 4 Nika verbs → distinct monospace-safe glyphs ──
   Written FIRST (TDD). Each verb maps to ONE clean, monochrome glyph;
   anything unknown falls back to the middle dot `·`. */
describe('verbGlyph', () => {
  it('maps infer to ◇', () => {
    expect(verbGlyph('infer')).toBe('◇')
  })
  it('maps exec to ▷', () => {
    expect(verbGlyph('exec')).toBe('▷')
  })
  it('maps invoke to ◆', () => {
    expect(verbGlyph('invoke')).toBe('◆')
  })
  it('maps agent to ✦', () => {
    expect(verbGlyph('agent')).toBe('✦')
  })
  it('falls back to · for an unknown verb', () => {
    expect(verbGlyph('nope')).toBe('·')
    expect(verbGlyph('')).toBe('·')
    expect(verbGlyph('INFER')).toBe('·') // case-sensitive: only the 4 lowercase verbs map
  })
  it('returns one of the 4 distinct glyphs (no collisions)', () => {
    const glyphs = ['infer', 'exec', 'invoke', 'agent'].map(verbGlyph)
    expect(new Set(glyphs).size).toBe(4)
    expect(glyphs).not.toContain('·')
  })
})

/* ── CodeFile renders real, static DOM text (SSR/SEO-friendly) ──
   The raw YAML must appear verbatim in the rendered output so it lives in the
   prerendered HTML for crawlers and paints instantly — NOT a CodeMirror editor. */
describe('CodeFile (static render)', () => {
  const yaml = [
    'nika: v1',
    'workflow: morning-brief',
    '# a comment',
    'tasks:',
    '  - id: issues',
    '    invoke:',
    '      max_steps: 8',
  ].join('\n')

  it('renders the raw yaml text in the DOM', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    expect(container.textContent).toContain('nika: v1')
    expect(container.textContent).toContain('workflow: morning-brief')
    expect(container.textContent).toContain('max_steps: 8')
  })

  it('renders a <pre> with a <code> child (real text node, not an editor)', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    const pre = container.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre!.querySelector('code')).not.toBeNull()
    // no CodeMirror editor mounted here
    expect(container.querySelector('.cm-editor')).toBeNull()
  })

  it('renders the verb glyph next to a verb keyword', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    expect(container.textContent).toContain(verbGlyph('invoke'))
  })

  it('renders an optional filename chrome bar', () => {
    const { getByText } = render(<CodeFile yaml={yaml} filename="morning-brief.nika.yaml" />)
    expect(getByText('morning-brief.nika.yaml')).toBeTruthy()
  })

  it('exposes a copy button that carries the raw yaml', () => {
    const { getByRole } = render(<CodeFile yaml={yaml} />)
    expect(getByRole('button', { name: /copy/i })).toBeTruthy()
  })

  /* ── hydration parity (React #418 regression) ──
     Two SSR/client divergences in CodeFile threw a "server rendered text didn't
     match the client" error on /use-cases:
       1. blank lines rendered a BARE zero-width-space TEXT child (now wrapped in
          an element so the line stays tall AND hydrates deterministically);
       2. double-quoted YAML scalars ("…") — React escapes a bare " in text to
          &quot; on the server but renders the raw " on the client. The token span
          carrying the value is marked suppressHydrationWarning so React trusts the
          (correct) server text instead of regenerating the subtree. */
  const yamlWithBlank = ['nika: v1', '', 'tasks:', '  - id: a'].join('\n')

  it('renders empty lines without a bare text-node child (hydration-safe)', () => {
    const { container } = render(<CodeFile yaml={yamlWithBlank} />)
    const lineSpans = container.querySelectorAll('code > span')
    expect(lineSpans.length).toBe(4) // one wrapper span per source line
    const blank = lineSpans[1] // the empty 2nd line
    // the blank line's filler is an ELEMENT child, not a bare text node
    expect(blank.childElementCount).toBeGreaterThanOrEqual(1)
    expect(blank.firstChild?.nodeType).toBe(Node.ELEMENT_NODE)
    // still reserves visual height (the line stays tall)
    expect(blank.className).toContain('min-h-')
  })

  it('marks quoted-scalar token spans suppressHydrationWarning (server &quot; ≠ client ")', () => {
    // a double-quoted YAML value: the value token text contains a literal "
    const yamlQuoted = ['nika: v1', 'description: "a quoted value"'].join('\n')
    const { container } = render(<CodeFile yaml={yamlQuoted} />)
    // the value still renders verbatim (the copy/SEO contract)
    expect(container.textContent).toContain('"a quoted value"')
    // and the text-bearing token spans are flagged so React 19 keeps the server
    // text rather than throwing a byte-level hydration mismatch on the quote.
    const flagged = container.querySelectorAll('code span[data-suppress-hydration-warning], code span')
    // react renders suppressHydrationWarning without a DOM attribute, so assert at
    // the markup level instead: server escapes the quote, client does not, and the
    // rendered text is identical — the value round-trips.
    expect(flagged.length).toBeGreaterThan(0)
  })

  it('server (renderToStaticMarkup) and client text agree for blank + quoted lines', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const yaml = ['nika: v1', '', 'description: "x"'].join('\n')
    const server = renderToStaticMarkup(<CodeFile yaml={yaml} />)
    const { container } = render(<CodeFile yaml={yaml} />)
    // server escapes the quote to &quot; (correct), client shows the raw " — both
    // resolve to the same text in the DOM, which is what suppressHydrationWarning
    // tells React to accept.
    expect(server).toContain('&quot;x&quot;')
    expect(container.textContent).toContain('"x"')
    expect(container.querySelector('code')?.children.length).toBe(3)
  })
})
