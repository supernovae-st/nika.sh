// extractors/corpus.mjs — the corpus families. Wave 1 carries the skeletons
// (the 10 verb templates, already pin-gated in-tree); the lessons (13) and
// jobs (26) join at the train once examples/manifest.yaml is vendored at the
// pin bump — adding them is one extractor edit, never a route edit (§J.3:
// the descriptor-flip pattern, generalized).

import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import { node, readJson, ROOT } from '../lib.mjs'

/* the room base comes from the DESCRIPTOR, never a literal here: the
   skeletons re-homed to /workflows/skeletons on 2026-08-02 and this
   extractor was the last place still minting /templates/* urls, which the
   graph's served-route law caught. */
const skeletonBase = (() => {
  const sets = parseYaml(readFileSync(`${ROOT}/scripts/lens/graph/sets.yaml`, 'utf8')).sets
  const s = sets.find((x) => x.id === 'templates')
  return (s?.rooms_url ?? '/templates/:name').replace(/\/:[^/]+$/, '')
})()

export function extract({ census, specRef }) {
  const nodes = []
  const templates = readJson('public/templates/catalog.json')
  for (const t of templates.templates) {
    const url = `${skeletonBase}/${t.name}`
    nodes.push(
      node({
        id: `skeleton/${t.name}`,
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
