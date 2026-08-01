// extractors/city.mjs — the ville: 13 buildings (CANON D-2026-07-29-N10),
// the honest archives, and the LANES — every lane an edge with a nameable
// law (pin? train? lockstep? bot ONE-PR?). Source: scripts/graph/city.yaml,
// the ONE authored input of the compiler (site voice · declared to the
// doctor's §J.1 typing gate).

import { edge, node, readYamlFile } from '../lib.mjs'

export function extract({ engineRef }) {
  const city = readYamlFile('scripts/graph/city.yaml')
  const nodes = []
  const edges = []
  const prov = 'supernovae-st/nika.sh · scripts/graph/city.yaml (site voice · authored against the city canon)'

  for (const b of city.buildings) {
    nodes.push(
      node({
        id: `building/${b.id}`,
        family: 'building',
        title: b.repo,
        lands: 'casse-wave (train 0.107 · /city/:building · D2)',
        data: { repo: b.repo, root: b.root, role: b.role },
        evidence: b.evidence,
        provenance: prov,
      }),
    )
  }
  for (const a of city.archives) {
    nodes.push(
      node({
        id: `building/${a.id}`,
        family: 'building',
        title: a.repo,
        data: { repo: a.repo, archived: true, role: a.role },
        evidence: a.evidence,
        provenance: prov,
      }),
    )
  }
  for (const l of city.lanes) {
    edges.push(
      edge({
        from: `building/${l.from}`,
        rel: l.rel,
        to: `building/${l.to}`,
        data: { law: l.law },
        evidence: l.evidence,
        provenance: prov,
      }),
    )
  }

  return {
    families: [
      {
        family: 'building',
        count: nodes.length,
        rooms_exist: false,
        lands: 'casse-wave (train 0.107 · /city/:building · D2)',
        source: 'scripts/graph/city.yaml',
        clock: 'site',
        note: '13 canonical buildings (D-2026-07-29-N10) + the honest archives — history does not get erased (H.3)',
      },
    ],
    nodes,
    edges,
    inputs: [{ path: 'scripts/graph/city.yaml', voice: true }],
  }
}
