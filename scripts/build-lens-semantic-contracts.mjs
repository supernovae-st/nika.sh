#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from './spec-resync-lib.mjs'
import {
  carrierSetSha256,
  discoverCountClaims,
  discoverPrerenderClaims,
  discoverRouteClaims,
  discoverSnippetCarriers,
  renderedCarriers,
} from './lens-semantics-lib.mjs'

const WRITE = process.argv.includes('--write')
const CONTRACT_ROOT = join(ROOT, 'scripts/lens/contracts')
const CARRIER_UNIVERSE_PATH = join(CONTRACT_ROOT, 'carrier-universe.v1.json')

function fail(message) {
  throw new Error(`LENS-006 contract build: ${message}`)
}

function authoritativeCarriers() {
  const universe = JSON.parse(readFileSync(CARRIER_UNIVERSE_PATH, 'utf8'))
  const carriers = universe.carriers
  if (universe.contract_version !== 1 || universe.authority !== 'independent-exhaustive-carrier-universe') {
    fail('carrier universe has the wrong identity/version')
  }
  if (!Array.isArray(carriers) || new Set(carriers).size !== carriers.length
    || JSON.stringify(carriers) !== JSON.stringify([...carriers].sort())) {
    fail('carrier universe is not a unique sorted path set')
  }
  if (universe.carrier_count !== carriers.length || universe.set_sha256 !== carrierSetSha256(carriers)) {
    fail('carrier universe count/digest differs from its exhaustive path set')
  }
  const discovered = renderedCarriers(ROOT)
  if (JSON.stringify(discovered) !== JSON.stringify(carriers)) {
    const missing = carriers.filter((path) => !discovered.includes(path))
    const extra = discovered.filter((path) => !carriers.includes(path))
    fail(`rendered carriers differ from independent universe; missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`)
  }
  return { ...universe, carriers }
}

function canonCounts() {
  const source = readFileSync(join(ROOT, 'src/canon.generated.ts'), 'utf8')
  const result = {}
  for (const field of ['verbs', 'builtins', 'providers', 'extractModes', 'templates', 'mcpTools', 'errorCodes', 'errorNamespaces']) {
    const match = source.match(new RegExp(`\\b${field}: (\\d+)`))
    if (!match) fail(`CanonCount field missing: ${field}`)
    result[field] = Number(match[1])
  }
  return result
}

const COUNT_WAIVERS = new Map([
  [
    'content/blog/2026-07-11-the-pipeline-is-a-file.md|Three verbs',
    ['workflow-subset', 'the displayed workflow uses infer, exec, and invoke; it does not claim the language total'],
  ],
  [
    'src/components/codefile-tips.ts|1 verbs',
    ['section-coordinate', 'S.1 is the stable section coordinate for the verb register'],
  ],
  [
    'src/components/codefile-tips.ts|3 builtins',
    ['section-coordinate', 'S.3 is the stable section coordinate for the builtin register'],
  ],
  [
    'src/flagships/flagship-data.ts|two builtins',
    ['workflow-subset', 'the price-watch example intentionally uses two members of the builtin registry'],
  ],
  [
    'src/pages/Home.tsx|05 verbs',
    ['section-coordinate', '05 is the home-film chapter number, not the verb vocabulary size'],
  ],
  [
    'src/sections/Toolbelt.tsx|4 builtin',
    ['registry-partition', 'the presentation groups the full builtin registry into four editorial families'],
  ],
])

function countContract() {
  const canon = canonCounts()
  const universe = authoritativeCarriers()
  const carriers = universe.carriers
  const bindings = discoverCountClaims(ROOT, carriers).map((claim) => {
    let relation
    let reason
    if (claim.expression_field) {
      if (claim.expression_field !== claim.field) {
        fail(`${claim.selector} binds ${claim.field} to CANON.${claim.expression_field}`)
      }
      relation = 'canon-expression'
      reason = `runtime interpolation reads CANON.${claim.field}`
    } else if (claim.ordinal) {
      relation = 'ordinal-member'
      reason = `ordinal member reference is bounded by CANON.${claim.field}`
    } else if (claim.value === canon[claim.field]) {
      relation = 'canon-count'
      reason = `literal is gated against CANON.${claim.field}`
    } else if (claim.singular && claim.value === 1) {
      relation = 'registry-member'
      reason = `singular member reference is bounded by CANON.${claim.field}`
    } else {
      const waiver = COUNT_WAIVERS.get(`${claim.path}|${claim.text}`)
      if (!waiver) fail(`${claim.selector} is an unbound literal: ${claim.text}`)
      ;[relation, reason] = waiver
    }
    const { expression_field: expressionField, singular, ...binding } = claim
    return {
      ...binding,
      ...(expressionField ? { expression_field: expressionField } : {}),
      relation,
      reason,
    }
  })
  return {
    contract_version: 1,
    canon_source: 'src/canon.generated.ts',
    canon_fields: Object.keys(canon),
    carrier_census: {
      roots: universe.roots,
      exclusions: universe.exclusions,
      count: carriers.length,
      set_sha256: carrierSetSha256(carriers),
    },
    claim_count: bindings.length,
    bindings,
  }
}

function snippetContract() {
  const carriers = discoverSnippetCarriers(ROOT, authoritativeCarriers().carriers)
  if (WRITE) {
    for (const carrier of carriers) {
      const blob = execFileSync('git', ['hash-object', '-w', carrier.path], { cwd: ROOT, encoding: 'utf8' }).trim()
      if (blob !== carrier.source_blob) fail(`Git blob computation differs for ${carrier.path}`)
    }
  }
  return {
    contract_version: 1,
    registry: 'SNIPPET_REGISTRY',
    source_repository: 'supernovae-st/nika.sh',
    census: {
      roots: ['content/blog/*.md#fence', 'src/**/*.tsx#CodeFile', 'src/**/*.tsx#pre'],
      exclusions: ['content/blog/README.md', '*.test.*', '*.generated.*'],
      carrier_count: carriers.length,
      block_count: carriers.flatMap((carrier) => carrier.blocks).length,
    },
    carriers,
  }
}

const COMPONENT_FEATURE = {
  Home: 'site.home',
  Blog: 'site.blog',
  BlogPost: 'site.blog',
  Learn: 'product.learn',
  Play: 'product.playground',
  Manifesto: 'site.manifesto',
  Changelog: 'site.changelog',
  Errors: 'registry.errors',
  Tools: 'registry.builtins',
  ToolPage: 'registry.builtins',
  Verbs: 'registry.verbs',
  VerbPage: 'registry.verbs',
  Language: 'registry.language',
  WordPage: 'registry.language',
  Providers: 'registry.providers',
  Templates: 'registry.templates',
  Sitemap: 'site.sitemap',
  UseCasesPage: 'product.use_cases',
  Spec: 'site.spec',
  Install: 'product.install',
  Convert: 'product.convert',
  Brand: 'site.brand',
  NotFound: 'site.not_found',
}

const FEATURE_EVIDENCE = {
  'site.home': 'src/pages/Home.tsx',
  'site.blog': 'src/pages/Blog.tsx',
  'product.learn': 'src/pages/Learn.tsx',
  'product.playground': 'src/pages/Play.tsx',
  'site.manifesto': 'src/pages/Manifesto.tsx',
  'site.changelog': 'src/pages/Changelog.tsx',
  'registry.errors': 'src/pages/Errors.tsx',
  'registry.builtins': 'src/pages/Tools.tsx',
  'registry.verbs': 'src/pages/Verbs.tsx',
  'registry.language': 'src/pages/Language.tsx',
  'registry.providers': 'src/pages/Providers.tsx',
  'registry.templates': 'src/pages/Templates.tsx',
  'site.sitemap': 'src/pages/Sitemap.tsx',
  'product.use_cases': 'src/pages/UseCasesPage.tsx',
  'site.spec': 'src/pages/Spec.tsx',
  'product.install': 'src/pages/Install.tsx',
  'product.convert': 'src/pages/Convert.tsx',
  'site.brand': 'src/pages/Brand.tsx',
  'site.not_found': 'src/pages/NotFound.tsx',
}

function featureContract() {
  const universe = authoritativeCarriers()
  const expectedSources = ['react-ssg.config.ts', 'site.config.ts', 'src/routes.tsx']
  if (JSON.stringify(universe.feature_sources) !== JSON.stringify(expectedSources)) {
    fail('feature census source universe differs')
  }
  const routes = discoverRouteClaims(ROOT)
  const pages = discoverPrerenderClaims(ROOT)
  const claims = pages.map((page) => {
    const feature = COMPONENT_FEATURE[page.component]
    if (!feature) fail(`prerender component is absent from FEATURE_REGISTRY mapping: ${page.component}`)
    return { ...page, feature, presented_as: 'live' }
  })
  for (const route of routes.filter((entry) => entry.path !== '/*')) {
    if (!pages.some((page) => page.route_selector === route.selector)) {
      fail(`public route has no prerendered page: ${route.path}`)
    }
  }
  const liveFeatures = [...new Set(Object.values(COMPONENT_FEATURE))].sort().map((id) => ({
    id,
    status: 'live',
    evidence: [FEATURE_EVIDENCE[id]],
  }))
  return {
    contract_version: 1,
    registry: 'FEATURE_REGISTRY',
    allowed_status: ['shipped', 'live', 'experimental', 'deferred'],
    presentable_status: ['shipped', 'live'],
    route_source: 'src/routes.tsx',
    prerender_source: 'site.config.ts',
    prerender_consumer: 'react-ssg.config.ts',
    route_definition_count: routes.length,
    page_claim_count: claims.length,
    features: [
      ...liveFeatures,
      { id: 'lens.output_inventory', status: 'deferred', evidence: [] },
      { id: 'lens.normative_prose', status: 'deferred', evidence: [] },
      { id: 'lens.carrier_census', status: 'deferred', evidence: [] },
      { id: 'runtime.remote_play_execution', status: 'experimental', evidence: [] },
    ],
    claims,
  }
}

function emit(name, value) {
  const path = join(CONTRACT_ROOT, name)
  const bytes = `${JSON.stringify(value, null, 2)}\n`
  if (WRITE) {
    writeFileSync(path, bytes)
    console.log(`wrote ${name}`)
    return
  }
  if (!existsSync(path) || readFileSync(path, 'utf8') !== bytes) fail(`${name} is stale; run with --write`)
  console.log(`ok ${name}`)
}

emit('count-source.v1.json', countContract())
emit('snippets.v1.json', snippetContract())
emit('features.v1.json', featureContract())
