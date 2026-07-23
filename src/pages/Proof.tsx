import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { LivingTerminal } from '../components/LivingTerminal'
import { StampStrip } from '../components/StampStrip'
import { HubFoot } from './hub-shared'
import { useHubHead, chapterHref } from './hub-lib'
import { HUBS, GATE_GRID } from './hub-data.generated'
import '../sections/v4-home.css'
import './proof-page.css'

/* ─── /proof · the proof register (§4.9 · how Nika shows its work) ────────────
   The hub grammar retired for the register grammar (the /providers ·
   /tools · /errors family): word masthead, one-word title, StampStrip,
   cl-year band heads. Substance unchanged: the run graph (structure now ·
   the living terminal replays the REAL 0.104-train captures), the receipt
   SLOT (named W5 in the descriptor · the sister waves already ratified
   receipt_format upstream — the resync fills it the day the canon lands),
   conformance levels and the machine surfaces as anchored rows. The layer
   hue (--hub-hue · the proof green) survives ONLY as the deep-link :target
   bar and the rail hover: the structure unified, the identity stayed.
   Inbound anchors preserved: #graph (Flow rail) · #conformance (Boundary
   rail) · #level-* · #mcp-*. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const hub = useHubHead(
    'proof',
    'The proof · a run you can verify, a graph you can read · Nika',
    'How Nika shows its work: the precomputed run graph, the hash-chained trace, three nested conformance levels and the machine surfaces agents load. Every claim fixture-proven.',
  )
  const levels = hub.sets.find((s) => s.id === 'conformance-levels')!
  const oracle = hub.sets.find((s) => s.id === 'mcp-tools')!
  const sec = (id: string) => hub.sections.find((s) => s.id === id)!
  /* the graph speaks a closed set of edge kinds — the flow hub OWNS them
     (this page owns the envelope); the count derives from the shared
     descriptor module, never typed */
  const edgeKindsN = HUBS.flow.sets.find((s) => s.id === 'edge-kinds')!.members.length
  const receiptSlot = sec('receipt').slot!
  const bandRise = (i: number) => ({ ['--rise-delay' as string]: `${180 + i * 30}ms` })

  return (
    <main className="theme-dark pf-page" style={{ ['--hub-hue' as string]: '#34d399' }}>
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="pf-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the proof layer
          </p>
          <h1 id="pf-title" className="v4sec-title pf-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Proof.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            A run you can verify, a graph you can read: the precomputed run graph, the
            hash-chained trace, the conformance suite that re-proves every claim.{' '}
            <b>Verification is replay, not trust</b>: <code>nika check --json</code> speaks typed
            findings, the read-only oracle serves agents over MCP, and this page ships as data at{' '}
            <a href="/ontology/language.json">/ontology/language.json</a>.
          </p>
          <p className="pf-src" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
            Defined by <a href={chapterHref('spec/07-conformance.md')}>spec/07 · conformance</a>
          </p>

          {/* the layer's dimensions, at a glance — every figure derived */}
          <StampStrip
            items={[
              { n: levels.members.length, label: 'conformance levels', sub: 'nested · core to stdlib' },
              { n: GATE_GRID.cells.length, label: 'gate verdicts', sub: 'producer × edge form' },
              { n: oracle.members.length, label: 'oracle tools', sub: 'read-only · over mcp' },
              { n: receiptSlot, label: 'the receipt', sub: 'ratified · fills at resync' },
            ]}
          />

          {/* ── the run graph ──────────────────────────────────────────────── */}
          <section className="pf-band" id="graph" aria-labelledby="graph-title" data-rise style={bandRise(0)}>
            <div className="cl-year-head">
              <h2 className="cl-year-n pf-band-n" id="graph-title">
                {sec('graph').title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {edgeKindsN} edge {edgeKindsN === 1 ? 'kind' : 'kinds'}
              </span>
            </div>
            <p className="pf-gloss">
              Before anything runs, the engine emits the workflow AS a graph: a versioned
              envelope over nodes and edges, the edge kinds a closed six, unknown kinds
              reader-tolerated by law · the document describes the file as WRITTEN, never
              run state. The kinds themselves live on the flow hub; this page owns the
              envelope and its additive law.
            </p>
            {/* the slot's own prophecy, filled: the first W2+ train shipped
                (0.104) — the living terminal replays the REAL captures,
                including `nika inspect` with its human|json dual */}
            <LivingTerminal />
            <p className="pf-refs">
              <a className="pf-ref" href="/flow#edges">
                <span className="pf-ref-k">kinds</span>the six edge kinds · /flow#edges
              </a>
              <a className="pf-ref" href={chapterHref('spec/03-dag.md')}>
                <span className="pf-ref-k">spec</span>the wire contract · spec/03
              </a>
            </p>
          </section>

          {/* ── the receipt ────────────────────────────────────────────────── */}
          <section className="pf-band" id="receipt" aria-labelledby="receipt-title" data-rise style={bandRise(1)}>
            <div className="cl-year-head">
              <h2 className="cl-year-n pf-band-n" id="receipt-title">
                {sec('receipt').title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">slot {receiptSlot}</span>
            </div>
            {/* the W5 trace-wave law: this plate projects the canon the resync
                brings — never prose written ahead of it (the hub-slot
                semantics, register skin) */}
            <p className="pf-slot">
              ratified · fills with the trace wave: the NDJSON trace, the hash chain,{' '}
              <code>nika trace verify</code>, resume · this section projects the canon the
              resync brings, never prose written ahead of it.
            </p>
          </section>

          {/* ── conformance ────────────────────────────────────────────────── */}
          <section className="pf-band" id="conformance" aria-labelledby="conf-title" data-rise style={bandRise(2)}>
            <div className="cl-year-head">
              <h2 className="cl-year-n pf-band-n" id="conf-title">
                {levels.title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {levels.members.length} {levels.members.length === 1 ? 'level' : 'levels'}
              </span>
            </div>
            <p className="pf-gloss">{levels.opener}</p>
            <ol className="pf-list">
              {levels.members.map((m) => (
                <li key={m.id} id={`${levels.anchor_prefix}${m.id}`} className="pf-row">
                  <div className="pf-row-head">
                    {/* the level OWNS a page — its id is the door (the hover
                        card keeps the readout preview) */}
                    {m.url ? (
                      <Link
                        className="pf-id"
                        to={m.url}
                        data-node-id={`${levels.node_prefix}:${m.id}`}
                        title="open the level's page"
                      >
                        {m.id}
                      </Link>
                    ) : (
                      <a
                        className="pf-id"
                        href={`#${levels.anchor_prefix}${m.id}`}
                        data-node-id={`${levels.node_prefix}:${m.id}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                          e.preventDefault()
                          window.dispatchEvent(
                            new CustomEvent('insp:open', {
                              detail: { id: `${levels.node_prefix}:${m.id}` },
                            }),
                          )
                        }}
                      >
                        {m.id}
                      </a>
                    )}
                    {m.slot && (
                      <span className="pf-wave" title={`ships with the ${m.slot} wave`}>
                        {m.slot}
                      </span>
                    )}
                  </div>
                  <p className="pf-desc">{m.one_liner}</p>
                </li>
              ))}
            </ol>
            <p className="pf-refs">
              <a className="pf-ref" href="https://github.com/supernovae-st/nika-spec/tree/main/conformance">
                <span className="pf-ref-k">suite</span>the conformance tree · nika-spec
              </a>
              <a className="pf-ref" href="/play">
                <span className="pf-ref-k">replayed</span>the playground port re-runs the corpus in CI
              </a>
            </p>
          </section>

          {/* ── machine surfaces ───────────────────────────────────────────── */}
          <section className="pf-band" id="machine" aria-labelledby="machine-title" data-rise style={bandRise(3)}>
            <div className="cl-year-head">
              <h2 className="cl-year-n pf-band-n" id="machine-title">
                {sec('machine').title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {oracle.members.length} {oracle.members.length === 1 ? 'tool' : 'tools'}
              </span>
            </div>
            <p className="pf-gloss">
              The same truth, machine-shaped: <code>nika check --json</code> speaks typed findings
              with stable exit codes · the read-only MCP oracle serves the register below to any
              agent · this site serves its own twin, /ontology/language.json: the page you are
              reading, as data.
            </p>
            <ol className="pf-list">
              {oracle.members.map(({ id: t, url }) => (
                <li key={t} id={`${oracle.anchor_prefix}${t}`} className="pf-row">
                  <div className="pf-row-head">
                    {url ? (
                      <Link className="pf-id" to={url} title="open the tool's page">
                        {t}
                      </Link>
                    ) : (
                      <a className="pf-id" href={`#${oracle.anchor_prefix}${t}`}>
                        {t}
                      </a>
                    )}
                  </div>
                  <p className="pf-desc">read-only · the oracle&apos;s {t.replace('nika_', '')} surface</p>
                </li>
              ))}
            </ol>
            <p className="pf-refs">
              <a className="pf-ref" href="/ontology/language.json">
                <span className="pf-ref-k">twin</span>this site as data · /ontology/language.json
              </a>
              <a className="pf-ref" href="https://github.com/supernovae-st/nika-agents">
                <span className="pf-ref-k">kit</span>the agents kit · nika-agents
              </a>
            </p>
          </section>

          <p className="pf-foot" data-rise>
            The proof is portable: replay the conformance corpus in the{' '}
            <Link to="/play">playground</Link>, or <Link to="/install">install</Link> and ask the
            binary itself: <code>nika check --json</code>. <Link to="/spec">Read the spec →</Link>
          </p>

          <HubFoot nodeId="layer:proof" />
        </div>
      </section>
    </main>
  )
}
