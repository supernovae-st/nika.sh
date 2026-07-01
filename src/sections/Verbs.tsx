import { Link } from 'react-router'
import { useRevealOnce } from './use-reveal-once'
import { verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import { CodeFile } from '../components/CodeFile'
import './v4-home.css'

/* ─── FIG 2.0 · The four verbs (theme-dark · the numbered spec chapters) ───────
   Linear's signature register applied to the one thing that deserves it: a
   LANGUAGE gets a numbered spec, not a bento. Four chapter blocks — 1.0 infer ·
   2.0 exec · 3.0 invoke · 4.0 agent — each: a mono chapter kicker, the verb's
   job as a two-tone sentence (white claim + dim elaboration · Raycast pattern),
   a SMALL complete workflow in the shared CodeFile product surface, and a mono
   sub-index line (1.1 / 1.2 / 1.3) linking deeper into /spec — only anchors
   that exist; entries without a real anchor stay plain text.

   Framing: "A verb is a distinct native execution model." (D-2026-05-22-N18)

   HONESTY: every YAML block is a COMPLETE minimal workflow, valid against
   public/schema/workflow.json (nika + workflow + tasks, one verb each) — never
   a floating fragment. Verb hue lights ONLY inside the CodeFile frames (the
   verb keyword's canonical colour + a hue seam on the frame edge); the page
   chrome around them stays monochrome.

   SSR-safe: pure DOM, no window at render. The reveal is an IntersectionObserver
   added on mount; content is fully visible by default (no-JS / reduced-motion). */

/* the 4 verb hues → the per-chapter --vh custom prop (drives the FRAME seam —
   the only place the hue is allowed outside the syntax colours). */
const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/* one sub-index entry · `to` links a REAL route (+anchor) from routes.tsx /
   a real in-page section id; entries without one render as plain text. */
type SubEntry = { n: string; label: string; to?: string }

type Chapter = {
  verb: NikaVerb
  /** the chapter number · '1.0' */
  n: string
  /** the white claim (the job, one word-ish) */
  claim: string
  /** the dim elaboration (the rest of the two-tone sentence) */
  gloss: string
  filename: string
  /** a COMPLETE minimal workflow · schema-valid · 6-8 lines */
  yaml: string
  sub: SubEntry[]
}

const CHAPTERS: Chapter[] = [
  {
    verb: 'infer',
    n: '1.0',
    claim: 'Think.',
    gloss: 'Ask any model — local or cloud.',
    filename: 'think.nika.yaml',
    yaml: `nika: v1
workflow: think
model: ollama/llama3.1
tasks:
  - id: summarize
    infer:
      prompt: "Three risks in this release, ranked"
`,
    sub: [
      { n: '1.1', label: 'providers', to: '/spec#s4' },
      { n: '1.2', label: 'structured output', to: '/spec#s1' },
      { n: '1.3', label: 'local models', to: '/spec#s4' },
    ],
  },
  {
    verb: 'exec',
    n: '2.0',
    claim: 'Run.',
    gloss: 'A shell command, captured and typed.',
    filename: 'run.nika.yaml',
    yaml: `nika: v1
workflow: run
tasks:
  - id: build
    exec:
      command: "cargo build --release"
`,
    sub: [
      { n: '2.1', label: 'capture & exit codes' },
      { n: '2.2', label: 'retry · timeout', to: '/spec#s2' },
      { n: '2.3', label: 'permitted programs', to: '/spec#permits' },
    ],
  },
  {
    verb: 'invoke',
    n: '3.0',
    claim: 'Use a tool.',
    gloss: 'Fetch a page, write a file, call GitHub — every tool explicit.',
    filename: 'use-a-tool.nika.yaml',
    yaml: `nika: v1
workflow: use-a-tool
tasks:
  - id: page
    invoke:
      tool: "nika:fetch"
      args: { url: "https://nika.sh" }
`,
    sub: [
      { n: '3.1', label: 'builtins', to: '/spec#s3' },
      { n: '3.2', label: 'extract modes', to: '/spec#s5' },
      { n: '3.3', label: 'MCP servers' },
    ],
  },
  {
    verb: 'agent',
    n: '4.0',
    claim: 'Delegate.',
    gloss: 'An autonomous loop, on a leash you can read.',
    filename: 'delegate.nika.yaml',
    yaml: `nika: v1
workflow: delegate
model: ollama/llama3.1
tasks:
  - id: audit
    agent:
      prompt: "Find every dead link in ./docs"
      tools: ["nika:read", "nika:fetch"]
`,
    sub: [
      { n: '4.1', label: 'tool allow-list', to: '/spec#permits' },
      { n: '4.2', label: 'max turns' },
      { n: '4.3', label: 'the human gate', to: '#human-in-the-loop' },
    ],
  },
]

/* one sub-index entry · a route link (react-router · ScrollRestoration scrolls
   the anchor), an in-page anchor (native hash scroll), or plain text. */
function SubIndex({ entry }: { entry: SubEntry }) {
  const body = (
    <>
      <span className="v4chap-subn">{entry.n}</span> {entry.label}
    </>
  )
  if (!entry.to) return <span className="v4chap-subentry">{body}</span>
  if (entry.to.startsWith('#')) {
    return (
      <a href={entry.to} className="v4chap-subentry v4chap-subentry--link">
        {body}
      </a>
    )
  }
  return (
    <Link to={entry.to} className="v4chap-subentry v4chap-subentry--link">
      {body}
    </Link>
  )
}

function ChapterBlock({ chapter, index }: { chapter: Chapter; index: number }) {
  const c = chapter
  return (
    <article
      className="v4chap"
      style={{ ['--vh' as string]: VERB_HUE[c.verb], ['--rise-delay' as string]: `${index * 60}ms` }}
      data-rise
      aria-labelledby={`v4chap-${c.verb}`}
    >
      {/* LEFT · the chapter text column */}
      <div className="v4chap-copy">
        {/* the mono chapter kicker · `1.0 infer →` */}
        <p className="v4chap-kicker" id={`v4chap-${c.verb}`}>
          <span className="v4chap-n">{c.n}</span>
          <span className="v4chap-glyph" aria-hidden>
            {verbGlyph(c.verb)}
          </span>
          <span className="v4chap-verb">{c.verb}</span>
          <span className="v4chap-arrow" aria-hidden>
            →
          </span>
        </p>

        {/* the two-tone sentence · white claim + dim elaboration */}
        <p className="v4chap-sentence">
          <b>{c.claim}</b> {c.gloss}
        </p>

        {/* the mono sub-index · deeper chapters (real anchors only) */}
        <p className="v4chap-sub">
          {c.sub.map((s, i) => (
            <span key={s.n}>
              {i > 0 && (
                <span className="v4chap-subdot" aria-hidden>
                  {' '}
                  ·{' '}
                </span>
              )}
              <SubIndex entry={s} />
            </span>
          ))}
        </p>
      </div>

      {/* RIGHT · the verb's task in the product surface (hue lives HERE only) */}
      <div className="v4chap-frame">
        <CodeFile yaml={c.yaml} filename={c.filename} className="v4chap-code" />
      </div>
    </article>
  )
}

export default function Verbs() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="verbs" aria-labelledby="verbs-title" className="theme-dark v4sec scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          FIG 2.0
        </p>
        <h2 id="verbs-title" className="v4sec-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          What an agent can&nbsp;do — declared, not&nbsp;hidden.
        </h2>
        <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          Four verbs are the <b>only</b> native execution models — every action
          explicit and typed, never improvised from a hidden prompt. Everything{' '}
          <i>callable</i> is a tool under <code className="mono">invoke</code> — and tools are{' '}
          <b>allow-listed</b>. Everything about <i>ordering</i> is the DAG. No fifth verb, ever.
        </p>

        {/* the numbered chapters · 1.0 → 4.0 · hairline-ruled spec register */}
        <div className="v4chap-list">
          {CHAPTERS.map((c, i) => (
            <ChapterBlock key={c.verb} chapter={c} index={i} />
          ))}
        </div>

        <p className="v4verbs-note" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          infer&nbsp;◇&nbsp;·&nbsp;exec&nbsp;▷&nbsp;·&nbsp;invoke&nbsp;◆&nbsp;·&nbsp;agent&nbsp;✦
          &nbsp;&nbsp;—&nbsp;&nbsp;the whole operation space, declared in one file
        </p>
      </div>
    </section>
  )
}
