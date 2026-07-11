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

/* which static paths exist · drives the prerender AND the sitemap.
   BLOG_PATHS mirrors content/blog/*.md slugs — kept literal (this file stays
   import-free); the vitest drift gate (blog.test.ts) fails when a post and
   this list disagree. */
export const BLOG_PATHS = [
  '/blog/the-pipeline-is-a-file',
  '/blog/the-mcp-server-you-didnt-build',
  '/blog/the-chain-of-custody',
  '/blog/the-local-forecast',
  '/blog/written-by-agents',
  '/blog/the-one-task-rerun',
  '/blog/the-run-that-waits',
  '/blog/the-resume-story',
  '/blog/prompts-are-code',
  '/blog/injection-goes-nowhere',
  '/blog/time-travel-for-real',
  '/blog/the-run-becomes-evidence',
  '/blog/the-editor-tells-the-truth',
  '/blog/the-credentials-your-pipeline-breaks',
  '/blog/one-wire-five-servers',
  '/blog/media-are-workflow-citizens',
  '/blog/the-secrets-line',
  '/blog/the-cost-line',
  '/blog/anatomy-of-a-verb',
  '/blog/the-trace-you-can-replay',
  '/blog/own-your-stack',
  '/blog/starting-over-on-purpose',
  '/blog/naming-the-drum',
  '/blog/the-note-that-started-it',
  '/blog/dag-for-free',
  '/blog/four-verbs',
  '/blog/intent-as-code',
  '/blog/blast-radius-in-the-file',
  '/blog/standard-library-not-plugin-store',
  '/blog/open-spec-copyleft-engine',
]
/* the manifesto's translated variants (BCP 47 slugs · hreflang cluster) */
export const MANIFESTO_PATHS = ['/fr/manifesto', '/es/manifesto', '/de/manifesto', '/pt-br/manifesto', '/ja/manifesto', '/ko/manifesto', '/zh-hans/manifesto']
/* the error register's deep pages — one static landing per registered code
   (the engine stamps docs_url: https://nika.sh/errors/<CODE> on every check
   finding, and DO's error_document wins over catchall_document in practice:
   un-prerendered deep links 404'd in prod — caught by scripts/e2e-sweep).
   Kept literal (this file stays import-free); the errors drift gate
   (src/test/errors.test.ts) fails when a code and its path diverge. */
export const ERROR_PATHS = [
  '/errors/NIKA-AGENT-001',
  '/errors/NIKA-AGENT-002',
  '/errors/NIKA-BUILTIN-001',
  '/errors/NIKA-BUILTIN-DONE-001',
  '/errors/NIKA-CANCEL-001',
  '/errors/NIKA-DAG-001',
  '/errors/NIKA-DAG-002',
  '/errors/NIKA-DAG-003',
  '/errors/NIKA-DAG-004',
  '/errors/NIKA-EXEC-001',
  '/errors/NIKA-EXEC-002',
  '/errors/NIKA-INFER-001',
  '/errors/NIKA-INFER-002',
  '/errors/NIKA-INVOKE-001',
  '/errors/NIKA-INVOKE-002',
  '/errors/NIKA-MCP-001',
  '/errors/NIKA-MCP-002',
  '/errors/NIKA-PARSE-001',
  '/errors/NIKA-PARSE-002',
  '/errors/NIKA-PARSE-003',
  '/errors/NIKA-PARSE-004',
  '/errors/NIKA-PARSE-005',
  '/errors/NIKA-PARSE-006',
  '/errors/NIKA-PARSE-007',
  '/errors/NIKA-PARSE-008',
  '/errors/NIKA-PARSE-009',
  '/errors/NIKA-PARSE-010',
  '/errors/NIKA-PARSE-011',
  '/errors/NIKA-PARSE-012',
  '/errors/NIKA-PARSE-013',
  '/errors/NIKA-PARSE-014',
  '/errors/NIKA-PARSE-015',
  '/errors/NIKA-PARSE-017',
  '/errors/NIKA-PARSE-018',
  '/errors/NIKA-PARSE-019',
  '/errors/NIKA-SEC-001',
  '/errors/NIKA-SEC-002',
  '/errors/NIKA-SEC-003',
  '/errors/NIKA-SEC-004',
  '/errors/NIKA-SEC-005',
  '/errors/NIKA-TIMEOUT-001',
  '/errors/NIKA-VAR-001',
  '/errors/NIKA-VAR-002',
  '/errors/NIKA-VAR-003',
  '/errors/NIKA-VAR-004',
  '/errors/NIKA-VAR-005',
  '/errors/NIKA-VAR-006',
  '/errors/NIKA-VAR-007',
  '/errors/NIKA-VAR-008',
  '/errors/NIKA-VAR-009',
]

/* the stdlib register's deep pages — one static landing per builtin (slug =
   bare name: /tools/fetch). Same prerender law as ERROR_PATHS; kept literal
   (this file stays import-free); the tools drift gate
   (src/test/tools.test.ts) fails when the catalog and these paths diverge. */
export const TOOL_PATHS = [
  '/tools/assert',
  '/tools/chart',
  '/tools/compose',
  '/tools/convert',
  '/tools/date',
  '/tools/done',
  '/tools/edit',
  '/tools/emit',
  '/tools/fetch',
  '/tools/glob',
  '/tools/grep',
  '/tools/hash',
  '/tools/image_fx',
  '/tools/image_generate',
  '/tools/inspect',
  '/tools/jq',
  '/tools/json_diff',
  '/tools/json_merge_patch',
  '/tools/log',
  '/tools/notify',
  '/tools/prompt',
  '/tools/read',
  '/tools/tts_generate',
  '/tools/uuid',
  '/tools/validate',
  '/tools/wait',
  '/tools/write',
]

export const PATHS = ['/', '/blog', ...BLOG_PATHS, '/learn', '/play', '/manifesto', ...MANIFESTO_PATHS, '/changelog', '/errors', ...ERROR_PATHS, '/tools', ...TOOL_PATHS, '/use-cases', '/spec', '/install', '/convert', '/brand']
