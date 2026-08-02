/* ─── shared static-site constants (no deps, no JSX) ─────────────────────────
   The single source of truth for the canonical origin + the static route paths.
   Imported by BOTH react-ssg.config.ts (prerender: one index.html per path) and
   vite.config.ts (the sitemap plugin derives dist/sitemap.xml from PATHS) — and
   by the app itself (CommandK reads PATHS). Kept JSX-free and free of node
   builtins so it loads cleanly in every consumer: the Node config program
   (tsc's tsconfig.node.json), the vitest node env, AND the browser bundle —
   without dragging src/routes.tsx into any of them. The ONE permitted import
   shape is a pure-data generated module (see ERROR_PATHS); a node:fs read
   here would exile the file from the browser.

   Add a new static route in src/routes.tsx AND here — both the prerender and the
   sitemap pick it up with zero extra wiring. */

import { ERROR_CODES } from './src/content/errors.generated'
import { PENDING_ERROR_CODES } from './pending-error-codes'
import { MODEL_SLUGS, MCP_SLUGS } from './src/content/catalog-paths.generated'

/* the pending list is AUTHORED in pending-error-codes.ts (a leaf — see its
   header for the bundle law) and re-exported here: consumers of the static
   route config read PENDING_ERROR_CODES from this module, the list itself
   has exactly one home. */
export { PENDING_ERROR_CODES }

/* the canonical site origin (matches src/content.ts SITE). */
export const ORIGIN = 'https://nika.sh'

/* which static paths exist · drives the prerender AND the sitemap.
   BLOG_PATHS mirrors content/blog/*.md slugs — kept literal (this file stays
   import-free); the vitest drift gate (blog.test.ts) fails when a post and
   this list disagree. */
export const BLOG_PATHS = [
  '/blog/the-registry-reproves-everything',
  '/blog/the-generative-workflow',
  '/blog/the-agent-workflow-spectrum',
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
/* the journal's tag registers — one citable page per tag (slug = the tag,
   lowercased). Kept literal (this file stays import-free); the drift gate
   (tag-library-paths.test.ts) re-derives the set from the posts and fails
   on any divergence. */
export const BLOG_TAG_PATHS = [
  '/blog/tags/agents',
  '/blog/tags/engine',
  '/blog/tags/language',
  '/blog/tags/manifesto',
  '/blog/tags/origins',
  '/blog/tags/security',
  '/blog/tags/sovereignty',
]

/* the journal's reading paths — one citable page per series (slug = the
   series id). Kept literal; the drift gate (tag-library-paths.test.ts)
   re-derives the set from the posts' series field. */
export const BLOG_SERIES_PATHS = ['/blog/series/trace-family']

/* the integrations register — get Nika into your stack: one room per
   client lane (how people search: claude code · codex · cursor · vscode ·
   hermes · mcp) and per public repo. Kept literal; the drift gate
   (integrations.test.ts) pins these against the authored module. */
export const INTEGRATION_PATHS = [
  '/integrations',
  '/integrations/claude-code',
  '/integrations/codex',
  '/integrations/cursor',
  '/integrations/vscode',
  '/integrations/hermes',
  '/integrations/mcp',
  '/integrations/engine',
  '/integrations/spec',
  '/integrations/registry',
  '/integrations/client-sdk',
  '/integrations/audit-workflow',
  '/integrations/docs',
  '/integrations/homebrew',
  '/integrations/website',
]

/* the roomed families' ROOTS — every family with member rooms owns its
   root page too (the /types 404 class). Kept literal; the drift gate
   (family-roots.test.ts) pins these against MEMBER_ROOM_FAMILIES. */
export const FAMILY_ROOT_PATHS = [
  '/language/namespaces',
  '/language/types',
  '/language/edges',
  '/language/predicates',
  '/language/families',
  '/language/modes',
  '/language/permits',
  '/language/secrets',
  '/language/conformance',
  '/language/error-namespaces',
  '/language/error-categories',
  '/how/oracle',
  '/truth',
]

/* the manifesto's translated variants (BCP 47 slugs · hreflang cluster) */
export const MANIFESTO_PATHS = ['/fr/manifesto', '/es/manifesto', '/de/manifesto', '/pt-br/manifesto', '/ja/manifesto', '/ko/manifesto', '/zh-hans/manifesto']
/* the install cluster (WO-10 wiring · mirrors LOCALIZED['/install'] — the
   i18n gate judges the two equal both ways) */
export const INSTALL_PATHS = ['/fr/install', '/es/install', '/de/install', '/pt-br/install', '/ja/install', '/ko/install', '/zh-hans/install']
/* the error register's deep pages — one static landing per registered code
   (the engine stamps docs_url: https://nika.sh/errors/<CODE> on every check
   finding, and DO's error_document wins over catchall_document in practice:
   un-prerendered deep links 404'd in prod — caught by scripts/e2e-sweep).

   DERIVED, never hand-typed: the catalog's compiled projection
   (src/content/errors.generated.ts — itself byte-diff gated against
   public/errors/catalog.json, projected from the spec canon.yaml) ∪
   PENDING_ERROR_CODES (authored in pending-error-codes.ts), deduped and
   sorted. The projection stands in for a direct read of the JSON because
   this module also ships to the browser (CommandK imports PATHS — a
   node:fs read here would break the bundle); the errors drift gate
   (src/test/errors.test.ts) recomputes the union INDEPENDENTLY from the
   raw catalog bytes and fails on any divergence, and the lens discovery
   (scripts/lens-semantics-lib.mjs) derives the same list from the same two
   sources. A code enters by landing in the catalog or joining PENDING —
   never by editing this expression. */
export const ERROR_PATHS: string[] = [
  ...new Set([
    ...ERROR_CODES.map((e) => `/errors/${e.code}`),
    ...PENDING_ERROR_CODES.map((c) => `/errors/${c}`),
  ]),
].sort()

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
  '/tools/decide',
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

/* (the provider rooms are REAL dedicated pages at /providers/<id> —
   prerendered via LENS_PATHS · served by ProviderPage · the WO-6 stub
   era is over) */

/* the verb rooms — one static landing per verb (slug = verb name:
   /verbs/infer). Same prerender law; kept literal; the language drift gate
   (src/test/language.test.ts) pins these against CANON.verbNames. */
export const VERB_PATHS = ['/language/verbs/infer', '/language/verbs/exec', '/language/verbs/invoke', '/language/verbs/agent']

/* the keyword register's deep pages — one static landing per language word
   (slug = the key as typed: /language/with). Same prerender law;
   kept literal (this file stays import-free); the language drift gate
   (src/test/language.test.ts) fails when the schema's word set and these
   paths diverge. */
export const LANGUAGE_PATHS = [
  '/language/words/after',
  '/language/words/agent',
  '/language/words/args',
  '/language/words/backoff_max_ms',
  '/language/words/backoff_ms',
  '/language/words/backoff_strategy',
  '/language/words/capture',
  '/language/words/command',
  '/language/words/config',
  '/language/words/const',
  '/language/words/cwd',
  '/language/words/declassify',
  '/language/words/decode',
  '/language/words/description',
  '/language/words/env',
  '/language/words/exec',
  '/language/words/fail_fast',
  '/language/words/fail_workflow',
  '/language/words/for_each',
  '/language/words/id',
  '/language/words/inert',
  '/language/words/infer',
  '/language/words/inputs',
  '/language/words/invoke',
  '/language/words/jitter',
  '/language/words/max_attempts',
  '/language/words/max_parallel',
  '/language/words/max_tokens',
  '/language/words/max_tokens_total',
  '/language/words/max_turns',
  '/language/words/model',
  '/language/words/nika',
  '/language/words/on_codes',
  '/language/words/on_error',
  '/language/words/on_finally',
  '/language/words/output',
  '/language/words/outputs',
  '/language/words/permits',
  '/language/words/policy',
  '/language/words/prompt',
  '/language/words/recover',
  '/language/words/retry',
  '/language/words/returns',
  '/language/words/run',
  '/language/words/schema',
  '/language/words/secrets',
  '/language/words/shell',
  '/language/words/skills',
  '/language/words/skip',
  '/language/words/stdin',
  '/language/words/system',
  '/language/words/tasks',
  '/language/words/temperature',
  '/language/words/thinking',
  '/language/words/timeout',
  '/language/words/tool',
  '/language/words/tools',
  '/language/words/types',
  '/language/words/vision',
  '/language/words/when',
  '/language/words/with',
  '/language/words/workflow',
]

/* the skeleton register's deep pages — one static landing per template
   (slug = template name: /templates/chain). Same prerender law; kept
   literal; the templates drift gate (src/test/templates.test.ts) fails
   when the pack and these paths diverge. README routing order. */
export const TEMPLATE_PATHS = [
  '/workflows/skeletons/chain',
  '/workflows/skeletons/gate-and-act',
  '/workflows/skeletons/fanout',
  '/workflows/skeletons/etl-state',
  '/workflows/skeletons/agent-loop',
  '/workflows/skeletons/human-gated-ship',
  '/workflows/skeletons/website-brief',
  '/workflows/skeletons/media-asset-pack',
  '/workflows/skeletons/api-upload-and-create',
  '/workflows/skeletons/docker-report',
]

/* ── LENS PATHS · GENERATED between these markers by scripts/lens/graph/build-lens.mjs
   (compiler output 3): the routes the LENS introduced — hubs and surfaces flip
   into existence by descriptor edit + recompile, never by hand here. DO NOT EDIT. */
export const LENS_PATHS = ['/map', '/how/flow', '/how/boundary', '/how/proof', '/catalog/providers/anthropic', '/catalog/providers/deepseek', '/catalog/providers/gemini', '/catalog/providers/groq', '/catalog/providers/huggingface', '/catalog/providers/llamacpp', '/catalog/providers/lmstudio', '/catalog/providers/localai', '/catalog/providers/mistral', '/catalog/providers/mock', '/catalog/providers/moonshot', '/catalog/providers/nvidia', '/catalog/providers/ollama', '/catalog/providers/openai', '/catalog/providers/openrouter', '/catalog/providers/vllm', '/catalog/providers/xai', '/how/oracle/nika_canon', '/how/oracle/nika_catalog', '/how/oracle/nika_check', '/how/oracle/nika_examples', '/how/oracle/nika_explain', '/how/oracle/nika_inspect', '/how/oracle/nika_schema', '/how/oracle/nika_template', '/how/oracle/nika_tools', '/language/conformance/core', '/language/conformance/runtime', '/language/conformance/stdlib', '/language/edges/control', '/language/edges/failure-observation', '/language/edges/finally', '/language/edges/recovery', '/language/edges/terminal-observation', '/language/edges/value', '/language/error-categories/budget_error', '/language/error-categories/cancelled', '/language/error-categories/internal_error', '/language/error-categories/network_error', '/language/error-categories/parse_error', '/language/error-categories/process_error', '/language/error-categories/provider_error', '/language/error-categories/security_error', '/language/error-categories/timeout_error', '/language/error-categories/tool_error', '/language/error-categories/validation_error', '/language/error-categories/variable_error', '/language/error-namespaces/NIKA-AGENT', '/language/error-namespaces/NIKA-ASSERT', '/language/error-namespaces/NIKA-AUTH', '/language/error-namespaces/NIKA-BUILTIN', '/language/error-namespaces/NIKA-CANCEL', '/language/error-namespaces/NIKA-COMP', '/language/error-namespaces/NIKA-DAG', '/language/error-namespaces/NIKA-DECIDE', '/language/error-namespaces/NIKA-DEFAULT', '/language/error-namespaces/NIKA-DRIFT', '/language/error-namespaces/NIKA-EXEC', '/language/error-namespaces/NIKA-IMPL', '/language/error-namespaces/NIKA-INFER', '/language/error-namespaces/NIKA-INVOKE', '/language/error-namespaces/NIKA-LOCK', '/language/error-namespaces/NIKA-MCP', '/language/error-namespaces/NIKA-PARSE', '/language/error-namespaces/NIKA-POLICY', '/language/error-namespaces/NIKA-PORT', '/language/error-namespaces/NIKA-PROVIDER', '/language/error-namespaces/NIKA-SEC', '/language/error-namespaces/NIKA-TIMEOUT', '/language/error-namespaces/NIKA-TYPE', '/language/error-namespaces/NIKA-VALUES', '/language/error-namespaces/NIKA-VAR', '/language/families/core', '/language/families/data', '/language/families/file', '/language/families/introspection', '/language/families/media', '/language/families/network', '/language/modes/article', '/language/modes/feed', '/language/modes/jq', '/language/modes/links', '/language/modes/markdown', '/language/modes/metadata', '/language/modes/selector', '/language/modes/sitemap', '/language/modes/text', '/language/namespaces/config', '/language/namespaces/const', '/language/namespaces/inputs', '/language/namespaces/secrets', '/language/namespaces/tasks', '/language/namespaces/with', '/language/permits/env', '/language/permits/exec', '/language/permits/fs', '/language/permits/net', '/language/permits/tools', '/language/predicates/failure', '/language/predicates/skipped', '/language/predicates/success', '/language/predicates/terminal', '/language/secrets/env', '/language/secrets/file', '/language/secrets/vault', '/language/types/bool', '/language/types/bytes', '/language/types/duration', '/language/types/integer', '/language/types/null', '/language/types/number', '/language/types/path', '/language/types/string', '/language/types/timestamp', '/language/types/uri', '/truth/canon', '/truth/catalog', '/truth/lens', '/truth/manifest', '/truth/mirror', '/truth/pack', '/truth/pin', '/truth/registry', '/truth/schema', '/truth/spec', '/workflows/jobs/bookmark-triage', '/workflows/jobs/ceo-monday-brief', '/workflows/jobs/competitor-radar', '/workflows/jobs/config-drift-sentinel', '/workflows/jobs/contract-guard', '/workflows/jobs/csv-chart-report', '/workflows/jobs/deep-research-brief', '/workflows/jobs/etl-quarantine', '/workflows/jobs/image-fx-batch', '/workflows/jobs/incident-war-room', '/workflows/jobs/invoice-chaser', '/workflows/jobs/localization-factory', '/workflows/jobs/meeting-actions', '/workflows/jobs/model-bench', '/workflows/jobs/og-images', '/workflows/jobs/pr-review-fanout', '/workflows/jobs/price-watch', '/workflows/jobs/release-notes', '/workflows/jobs/release-radar', '/workflows/jobs/release-train', '/workflows/jobs/resume-screener', '/workflows/jobs/seo-content-brief', '/workflows/jobs/social-repurpose', '/workflows/jobs/standup-digest', '/workflows/jobs/support-triage', '/workflows/jobs/transcript-shownotes']
/* ── LENS PATHS END ── */

/* the catalog world (D1 · engine-release clock) — hub + registers + one room
   per model and per MCP server. Slugs derive from the vendored engine
   surfaces (scripts/build-catalog.mjs → catalog-paths.generated); a model
   enters by entering the released catalog, never by editing this list. */
export const CATALOG_PATHS: string[] = [
  '/catalog',
  '/catalog/models',
  ...MODEL_SLUGS.map((s) => `/catalog/models/${s}`),
  '/catalog/pricing',
  '/catalog/energy',
  '/catalog/mcp',
  ...MCP_SLUGS.map((s) => `/catalog/mcp/${s}`),
  '/catalog/embeddings',
  '/catalog/capabilities',
]

/* the teaching path's rooms (V2 · 2026-08-02) · one per numbered spec
   example, in the order the path teaches them. The slugs come from
   scripts/build-lessons.mjs (pin-sourced); lessons.test pins this list
   against the generated module so the two can never disagree. */
export const LESSON_PATHS = ['/workflows/path/01-hello', '/workflows/path/02-parallel-fanout', '/workflows/path/03-exec-pipeline', '/workflows/path/04-schema-retry', '/workflows/path/05-fetch-chain', '/workflows/path/06-code-review', '/workflows/path/07-for-each-locales', '/workflows/path/08-config-values', '/workflows/path/09-returns-typed-door', '/workflows/path/10-compose-child', '/workflows/path/10-compose-pipeline', '/workflows/path/11-declassify-the-door', '/workflows/path/12-failure-routing']

/* the specification's chapter rooms (V3 · 2026-08-02) · one per chapter of
   the pack, in reading order. Slugs come from scripts/build-chapters.mjs
   (pin-sourced); chapters.test pins this list against the module. */
export const CHAPTER_PATHS = ['/language/spec/overview', '/language/spec/envelope', '/language/spec/verbs', '/language/spec/dag', '/language/spec/variables', '/language/spec/errors', '/language/spec/stdlib-contract', '/language/spec/conformance', '/language/spec/out-of-scope', '/language/spec/types', '/language/spec/authority', '/language/spec/decision', '/language/spec/gateway', '/language/spec/outcomes', '/language/spec/composition', '/language/spec/proof', '/language/spec/projections', '/language/spec/trace']

/* the /how world (V1 · 2026-08-02) · the RÉCIT world's own pages. The three
   re-homed hubs ride LENS_PATHS (descriptor-derived); these two are authored
   here because they are authored pages, not lens surfaces. */
export const HOW_PATHS = ['/how', '/how/router']

export const PATHS = ['/', '/blog', ...BLOG_PATHS, ...BLOG_TAG_PATHS, ...BLOG_SERIES_PATHS, '/learn', '/play', '/manifesto', ...MANIFESTO_PATHS, '/changelog', '/errors', ...ERROR_PATHS, '/tools', ...TOOL_PATHS, '/language/verbs', ...VERB_PATHS, '/language', ...LANGUAGE_PATHS, '/catalog/providers', ...TEMPLATE_PATHS, ...INTEGRATION_PATHS, ...CATALOG_PATHS, ...FAMILY_ROOT_PATHS, ...HOW_PATHS, '/workflows', '/workflows/jobs', '/workflows/skeletons', ...LESSON_PATHS, '/language/spec', ...CHAPTER_PATHS, ...LENS_PATHS, '/timeline', '/install', ...INSTALL_PATHS, '/convert', '/brand']
