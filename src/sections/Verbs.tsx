import { Link } from 'react-router'
import { useRevealOnce } from './use-reveal-once'
import { verbGlyph, type NikaVerb } from '../components/codefile-highlight'
import { CHAPTERS, type Chapter, type SubEntry } from './verbs-data'
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
          <b>allow-listed</b>. Everything about <i>ordering</i> is the plan — which tasks
          wait on which. No fifth verb, ever.
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
