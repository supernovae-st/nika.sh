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
  ['read-only tool', 'mcpTools'], ['read-only tools', 'mcpTools'],
  ['error code', 'errorCodes'], ['error codes', 'errorCodes'],
  ['error namespace', 'errorNamespaces'], ['error namespaces', 'errorNamespaces'],
])

const COUNT_NOUN_PATTERN = /(verbs?|builtins?|providers?|extract(?:ion)?\s+modes?|templates?|MCP\s+tools?|read-only\s+tools?|error\s+codes?|error\s+namespaces?)\b/gi

const PUBLIC_TEXT = /\.(?:css|html|json|md|sh|svg|ttl|txt|webmanifest|xml|ya?ml)$/
const PROJECTION_SOURCES = ['scripts/build-blog.mjs', 'scripts/build-og-card.mjs']

function cssContentDeclarations(text) {
  const declarations = []
  const boundary = (character) => !character || !/[A-Za-z0-9_-]/.test(character)
  let index = 0
  while (index < text.length) {
    if (text.startsWith('/*', index)) {
      const end = text.indexOf('*/', index + 2)
      index = end < 0 ? text.length : end + 2
      continue
    }
    const quote = text[index]
    if (quote === "'" || quote === '"') {
      index += 1
      while (index < text.length && text[index] !== quote) {
        index += text[index] === '\\' ? 2 : 1
      }
      index += 1
      continue
    }
    if (text.startsWith('content', index) && boundary(text[index - 1]) && boundary(text[index + 7])) {
      let cursor = index + 7
      while (/\s/.test(text[cursor] ?? '')) cursor += 1
      if (text[cursor] === ':') {
        const start = cursor + 1
        cursor = start
        let depth = 0
        while (cursor < text.length) {
          if (text.startsWith('/*', cursor)) {
            const end = text.indexOf('*/', cursor + 2)
            cursor = end < 0 ? text.length : end + 2
            continue
          }
          const valueQuote = text[cursor]
          if (valueQuote === "'" || valueQuote === '"') {
            cursor += 1
            while (cursor < text.length && text[cursor] !== valueQuote) {
              cursor += text[cursor] === '\\' ? 2 : 1
            }
            cursor += 1
            continue
          }
          if (text[cursor] === '(') depth += 1
          else if (text[cursor] === ')') depth = Math.max(0, depth - 1)
          else if (depth === 0 && (text[cursor] === ';' || text[cursor] === '}')) break
          cursor += 1
        }
        declarations.push({
          line: lineAt(text, index),
          value: text.slice(start, cursor).trim(),
        })
        index = cursor + 1
        continue
      }
    }
    index += 1
  }
  return declarations
}

function decodeCssEscape(source, index) {
  const next = source[index + 1]
  if (next === '\n' || next === '\r' || next === '\f') return { value: '', next: index + 2 }
  const hex = source.slice(index + 1).match(/^[0-9a-f]{1,6}/i)?.[0]
  if (hex) {
    let nextIndex = index + 1 + hex.length
    if (/\s/.test(source[nextIndex] ?? '')) nextIndex += 1
    const point = Number.parseInt(hex, 16)
    return { value: point === 0 || point > 0x10ffff ? '\uFFFD' : String.fromCodePoint(point), next: nextIndex }
  }
  return { value: next ?? '', next: Math.min(source.length, index + 2) }
}

function cssValueInventory(value) {
  const literals = []
  let unquoted = ''
  let index = 0
  while (index < value.length) {
    const quote = value[index]
    if (quote !== "'" && quote !== '"') {
      unquoted += quote
      index += 1
      continue
    }
    let decoded = ''
    index += 1
    while (index < value.length && value[index] !== quote) {
      if (value[index] === '\\') {
        const escape = decodeCssEscape(value, index)
        decoded += escape.value
        index = escape.next
      } else {
        decoded += value[index]
        index += 1
      }
    }
    if (value[index] === quote) index += 1
    literals.push(decoded)
    unquoted += ' '
  }
  const expressions = [...unquoted.matchAll(/\b([a-z-]+)\s*\(([^()]*)\)/gi)]
    .map((match) => `${match[1].toLowerCase()}(${match[2].trim().replace(/\s+/g, ' ')})`)
  return { literals, expressions }
}

export function cssContentInventory(root, paths = renderedCarriers(root).filter((path) => path.endsWith('.css'))) {
  const declarations = []
  for (const path of paths) {
    const text = readFileSync(join(root, path), 'utf8')
    for (const [ordinal, declaration] of cssContentDeclarations(text).entries()) {
      const inventory = cssValueInventory(declaration.value)
      declarations.push({
        selector: `${path}#css-content:${ordinal + 1}`,
        path,
        line: declaration.line,
        value: declaration.value,
        ...inventory,
      })
    }
  }
  const literals = [...new Set(declarations.flatMap((entry) => entry.literals))].sort()
  const dynamic_expressions = [...new Set(declarations.flatMap((entry) => entry.expressions))].sort()
  const count_claims = declarations.flatMap((entry) => {
    const visible = entry.literals.join(' ')
    return discoverCountClaimsInText(entry.path, visible).map((claim) => ({
      selector: entry.selector,
      path: entry.path,
      line: entry.line,
      text: claim.text,
      field: claim.field,
      value: claim.value,
    }))
  })
  return { literals, dynamic_expressions, count_claims }
}

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
    if (entry.isSymbolicLink()) throw new Error(`rendered carrier is a symlink: ${path}`)
    if (entry.isDirectory()) out.push(...walk(root, path, accept))
    else if (accept(path)) out.push(path.split(sep).join('/'))
  }
  return out
}

export function renderedCarriers(root) {
  const source = walk(root, 'src', (path) => {
    if (!/\.(?:css|ts|tsx)$/.test(path)) return false
    return !path.includes('.test.') && !path.startsWith('src/test/')
  })
  const posts = walk(root, 'content/blog', (path) => path.endsWith('.md') && !path.endsWith('/README.md'))
  const publicText = walk(root, 'public', (path) => PUBLIC_TEXT.test(path))
  return [...new Set([...source, ...posts, ...publicText, ...PROJECTION_SOURCES])].sort()
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

export function discoverSnippetCarriers(root, carrierUniverse = renderedCarriers(root)) {
  const paths = carrierUniverse.filter((path) => (
    (path.startsWith('content/blog/') && path.endsWith('.md'))
    || (path.startsWith('src/') && path.endsWith('.tsx'))
  ))
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
    'BLOG_PATHS', 'MANIFESTO_PATHS', 'INSTALL_PATHS', 'ERROR_PATHS', 'TOOL_PATHS',
    'PROVIDER_PATHS', 'VERB_PATHS', 'LANGUAGE_PATHS', 'TEMPLATE_PATHS',
    'ATLAS_PATHS',
  ]) {
    // A registry page can fuse away (its path array leaves the file with it);
    // only arrays still declared join the map — an unknown SPREAD stays fatal.
    if (new RegExp(`export const ${name} = \\[`).test(source)) {
      arrays.set(name, literalArray(source, name))
    }
  }
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
