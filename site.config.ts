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
/* the error register's deep pages — one static landing per registered code
   (the engine stamps docs_url: https://nika.sh/errors/<CODE> on every check
   finding, and DO's error_document wins over catchall_document in practice:
   un-prerendered deep links 404'd in prod — caught by scripts/e2e-sweep).
   Kept literal (this file stays import-free); the errors drift gate
   (src/test/errors.test.ts) fails when a code and its path diverge. */
export const ERROR_PATHS = [
  '/errors/NIKA-AGENT-001',
  '/errors/NIKA-AGENT-002',
  '/errors/NIKA-AGENT-003',
  '/errors/NIKA-AGENT-004',
  '/errors/NIKA-ASSERT-001',
  '/errors/NIKA-BUILTIN-001',
  '/errors/NIKA-BUILTIN-DONE-001',
  '/errors/NIKA-CANCEL-001',
  '/errors/NIKA-COMP-001',
  '/errors/NIKA-COMP-002',
  '/errors/NIKA-COMP-003',
  '/errors/NIKA-COMP-004',
  '/errors/NIKA-DAG-001',
  '/errors/NIKA-DAG-002',
  '/errors/NIKA-DAG-004',
  '/errors/NIKA-DAG-005',
  '/errors/NIKA-DAG-006',
  '/errors/NIKA-DAG-007',
  '/errors/NIKA-DECIDE-001',
  '/errors/NIKA-DECIDE-002',
  '/errors/NIKA-EXEC-001',
  '/errors/NIKA-EXEC-002',
  '/errors/NIKA-INFER-001',
  '/errors/NIKA-INFER-002',
  '/errors/NIKA-INVOKE-001',
  '/errors/NIKA-INVOKE-002',
  '/errors/NIKA-LOCK-001',
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
  '/errors/NIKA-PARSE-020',
  '/errors/NIKA-PARSE-021',
  '/errors/NIKA-PARSE-022',
  '/errors/NIKA-PARSE-023',
  '/errors/NIKA-PARSE-024',
  '/errors/NIKA-PARSE-025',
  '/errors/NIKA-POLICY-001',
  '/errors/NIKA-PORT-001',
  '/errors/NIKA-PORT-002',
  '/errors/NIKA-SEC-001',
  '/errors/NIKA-SEC-002',
  '/errors/NIKA-SEC-003',
  '/errors/NIKA-SEC-004',
  '/errors/NIKA-SEC-005',
  '/errors/NIKA-SEC-006',
  '/errors/NIKA-SEC-007',
  '/errors/NIKA-TIMEOUT-001',
  '/errors/NIKA-TYPE-001',
  '/errors/NIKA-TYPE-002',
  '/errors/NIKA-TYPE-003',
  '/errors/NIKA-TYPE-004',
  '/errors/NIKA-TYPE-005',
  '/errors/NIKA-TYPE-006',
  '/errors/NIKA-TYPE-101',
  '/errors/NIKA-VAR-001',
  '/errors/NIKA-VAR-002',
  '/errors/NIKA-VAR-003',
  '/errors/NIKA-VAR-004',
  '/errors/NIKA-VAR-005',
  '/errors/NIKA-VAR-006',
  '/errors/NIKA-VAR-007',
  '/errors/NIKA-VAR-008',
  '/errors/NIKA-VAR-009',
  '/errors/NIKA-VAR-020',
  '/errors/NIKA-VAR-021',
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

/* the provider register's deep pages — one static landing per spec-named
   provider (slug = provider id: /providers/ollama). Same prerender law;
   kept literal (this file stays import-free); the providers drift gate
   (src/test/providers.test.ts) fails when the catalog and these paths
   diverge. Order mirrors the presentation law (local first). */
export const PROVIDER_PATHS = [
  '/providers/ollama',
  '/providers/lmstudio',
  '/providers/llamacpp',
  '/providers/localai',
  '/providers/vllm',
  '/providers/mistral',
  '/providers/anthropic',
  '/providers/openai',
  '/providers/gemini',
  '/providers/deepseek',
  '/providers/xai',
  '/providers/groq',
  '/providers/openrouter',
  '/providers/huggingface',
  '/providers/nvidia',
  '/providers/mock',
]

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
  '/language/vars',
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
export const ATLAS_PATHS = ['/map', '/flow', '/boundary', '/proof', '/use-cases/t1-image-fx-batch', '/use-cases/t1-meeting-actions', '/use-cases/t1-og-images', '/use-cases/t1-price-watch', '/use-cases/t1-social-repurpose', '/use-cases/t1-standup-digest', '/use-cases/t2-bookmark-triage', '/use-cases/t2-contract-guard', '/use-cases/t2-csv-chart-report', '/use-cases/t2-etl-quarantine', '/use-cases/t2-invoice-chaser', '/use-cases/t2-model-bench', '/use-cases/t2-release-notes', '/use-cases/t2-release-radar', '/use-cases/t2-seo-content-brief', '/use-cases/t2-support-triage', '/use-cases/t2-transcript-shownotes', '/use-cases/t3-competitor-radar', '/use-cases/t3-config-drift-sentinel', '/use-cases/t3-localization-factory', '/use-cases/t3-pr-review-fanout', '/use-cases/t3-resume-screener', '/use-cases/t4-ceo-monday-brief', '/use-cases/t4-deep-research-brief', '/use-cases/t4-incident-war-room', '/use-cases/t4-release-train']
/* ── ATLAS PATHS END ── */

export const PATHS = ['/', '/blog', ...BLOG_PATHS, '/learn', '/play', '/manifesto', ...MANIFESTO_PATHS, '/changelog', '/errors', ...ERROR_PATHS, '/tools', ...TOOL_PATHS, '/verbs', ...VERB_PATHS, '/language', ...LANGUAGE_PATHS, '/providers', ...PROVIDER_PATHS, '/templates', ...TEMPLATE_PATHS, ...ATLAS_PATHS, '/use-cases', '/spec', '/install', '/convert', '/brand']
