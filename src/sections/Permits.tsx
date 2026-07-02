import { useRevealOnce } from './use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { SHOWCASE_YAML } from './usecases-yaml.generated'
import './v4-home.css'
import { SectionHead } from '../components/SectionHead'

/* ─── FIG 3.5 · What it's allowed to do (theme-dark · the seatbelt) ────────────
   Design doc §4 (FIG 3.5) + §5 — the `permits:` block, the control narrative's
   beating heart. Every plan declares its blast radius up front; the runtime
   enforces it; out of bounds is DENIED, not logged after the fact.

   Two halves, asymmetric:
     • LEFT  — the worked example: a true READ-ONLY slice of the real fil-rouge
       (`SHOWCASE_YAML['t3-resume-screener']`), header + the `permits:` block,
       rendered by <CodeFile/> (server-rendered, monochrome, highlighted). The
       slice is computed from the real file by line range — never hand-typed.
     • RIGHT — the permits MODEL from public/schema/workflow.json (fs.read /
       fs.write read-XOR-write · net.http host allowlist · exec false|true|list ·
       tools allowlist), then the three enforcement codes (NIKA-SEC-004 / -002 /
       -001) that turn the boundary into a denial BEFORE anything runs.

   Spec-true BY CONSTRUCTION: the YAML excerpt is sliced from the generated
   showcase (the SSOT projector). The category descriptions + SEC codes are the
   craft layer (worded to match the schema + errors catalog, never invented).

   SSR-safe: pure DOM; <CodeFile/> is server-rendered (the slice lives in the
   prerendered HTML). The reveal is an IntersectionObserver added on mount with
   content fully visible by default (no-JS / reduced-motion). */

/* the fil-rouge YAML · the only projected showcase with a real permits: block. */
const FULL_YAML = SHOWCASE_YAML['t3-resume-screener']

/* a TRUE slice · the header + the whole permits: block (lines 1–11 of the real
   file), computed by line range so it can never drift from the projected source.
   The permits: block (lines 7–11) is emphasized via <CodeFile/>'s highlight. */
const SLICE_FROM = 1
const SLICE_TO = 11
const PERMITS_FROM = 7 // `permits:` line within the slice
const PERMITS_TO = 11 // `tools: [...]` line — the last permits line
const EXCERPT = FULL_YAML.split('\n').slice(SLICE_FROM - 1, SLICE_TO).join('\n')

/* the permits MODEL · the four declarable categories, worded straight off
   public/schema/workflow.json §permits (read-XOR-write · host allowlist ·
   exec false|true|list · tool allowlist). */
const CATEGORIES: { fig: string; key: string; gloss: string; shape: string }[] = [
  {
    fig: 'i',
    key: 'fs.read / fs.write',
    gloss: 'which files it can read, which it can write — read XOR write, by glob.',
    shape: 'read: [globs] · write: [globs]',
  },
  {
    fig: 'ii',
    key: 'net.http',
    gloss: 'which hosts it can reach. Omit it and the plan cannot touch the network at all.',
    shape: 'http: [host allowlist]',
  },
  {
    fig: 'iii',
    key: 'exec',
    gloss: 'which programs it can run — none, any (blocklist-gated), or a named allowlist.',
    shape: 'false · true · [program names]',
  },
  {
    fig: 'iv',
    key: 'tools',
    gloss: 'which nika:/mcp: tools it may call. Anything off the list is unreachable.',
    shape: 'tools: [allowed tool ids]',
  },
]

/* the enforcement codes · from public/errors/catalog.json (security_error class).
   These are what « out of bounds » resolves to — a denial BEFORE the effect runs,
   not a log written after the damage. */
const DENIALS: { code: string; failure: string }[] = [
  { code: 'NIKA-SEC-004', failure: 'effect outside the declared permits: boundary (fs / net / exec / tool)' },
  { code: 'NIKA-SEC-002', failure: 'agent tool call outside the tools: whitelist' },
  { code: 'NIKA-SEC-001', failure: 'exec: blocklist hit' },
]

export default function Permits() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="permits" aria-labelledby="permits-title" className="theme-dark v4sec scroll-mt-24">
      <div className="v4sec-wrap">
        <SectionHead fig="FIG 3.5" id="permits-title" title={<>What it&apos;s allowed to&nbsp;do.</>}>
          Every plan declares its <b>blast radius</b> up front — which files it can{' '}
          <b>read</b>, which it can <b>write</b> (read XOR write), which hosts it can
          reach, which programs it can run, which tools it may call. The runtime{' '}
          <b>enforces</b> it. Out of bounds is <b>denied</b>, not logged after the fact.
        </SectionHead>

        {/* the two-column stage · the real slice (left) + the model & denials (right) */}
        <div className="v4permits-stage" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
          {/* LEFT · the worked example — a true READ-ONLY slice of the fil-rouge */}
          <figure className="v4permits-example">
            <figcaption className="v4permits-cap">
              <span className="v4permits-cap-fig">FIG 3.5.1 · the worked example</span>
              <span className="v4permits-cap-note">
                local model · no <code>net:</code> at all — the CVs physically cannot leave the machine
              </span>
            </figcaption>
            <CodeFile
              yaml={EXCERPT}
              filename="resume-screener.nika.yaml"
              highlight={[PERMITS_FROM, PERMITS_TO]}
              className="v4permits-code"
            />
            <p className="v4permits-readonly" aria-hidden>
              real lines, sliced from the projected file — read-only
            </p>
          </figure>

          {/* RIGHT · the permits model + the enforcement codes */}
          <div className="v4permits-side">
            <div className="v4permits-model">
              <p className="v4permits-model-head">
                <span className="v4permits-model-fig">FIG 3.5.2 · the model</span>
                <span className="v4permits-model-rule">
                  once <code>permits:</code> is present, every category is <b>default-deny</b>
                </span>
              </p>
              <dl className="v4permits-cats">
                {CATEGORIES.map((c) => (
                  <div className="v4permits-cat" key={c.key}>
                    <dt className="v4permits-cat-key">
                      <span className="v4permits-cat-fig" aria-hidden>
                        {c.fig}
                      </span>
                      <code>{c.key}</code>
                    </dt>
                    <dd className="v4permits-cat-gloss">
                      {c.gloss}
                      <span className="v4permits-cat-shape" aria-hidden>
                        {c.shape}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="v4permits-denials">
              <p className="v4permits-denials-head">
                <span className="v4permits-model-fig">FIG 3.5.3 · denied, before it runs</span>
              </p>
              <ul className="v4permits-codes">
                {DENIALS.map((d) => (
                  <li className="v4permits-code" key={d.code}>
                    <span className="v4permits-code-id">{d.code}</span>
                    <span className="v4permits-code-fail">{d.failure}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="v4permits-note" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          the <code>permits:</code> block is the seatbelt — checked by the runtime, enforced before the effect
        </p>
      </div>
    </section>
  )
}
