import { ATLAS_PROVENANCE, SOURCES_LIVE } from '../content/atlas-meta.generated'
import './truth-line.css'

/* ─── TruthLine · the page carries its freshness (atlas §4 convention) ───────
   ONE per atlas page, page footer, discrete: where this page's truth comes
   from (spec pin · engine release · the vendored catalog vintage when it
   lags) + « this page as data » (the served twin, node-addressed). The
   « about sources » link appears when /sources ships (WO-7) — a link that
   404s teaches nothing. Anti-slop law: a truth line frames real data or it
   does not render. */

export function TruthLine({ nodeId }: { nodeId?: string }) {
  const p = ATLAS_PROVENANCE
  const pin = p.spec_pin ? `spec@${p.spec_pin.slice(0, 7)}` : 'spec pin · next resync stamps it'
  const catalogLag = p.catalogs.tools !== p.engine_version.replace(/^v/, '')
  return (
    <p className="truth-line">
      <span>
        Derived from {pin} · engine {p.engine_version}
        {catalogLag ? ` · catalogs vendored at ${p.catalogs.tools}` : ''}
      </span>
      <a
        className="truth-line-link"
        href={`/ontology/language.json${nodeId ? `#${encodeURIComponent(nodeId)}` : ''}`}
      >
        this page as data <span aria-hidden>{'</>'}</span>
      </a>
      {SOURCES_LIVE && (
        <a className="truth-line-link" href="/sources">
          about sources →
        </a>
      )}
    </p>
  )
}
