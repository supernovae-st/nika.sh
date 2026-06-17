import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import reactSsg from 'vite-plugin-react-ssg'

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

// https://vite.dev/config/
// reactSsg() prerenders each route to static HTML at build time (closeBundle):
// instant first paint + crawlable DOM, then the client hydrates (see main.tsx).
// Routes to prerender are declared in react-ssg.config.ts (project root).
export default defineConfig({
  plugins: [react(), tailwindcss(), reactSsg(), previewCleanUrls()],
})
