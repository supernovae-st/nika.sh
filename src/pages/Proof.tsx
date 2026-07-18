import { useRevealOnce } from '../sections/use-reveal-once'
import { LivingTerminal } from '../components/LivingTerminal'
import { MemberRows, Rails, HubFoot } from './hub-shared'
import { useHubHead, chapterHref } from './hub-lib'

/* ─── /proof · hub Proof (§4.9 · how Nika shows its work) ────────────────────
   The run graph (structure now · the real inspect payload is
   release-gated), the receipt SLOT (named W5 in the descriptor · the
   sister waves already ratified receipt_format upstream — the resync
   fills this the day the canon lands), conformance levels and the
   machine surfaces as anchored registers. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const hub = useHubHead(
    'proof',
    'The proof · a run you can verify, a graph you can read · Nika',
    'How Nika shows its work: the precomputed run graph, the hash-chained trace, three nested conformance levels and the machine surfaces agents load. Every claim fixture-proven.',
  )
  const levels = hub.sets.find((s) => s.id === 'conformance-levels')!

  return (
    <main className="theme-dark hub-page" style={{ ['--hub-hue' as string]: '#34d399' }}>
      <section ref={ref} aria-labelledby="hub-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <header>
            <p className="v4-kick">the proof</p>
            <h1 id="hub-title" className="v4-h2">
              A run you can verify
            </h1>
            <p className="hub-opener">{hub.opener}</p>
            <p className="hub-authority">
              Defined by <a href={chapterHref('spec/07-conformance.md')}>spec/07 · conformance</a>
            </p>
          </header>

          <section className="hub-sec" id="graph" aria-labelledby="graph-title">
            <h2 className="hub-sec-title" id="graph-title">
              The run graph
            </h2>
            <p className="hub-sec-note">
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
            <Rails
              rails={[
                { kind: 'kinds', label: 'the six edge kinds · /flow#edges', href: '/flow#edges' },
                { kind: 'spec', label: 'the wire contract · spec/03', href: chapterHref('spec/03-dag.md') },
              ]}
            />
          </section>

          <section className="hub-sec" id="receipt" aria-labelledby="receipt-title">
            <h2 className="hub-sec-title" id="receipt-title">
              The receipt
            </h2>
            <p className="hub-slot">
              ratified · fills with the trace wave: the NDJSON trace, the hash chain,
              <code>nika trace verify</code>, resume — this section projects the canon the resync
              brings, never prose written ahead of it.
            </p>
          </section>

          <section className="hub-sec" id="conformance" aria-labelledby="conf-title">
            <h2 className="hub-sec-title" id="conf-title">
              {levels.title}
            </h2>
            <p className="hub-sec-note">{levels.opener}</p>
            <MemberRows set={levels} />
            <Rails
              rails={[
                { kind: 'suite', label: 'the conformance tree · nika-spec', href: 'https://github.com/supernovae-st/nika-spec/tree/main/conformance' },
                { kind: 'replayed', label: 'the playground port re-runs the corpus in CI', href: '/play' },
              ]}
            />
          </section>

          <section className="hub-sec" id="machine" aria-labelledby="machine-title">
            <h2 className="hub-sec-title" id="machine-title">
              Machine surfaces
            </h2>
            <p className="hub-sec-note">
              The same truth, machine-shaped: <code>nika check --json</code> speaks typed findings with
              stable exit codes · the read-only MCP oracle serves the register below to any
              agent · this site serves its own twin, /ontology/language.json — the page you
              are reading, as data.
            </p>
            <ul className="hub-members">
              {(hub.sets.find((s) => s.id === 'mcp-tools')?.members ?? []).map(({ id: t }) => (
                <li key={t} className="hub-member" id={`mcp-${t}`}>
                  <span className="hub-member-id">
                    <a href={`#mcp-${t}`}>{t}</a>
                  </span>
                  <span className="hub-member-gloss">read-only · the oracle&apos;s {t.replace('nika_', '')} surface</span>
                </li>
              ))}
            </ul>
            <Rails
              rails={[
                { kind: 'twin', label: 'this site as data · /ontology/language.json', href: '/ontology/language.json' },
                { kind: 'kit', label: 'the agents kit · nika-agents', href: 'https://github.com/supernovae-st/nika-agents' },
              ]}
            />
          </section>

          <HubFoot nodeId="layer:proof" />
        </div>
      </section>
    </main>
  )
}
