import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Diagnostic, DiagnosticList, type Finding } from './Diagnostic'
import { NIKA_AUDIT_SEVERITY, NIKA_AUDIT_HUE } from '../design-tokens.generated'

/* ── the diagnostic atom ──────────────────────────────────────────────────────
   This renders what the binary said about a file, so the gates here are about
   FIDELITY (we show what it emitted) and about the atom staying bound to the
   projected palette rather than to a colour someone typed. */

const FINDING: Finding = {
  code: 'NIKA-DAG-002',
  gate: 'CONFORM',
  severity: 'error',
  message: 'unknown dependency: task `judge` depends on `dif`, which does not exist — did you mean `diff`?',
  docsUrl: 'https://nika.sh/errors/NIKA-DAG-002',
  line: 20,
  col: 13,
  source: '      diff: ${{ tasks.dif.output }}',
  width: 1,
}

describe('Diagnostic · the finding, as the binary emitted it', () => {
  it('carries severity without relying on colour', () => {
    /* the glyph is the non-colour carrier: three severities, three marks. A
       reader in forced-colors, or one who cannot separate red from amber, still
       reads which is which. */
    const glyphs = NIKA_AUDIT_SEVERITY.map((severity) => {
      const { container } = render(<Diagnostic finding={{ ...FINDING, severity }} />)
      return container.querySelector('.dg-glyph')?.textContent
    })
    expect(new Set(glyphs).size).toBe(NIKA_AUDIT_SEVERITY.length)
    expect(glyphs.every(Boolean)).toBe(true)
  })

  it('names the severity to a screen reader', () => {
    const { container } = render(<Diagnostic finding={FINDING} />)
    expect(container.querySelector('.dg-sr')?.textContent).toContain('error')
  })

  it('renders the engine sentence verbatim, with its identifiers as code', () => {
    const { container } = render(<Diagnostic finding={FINDING} />)
    const msg = container.querySelector('.dg-msg')
    /* verbatim: the words are the engine's, backticks are presentation only */
    expect(msg?.textContent).toBe(FINDING.message.replace(/`/g, ''))
    const toks = [...(msg?.querySelectorAll('.dg-tok') ?? [])].map((n) => n.textContent)
    expect(toks).toEqual(['judge', 'dif', 'diff'])
  })

  it('lands the caret under the column the engine accused', () => {
    const { container } = render(<Diagnostic finding={FINDING} />)
    const caret = container.querySelector('.dg-caret .dg-code-line')?.textContent ?? ''
    /* col is 1-indexed, as the CLI prints it — the arm sits at col-1 spaces in */
    expect(caret.indexOf('━')).toBe(FINDING.col! - 1)
  })

  it('keeps the source line byte-verbatim (never re-indented)', () => {
    const { container } = render(<Diagnostic finding={FINDING} />)
    expect(container.querySelector('.dg-src .dg-code-line')?.textContent).toBe(FINDING.source)
  })

  it('links the code to its catalog page on this site', () => {
    const { container } = render(<Diagnostic finding={FINDING} />)
    const a = container.querySelector('a.dg-code')
    expect(a?.getAttribute('href')).toBe(FINDING.docsUrl)
    expect(a?.textContent).toBe(FINDING.code)
  })

  it('renders without a span (not every gate line carries one)', () => {
    const { container } = render(
      <Diagnostic finding={{ gate: 'COST', severity: 'warning', message: 'UNBOUNDED — no max_tokens declared' }} />,
    )
    expect(container.querySelector('.dg-span')).toBeNull()
    /* and with no code, no fix line promises a command that teaches nothing */
    expect(container.querySelector('.dg-fix')).toBeNull()
  })

  it('announces a run of findings as one list', () => {
    const { container } = render(<DiagnosticList findings={[FINDING, FINDING]} label="audit findings" />)
    expect(container.querySelector('[role=list]')?.getAttribute('aria-label')).toBe('audit findings')
    expect(container.querySelectorAll('[role=listitem]').length).toBe(2)
  })
})

/* ── the shapes the binary actually emits ────────────────────────────────────
   Measured over 111 findings from the 125 vendored spec fixtures. Every case
   below is one the corpus produces; a renderer that only handles the pretty one
   drops the majority on the floor. */
describe('Diagnostic · every shape the corpus produces', () => {
  it('anchors a task-scoped finding, which has no position at all', () => {
    /* 37 of 111 name a task instead of a span, and the two are near-disjoint
       (both in exactly 1 case). Without the task row the biggest class after
       parse renders as a headless sentence. */
    const { container } = render(
      <Diagnostic
        finding={{
          code: 'NIKA-SEC-004',
          gate: 'PERMITS',
          severity: 'error',
          message: 'invoke tool `nika:wrte` is outside permits.tools',
          task: 'save',
        }}
      />,
    )
    expect(container.querySelector('.dg-span')).toBeNull()
    expect(container.querySelector('.dg-at-v')?.textContent).toBe('save')
  })

  it('renders a finding with neither span nor task (a dependency cycle has no single position)', () => {
    const { container } = render(
      <Diagnostic finding={{ code: 'NIKA-DAG-001', gate: 'CONFORM', severity: 'error', message: 'cycle' }} />,
    )
    expect(container.querySelector('.dg-msg')?.textContent).toBe('cycle')
    expect(container.querySelector('.dg-span')).toBeNull()
    expect(container.querySelector('.dg-at')).toBeNull()
  })

  it('treats the sentinel task "-" as absent, not as a task named dash', () => {
    const { container } = render(
      <Diagnostic finding={{ gate: 'COST', severity: 'warning', message: 'unbounded', task: '-' }} />,
    )
    expect(container.querySelector('.dg-at')).toBeNull()
  })

  it('survives a finding with no code and no docs_url (the TYPES gate emits two)', () => {
    const { container } = render(
      <Diagnostic
        finding={{ gate: 'TYPES', severity: 'error', message: '`entitties` is not in the declared schema' }}
      />,
    )
    expect(container.querySelector('.dg-code')).toBeNull()
    /* no code means no room to link and no command to teach — the help row
       must vanish rather than promise `nika explain undefined` */
    expect(container.querySelector('.dg-fix')).toBeNull()
  })

  it('does not collide when one code fires twice with different messages', () => {
    const twice: Finding[] = [
      { code: 'NIKA-BUILTIN-001', gate: 'TOOLS', severity: 'error', message: 'first' },
      { code: 'NIKA-BUILTIN-001', gate: 'TOOLS', severity: 'error', message: 'second' },
    ]
    const { container } = render(<DiagnosticList findings={twice} label="audit" />)
    const msgs = [...container.querySelectorAll('.dg-msg')].map((n) => n.textContent)
    expect(msgs).toEqual(['first', 'second'])
  })

  it('prefers the engine own fix over the fallback command', () => {
    /* capability_escapes[].fix and conformance[].suggestion are real structured
       data that the flattened .findings stream drops. Showing `nika explain`
       when we hold the actual answer is honest but wasteful. */
    const { container } = render(
      <Diagnostic
        finding={{
          code: 'NIKA-SEC-004',
          gate: 'PERMITS',
          severity: 'error',
          message: 'outside permits.tools',
          fix: 'add `nika:write` to permits.tools',
          applicability: 'machine',
        }}
      />,
    )
    expect(container.querySelector('.dg-fix-words')?.textContent).toBe('add nika:write to permits.tools')
    expect(container.querySelector('.dg-fix-cmd')).toBeNull()
    expect(container.querySelector('.dg-fix')?.getAttribute('data-appl')).toBe('machine')
  })

  it('softens the verb when the engine only suspects the fix', () => {
    /* rustc: « be conservative when choosing the level ». A page where every
       fix looks mechanical has promised something the engine did not. */
    const { container } = render(
      <Diagnostic
        finding={{
          code: 'NIKA-DRIFT-001',
          gate: 'PERMITS',
          severity: 'info',
          message: 'entry matches no path the body reads',
          fix: 'remove the entry',
          applicability: 'maybe',
          tags: ['unnecessary'],
        }}
      />,
    )
    expect(container.querySelector('.dg-fix-k')?.textContent).toBe('consider')
    /* LSP DiagnosticTag.Unnecessary · the sanctioned rendering is faded, and a
       tidy-up must not read at the weight of a failure */
    expect(container.querySelector('.dg')?.getAttribute('data-tag')).toBe('unnecessary')
  })

  it('carries the span label beside the caret, not inside the message', () => {
    const { container } = render(<Diagnostic finding={{ ...FINDING, label: 'did you mean `diff`?' }} />)
    expect(container.querySelector('.dg-label')?.textContent?.trim()).toBe('did you mean `diff`?')
    expect(container.querySelector('.dg-msg')?.textContent).toBe(FINDING.message.replace(/`/g, ''))
  })

  it('narrates the location in words, and hides the box drawing', () => {
    /* ╭▸ │ ╰╴ ━ read as a stream of character names. miette ships a whole
       narratable handler for exactly this reason. */
    const { container } = render(<Diagnostic finding={{ ...FINDING, filename: 'pr-review.nika.yaml' }} />)
    expect(container.querySelector('.dg-loc')?.getAttribute('aria-hidden')).toBe('true')
    expect(container.querySelector('.dg-caret')?.getAttribute('aria-hidden')).toBe('true')
    const narrated = [...container.querySelectorAll('.dg-sr')].map((n) => n.textContent).join(' ')
    expect(narrated).toContain('line 20, column 13')
    expect(narrated).toContain('pr-review.nika.yaml')
  })
})

describe('Diagnostic · the palette stays projected', () => {
  const css = readFileSync(join(__dirname, 'diagnostic.css'), 'utf8')

  it('paints every severity from the projected --audit-* token', () => {
    for (const severity of NIKA_AUDIT_SEVERITY) {
      expect(css, `${severity} must bind var(--audit-${severity})`).toContain(`var(--audit-${severity})`)
    }
  })

  it('never hardcodes a hue the spec already stores', () => {
    /* the binding lives in nika-spec severity.audit and reaches here through
       design.generated.css. A literal here is the exact drift this whole chain
       was built to end — the canvas held one for months. */
    const literals = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
    expect(literals, `raw hex in diagnostic.css: ${literals.join(' ')}`).toEqual([])
    for (const hue of Object.values(NIKA_AUDIT_HUE)) expect(css).not.toContain(hue)
  })

  it('keeps the hue off body copy (the stored fail hue is not a text colour)', () => {
    /* nika-spec keeps a separate fail_text ramp precisely because the raw fail
       hue does not clear the body floor — so the message must not wear it. */
    const msgRule = css.slice(css.indexOf('.dg-msg'), css.indexOf('.dg-tok'))
    expect(msgRule).not.toContain('--dg-hue')
  })
})
