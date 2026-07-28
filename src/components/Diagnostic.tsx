import { NIKA_AUDIT_SEVERITY } from '../design-tokens.generated'
import './diagnostic.css'

/* ─── Diagnostic · ONE finding, as the binary emits it ────────────────────────
   The site's whole claim is « audited before a token is spent », and until this
   component there was nowhere to SHOW one: the panels render the file and
   nothing about its audit, and all seven captured verdicts in
   check-verdicts.generated.ts are clean. A product that only exists at the
   moment something is wrong had never rendered that moment.

   The anatomy is the one every compiler settled on (rustc · miette · Elm):
   severity, then WHERE, then WHAT, then WHAT TO DO. Nothing invented —
   `nika check --json` emits exactly these fields, and the severity strings are
   the projected NIKA_AUDIT_SEVERITY, hue-bound in nika-spec `severity.audit`.

   Colour is never the only carrier (a11y): the glyph differs per severity, the
   severity word is in the accessible name, and the left rule is a shape as much
   as a hue. Pure DOM, SSR-safe, zero JS to read it. */

export type Severity = (typeof NIKA_AUDIT_SEVERITY)[number]

/* How much the reader should trust a suggested fix. rustc types every
   suggestion this way and warns « be conservative when choosing the level »;
   Biome surfaces the same split in its UI as FIXABLE + « Safe fix: ». Three of
   these are visible in one `nika check` pass — a typo the engine can rewrite
   mechanically, a permit it merely SUSPECTS is dead, and a cost line with no
   suggestion at all. Drawing them identically would throw away the most honest
   thing the tool does. */
export type Applicability = 'machine' | 'maybe' | 'none'

export interface Finding {
  /** the catalog code · NIKA-DAG-002. OPTIONAL, measured: 109/111 findings over
      the vendored fixture corpus carry one; a `schema_type` finding carries
      neither code nor docs_url, so there is nothing to link. */
  code?: string
  /** the pass that found it. Observed over the corpus: PARSE · CONFORM ·
      PERMITS · POLICY · TYPES · SECRETS · COMPOSITION · ARGS.
      This is LSP's `source` ("a human-readable string describing the source of
      this diagnostic"); Nika's word for it is the gate, so the page says gate.
      It is NOT derivable from the code — NIKA-PARSE-001 arrives at the PARSE
      gate and NIKA-PARSE-002 at CONFORM. Only a captured finding knows it. */
  gate: string
  /** THE HONEST NOTE. `check --json` types every FINDING `error` and gives
      `.hints` no severity at all — the three weights you see in the terminal
      (✖ / ⚠ / ↳) are the CLI's RENDERING, not a field. So this is the site's
      own mapping, made explicit rather than implied: a finding is `error`, an
      unbounded cost is `warning`, an advisory hint is `info`. The hues behind
      them are the projected audit ladder (nika-spec `severity.audit`). */
  severity: Severity
  /** the engine's own sentence, backticks and all */
  message: string
  /** the catalog page · /errors/<code> on this very site (LSP codeDescription.href) */
  docsUrl?: string
  /** 1-indexed, as the CLI prints it. DERIVED, not emitted: the binary gives a
      byte-offset `span:{start,end}` and the caller converts. Frequently absent
      — every `parse` finding (38/111 over the corpus) carries no position at
      all, and a dependency cycle has no single one either. */
  line?: number
  col?: number
  /** the offending source line, verbatim — never re-indented */
  source?: string
  /** the task a finding names when it has no position. 37/111 identify a task
      instead of a span; the two are near-disjoint (both in 1 case). Without
      this the largest class of finding renders as a headless sentence. */
  task?: string
  /** caret width in characters (defaults to one) */
  width?: number
  /** the file the span points into */
  filename?: string
  /** the PRIMARY SPAN's own words. rustc's rule: a span label carries enough
      text to stand alone if it were the only thing shown, and because it points
      at the code it can be terser than the message. */
  label?: string
  /** LSP DiagnosticTag. `unnecessary` is the sanctioned rendering for "this
      declares something nothing uses" — faded, never squiggled. Exactly what
      NIKA-DRIFT-001 says about a permit wider than the body. */
  tags?: ('unnecessary' | 'deprecated')[]
  /** how far to trust the fix (see Applicability) */
  applicability?: Applicability
  /** the engine's OWN fix, when it has one. This is real structured data —
      capability_escapes[].fix · permit_taints[].fix · conformance[].suggestion —
      that the flattened `.findings` stream drops. Rendering only
      `nika explain <code>` is honest but throws away the better answer the
      engine already computed. */
  fix?: string
}

/* the glyph is the non-colour carrier · the CLI's own three */
const GLYPH: Record<Severity, string> = { error: '✖', warning: '⚠', info: '↳' }

/* the engine writes identifiers in `backticks`; render them as code so a
   reader's eye lands on the offending name, not on the prose around it. The
   split keeps the delimiters out and the odd indices are the spans. */
function Message({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) =>
        i % 2 ? (
          <code className="dg-tok" key={i}>
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

export function Diagnostic({ finding: f, className = '' }: { finding: Finding; className?: string }) {
  const hasSpan = f.line != null && f.source != null
  /* the caret sits under the offending column. The gutter is rendered as text
     in the same mono grid as the source, so the arm lands on the character it
     accuses at every zoom — a positioned overlay drifts the moment the reader
     changes font size. */
  const pad = Math.max(0, (f.col ?? 1) - 1)

  return (
    <div
      className={`dg ${className}`}
      data-sev={f.severity}
      data-tag={f.tags?.includes('unnecessary') ? 'unnecessary' : undefined}
      role="listitem"
    >
      <p className="dg-head">
        <span className="dg-glyph" aria-hidden>
          {GLYPH[f.severity]}
        </span>
        <span className="dg-sr">{f.severity}:</span>
        <span className="dg-gate">{f.gate}</span>
        {f.code &&
          (f.docsUrl ? (
            <a className="dg-code" href={f.docsUrl}>
              {f.code}
            </a>
          ) : (
            <span className="dg-code">{f.code}</span>
          ))}
      </p>

      <p className="dg-msg">
        <Message text={f.message} />
      </p>

      {hasSpan && (
        <div className="dg-span">
          {/* the compact form is for the eye; a reader who hears the page gets
              the sentence, because « colon twenty colon thirteen » is not a
              location. The shape is miette's NarratableReportHandler, which
              exists precisely for this. */}
          <p className="dg-loc" aria-hidden>
            <span className="dg-loc-arm">╭▸</span>
            {f.filename ? `${f.filename}:` : ''}
            {f.line}:{f.col ?? 1}
          </p>
          <p className="dg-sr">
            begin snippet{f.filename ? ` for ${f.filename}` : ''} at line {f.line}, column{' '}
            {f.col ?? 1}
            {f.label ? `: ${f.label}` : ''}
          </p>
          <pre className="dg-src">
            <span className="dg-ln" aria-hidden>
              {f.line}
            </span>
            <span className="dg-code-line">{f.source}</span>
          </pre>
          {/* the caret row is a RENDERING of the span, not content — the box
              drawing would read as a stream of character names. The label beside
              it is rustc's rule: a span label carries enough text to stand alone,
              and being spatially aware it can be terser than the message. */}
          <pre className="dg-caret" aria-hidden>
            <span className="dg-ln" />
            <span className="dg-code-line">
              {' '.repeat(pad)}
              {'━'.repeat(Math.max(1, f.width ?? 1))}
              {f.label ? <span className="dg-label"> {f.label}</span> : null}
            </span>
          </pre>
        </div>
      )}

      {/* a finding with no position names a TASK instead — the largest class
          after parse. Dropping it leaves the sentence headless. */}
      {!hasSpan && f.task && f.task !== '-' && (
        <p className="dg-at">
          <span className="dg-at-k">in task</span>
          <code className="dg-at-v">{f.task}</code>
        </p>
      )}

      {/* the fix is a SUB-diagnostic, never part of the error line (rustc:
          « the error or warning portion should not suggest how to fix the
          problem, only the help sub-diagnostic should »). And it states how far
          to trust itself — a page where everything looks mechanically fixable
          has promised something the engine was careful not to. */}
      {(f.fix || f.code) && (
        <p className="dg-fix" data-appl={f.applicability ?? 'none'}>
          <span className="dg-fix-k">{f.applicability === 'maybe' ? 'consider' : 'help'}</span>
          {f.fix ? (
            <span className="dg-fix-words">
              <Message text={f.fix} />
            </span>
          ) : (
            <code className="dg-fix-cmd">nika explain {f.code}</code>
          )}
        </p>
      )}
    </div>
  )
}

/* the group · a run of findings reads as ONE verdict, not N cards. The list
   role is what makes a screen reader announce « 4 items » before the first —
   the count is the headline of a failed audit. */
export function DiagnosticList({
  findings,
  label,
  className = '',
}: {
  findings: Finding[]
  label: string
  className?: string
}) {
  return (
    <div className={`dg-list ${className}`} role="list" aria-label={label}>
      {findings.map((f, i) => (
        <Diagnostic finding={f} key={`${f.code ?? f.gate}-${i}`} />
      ))}
    </div>
  )
}
