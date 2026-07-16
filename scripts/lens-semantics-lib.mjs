import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const CARDINAL_UNITS = new Map([
  ['zero', 0], ['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5],
  ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10],
  ['eleven', 11], ['twelve', 12], ['thirteen', 13], ['fourteen', 14],
  ['fifteen', 15], ['sixteen', 16], ['seventeen', 17], ['eighteen', 18],
  ['nineteen', 19],
])

const CARDINAL_TENS = new Map([
  ['twenty', 20], ['thirty', 30], ['forty', 40], ['fifty', 50],
  ['sixty', 60], ['seventy', 70], ['eighty', 80], ['ninety', 90],
])

const ORDINALS = new Map([
  ['first', 'one'], ['second', 'two'], ['third', 'three'], ['fourth', 'four'],
  ['fifth', 'five'], ['sixth', 'six'], ['seventh', 'seven'], ['eighth', 'eight'],
  ['ninth', 'nine'], ['tenth', 'ten'], ['eleventh', 'eleven'], ['twelfth', 'twelve'],
  ['thirteenth', 'thirteen'], ['fourteenth', 'fourteen'], ['fifteenth', 'fifteen'],
  ['sixteenth', 'sixteen'], ['seventeenth', 'seventeen'], ['eighteenth', 'eighteen'],
  ['nineteenth', 'nineteen'], ['twentieth', 'twenty'], ['thirtieth', 'thirty'],
  ['fortieth', 'forty'], ['fiftieth', 'fifty'], ['sixtieth', 'sixty'],
  ['seventieth', 'seventy'], ['eightieth', 'eighty'], ['ninetieth', 'ninety'],
  ['hundredth', 'hundred'], ['thousandth', 'thousand'], ['millionth', 'million'],
])

const NUMBER_WORDS = new Set([
  ...CARDINAL_UNITS.keys(), ...CARDINAL_TENS.keys(), ...ORDINALS.keys(),
  'hundred', 'thousand', 'million', 'and',
])

const COUNT_NOUNS = new Map([
  ['verb', 'verbs'], ['verbs', 'verbs'],
  ['builtin', 'builtins'], ['builtins', 'builtins'],
  ['provider', 'providers'], ['providers', 'providers'],
  ['extract mode', 'extractModes'], ['extract modes', 'extractModes'],
  ['extraction mode', 'extractModes'], ['extraction modes', 'extractModes'],
  ['template', 'templates'], ['templates', 'templates'],
  ['mcp tool', 'mcpTools'], ['mcp tools', 'mcpTools'],
  ['error code', 'errorCodes'], ['error codes', 'errorCodes'],
  ['error namespace', 'errorNamespaces'], ['error namespaces', 'errorNamespaces'],
])

const COUNT_NOUN_PATTERN = /(verbs?|builtins?|providers?|extract(?:ion)?\s+modes?|templates?|MCP\s+tools?|error\s+codes?|error\s+namespaces?)\b/gi

export function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function gitBlobId(bytes) {
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex')
}

function walk(root, directory, accept) {
  const out = []
  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) out.push(...walk(root, path, accept))
    else if (accept(path)) out.push(path.split(sep).join('/'))
  }
  return out
}

export function renderedCarriers(root) {
  const source = walk(root, 'src', (path) => {
    if (!/\.(?:ts|tsx)$/.test(path)) return false
    return !path.includes('.generated.') && !path.includes('.test.') && !path.startsWith('src/test/')
  })
  const posts = walk(root, 'content/blog', (path) => path.endsWith('.md') && !path.endsWith('/README.md'))
  return [...source, ...posts, 'public/llms.txt'].sort()
}

export function carrierSetSha256(paths) {
  return sha256Bytes(Buffer.from(`${[...paths].sort().join('\n')}\n`))
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length
}

function parseNumberPhrase(source) {
  const numeric = source.match(/^(\d+)(st|nd|rd|th)?$/i)
  if (numeric) return { value: Number(numeric[1]), ordinal: Boolean(numeric[2]) }
  const raw = source.toLowerCase().split(/[\s-]+/).filter(Boolean)
  if (raw.length === 0 || raw.some((word) => !NUMBER_WORDS.has(word))) return null
  let ordinal = false
  const words = raw.map((word) => {
    if (!ORDINALS.has(word)) return word
    ordinal = true
    return ORDINALS.get(word)
  }).filter((word) => word !== 'and')
  if (words.length === 0) return null
  let total = 0
  let current = 0
  for (const word of words) {
    if (CARDINAL_UNITS.has(word)) current += CARDINAL_UNITS.get(word)
    else if (CARDINAL_TENS.has(word)) current += CARDINAL_TENS.get(word)
    else if (word === 'hundred') current = (current || 1) * 100
    else if (word === 'thousand' || word === 'million') {
      total += (current || 1) * (word === 'thousand' ? 1_000 : 1_000_000)
      current = 0
    } else return null
  }
  return { value: total + current, ordinal }
}

function expressionField(source) {
  return source.match(/^\$\{CANON\.([A-Za-z]+)\}$/)?.[1]
}

export function discoverCountClaimsInText(path, text) {
  const claims = []
  let ordinal = 0
  for (const nounMatch of text.matchAll(COUNT_NOUN_PATTERN)) {
    const prefixStart = Math.max(0, nounMatch.index - 120)
    const prefix = text.slice(prefixStart, nounMatch.index)
    const expression = prefix.match(/\$\{CANON\.([A-Za-z]+)\}\s*$/)
    let source
    let parsed
    let sourceIndex
    if (expression) {
      source = expression[0].trim()
      parsed = { value: null, ordinal: false }
      sourceIndex = nounMatch.index - expression[0].length + expression[0].search(/\S/)
    } else {
      const numeric = prefix.match(/\b\d+(?:st|nd|rd|th)?\s*$/i)
      if (numeric) {
        source = numeric[0].trim()
        parsed = parseNumberPhrase(source)
        sourceIndex = nounMatch.index - numeric[0].length + numeric[0].search(/\S/)
      } else {
        const tail = prefix.match(/[A-Za-z]+(?:[\s-]+[A-Za-z]+){0,11}\s*$/)?.[0]
        if (!tail) continue
        const tailWords = tail.trim().split(/\s+/)
        for (let start = 0; start < tailWords.length; start += 1) {
          const candidate = tailWords.slice(start).join(' ')
          const candidateParsed = parseNumberPhrase(candidate)
          if (!candidateParsed) continue
          source = candidate
          parsed = candidateParsed
          const candidateOffset = tail.indexOf(tailWords[start])
          sourceIndex = nounMatch.index - tail.length + candidateOffset
          break
        }
      }
    }
    if (!source || !parsed) continue
    ordinal += 1
    const noun = nounMatch[1].toLowerCase().replace(/\s+/g, ' ')
    claims.push({
      selector: `${path}#count:${ordinal}`,
      path,
      line: lineAt(text, sourceIndex),
      text: `${source} ${nounMatch[0]}`.replace(/\s+/g, ' '),
      source,
      field: COUNT_NOUNS.get(noun),
      value: parsed.value,
      expression_field: expressionField(source),
      ordinal: parsed.ordinal,
      singular: !noun.endsWith('s'),
    })
  }
  return claims
}

export function discoverCountClaims(root, paths = renderedCarriers(root)) {
  return paths.flatMap((path) => discoverCountClaimsInText(path, readFileSync(join(root, path), 'utf8')))
}

function markdownBlocks(path, text) {
  const out = []
  const fence = /^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm
  let ordinal = 0
  for (const match of text.matchAll(fence)) {
    ordinal += 1
    out.push({
      selector: `${path}#fence:${ordinal}`,
      kind: 'markdown-fence',
      line: lineAt(text, match.index),
      language: match[1].trim().split(/\s+/)[0] || 'text',
      sha256: sha256Bytes(Buffer.from(match[0])),
    })
  }
  return out
}

function jsxBlocks(path, text) {
  const out = []
  for (const [tag, kind] of [['CodeFile', 'codefile'], ['pre', 'pre']]) {
    const pattern = new RegExp(`<${tag}\\b`, 'g')
    let ordinal = 0
    for (const match of text.matchAll(pattern)) {
      ordinal += 1
      const end = text.indexOf('\n', match.index)
      const selectorLine = text.slice(match.index, end < 0 ? text.length : end)
      out.push({
        selector: `${path}#${kind}:${ordinal}`,
        kind: `jsx-${kind}`,
        line: lineAt(text, match.index),
        // The complete carrier bytes are Git-blob bound. This local digest
        // makes the selector line itself explicit without attempting to parse
        // arbitrary nested JSX expressions in a dependency-free gate.
        sha256: sha256Bytes(Buffer.from(selectorLine)),
      })
    }
  }
  return out.sort((a, b) => a.line - b.line || a.selector.localeCompare(b.selector))
}

export function discoverSnippetCarriers(root) {
  const paths = [
    ...walk(root, 'content/blog', (path) => path.endsWith('.md') && !path.endsWith('/README.md')),
    ...walk(root, 'src', (path) => path.endsWith('.tsx') && !path.includes('.test.') && !path.includes('.generated.')),
  ].sort()
  const carriers = []
  for (const path of paths) {
    const bytes = readFileSync(join(root, path))
    const text = bytes.toString('utf8')
    const blocks = path.endsWith('.md') ? markdownBlocks(path, text) : jsxBlocks(path, text)
    if (blocks.length > 0) carriers.push({ path, source_blob: gitBlobId(bytes), blocks })
  }
  return carriers
}

export function flattenSnippetBlocks(carriers) {
  return carriers.flatMap((carrier) => carrier.blocks.map((block) => ({ path: carrier.path, ...block })))
}

export function discoverRouteClaims(root) {
  const path = 'src/routes.tsx'
  const text = readFileSync(join(root, path), 'utf8')
  const claims = []
  const route = /\{\s*(index:\s*true|path:\s*'([^']+)')\s*,\s*Component:\s*([A-Za-z0-9_]+)\s*\}/g
  for (const match of text.matchAll(route)) {
    const routePath = match[1].startsWith('index:') ? '/' : `/${match[2]}`
    claims.push({
      selector: `${path}#route:${claims.length + 1}`,
      path: routePath,
      component: match[3],
      line: lineAt(text, match.index),
    })
  }
  return claims
}

function literalArray(source, name) {
  const match = source.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\]`))
  if (!match) throw new Error(`static path array missing: ${name}`)
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1])
}

export function discoverPrerenderPaths(root) {
  const source = readFileSync(join(root, 'site.config.ts'), 'utf8')
  const arrays = new Map()
  for (const name of [
    'BLOG_PATHS', 'MANIFESTO_PATHS', 'ERROR_PATHS', 'TOOL_PATHS',
    'PROVIDER_PATHS', 'VERB_PATHS', 'LANGUAGE_PATHS', 'TEMPLATE_PATHS',
  ]) arrays.set(name, literalArray(source, name))
  const expression = source.match(/export const PATHS = \[([^\n]+)\]/)?.[1]
  if (!expression) throw new Error('PATHS expression missing from site.config.ts')
  const paths = []
  for (const token of expression.split(',').map((entry) => entry.trim()).filter(Boolean)) {
    const literal = token.match(/^'([^']+)'$/)?.[1]
    if (literal) paths.push(literal)
    else if (token.startsWith('...') && arrays.has(token.slice(3))) paths.push(...arrays.get(token.slice(3)))
    else throw new Error(`unsupported PATHS token: ${token}`)
  }
  if (new Set(paths).size !== paths.length) throw new Error('duplicate prerender path in site.config.ts')
  return paths
}

function routeMatches(pattern, path) {
  if (pattern === path) return true
  if (!pattern.includes(':')) return false
  const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[^/]+/g, '[^/]+')}$`)
  return regex.test(path)
}

export function discoverPrerenderClaims(root) {
  const routes = discoverRouteClaims(root).filter((route) => route.path !== '/*')
  return discoverPrerenderPaths(root).map((path, index) => {
    const matches = routes.filter((route) => routeMatches(route.path, path))
    if (matches.length !== 1) throw new Error(`prerender path resolves to ${matches.length} routes: ${path}`)
    return {
      selector: `site.config.ts#page:${index + 1}`,
      path,
      route_selector: matches[0].selector,
      component: matches[0].component,
    }
  })
}

export function relativePath(root, path) {
  return relative(root, path).split(sep).join('/')
}
