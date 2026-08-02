/* ─── prerender-coverage · every declared route really became a file ──────────
   The prerenderer FALLS BACK to client-side rendering when a page throws, and
   it does so with a warning and exit 0. On 2026-08-02 /language rendered a
   family by a key that had moved, threw, and shipped CSR-only — invisible to
   every crawler and to no-JS readers, with a green build. That is the blind
   belt class: a check whose failure mode is silence.

   This asserts the whole contract instead: every path in PATHS has an
   index.html in dist, and it carries real prerendered markup rather than the
   empty CSR shell. Runs in postbuild, so `pnpm build` can no longer be green
   while a page is missing.

   Run: node scripts/prerender-coverage.mjs */
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverPrerenderPaths } from './lens-semantics-lib.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

const paths = discoverPrerenderPaths(ROOT)
if (paths.length < 500) {
  console.error(`✗ prerender coverage: only ${paths.length} paths discovered — the census is broken`)
  process.exit(5)
}

const missing = []
const hollow = []
for (const p of paths) {
  const file = join(DIST, p === '/' ? 'index.html' : `${p.slice(1)}/index.html`)
  if (!existsSync(file)) {
    missing.push(p)
    continue
  }
  /* a CSR fallback ships the shell: <div id="root"></div> with nothing in it.
     A prerendered page always carries its own <main>. */
  const html = readFileSync(file, 'utf8')
  if (!html.includes('<main') && !html.includes('<article')) hollow.push(p)
}

if (missing.length || hollow.length) {
  if (missing.length) console.error(`✗ ${missing.length} route(s) produced NO file:\n  ${missing.slice(0, 20).join('\n  ')}`)
  if (hollow.length)
    console.error(
      `✗ ${hollow.length} route(s) shipped the CSR shell (the prerender threw and fell back):\n  ${hollow.slice(0, 20).join('\n  ')}`,
    )
  process.exit(5)
}
console.log(`✓ prerender coverage · ${paths.length} routes, every one a real page`)
