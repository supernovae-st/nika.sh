import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { CANON } from '../canon.generated'
import {
  ERROR_PATHS,
  LANGUAGE_PATHS,
  TEMPLATE_PATHS,
  TOOL_PATHS,
  VERB_PATHS,
} from '../../site.config'

/* ── the atlas descriptor gates ───────────────────────────────────────────────
   scripts/atlas/sets.yaml is the ONE authored input of the language atlas
   (mega-plan §2): every canonical set declared once — its layer, its gated
   source, its surface (rooms or anchors), its unique data. These gates pin
   the descriptor against the sources it claims to describe, so an edit that
   invents a set, drops the three-conditions law, or lets a versioned
   constant drift from the schema goes red HERE — before the compiler
   (WO-2) ever consumes it. Counts are asserted from sources, never typed. */

const ROOT = join(__dirname, '../..')

interface SetDecl {
  id: string
  layer: string
  title: string
  source: Record<string, unknown>
  clock: 'spec' | 'release' | 'both'
  counted_in_canon: boolean
  closed: boolean
  surface: 'rooms' | 'anchors'
  unique_data?: string
  rooms_url?: string
  rooms_exist?: boolean
  lands?: string
  surface_waiver?: string
  defined_by: string[]
  opener: string
  members?: { id: string; one_liner: string; slot?: string }[]
  moved?: { from: string; to: string }[]
}

interface Descriptor {
  atlas_descriptors: number
  layers: { id: string; title: string; hub: string; hub_exists: boolean; lands?: string; opener: string }[]
  sets: SetDecl[]
  surfaces: { id: string; url: string }[]
  library_heroes: { file: string; class: string | null }[]
}

const doc = parse(readFileSync(join(ROOT, 'scripts/atlas/sets.yaml'), 'utf8')) as Descriptor
const schema = JSON.parse(readFileSync(join(ROOT, 'public/schema/workflow.json'), 'utf8')) as {
  properties: {
    permits: { properties: Record<string, unknown> }
    secrets: { additionalProperties: { properties: { source: { enum: string[] } } } }
  }
}
const toolsCatalog = JSON.parse(readFileSync(join(ROOT, 'public/tools/catalog.json'), 'utf8')) as {
  tools: { bare: string; category: string }[]
}

const setById = new Map(doc.sets.map((s) => [s.id, s]))
const need = (id: string): SetDecl => {
  const s = setById.get(id)
  if (!s) throw new Error(`descriptor set missing: ${id}`)
  return s
}

describe('sets.yaml · the descriptor is structurally sound', () => {
  it('declares the marker and the seven anatomical layers, in reading order', () => {
    expect(doc.atlas_descriptors).toBe(1)
    expect(doc.layers.map((l) => l.id)).toEqual([
      'shape',
      'flow',
      'acts',
      'reach',
      'boundary',
      'refusals',
      'proof',
    ])
  })

  it('every set is unique, layered, sourced, chaptered and opened', () => {
    const ids = doc.sets.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    const layerIds = new Set(doc.layers.map((l) => l.id))
    for (const s of doc.sets) {
      expect(layerIds.has(s.layer), `${s.id} → layer ${s.layer}`).toBe(true)
      expect(Object.keys(s.source).length, `${s.id} needs a source`).toBeGreaterThan(0)
      expect(s.defined_by.length, `${s.id} needs an authority chapter`).toBeGreaterThan(0)
      expect(s.opener.trim().length, `${s.id} needs an opener`).toBeGreaterThan(40)
      expect(['spec', 'release', 'both']).toContain(s.clock)
    }
  })

  it('three-conditions law: a rooms surface names its unique data', () => {
    for (const s of doc.sets.filter((x) => x.surface === 'rooms')) {
      expect(s.unique_data?.trim().length, `${s.id} rooms need unique_data`).toBeGreaterThan(10)
      expect(s.rooms_url, `${s.id} rooms need a url pattern`).toMatch(/^\/[a-z-]+\/:/)
    }
  })

  it('a surface that does not exist yet carries its landing + waiver', () => {
    for (const s of doc.sets.filter((x) => x.surface === 'rooms' && x.rooms_exist === false)) {
      expect(s.lands, `${s.id} needs lands`).toMatch(/^wo-\d+$/)
      expect(s.surface_waiver, `${s.id} needs a written waiver`).toBeTruthy()
    }
  })
})

describe('sets.yaml · existing room sets match the routes the site serves', () => {
  const cases: [string, string[], (p: string) => string][] = [
    ['words', LANGUAGE_PATHS, (p) => p.replace('/language/', '')],
    ['verbs', VERB_PATHS, (p) => p.replace('/verbs/', '')],
    ['builtins', TOOL_PATHS, (p) => p.replace('/tools/', '')],
    ['templates', TEMPLATE_PATHS, (p) => p.replace('/templates/', '')],
    ['error-codes', ERROR_PATHS, (p) => p.replace('/errors/', '')],
  ]
  it.each(cases)('%s rooms exist and the url pattern matches PATHS', (id, paths) => {
    const s = need(id)
    expect(s.surface).toBe('rooms')
    expect(s.rooms_exist).toBe(true)
    expect(paths.length).toBeGreaterThan(0)
    const base = s.rooms_url!.split('/:')[0]
    for (const p of paths) expect(p.startsWith(`${base}/`), `${p} under ${base}`).toBe(true)
  })
})

describe('sets.yaml · the versioned constants mirror their gated sources', () => {
  it('permit families = the served schema permits properties, exactly', () => {
    const declared = need('permit-families').members!.map((m) => m.id)
    expect(declared.sort()).toEqual(Object.keys(schema.properties.permits.properties).sort())
  })

  it('secret sources = the served schema source enum, exactly', () => {
    const declared = need('secret-sources').members!.map((m) => m.id)
    expect(declared.sort()).toEqual(
      [...schema.properties.secrets.additionalProperties.properties.source.enum].sort(),
    )
  })

  it('edge kinds pin the closed six of spec/03 (a wave revision edits both)', () => {
    expect(need('edge-kinds').members!.map((m) => m.id)).toEqual([
      'value',
      'terminal-observation',
      'failure-observation',
      'control',
      'recovery',
      'finally',
    ])
  })

  it('gate predicates pin the closed four of spec/03', () => {
    expect(need('gate-predicates').members!.map((m) => m.id)).toEqual([
      'succeeded',
      'failed',
      'skipped',
      'terminal',
    ])
  })

  it('tool families cover every category the shipped catalog witnesses', () => {
    const witnessed = [...new Set(toolsCatalog.tools.map((t) => t.category))].sort()
    // families are anchors derived from the catalog · the descriptor lists none
    // by hand — the OPENER must name each witnessed family so the teaching
    // voice and the data cannot drift apart.
    const opener = need('tool-families').opener
    for (const fam of witnessed) expect(opener, `opener names ${fam}`).toContain(fam)
  })

  it('truth words carry the vocabulary of §1bis, each with one meaning', () => {
    expect(need('truth-words').members!.map((m) => m.id)).toEqual([
      'spec',
      'canon',
      'schema',
      'pack',
      'pin',
      'catalog',
      'mirror',
      'registry',
      'manifest',
      'atlas',
    ])
  })
})

describe('sets.yaml · moved entries are complete and shaped as redirects', () => {
  it('providers moved covers every cataloged provider (the rooms died in the WO-6 fusion)', () => {
    const moved = need('providers').moved!
    const catalog = JSON.parse(
      readFileSync(join(ROOT, 'public/providers/catalog.json'), 'utf8'),
    ) as { providers: { id: string }[] }
    expect(moved.map((m) => m.from).sort()).toEqual(
      catalog.providers.map((p) => `/providers/${p.id}`).sort(),
    )
    for (const m of moved) {
      const id = m.from.replace('/providers/', '')
      expect(m.to).toBe(`/providers#${id}`)
    }
  })

  it('the sitemap surface moves to /map', () => {
    const legacy = doc.surfaces.find((s) => s.id === 'sitemap-legacy') as
      | { moved?: { from: string; to: string } }
      | undefined
    expect(legacy?.moved).toEqual({ from: '/sitemap', to: '/map', applied: 'wo-3' })
  })
})

describe('sets.yaml · counted_in_canon claims are true against CANON', () => {
  it('every counted set resolves to a real canon figure', () => {
    const canonCounts: Record<string, number> = {
      namespaces: CANON.namespaces,
      verbs: CANON.verbs,
      builtins: CANON.builtins,
      providers: CANON.providers,
      'extract-modes': CANON.extractModes,
      templates: CANON.templates,
      'mcp-tools': CANON.mcpTools,
      'error-codes': CANON.errorCodes,
      'error-namespaces': CANON.errorNamespaces,
      'error-categories': CANON.errorCategories,
    }
    for (const s of doc.sets) {
      if (s.counted_in_canon) {
        expect(canonCounts[s.id], `${s.id} claims counted_in_canon`).toBeGreaterThan(0)
      } else {
        expect(canonCounts[s.id], `${s.id} should claim counted_in_canon`).toBeUndefined()
      }
    }
  })
})

describe('sets.yaml · the anti-slop law holds on the authored voice', () => {
  const authored = [
    ...doc.layers.map((l) => ({ id: `layer:${l.id}`, text: l.opener })),
    ...doc.sets.map((s) => ({ id: `set:${s.id}`, text: s.opener })),
    ...doc.sets.flatMap((s) => (s.members ?? []).map((m) => ({ id: `${s.id}/${m.id}`, text: m.one_liner }))),
  ]

  it('no em dash anywhere in the authored voice (middots are the house mark)', () => {
    for (const a of authored) expect(a.text, a.id).not.toMatch(/—/)
  })

  it('no banned intensifiers', () => {
    for (const a of authored) {
      expect(a.text, a.id).not.toMatch(/\b(seamless|powerful|robust|blazingly|cutting-edge)\b/i)
    }
  })

  it('openers stay in the 2-3 sentence quotable band', () => {
    for (const s of doc.sets) {
      const sentences = s.opener.split(/[.!?](?:\s|$)/).filter((x) => x.trim().length > 0)
      expect(sentences.length, `set:${s.id}`).toBeGreaterThanOrEqual(1)
      expect(sentences.length, `set:${s.id}`).toBeLessThanOrEqual(3)
    }
  })
})

describe('sets.yaml · the library heroes await their WO-2 classing', () => {
  it('all seven heroes are listed with a class field (null until the audit)', () => {
    expect(doc.library_heroes.length).toBe(7)
    for (const h of doc.library_heroes) {
      expect(h.file).toMatch(/^public\/library\/[a-z-]+\.nika\.yaml$/)
      expect(h.class === null || ['spec-vendored', 'crafted-room'].includes(h.class!)).toBe(true)
    }
  })
})
