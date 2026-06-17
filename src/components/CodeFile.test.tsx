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
})
