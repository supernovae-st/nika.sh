import { useRevealOnce } from './use-reveal-once'
import { VERBS } from '../content'
import { verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import './v4-home.css'

/* ─── FIG 2.0 · The four verbs (theme-dark) ───────────────────────────────────
   Design doc §6 (FIG 2.0) — clarity. A COMPOSED, asymmetric grid (not a plain
   centered 2×2): the lead verb (infer) is a tall left plate, the other three
   stack in a right rail. Each verb = its glyph (verbGlyph · monochrome ◇▷◆✦) +
   name + a one-line gloss (reused from content.ts VERBS) + a 2-line real spec
   snippet. FIG 2.1–2.4 sub-labels. Hairline borders. The verb HUE appears only
   as a hairline accent on hover/focus (left rule + glyph), never as a fill —
   per §3.4 (static site grayscale, the verb-hue whisper is earned).

   Framing: "A verb is a distinct native execution model." (D-2026-05-22-N18)

   SSR-safe: pure DOM, no window at render. The reveal is an IntersectionObserver
   added on mount; content is fully visible by default (no-JS / reduced-motion). */

/* the 4 verb hues → the per-card --vh custom prop (drives the hover accent). */
const VERB_HUE: Record<NikaVerb, string> = {
  infer: 'var(--verb-infer)',
  exec: 'var(--verb-exec)',
  invoke: 'var(--verb-invoke)',
  agent: 'var(--verb-agent)',
}

/* the one-line "what kind of execution" gloss per verb — the native-model framing
   (kept short; the longer copy from content.ts VERBS.body is the gloss line). */
const VERB_MODEL: Record<NikaVerb, string> = {
  infer: 'a model call',
  exec: 'a process',
  invoke: 'a tool call',
  agent: 'a tool-use loop',
}

/* a 2-line spec snippet per verb · the verb keyword gets its glyph + bright ink,
   everything else stays dim. Taken verbatim from the spec shapes in content.ts. */
const VERB_SNIPPET: Record<NikaVerb, string[]> = {
  infer: ['- id: research', '  infer:'],
  exec: ['- id: build', '  exec:'],
  invoke: ['- id: read_config', '  invoke:'],
  agent: ['- id: research', '  agent:'],
}

/* render one snippet line, tinting only the verb keyword (with its glyph). */
function SnippetLine({ line }: { line: string }) {
  // match a bare verb keyword at the end of a "  <verb>:" line
  const m = line.match(/^(\s*)(infer|exec|invoke|agent)(:)$/)
  if (m) {
    const verb = m[2] as NikaVerb
    return (
      <span>
        {m[1]}
        <span className="v4snip-glyph" aria-hidden>
          {verbGlyph(verb)}{' '}
        </span>
        <span className="v4snip-verb">{verb}</span>
        {m[3]}
      </span>
    )
  }
  return <span>{line}</span>
}

function VerbCard({
  verb,
  tagline,
  gloss,
  index,
  lead,
}: {
  verb: NikaVerb
  tagline: string
  gloss: string
  index: number
  lead: boolean
}) {
  return (
    <article
      className={`v4verb ${lead ? 'v4verb--lead' : 'v4verb--rail'}`}
      style={{ ['--vh' as string]: VERB_HUE[verb], ['--rise-delay' as string]: `${index * 70}ms` }}
      data-rise
    >
      <div className="v4verb-head">
        <span className="v4verb-glyph" aria-hidden>
          {verbGlyph(verb)}
        </span>
        <h3 className="v4verb-name">{verb}</h3>
        <span className="v4verb-tag">{tagline}</span>
      </div>

      <p className="v4verb-sub">FIG 2.{index + 1} · {VERB_MODEL[verb]}</p>
      <p className="v4verb-gloss">{gloss}</p>

      <div className="v4verb-snip">
        <pre aria-label={`${verb} task · spec shape`}>
          {VERB_SNIPPET[verb].map((l, i) => (
            <span key={i} style={{ display: 'block' }}>
              <SnippetLine line={l} />
            </span>
          ))}
        </pre>
      </div>
    </article>
  )
}

export default function Verbs() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  const verbs = VERBS as { verb: NikaVerb; tagline: string; body: string }[]

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

        <div className="v4verbs-grid">
          {verbs.map((v, i) => (
            <VerbCard
              key={v.verb}
              verb={v.verb}
              tagline={v.tagline}
              gloss={v.body}
              index={i}
              lead={i === 0}
            />
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
