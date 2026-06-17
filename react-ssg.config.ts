import { defineReactSsgConfig } from 'vite-plugin-react-ssg'
import { routes } from './src/routes'

/* ─── build-time prerender config · vite-plugin-react-ssg (route mode) ────────
   The route table in src/routes.tsx is the single source of truth; the plugin
   discovers the static paths from it and prerenders each to its own index.html
   (dist/index.html, dist/blog/index.html, …) using React Router's static
   handler. `paths` lists them explicitly too — a belt-and-suspenders guard so a
   route never silently drops from the build. Add new static routes here AND in
   src/routes.tsx when Phase 4 lands /spec /changelog /use-cases.

   `origin` is the canonical site URL — used when a loader needs an absolute URL
   (none today, but it keeps prerender requests well-formed). */

export default defineReactSsgConfig({
  history: 'browser',
  origin: 'https://nika.sh',
  routes,
  paths: ['/', '/blog', '/learn', '/play', '/manifesto', '/changelog', '/use-cases'],
})
