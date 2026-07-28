import { Link } from 'react-router'
import { NIKA_VERB_GLYPH, NIKA_VERB_HEX } from '../design-tokens.generated'
import { useLamp } from '../lib/use-lamp'

/* ─── the verb field · why there are exactly four, drawn ──────────────────────
   The page claims "four, never five". A claim is a sentence; this is the
   argument. A step can natively do exactly three things — ask a model, run a
   process, call a tool — and there is exactly one way to put them in a loop.
   That is the whole of it, and once you can see it the fifth verb has nowhere
   to stand.

   THE FIRST DRAFT WAS A 2×2 and it was false. Whatever axes it was given,
   `exec` and `invoke` fell in the same cell, because they differ in WHAT they
   touch rather than in who decides or what is reached. Forcing the grid would
   have been a structural device encoding nothing true — the exact failure the
   design discipline warns about. Three primitives and a loop is what the
   language actually is.

   The plates are the site's shared primitive (styles/plate.css, projected from
   nika-spec design/tokens.yaml), so this field is lit by the same lamp as the
   canvas will be. */

const PRIMITIVES = [
  { verb: 'infer', does: 'asks a model', why: 'the only step that thinks' },
  { verb: 'exec', does: 'runs a process', why: 'the only step that shells out' },
  { verb: 'invoke', does: 'calls a tool', why: 'the only step that reaches a permit' },
] as const

export function VerbField() {
  const { ref: lampRef, props: lampProps } = useLamp<HTMLDivElement>()

  return (
    <div className="vfield cabinet" ref={lampRef} {...lampProps}>
      <p className="vfield-axis">a step can natively do three things</p>

      <ul className="vfield-row">
        {PRIMITIVES.map(({ verb, does, why }) => (
          <li key={verb}>
            <Link
              to={`/verbs/${verb}`}
              className="plate vfield-plate"
              style={{ ['--vf-hue' as string]: NIKA_VERB_HEX[verb] }}
            >
              <span className="vfield-glyph" aria-hidden>
                {NIKA_VERB_GLYPH[verb]}
              </span>
              <span className="plate-title vfield-verb">{verb}</span>
              <span className="vfield-does">{does}</span>
              <span className="vfield-why">{why}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* the three wires converging — drawn, not decorative: they are why the
          fourth verb is a different kind of thing */}
      <svg className="vfield-wires" viewBox="0 0 300 60" aria-hidden preserveAspectRatio="none">
        <path d="M50 0 V26 H150 V60" />
        <path d="M150 0 V60" />
        <path d="M250 0 V26 H150 V60" />
      </svg>

      <p className="vfield-axis vfield-axis--low">and exactly one way to loop them</p>

      <Link
        to="/verbs/agent"
        className="plate vfield-plate vfield-plate--loop"
        style={{ ['--vf-hue' as string]: NIKA_VERB_HEX.agent }}
      >
        <span className="vfield-glyph" aria-hidden>
          {NIKA_VERB_GLYPH.agent}
        </span>
        <span className="plate-title vfield-verb">agent</span>
        <span className="vfield-does">loops the three, under a budget</span>
        <span className="vfield-why">the only step that decides what comes next</span>
      </Link>

      <p className="vfield-close">
        There is no fifth, because there is no fourth thing a step can do. Everything{' '}
        <em>callable</em> is a tool under <code>invoke</code>; everything about{' '}
        <em>ordering</em> is the plan.
      </p>
    </div>
  )
}
