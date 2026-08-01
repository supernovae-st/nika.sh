// extractors/corpus.mjs — the corpus families. Wave 1 carries the skeletons
// (the 10 verb templates, already pin-gated in-tree); the lessons (13) and
// jobs (26) join at the train once examples/manifest.yaml is vendored at the
// pin bump — adding them is one extractor edit, never a route edit (§J.3:
// the descriptor-flip pattern, generalized).

import { node, readJson } from '../lib.mjs'

export function extract({ census, specRef }) {
  const nodes = []
  const templates = readJson('public/templates/catalog.json')
  for (const t of templates.templates) {
    const url = `/templates/${t.name}`
    nodes.push(
      node({
        id: `skeleton:${t.name}`,
        family: 'skeleton',
        title: t.name,
        url,
        served: census.has(url),
        data: { intent: t.intent ?? null, sha256: t.sha256 ?? null },
        evidence: `public/templates/catalog.json templates[] row (pack ${templates.version} · sha256-pinned per file)`,
        provenance: `${specRef} · public/templates/catalog.json`,
      }),
    )
  }
  return {
    families: [
      {
        family: 'skeleton',
        count: templates.templates.length,
        rooms_exist: true,
        source: 'public/templates/catalog.json',
        clock: 'spec-pin',
        note: 'lessons (path/) + jobs join at the train once the pack manifest is vendored at the pin bump',
      },
    ],
    nodes,
    edges: [],
    inputs: [{ path: 'public/templates/catalog.json' }],
  }
}
