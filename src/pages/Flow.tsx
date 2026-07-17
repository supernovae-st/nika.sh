import { useRevealOnce } from '../sections/use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { MARKET_VOCAB } from '../content/market-vocab.generated'
import { MemberRows, Rails, HubFoot, GateMatrix } from './hub-shared'
import { useHubHead, chapterHref } from './hub-lib'

/* ─── /flow · hub Flow (§4.3 · the layer that owns « how tasks LINK ») ────────
   Structure-first projection of the descriptor: the two doors (real
   skeleton excerpts · spec-template class, sha-pinned upstream), the edge
   kinds and gate predicates as anchored member registers, the I1 matrix
   (pure fixture replay), waves, the dead depends_on teaching, the W-DEC
   slot. The « real inspect payload per kind » beat is RELEASE-GATED (the
   pre-W2 released binary cannot speak the corpus) — the fixture links
   carry the evidence until the train. */

/* the two doors · verbatim slices of the sha-pinned chain skeleton (the
   catalog carries the whole file · these are its own lines, spec-correct) */
const WITH_EXCERPT = `think:
  with:
    gather: \${{ tasks.gather.output }}
  infer:
    prompt: |
      Summarize · \${{ with.gather }}`

const AFTER_EXCERPT = `announce:
  after: { changelog: success }
  invoke:
    tool: "nika:notify"`

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

  return (
    <main className="theme-dark hub-page" style={{ ['--hub-hue' as string]: '#5b8cff' }}>
      <section ref={ref} aria-labelledby="hub-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <header>
            <p className="v4-kick">the flow</p>
            <h1 id="hub-title" className="v4-h2">
              Two doors, one graph
            </h1>
            <p className="hub-opener">{hub.opener}</p>
            <p className="hub-authority">
              Defined by <a href={chapterHref('spec/03-dag.md')}>spec/03 · the DAG</a>
            </p>
          </header>

          <section className="hub-sec" id="doors" aria-labelledby="doors-title">
            <h2 className="hub-sec-title" id="doors-title">
              The two doors
            </h2>
            <p className="hub-sec-note">
              with: binds a value and IS a data edge · after: orders on outcome and IS a
              control edge. Nothing else creates an edge; there is no dependency list to
              maintain beside the file.
            </p>
            <div className="hub-pair">
              <CodeFile yaml={WITH_EXCERPT} filename="with · a value edge" sourceHref="https://github.com/supernovae-st/nika-spec/blob/main/templates/chain.nika.yaml" />
              <CodeFile yaml={AFTER_EXCERPT} filename="after · a control edge" sourceHref="https://github.com/supernovae-st/nika-spec/blob/main/templates/human-gated-ship.nika.yaml" />
            </div>
            <Rails
              rails={[
                { kind: 'room', label: 'with', href: '/language/with' },
                { kind: 'room', label: 'after', href: '/language/after' },
                { kind: 'teaching', label: 'depends_on does not exist · NIKA-PARSE-024', href: '/errors/NIKA-PARSE-024' },
              ]}
            />
          </section>

          <section className="hub-sec" id="edges" aria-labelledby="edges-title">
            <h2 className="hub-sec-title" id="edges-title">
              {edgeKinds.title}
            </h2>
            <p className="hub-sec-note">{edgeKinds.opener}</p>
            <MemberRows set={edgeKinds} />
            <p className="hub-slot">
              real <code>nika inspect</code> payloads per kind land with the first W2+ release train
              (engine captures are release-gated by law) · until then every kind above
              links its conformance fixtures through the matrix below.
            </p>
            <Rails
              rails={[
                { kind: 'projects to', label: 'the run graph · /proof#graph', href: '/proof#graph' },
              ]}
            />
          </section>

          <section className="hub-sec" id="predicates" aria-labelledby="predicates-title">
            <h2 className="hub-sec-title" id="predicates-title">
              {predicates.title}
            </h2>
            <p className="hub-sec-note">{predicates.opener}</p>
            <MemberRows set={predicates} />
          </section>

          <section className="hub-sec" id="gate" aria-labelledby="gate-title">
            <h2 className="hub-sec-title" id="gate-title">
              The gate, exhaustively
            </h2>
            <p className="hub-sec-note">
              Producer state by consumer edge form: 40 cells, 35 run against the reference
              model (the spec authors every verdict), 5 statically dead. Pick a cell; the
              site replays the fixture truth, it never re-derives it.
            </p>
            <GateMatrix />
          </section>

          <section className="hub-sec" id="waves" aria-labelledby="waves-title">
            <h2 className="hub-sec-title" id="waves-title">
              Waves
            </h2>
            <p className="hub-sec-note">
              The engine reads every edge and runs Kahn fronts: tasks with no unmet producer
              start together, each wave as wide as the graph allows. max_parallel caps a
              fan-out politely · fail_fast decides whether one failure drains the batch ·
              when: is business logic AFTER the gate admits a task, never the gate itself.
            </p>
            <Rails
              rails={[
                { kind: 'room', label: 'for_each', href: '/language/for_each' },
                { kind: 'room', label: 'max_parallel', href: '/language/max_parallel' },
                { kind: 'room', label: 'fail_fast', href: '/language/fail_fast' },
                { kind: 'room', label: 'when', href: '/language/when' },
              ]}
            />
          </section>

          <section className="hub-sec" id="decisions" aria-labelledby="decisions-title">
            <h2 className="hub-sec-title" id="decisions-title">
              Decisions
            </h2>
            <p className="hub-slot">
              ratified · ships with the decisions wave: nika:decide and the Decision IR join
              this page when the resync brings the W-DEC canon.
            </p>
          </section>

          <HubFoot nodeId="layer:flow" />
        </div>
      </section>
    </main>
  )
}
