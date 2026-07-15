import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PATHS } from '../../site.config'

/* ── the llms.txt URL-integrity gate ──────────────────────────────────────────
   llms.txt is the agent-facing map of the site — and the one surface whose
   LINKS had no gate: the counts gate (llms.test.ts) pins figures, e2e-sweep
   pins every <a> on rendered pages, but a nika.sh URL typed into llms.txt
   (…/templates · …/tools/catalog.json) could 404 silently after a rename.

   The gate: every https://nika.sh/<path> the file cites must be either a
   prerendered route (site.config PATHS) or a real file under public/.
   Fragment URLs check their base route. Anything else goes red HERE,
   never dead for the crawlers the file exists to serve. */

const ROOT = join(__dirname, '../..')
const llms = readFileSync(join(ROOT, 'public/llms.txt'), 'utf8')

describe('/llms.txt · every nika.sh URL it cites resolves', () => {
  const urls = [...llms.matchAll(/https:\/\/nika\.sh(\/[^\s)»›"'·]*)/g)]
    .map((m) => m[1].replace(/[.,;:]+$/, ''))
    /* a bare-# tail is an RDF NAMESPACE URI (icons.ttl declares one), a
       semantic identifier — not a fetchable page */
    .filter((p) => p !== '/' && !p.endsWith('#'))

  it('cites at least the register surfaces (the sweep is not vacuous)', () => {
    expect(urls.length).toBeGreaterThan(8)
  })

  it.each([...new Set(urls)])('%s exists (route or public file)', (path) => {
    const base = path.split('#')[0]
    const isRoute = PATHS.includes(base)
    const isPublicFile =
      /\.[a-z0-9]+$/i.test(base) && existsSync(join(ROOT, 'public', ...base.slice(1).split('/')))
    /* served icon catalog pattern — a directory of generated files */
    const isIconPattern = base.startsWith('/brand/icons/')
    /* build-derived live contracts — written at closeBundle (vite.config
       sitemap plugin), never committed; presence in dist/ is enforced by
       gate.yml's live-URL contract step on every push */
    const isBuildDerived = base === '/sitemap.xml'
    expect(
      isRoute || isPublicFile || isIconPattern || isBuildDerived,
      `${path} is neither a prerendered route nor a public/ file`,
    ).toBe(true)
  })
})
