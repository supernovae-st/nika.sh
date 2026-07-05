import { existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import reactSsg from 'vite-plugin-react-ssg'
import { ORIGIN, PATHS, MANIFESTO_PATHS } from './site.config'

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
   closeBundle, AFTER public/ is copied and the routes are prerendered, so it
   overwrites the placeholder public/sitemap.xml with the derived, complete
   list. Home gets priority 1.0; the rest 0.7. `lastmod` = build date. */
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
      /* the manifesto's hreflang cluster · sitemap-level alternates (Google's
         recommended complement to the in-page <link> tags). URL slug → BCP 47. */
      const mfTag = (p: string) => {
        const seg = p.split('/')[1]
        return seg === 'pt-br' ? 'pt-BR' : seg === 'zh-hans' ? 'zh-Hans' : seg
      }
      const MF_ALL = ['/manifesto', ...MANIFESTO_PATHS]
      const mfLinks = [
        ...MF_ALL.map((mp) => {
          const tag = mp === '/manifesto' ? 'en' : mfTag(mp)
          return `    <xhtml:link rel="alternate" hreflang="${tag}" href="${ORIGIN}${mp}" />`
        }),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/manifesto" />`,
      ].join('\n')
      const urls = PATHS.map((p) => {
        const loc = p === '/' ? `${ORIGIN}/` : `${ORIGIN}${p}`
        const priority = p === '/' ? '1.0' : '0.7'
        const slug = p.startsWith('/blog/') ? p.slice('/blog/'.length) : null
        const lastmod = (slug && postDates.get(slug)) || buildDate
        const alternates = MF_ALL.includes(p) ? `\n${mfLinks}` : ''
        return (
          `  <url>\n` +
          `    <loc>${loc}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n` +
          `    <priority>${priority}</priority>${alternates}\n` +
          `  </url>`
        )
      }).join('\n')
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
      writeFileSync(join(outDir, 'sitemap.xml'), xml)
    },
  }
}

// https://vite.dev/config/
// reactSsg() prerenders each route to static HTML at build time (closeBundle):
// instant first paint + crawlable DOM, then the client hydrates (see main.tsx).
// Routes to prerender are declared in react-ssg.config.ts (project root).
export default defineConfig({
  plugins: [react(), tailwindcss(), reactSsg(), previewCleanUrls(), sitemap()],
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
