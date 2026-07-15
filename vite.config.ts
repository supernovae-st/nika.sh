import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import reactSsg from 'vite-plugin-react-ssg'
import { ORIGIN, PATHS } from './site.config'
import { hreflangLinks, localeOf } from './src/lib/i18n'

/* ─── preview clean-URL resolver ─────────────────────────────────────────────
   `vite preview` serves the SPA fallback (dist/index.html) for an extension-less
   path like `/blog`, so the browser would hydrate the Home shell with the Blog
   component → a guaranteed text/HTML mismatch (React #418). Production does NOT
   do this: DigitalOcean App Platform (and every CDN-style static host) resolves
   a clean URL `/blog` to its prerendered `/blog/index.html` BEFORE the catchall.
   This plugin makes `pnpm preview` faithful to that prod behaviour — it rewrites
   `/blog` → `/blog/index.html` when the prerendered file exists, so each route
   hydrates against its OWN HTML and `pnpm preview` is hydration-clean. */
function previewCleanUrls(): Plugin {
  return {
    name: 'preview-clean-urls',
    configurePreviewServer(server) {
      const outDir = server.config.build.outDir
      server.middlewares.use((req, _res, next) => {
        const url = req.url
        if (url && (req.method === 'GET' || req.method === 'HEAD')) {
          const path = url.split('?')[0].split('#')[0]
          // only bare, extension-less route paths (skip assets + the root)
          if (path.length > 1 && !path.includes('.')) {
            const clean = path.replace(/\/+$/, '')
            const candidate = join(outDir, clean, 'index.html')
            if (existsSync(candidate)) {
              req.url = `${clean}/index.html${url.slice(path.length)}`
            }
          }
        }
        next()
      })
    },
  }
}

/* ─── sitemap.xml generator ──────────────────────────────────────────────────
   Derives dist/sitemap.xml from the SAME `PATHS` array that drives the
   prerender (react-ssg.config.ts) — one source of truth, so the sitemap can
   never list a route that doesn't ship (or miss one that does). Runs in
   closeBundle, AFTER public/ is copied and the routes are prerendered, and
   writes dist/sitemap.xml as the ONLY copy — a committed placeholder rotted
   daily (lastmod = build date) with zero consumers, so none exists. Home gets priority 1.0; the rest 0.7. `lastmod` = build date. */
function sitemap(): Plugin {
  let outDir = 'dist'
  return {
    name: 'sitemap-xml',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const buildDate = new Date().toISOString().slice(0, 10)
      /* posts carry their REAL date (content truth beats build date); the
         generated module is the source (regex, not import — vite.config must
         not join the app graph). */
      const gen = readFileSync('src/content/blog.generated.ts', 'utf8')
      const postDates = new Map(
        [...gen.matchAll(/"slug": "([^"]+)"[\s\S]*?"date": "([^"]+)"/g)].map((m) => [m[1], m[2]]),
      )
      /* hreflang clusters · sitemap-level alternates (Google's recommended
         complement to the in-page <link> tags). GENERAL since WO-9a: the
         cluster is DERIVED from what PATHS serves (src/lib/i18n seam — the
         anti-slop law §4bis), so a page gains its alternates the day its
         locale route ships, and never before. Today that is the manifesto
         family; L1 pages join at WO-10 with zero edits here. */
      const clusterFor = (p: string) => {
        const links = hreflangLinks(p)
        if (links.length === 0) return ''
        return (
          '\n' +
          links
            .map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${ORIGIN}${l.href}" />`)
            .join('\n')
        )
      }
      /* class-aware tiers — the crawler reads intent, not one flat 0.7:
         home 1.0/weekly · the doors (every top-level page) 0.8/weekly ·
         posts 0.6/monthly on their REAL date · manifesto locale variants
         0.6/monthly (the EN door carries the family) · register deep rows
         (errors/tools/verbs/language/providers/templates — dense stable
         reference, not news) 0.5/monthly. */
      const tier = (p: string): { priority: string; changefreq: string } => {
        if (p === '/') return { priority: '1.0', changefreq: 'weekly' }
        if (p.startsWith('/blog/')) return { priority: '0.6', changefreq: 'monthly' }
        if (/^\/(errors|tools|verbs|language|providers|templates)\/.+/.test(p))
          return { priority: '0.5', changefreq: 'monthly' }
        if (localeOf(p).prefix) return { priority: '0.6', changefreq: 'monthly' }
        return { priority: '0.8', changefreq: 'weekly' }
      }
      const urls = PATHS.map((p) => {
        const loc = p === '/' ? `${ORIGIN}/` : `${ORIGIN}${p}`
        const { priority, changefreq } = tier(p)
        const slug = p.startsWith('/blog/') ? p.slice('/blog/'.length) : null
        const lastmod = (slug && postDates.get(slug)) || buildDate
        const alternates = clusterFor(p)
        return (
          `  <url>\n` +
          `    <loc>${loc}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${changefreq}</changefreq>\n` +
          `    <priority>${priority}</priority>${alternates}\n` +
          `  </url>`
        )
      }).join('\n')
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
      writeFileSync(join(outDir, 'sitemap.xml'), xml)
    },
  }
}

/* ─── DefinedTermSet JSON-LD injector (WO-7a) ─────────────────────────────────
   The compiler's jsonld.generated.ts carries one DefinedTermSet per atlas
   page ("Pages mount these at WO-7"). Every route is SYNC-prerendered, so a
   runtime import would drag the ~80K corpus into the initial chunk (the
   bundle-derive law); JSON-LD only has value in the STATIC html (crawlers
   never client-navigate) — so it lands POST-BUILD, straight into each
   page's prerendered <head>. Zero bundle bytes, zero hydration surface
   (React's walker hydrates #app; a static head script is inert to it).
   The hubs (/flow /boundary /proof) are the named exception: they derive
   the same sets in useHubHead (gate-pinned to this twin) — skipped here.
   A twin page with no dist file (unborn room, e.g. /sources pre-birth) is
   skipped BY NAME in the build log, never a silent hole. */
function jsonldTermsets(): Plugin {
  let outDir = 'dist'
  const HUB_MOUNTED = new Set(['/flow', '/boundary', '/proof'])
  return {
    name: 'jsonld-termsets',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      /* regex-slice, not import — vite.config must not join the app graph
         (the blog.generated precedent); the payload is pure JSON.stringify */
      const gen = readFileSync('src/content/jsonld.generated.ts', 'utf8')
      const m = gen.match(/= (\{[\s\S]*\})\n$/)
      if (!m) throw new Error('jsonld-termsets: cannot slice JSONLD_TERMSETS')
      const termsets = JSON.parse(m[1]) as Record<string, unknown[]>
      let injected = 0
      for (const [page, sets] of Object.entries(termsets)) {
        if (HUB_MOUNTED.has(page) || sets.length === 0) continue
        const file = join(outDir, page.slice(1), 'index.html')
        if (!existsSync(file)) {
          console.log(`  jsonld-termsets: ${page} has no prerendered page yet — skipped`)
          continue
        }
        const html = readFileSync(file, 'utf8')
        const script = `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': sets,
        })}</script>`
        if (!html.includes('</head>')) throw new Error(`jsonld-termsets: ${page} has no </head>`)
        writeFileSync(file, html.replace('</head>', `${script}</head>`))
        injected++
      }
      console.log(`  jsonld-termsets: ${injected} page(s) carry their DefinedTermSets`)
    },
  }
}

// https://vite.dev/config/
// reactSsg() prerenders each route to static HTML at build time (closeBundle):
// instant first paint + crawlable DOM, then the client hydrates (see main.tsx).
// Routes to prerender are declared in react-ssg.config.ts (project root).
export default defineConfig({
  plugins: [react(), tailwindcss(), reactSsg(), previewCleanUrls(), sitemap(), jsonldTermsets()],
  build: {
    // Vite 8 / Rolldown declarative chunking (NOT the deprecated manualChunks fn).
    // Pull the React runtime (react / react-dom / react-router / scheduler) into
    // one stable `react-vendor` chunk so a copy change doesn't bust its hash —
    // better long-term caching, no behaviour change.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
