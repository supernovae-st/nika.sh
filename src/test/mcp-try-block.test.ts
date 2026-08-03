/* ─── the MCP try-it block · the taught file must be the checkable file ──────
   The 105 server rooms teach ONE builder (mcpTryBlock). This gate judges it
   the way the binary would: parse as YAML, validate against the PINNED
   schema (public/schema/workflow.json — the spec at the resync pin), and
   hold the three grammar facts the 2026-08-03 audit fixed:
     · `invoke:` takes a MAPPING (a bare string parse-fails)
     · the tool ref separator is `/` (`mcp:<server>.<tool>` is refused by
       the binary with `expected mcp:<server>/<tool>`)
     · the grant lives in permits.tools with the FULL ref (permits.mcp is
       not a field — the fields are fs · net · exec · tools · env)
   The oracle returned `✔ clean` on this exact shape with a real ref. */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { mcpTryBlock } from '../pages/mcp-try-block'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pinSchema = JSON.parse(
  readFileSync(join(__dirname, '../../public/schema/workflow.json'), 'utf8'),
) as object
const ajv = new Ajv2020({ strict: false, validateFormats: false, allowUnionTypes: true })
const validate = ajv.compile(pinSchema)

/* ahrefs IS in the vendored registry (verified against catalog.generated) ·
   a plausible tool name stands in for the placeholder — the shape under
   judgment is the builder's, the ref only has to ride the grammar */
const concrete = mcpTryBlock('ahrefs', 'ahrefs').replaceAll('<tool>', 'keywords_explorer')

describe('mcp try-block · the taught file is the checkable file', () => {
  it('parses and validates against the pinned workflow schema', () => {
    const doc = parse(concrete) as Record<string, unknown>
    const ok = validate(doc)
    expect(ok, JSON.stringify(validate.errors ?? [], null, 1)).toBe(true)
  })

  it('invoke is a mapping whose tool ref rides the slash, never the dot', () => {
    const doc = parse(concrete) as {
      tasks: Record<string, { invoke: unknown }>
    }
    const invoke = doc.tasks.work.invoke as Record<string, unknown>
    expect(typeof invoke, 'invoke body must be a YAML mapping').toBe('object')
    expect(invoke.tool).toBe('mcp:ahrefs/keywords_explorer')
    expect(String(invoke.tool)).not.toMatch(/^mcp:[a-z0-9-]+\./)
  })

  it('the grant lives in permits.tools with the full ref · permits.mcp stays dead', () => {
    const doc = parse(concrete) as { permits: Record<string, unknown> }
    expect(doc.permits.tools).toEqual(['mcp:ahrefs/keywords_explorer'])
    expect('mcp' in doc.permits, 'permits.mcp is not a field the engine knows').toBe(false)
  })
})
