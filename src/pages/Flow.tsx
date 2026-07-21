import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { StampStrip } from '../components/StampStrip'
import { MARKET_VOCAB } from '../content/market-vocab.generated'
import { GATE_GRID } from './hub-data.generated'
import { MemberRows, Rails, HubFoot, GateMatrix } from './hub-shared'
import { useHubHead, chapterHref } from './hub-lib'
import '../sections/v4-home.css'
import './flow-page.css'

/* ─── /flow · the flow register (§4.3 · the layer that owns « how tasks LINK ») ─
   The register grammar (the /providers · /tools · /errors family): word
   masthead, one-word title, a StampStrip of the layer's dimensions (every
   figure DERIVED from hub-data + GATE_GRID · never typed), then band
   sections over the same SSOT projections: the two doors (real skeleton
   excerpts · spec-template class, sha-pinned upstream), the edge kinds and
   gate predicates as anchored member registers, the I1 matrix (pure
   fixture replay), waves, the W-DEC slot. The « real inspect payload per
   kind » beat is RELEASE-GATED (the pre-W2 released binary cannot speak
   the corpus) — the fixture links carry the evidence until the train. */

/* the two doors · verbatim slices of the sha-pinned skeletons (the catalog
   carries the whole files · these are their own lines, spec-correct) */
const DOORS = [
  {
    id: 'with',
    filename: 'with · a value edge',
    sourceHref: 'https://github.com/supernovae-st/nika-spec/blob/main/templates/chain.nika.yaml',
    yaml: `think:
  with:
    gather: \${{ tasks.gather.output }}
  infer:
    prompt: |
      Summarize · \${{ with.gather }}`,
  },
  {
    id: 'after',
    filename: 'after · a control edge',
    sourceHref:
      'https://github.com/supernovae-st/nika-spec/blob/main/templates/human-gated-ship.nika.yaml',
    yaml: `announce:
  after: { changelog: success }
  invoke:
    tool: "nika:notify"`,
  },
]

/* the wave knobs · each one owns a language room */
const WAVE_ROOMS = [
  { kind: 'room', label: 'for_each', href: '/language/for_each' },
  { kind: 'room', label: 'max_parallel', href: '/language/max_parallel' },
  { kind: 'room', label: 'fail_fast', href: '/language/fail_fast' },
  { kind: 'room', label: 'when', href: '/language/when' },
]

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const hub = useHubHead(
    'flow',
    // the market phrase comes from the vocab bridge, never typed here (§6.5)
    `The flow · ${MARKET_VOCAB['layer:flow'].term}, defined in the file · Nika`,
    'How tasks link in Nika: with binds values, after orders effects, the engine derives the run graph. Edge kinds, gate predicates and the full producer-state matrix, fixture-proven.',
  )
  const edgeKinds = hub.sets.find((s) => s.id === 'edge-kinds')!
  const predicates = hub.sets.find((s) => s.id === 'gate-predicates')!
  const replayed = GATE_GRID.cells.filter((c) => !c.dead)
  const dead = GATE_GRID.cells.filter((c) => c.dead)
  const decisionsSlot = hub.sections.find((s) => s.anchor === 'decisions')?.slot

  return (
    <main className="theme-dark fl-page" style={{ ['--hub-hue' as string]: '#5b8cff' }}>
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="fl-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the flow layer
          </p>
          <h1 id="fl-title" className="v4sec-title fl-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Flow.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Tasks link through two doors: <code>with:</code> binds a value, <code>after:</code>{' '}
            orders on outcome, and the engine reads those bindings into the run graph:{' '}
            <b>nothing else creates an edge</b>. There is no dependency list to maintain beside
            the file; every verdict on this page replays a conformance fixture.
          </p>
          <p className="fl-authority" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
            Defined by <a href={chapterHref('spec/03-dag.md')}>spec/03 · the DAG</a>
          </p>

          {/* the layer's dimensions, at a glance — every figure derived, never typed */}
          <StampStrip
            items={[
              { n: edgeKinds.members.length, label: 'edge kinds', sub: 'the closed set' },
              { n: predicates.members.length, label: 'gate predicates', sub: 'after: gates on state' },
              { n: GATE_GRID.cells.length, label: 'matrix cells', sub: 'producer × form' },
              { n: replayed.length, label: 'replayed verdicts', sub: 'spec-authored fixtures' },
            ]}
          />

          <section className="fl-band" id="doors" aria-labelledby="doors-title" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n fl-band-n" id="doors-title">
                The two doors
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {DOORS.length} {DOORS.length === 1 ? 'door' : 'doors'}
              </span>
            </div>
            <p className="fl-gloss">
              <code>with:</code> binds a value and IS a data edge · <code>after:</code> orders on
              outcome and IS a control edge. Nothing else creates an edge; there is no dependency
              list to maintain beside the file.
            </p>
            <div className="fl-pair">
              {DOORS.map((d) => (
                <CodeFile key={d.id} yaml={d.yaml} filename={d.filename} sourceHref={d.sourceHref} />
              ))}
            </div>
            <Rails
              rails={[
                { kind: 'room', label: 'with', href: '/language/with' },
                { kind: 'room', label: 'after', href: '/language/after' },
                { kind: 'teaching', label: 'depends_on does not exist · NIKA-PARSE-024', href: '/errors/NIKA-PARSE-024' },
              ]}
            />
          </section>

          <section className="fl-band" id="edges" aria-labelledby="edges-title" data-rise style={{ ['--rise-delay' as string]: '210ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n fl-band-n" id="edges-title">
                {edgeKinds.title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {edgeKinds.members.length} {edgeKinds.members.length === 1 ? 'kind' : 'kinds'}
              </span>
            </div>
            <p className="fl-gloss">{edgeKinds.opener}</p>
            <MemberRows set={edgeKinds} />
            <p className="fl-slot">
              <span className="fl-slot-k">release-gated</span>
              real <code>nika inspect</code> payloads per kind land with the first W2+ release
              train (engine captures are release-gated by law) · until then every kind above
              links its conformance fixtures through the matrix below.
            </p>
            <Rails
              rails={[
                { kind: 'projects to', label: 'the run graph · /proof#graph', href: '/proof#graph' },
              ]}
            />
          </section>

          <section className="fl-band" id="predicates" aria-labelledby="predicates-title" data-rise style={{ ['--rise-delay' as string]: '240ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n fl-band-n" id="predicates-title">
                {predicates.title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {predicates.members.length} {predicates.members.length === 1 ? 'predicate' : 'predicates'}
              </span>
            </div>
            <p className="fl-gloss">{predicates.opener}</p>
            <MemberRows set={predicates} />
          </section>

          <section className="fl-band" id="gate" aria-labelledby="gate-title" data-rise style={{ ['--rise-delay' as string]: '270ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n fl-band-n" id="gate-title">
                The gate, exhaustively
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {GATE_GRID.cells.length} {GATE_GRID.cells.length === 1 ? 'cell' : 'cells'}
              </span>
            </div>
            <p className="fl-gloss">
              Producer state by consumer edge form: {GATE_GRID.cells.length} cells,{' '}
              {replayed.length} run against the reference model (the spec authors every verdict),{' '}
              {dead.length} statically dead. Pick a cell; the site replays the fixture truth, it
              never re-derives it.
            </p>
            <GateMatrix />
          </section>

          <section className="fl-band" id="waves" aria-labelledby="waves-title" data-rise style={{ ['--rise-delay' as string]: '300ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n fl-band-n" id="waves-title">
                Waves
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {WAVE_ROOMS.length} {WAVE_ROOMS.length === 1 ? 'room' : 'rooms'}
              </span>
            </div>
            <p className="fl-gloss">
              The engine reads every edge and runs Kahn fronts: tasks with no unmet producer
              start together, each wave as wide as the graph allows. <code>max_parallel</code>{' '}
              caps a fan-out politely · <code>fail_fast</code> decides whether one failure drains
              the batch · <code>when:</code> is business logic AFTER the gate admits a task,
              never the gate itself.
            </p>
            <Rails rails={WAVE_ROOMS} />
          </section>

          <section className="fl-band" id="decisions" aria-labelledby="decisions-title" data-rise style={{ ['--rise-delay' as string]: '330ms' }}>
            <div className="cl-year-head">
              <h2 className="cl-year-n fl-band-n" id="decisions-title">
                Decisions
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">{decisionsSlot}</span>
            </div>
            <p className="fl-slot">
              <span className="fl-slot-k">ratified</span>
              ships with the decisions wave: <code>nika:decide</code> and the Decision IR join
              this page when the resync brings the W-DEC canon.
            </p>
          </section>

          <p className="fl-foot" data-rise>
            Edges are read, never declared: change the file and the graph follows, and{' '}
            <Link to="/proof">/proof</Link> renders what the engine derived. Sketch an edge in
            the <Link to="/play">playground</Link>, or <Link to="/install">install</Link> and let{' '}
            <code>nika check</code> read your file. <Link to="/spec">Read the spec →</Link>
          </p>

          <HubFoot nodeId="layer:flow" />
        </div>
      </section>
    </main>
  )
}
