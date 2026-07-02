/* ─── shared static-site constants (no deps, no JSX) ─────────────────────────
   The single source of truth for the canonical origin + the static route paths.
   Imported by BOTH react-ssg.config.ts (prerender: one index.html per path) and
   vite.config.ts (the sitemap plugin derives dist/sitemap.xml from PATHS). Kept
   JSX-free + import-free so it loads cleanly in the Node config program (tsc's
   tsconfig.node.json) without dragging src/routes.tsx into it.

   Add a new static route in src/routes.tsx AND here — both the prerender and the
   sitemap pick it up with zero extra wiring. */

/* the canonical site origin (matches src/content.ts SITE). */
export const ORIGIN = 'https://nika.sh'

/* which static paths exist · drives the prerender AND the sitemap. */
export const PATHS = ['/', '/blog', '/learn', '/play', '/manifesto', '/changelog', '/use-cases', '/spec', '/install']
