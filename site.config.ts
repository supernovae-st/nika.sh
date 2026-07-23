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
   prerendered via ATLAS_PATHS · served by ProviderPage · the WO-6 stub
   era is over) */

/* the verb rooms — one static landing per verb (slug = verb name:
   /verbs/infer). Same prerender law; kept literal; the language drift gate
   (src/test/language.test.ts) pins these against CANON.verbNames. */
export const VERB_PATHS = ['/verbs/infer', '/verbs/exec', '/verbs/invoke', '/verbs/agent']

/* the keyword register's deep pages — one static landing per language word
   (slug = the key as typed: /language/with). Same prerender law;
   kept literal (this file stays import-free); the language drift gate
   (src/test/language.test.ts) fails when the schema's word set and these
   paths diverge. */
export const LANGUAGE_PATHS = [
  '/language/after',
  '/language/agent',
  '/language/args',
  '/language/backoff_max_ms',
  '/language/backoff_ms',
  '/language/backoff_strategy',
  '/language/capture',
  '/language/command',
  '/language/config',
  '/language/const',
  '/language/cwd',
  '/language/decode',
  '/language/description',
  '/language/env',
  '/language/exec',
  '/language/fail_fast',
  '/language/fail_workflow',
  '/language/for_each',
  '/language/id',
  '/language/infer',
  '/language/inputs',
  '/language/invoke',
  '/language/jitter',
  '/language/max_attempts',
  '/language/max_parallel',
  '/language/max_tokens',
  '/language/max_tokens_total',
  '/language/max_turns',
  '/language/model',
  '/language/nika',
  '/language/on_codes',
  '/language/on_error',
  '/language/on_finally',
  '/language/output',
  '/language/outputs',
  '/language/permits',
  '/language/policy',
  '/language/prompt',
  '/language/recover',
  '/language/retry',
  '/language/returns',
  '/language/schema',
  '/language/secrets',
  '/language/shell',
  '/language/skills',
  '/language/skip',
  '/language/stdin',
  '/language/system',
  '/language/tasks',
  '/language/temperature',
  '/language/thinking',
  '/language/timeout',
  '/language/tool',
  '/language/tools',
  '/language/types',
  '/language/vision',
  '/language/when',
  '/language/with',
  '/language/workflow',
]

/* the skeleton register's deep pages — one static landing per template
   (slug = template name: /templates/chain). Same prerender law; kept
   literal; the templates drift gate (src/test/templates.test.ts) fails
   when the pack and these paths diverge. README routing order. */
export const TEMPLATE_PATHS = [
  '/templates/chain',
  '/templates/gate-and-act',
  '/templates/fanout',
  '/templates/etl-state',
  '/templates/agent-loop',
  '/templates/human-gated-ship',
  '/templates/website-brief',
  '/templates/media-asset-pack',
  '/templates/api-upload-and-create',
  '/templates/docker-report',
]

/* ── ATLAS PATHS · GENERATED between these markers by scripts/atlas/build-atlas.mjs
   (compiler output 3): the routes the ATLAS introduced — hubs and surfaces flip
   into existence by descriptor edit + recompile, never by hand here. DO NOT EDIT. */
export const ATLAS_PATHS = ['/map', '/sources', '/flow', '/boundary', '/proof', '/conformance/core', '/conformance/runtime', '/conformance/stdlib', '/edges/control', '/edges/failure-observation', '/edges/finally', '/edges/recovery', '/edges/terminal-observation', '/edges/value', '/error-categories/budget_error', '/error-categories/cancelled', '/error-categories/internal_error', '/error-categories/network_error', '/error-categories/parse_error', '/error-categories/process_error', '/error-categories/provider_error', '/error-categories/security_error', '/error-categories/timeout_error', '/error-categories/tool_error', '/error-categories/validation_error', '/error-categories/variable_error', '/error-namespaces/NIKA-AGENT', '/error-namespaces/NIKA-ASSERT', '/error-namespaces/NIKA-BUILTIN', '/error-namespaces/NIKA-CANCEL', '/error-namespaces/NIKA-COMP', '/error-namespaces/NIKA-DAG', '/error-namespaces/NIKA-DECIDE', '/error-namespaces/NIKA-EXEC', '/error-namespaces/NIKA-IMPL', '/error-namespaces/NIKA-INFER', '/error-namespaces/NIKA-INVOKE', '/error-namespaces/NIKA-LOCK', '/error-namespaces/NIKA-MCP', '/error-namespaces/NIKA-PARSE', '/error-namespaces/NIKA-POLICY', '/error-namespaces/NIKA-PORT', '/error-namespaces/NIKA-PROVIDER', '/error-namespaces/NIKA-SEC', '/error-namespaces/NIKA-TIMEOUT', '/error-namespaces/NIKA-TYPE', '/error-namespaces/NIKA-VAR', '/families/core', '/families/data', '/families/file', '/families/introspection', '/families/media', '/families/network', '/mcp/nika_canon', '/mcp/nika_catalog', '/mcp/nika_check', '/mcp/nika_examples', '/mcp/nika_explain', '/mcp/nika_inspect', '/mcp/nika_schema', '/mcp/nika_template', '/mcp/nika_tools', '/modes/article', '/modes/feed', '/modes/jq', '/modes/links', '/modes/markdown', '/modes/metadata', '/modes/selector', '/modes/sitemap', '/modes/text', '/namespaces/env', '/namespaces/secrets', '/namespaces/tasks', '/namespaces/vars', '/namespaces/with', '/permits/exec', '/permits/fs', '/permits/net', '/permits/tools', '/predicates/failure', '/predicates/skipped', '/predicates/success', '/predicates/terminal', '/providers/anthropic', '/providers/deepseek', '/providers/gemini', '/providers/groq', '/providers/huggingface', '/providers/llamacpp', '/providers/lmstudio', '/providers/localai', '/providers/mistral', '/providers/mock', '/providers/moonshot', '/providers/nvidia', '/providers/ollama', '/providers/openai', '/providers/openrouter', '/providers/vllm', '/providers/xai', '/secrets/env', '/secrets/file', '/secrets/vault', '/truth/atlas', '/truth/canon', '/truth/catalog', '/truth/manifest', '/truth/mirror', '/truth/pack', '/truth/pin', '/truth/registry', '/truth/schema', '/truth/spec', '/types/bool', '/types/bytes', '/types/duration', '/types/integer', '/types/null', '/types/number', '/types/path', '/types/string', '/types/timestamp', '/types/uri', '/use-cases/t1-image-fx-batch', '/use-cases/t1-meeting-actions', '/use-cases/t1-og-images', '/use-cases/t1-price-watch', '/use-cases/t1-social-repurpose', '/use-cases/t1-standup-digest', '/use-cases/t2-bookmark-triage', '/use-cases/t2-contract-guard', '/use-cases/t2-csv-chart-report', '/use-cases/t2-etl-quarantine', '/use-cases/t2-invoice-chaser', '/use-cases/t2-model-bench', '/use-cases/t2-release-notes', '/use-cases/t2-release-radar', '/use-cases/t2-seo-content-brief', '/use-cases/t2-support-triage', '/use-cases/t2-transcript-shownotes', '/use-cases/t3-competitor-radar', '/use-cases/t3-config-drift-sentinel', '/use-cases/t3-localization-factory', '/use-cases/t3-pr-review-fanout', '/use-cases/t3-resume-screener', '/use-cases/t4-ceo-monday-brief', '/use-cases/t4-deep-research-brief', '/use-cases/t4-incident-war-room', '/use-cases/t4-release-train']
/* ── ATLAS PATHS END ── */

export const PATHS = ['/', '/blog', ...BLOG_PATHS, '/learn', '/play', '/manifesto', ...MANIFESTO_PATHS, '/changelog', '/errors', ...ERROR_PATHS, '/tools', ...TOOL_PATHS, '/verbs', ...VERB_PATHS, '/language', ...LANGUAGE_PATHS, '/providers', '/templates', ...TEMPLATE_PATHS, ...ATLAS_PATHS, '/use-cases', '/spec', '/timeline', '/install', ...INSTALL_PATHS, '/convert', '/brand']
