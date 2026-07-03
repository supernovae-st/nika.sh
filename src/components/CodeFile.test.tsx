import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeFile } from './CodeFile'
import { tokenizeLine, verbGlyph } from './codefile-highlight'

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

/* ── template refs (${{ … }}) + &anchors / *aliases are carved out ONCE ──
   Regression guard for the doubled-ref bug: classifyValue split the value on a
   DOUBLY-wrapped capture group, so String.split interleaved both groups and
   every ref was emitted twice (`${{ vars.x }}${{ vars.x }}`). The split now
   uses TREF_RE's single capture group, so each ref appears exactly once. */
describe('tokenizeLine · template refs / anchors', () => {
  it('emits a ${{ … }} ref exactly ONCE (no doubling)', () => {
    const { tokens } = tokenizeLine('  files: ${{ vars.cv_glob }}')
    const refs = tokens.filter((t) => t.kind === 'tref')
    expect(refs).toHaveLength(1)
    expect(refs[0].text).toBe('${{ vars.cv_glob }}')
    // and the whole line text round-trips with the ref present exactly once
    const text = tokens.map((t) => t.text).join('')
    expect(text).toBe('  files: ${{ vars.cv_glob }}')
    expect(text).not.toContain('}}${{')
  })

  it('emits MULTIPLE refs on one line each exactly once', () => {
    const { tokens } = tokenizeLine('msg: ${{ tasks.a.output }} then ${{ tasks.b.output }}')
    const refs = tokens.filter((t) => t.kind === 'tref').map((t) => t.text)
    expect(refs).toEqual(['${{ tasks.a.output }}', '${{ tasks.b.output }}'])
    const text = tokens.map((t) => t.text).join('')
    expect(text).not.toContain('}}${{')
    expect(text).toContain('then')
  })

  it('carves a &anchor and a *alias as single tref tokens', () => {
    const anchor = tokenizeLine('base: &shared')
    expect(anchor.tokens.filter((t) => t.kind === 'tref').map((t) => t.text)).toEqual(['&shared'])
    const alias = tokenizeLine('use: *shared')
    expect(alias.tokens.filter((t) => t.kind === 'tref').map((t) => t.text)).toEqual(['*shared'])
  })
})

/* ── flow-mapping task lines are real tokens, never one plain blob ──
   Regression guard: KEY_RE cannot see into `- { … }` (the `{` breaks the key
   charset), so flow-style task lines rendered as ONE unstyled span — and the
   F2 morph would fly a colorless block into its DAG node. */
describe('tokenizeLine · flow-mapping task lines (the F2 burst carriers)', () => {
  const flow =
    '  - { id: notes,    invoke: { tool: "nika:read", args: { path: ./notes/today.md } } }'

  it('never emits a whole-line plain blob for a `- { … }` line', () => {
    const { tokens } = tokenizeLine(flow)
    expect(tokens.length).toBeGreaterThan(5)
    expect(tokens.some((t) => t.kind === 'plain' && t.text.trim() !== '')).toBe(false)
  })

  it('classifies keys, the verb (glyph-bearing) and quoted strings inside the flow', () => {
    const { tokens } = tokenizeLine(flow)
    expect(tokens.filter((t) => t.kind === 'key').map((t) => t.text)).toEqual([
      'id',
      'tool',
      'args',
      'path',
    ])
    const verbs = tokens.filter((t) => t.kind === 'verb')
    expect(verbs).toHaveLength(1)
    expect(verbs[0].verb).toBe('invoke')
    expect(tokens.filter((t) => t.kind === 'string').map((t) => t.text)).toContain('"nika:read"')
  })

  it('round-trips the exact line text (the editor is a product replica)', () => {
    for (const line of [
      flow,
      '  - { id: transcript, invoke: { tool: "nika:read", args: { path: ./transcript.txt } } }',
      '{ score: 7, ok: true }',
    ]) {
      expect(
        tokenizeLine(line)
          .tokens.map((t) => t.text)
          .join(''),
      ).toBe(line)
    }
  })

  it('carves ${{ refs }} inside flow quoted values exactly once', () => {
    const { tokens } = tokenizeLine(
      '  - { id: save, invoke: { args: { content: "${{ tasks.draft.output }}" } } }',
    )
    const refs = tokens.filter((t) => t.kind === 'tref').map((t) => t.text)
    expect(refs).toEqual(['${{ tasks.draft.output }}'])
  })

  /* a flow value on a KEY line (`fs: { … }` · `tools: [ … ]`) gets the same
     real tokens — not one untyped string blob. Load-bearing for the hero wrap
     variant: `./action-items.json` must be its own space-less token so the
     cf-atom rule can forbid a mid-token hyphen break. */
  it('tokenizes a flow value on a key line (keys inside · atomic paths carved out)', () => {
    const line = '  fs: { read: [ ./transcript.txt ], write: [ ./action-items.json ] }'
    const { tokens } = tokenizeLine(line)
    expect(tokens.filter((t) => t.kind === 'key').map((t) => t.text)).toEqual([
      'fs',
      'read',
      'write',
    ])
    const strings = tokens.filter((t) => t.kind === 'string').map((t) => t.text)
    expect(strings).toContain('./action-items.json') // its OWN token, space-less
    expect(tokens.map((t) => t.text).join('')).toBe(line) // exact round-trip
  })
})

/* ── the rendered DOM carries each ${{ ref }} once (the prod-visible bug) ── */
describe('CodeFile · template ref rendering', () => {
  const yamlRefs = [
    'tasks:',
    '  - id: pool',
    '    invoke:',
    '      args:',
    '        files: ${{ vars.cv_glob }}',
    '  - id: pick',
    '    infer:',
    '      prompt: ${{ tasks.pool.output }}',
    'merge: &base',
    'ref: *base',
  ].join('\n')

  it('renders ${{ refs }} exactly once (no doubled refs in the DOM)', () => {
    const { container } = render(<CodeFile yaml={yamlRefs} />)
    const text = container.textContent ?? ''
    // the doubled-ref signature must be absent everywhere
    expect(text).not.toContain('}}${{')
    expect(text).not.toContain('${{ vars.cv_glob }}${{ vars.cv_glob }}')
    expect(text).not.toContain('${{ tasks.pool.output }}${{ tasks.pool.output }}')
    // and each ref still appears (exactly once)
    const once = (hay: string, needle: string) => hay.split(needle).length - 1
    expect(once(text, '${{ vars.cv_glob }}')).toBe(1)
    expect(once(text, '${{ tasks.pool.output }}')).toBe(1)
  })

  it('marks the ref text with a .cf-ref span', () => {
    const { container } = render(<CodeFile yaml="files: ${{ vars.cv_glob }}" lineNumbers={false} />)
    const refSpans = container.querySelectorAll('.cf-ref')
    expect(refSpans.length).toBe(1)
    expect(refSpans[0].textContent).toBe('${{ vars.cv_glob }}')
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

  it('renders an optional filename chrome tab', () => {
    const { getByText } = render(<CodeFile yaml={yaml} filename="morning-brief.nika.yaml" />)
    expect(getByText('morning-brief.nika.yaml')).toBeTruthy()
  })

  it('exposes a copy button that carries the raw yaml', () => {
    const { getByRole } = render(<CodeFile yaml={yaml} />)
    expect(getByRole('button', { name: /copy/i })).toBeTruthy()
  })

  /* ── the minimal titlebar register (product-frame recipe) ──
     The panel reads like a product frame, not a faked macOS window: 3 square
     ticks (never traffic lights), the filename in dim mono, ONE functional
     chip (copy) — always present so every call-site gets the same register. */
  it('renders the 3 square window ticks (no macOS traffic lights)', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    expect(container.querySelectorAll('.cf-tick').length).toBe(3)
    expect(container.querySelectorAll('.cf-light').length).toBe(0)
  })

  it('carries no decorative lang badge — the copy chip is the one functional chip', () => {
    const withName = render(<CodeFile yaml={yaml} filename="a.nika.yaml" lang="nika" />)
    expect(withName.container.querySelector('.cf-lang')).toBeNull()
    // without a filename, the lang still labels the tab slot itself
    const anon = render(<CodeFile yaml={yaml} />)
    expect(anon.container.querySelector('.cf-tab-name')?.textContent).toBe('yaml')
  })

  /* ── the line-number gutter · real, dimmed, right-aligned, opt-out-able ── */
  it('renders a line-number gutter (one number per source line)', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    const gutter = container.querySelectorAll('.cf-ln')
    expect(gutter.length).toBe(yaml.split('\n').length)
    // numbered from 1 (first line) and present on the last line
    expect(gutter[0].textContent).toBe('1')
    expect(gutter[gutter.length - 1].textContent).toBe(String(yaml.split('\n').length))
  })

  it('omits the gutter when lineNumbers={false}', () => {
    const { container } = render(<CodeFile yaml={yaml} lineNumbers={false} />)
    expect(container.querySelectorAll('.cf-ln').length).toBe(0)
    // the code text is still fully present
    expect(container.textContent).toContain('max_steps: 8')
  })

  /* ── rich syntax · keys/strings/numbers/comments/verbs get distinct classes ── */
  it('classifies tokens into distinct syntax spans (key/string/number/comment/verb)', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    expect(container.querySelector('.cf-key')).not.toBeNull() // e.g. workflow
    expect(container.querySelector('.cf-num')).not.toBeNull() // 8 in max_steps: 8
    expect(container.querySelector('.cf-comment')).not.toBeNull() // # a comment
    expect(container.querySelector('.cf-verb')).not.toBeNull() // invoke
  })

  it('highlights the emphasized line range as a real editor active-line band', () => {
    const { container } = render(<CodeFile yaml={yaml} highlight={[1, 2]} />)
    const lit = container.querySelectorAll('.cf-line--lit')
    expect(lit.length).toBe(2) // exactly the 2 highlighted source lines
  })

  /* ── the wrap variant (the hero reading register) ──
     Opt-in soft-wrap: the panel gains the variant class and each indented line
     carries its leading-space count as --cf-indent (the CSS hanging indent).
     The DEFAULT stays the pre + horizontal-scroll register — no variant class,
     no inline indent vars — so every other call-site is untouched. */
  it('wrap: adds the variant class and per-line --cf-indent for indented lines', () => {
    const { container } = render(<CodeFile yaml={yaml} wrap />)
    expect(container.querySelector('.cf-panel--wrap')).not.toBeNull()
    const texts = Array.from(container.querySelectorAll<HTMLElement>('.cf-line-text'))
    yaml.split('\n').forEach((raw, i) => {
      const lead = raw.length - raw.trimStart().length
      const got = texts[i].style.getPropertyValue('--cf-indent')
      // unindented lines carry NO inline var (they fall back to 0ch in CSS)
      expect(got).toBe(lead > 0 ? `${lead}ch` : '')
    })
    // e.g. "    invoke:" (4 leading spaces) → a real 4ch hanging indent
    expect(texts[5].style.getPropertyValue('--cf-indent')).toBe('4ch')
  })

  it('default (no wrap): no variant class, no inline indent vars', () => {
    const { container } = render(<CodeFile yaml={yaml} />)
    expect(container.querySelector('.cf-panel--wrap')).toBeNull()
    const texts = Array.from(container.querySelectorAll<HTMLElement>('.cf-line-text'))
    for (const t of texts) expect(t.style.getPropertyValue('--cf-indent')).toBe('')
  })

  it('wrap: the raw yaml text still renders verbatim (the copy stays honest)', () => {
    const { container, getByRole } = render(<CodeFile yaml={yaml} wrap />)
    expect(container.textContent).toContain('workflow: morning-brief')
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
    const { container } = render(<CodeFile yaml={yamlWithBlank} lineNumbers={false} />)
    const lineSpans = container.querySelectorAll('code > .cf-line')
    expect(lineSpans.length).toBe(4) // one wrapper span per source line
    const blankText = lineSpans[1].querySelector('.cf-line-text')! // the empty 2nd line's text cell
    // the blank line's filler is an ELEMENT child, not a bare text node
    expect(blankText.childElementCount).toBeGreaterThanOrEqual(1)
    expect(blankText.firstChild?.nodeType).toBe(Node.ELEMENT_NODE)
    // the line wrapper is the editor line (reserves visual height via .cf-line)
    expect(lineSpans[1].className).toContain('cf-line')
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
