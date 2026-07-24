# Provider rooms + projection mega-plan · 2026-07-24

> **EXECUTED same-arc** — waves 1-5 P1 shipped (donors ×17 · ProviderPage ·
> doors on 10 register surfaces · legacy_moves stubs · tier() · OG · ⌘K
> members · size bite 374→377). The P3 rows in wave 5 stay the open backlog.

> The ask: `/providers#ollama` is an anchor on a register page while
> `/language/for_each` is a real room. Every provider deserves the same:
> `https://nika.sh/providers/<id>` as a detailed, enriched page with the
> right chrome — and the same projection law audited site-wide (sitemap ·
> canonical · rooms coverage), socratically.

## The state (empirical, 2026-07-24)

- `/providers/:id` ALREADY routes and prerenders (rooms universelles ·
  operator verdict 2026-07-18 « chaque élément a sa page ») — but it renders
  the **generic MemberRoom**: a thin facts table off `readoutFor`, no models,
  no env-var teaching, no YAML, no per-provider head.
- The register page (`/providers`) links rows to `#anchors` only — the rooms
  are served but **never linked** (orphan pages to a crawler).
- Prod serves a stale build: `/providers/ollama` answers with Mistral's
  `<title>` — the local build is correct; verify post-deploy.
- The rich-data pipeline exists: `providers.generated.ts` (17 entries ·
  models · ctx windows · dialects · env vars · presentation-law order) is
  byte-diff gated against `public/providers/catalog.json` (the engine's own
  `nika catalog --json`).
- Spec truth: an `infer:` task names its provider as the **`model:` prefix**
  (`model: ollama/qwen3.5:4b`) — there is no `provider:` key under `infer:`
  (only `nika:image_generate` / `nika:tts_generate` take one as an arg).
- Proven in scratch: minimal per-provider workflows go `nika check` green
  (RC=0) with literal prompts + `max_tokens` bounds — the check output even
  carries the cost ceiling (`≤ $0.0060`), which the page can teach.

## The laws that bind this arc

1. **Spec truth** — every YAML shown validates against the served
   `workflow.schema.json`; counts ride `CANON`, never hand-typed.
2. **Vendored-catalog law** — builds never probe the binary; regeneration is
   a deliberate manual run (`build-terminal-captures` precedent); drift
   gates stay hermetic (ajv + byte-diff).
3. **Presentation law** — local first · Mistral leads the cloud ·
   anthropic/openai never first (supernovae-alignment Rule 3, asserted in
   `providers.test.ts`).
4. **Never invent YAML in a component** — evidence comes from gated donors.
5. **Copy discipline** — direct, jargon-free, no em-dash slop.
6. Gates before push: `pnpm check && pnpm lint && pnpm build`, zero warnings.

## Wave 1 · the data layer

- `content/provider-usage/<id>.nika.yaml` × 17 — one crafted, check-green,
  self-contained workflow per provider, each teaching a distinct angle
  (local privacy for ollama · thinking budget for anthropic · speed batch
  for groq · routing for openrouter · mock-first for mock …). Authoring
  ritual: `nika check` RC=0 per file, `model:` prefix = the file's provider.
- `scripts/build-provider-usage.mjs` — compiles the donors + the check
  verdict captured at regen time (cost ceiling line) into
  `src/content/provider-usage.generated.ts`. Deterministic, no build stamps.
- `src/content/provider-meta.ts` — AUTHORED enrichment, one entry per
  provider: the angle (lede), seo title tail, setup steps (install command
  or key-console URL + `export ENV_VAR=…`), a sovereignty/jurisdiction note
  where it earns its place, "pick it when" line. Facts verified by research
  (2026-07 web pass).
- `src/test/provider-usage.test.ts` — REGEN (recompiles + byte-diffs) ·
  FIDELITY (generated yaml byte-equals the donor) · TRUTH (ajv against the
  served schema · model-prefix law · meta covers exactly the CANON id set).

## Wave 2 · the room

- `src/pages/ProviderPage.tsx` — the room recipe (ToolPage/WordPage
  grammar): crumb `← the provider catalog` + kind badge · fig/H1/lede ·
  StampStrip (models · kind · key · dialect) · **the wire** (dialect, env
  var teaching, aliases, default/cheap) · **the models** (alias → pin →
  ctx/caps; the alias-pinning story) · **in a real file** (CodeFile donor +
  audited cost-ceiling line) · **get set up** (local: install + port ·
  cloud: key console + env export + `nika doctor`) · **swap it** (the
  one-word diff + same-kind siblings) · cross-refs (verbs/infer ·
  language/model · sources rail · blog rail) · the walk (prev/next/all,
  catalog order) · TruthLine.
- Route swap in `routes.tsx`: `providers/:id` → ProviderPage (MemberRoom
  keeps the other 13 families).
- Atlas: providers family leaves `MEMBER_ROOM_FAMILIES` (explicit
  descriptor/compiler flag, regenerated — never hand-edited); `/providers/*`
  paths stay prerendered (ATLAS_PATHS or a derived PROVIDER_PATHS, the
  ERROR_PATHS import precedent).
- Per-page head: authored title/description · `og-providers.png` + alt ·
  BreadcrumbList + DefinedTerm JSON-LD (aligned with jsonld.generated).
- `PROVIDER_SOURCES` in `sources.ts` for the rail.

## Wave 3 · the register + the wiring

- `Providers.tsx`: each row's name links its room; `#anchors` stay citable;
  an explicit room affordance per row; the foot links the walk.
- `build-blog.mjs`: emit `provider:<id>` FROM_BLOG keys (posts do speak
  providers) → the blog rail on rooms.
- The cascade surfaces (exact list from the gates audit): twins · llms.txt ·
  pagefind · ⌘K palette corpus · nav counts — regenerate/update each.

## Wave 4 · gates + ship

- `pnpm check && pnpm lint && pnpm build` · vitest suite · a11y-sweep +
  e2e-sweep · size-budget · sample `shoot-routes` shots of 2–3 rooms.
- Commit (`Co-Authored-By: Nika 🦋`) · push · announce · verify prod
  `/providers/ollama` head after the DO deploy settles.

## Wave 5 · the projection sweep (socratic)

The question behind each fix: *does every citable element own a truthful,
linked, discoverable URL?* Audited 2026-07-24 (code-side projection audit +
Ahrefs crawl). The verdict: the ROOMS half of « chaque élément a sa page »
is done (119 member rooms served, sitemapped, pagefind-indexed) — the DOORS
half is missing on every register.

P1 — execute in this arc:
- Register/hub pages link members to `#anchors` or plain text instead of
  their existing rooms, on 10 surfaces: `hub-shared.tsx` MemberRows
  (Flow · Boundary), `Proof.tsx` (conformance + mcp), `Providers.tsx`,
  `Tools.tsx` (family heads), `Errors.tsx` (namespace + category),
  `Sources.tsx` (truth words), `ToolPage.tsx` fetch-room mode chips.
  Fix: the member's name links its room; the anchor and the inspector
  stay secondary affordances.
- `/language/depends_on` is a live 404 on a core-looking keyword (Ahrefs
  crawled it 2026-07-15): ship the redirect to `/language/after`.
- 15 retired `/concepts/*` URLs still 404: redirect rows to the nearest
  living pages.

P2 — this arc where cheap, else noted:
- Sitemap `tier()` regex misses the 13 atlas room families + `/use-cases/:slug`
  (~145 reference rooms weighted 0.8/weekly instead of 0.5/monthly).
- `/errors` + `/errors/:code` have NO og:image and `og-errors.png` does not
  exist; member rooms ship no og:image at all — add the family cards.
- ⌘K corpus: 13 room families absent; providers entries point at anchors.
- Intent-bearing titles for rooms (the Ahrefs lever: "ollama · Nika
  providers" carries no query intent) — the provider-meta titles do this
  for providers; note the pattern for other families.

P3 — noted, deferred with reasons:
- `/errors/:code` + `/templates/:name` re-render the whole register per
  deep page (duplicate-content class) — a dedicated-room refactor, own arc.
- Blog tags · changelog releases · library heroes lack pages — own arc.
- llms.txt line 109 "members anchored" stale wording — fix in passing.
- Constellation SVG links only 12/17 provider rooms — compiler quirk,
  low-stakes (the dense grid covers all).
- Ahrefs/GSC wiring for nika.sh (operator action: create the Site Audit
  project + connect GSC — the depends_on class would have auto-flagged).
- Deep-link rooms from engine/spec/docs/README surfaces (cross-repo).

## Wave 6 · memory

- Auto-memory: the arc, its laws, the audit residue (P2/P3 backlog).

## Executed same-day follow-ups (arcs 2–3)

- Dedicated rooms: /errors/:code (ErrorPage) · /templates/:name
  (TemplatePage · PlanMap) — the duplicate-content class is dead.
- Citability: /blog/tags/:tag ×7 · /blog/series/:id · /library + 10 rooms
  (PlanMap + honesty contract) · changelog per-release anchors.
- MemberRoom de-slopped (self-door · lede fallback · deduped facts via
  readoutFor — inspector and hover cards benefit too · member stamps).
- /integrations (Ahrefs-named: « claude skills » 12.7k/mo · « mcp server »
  ~15k · « ecosystem » dead): FULL KIT + one room per client (claude-code ·
  codex · cursor · vscode · hermes · mcp) + 8 repo rooms — commands
  verbatim from the READMEs (the SSOT) · the kit contents chipped (9 oracle
  tools → their /mcp rooms) · « open it in the playground → » on every
  whole file (templates · provider donors · library) via the ?y= handoff ·
  GitHub code-search on every error room · nav Product + Learn doors.
- Laws learned: lz-string default-import (CJS breaks the SSG loader — and
  a broken SSG config SKIPS the whole prerender silently: always check the
  page count line) · snippet-lint forbids the envelope literal in authored
  TS · the e2e rss check must exempt /blog/(tags|series)/ · zombie port
  4523 after a killed belt (lsof + kill, the ports-PID law).

## The next windows (the ambition backlog · SOTA or better)

1. **Per-code OG cards** — bake og-errors-<CODE>.png for the top error
   codes (the card carries the code + failure line): no one else gives a
   typed refusal its own social card.
2. **Pick-your-stack switcher on /integrations** — zero-JS `<details>`
   tabs per client (the Stripe-docs pattern, without the JS): one screen,
   your two installs side by side.
3. **llms-full.txt beyond the blog** — serve the registers (providers ·
   errors · integrations) as one agent-readable file; agents stop crawling
   room by room.
4. **A releases feed** — rss for /changelog releases (the blog feed
   precedent); watchers follow the engine without GitHub.
5. **Query-pillar pages** — the Ahrefs money queries (« claude skills » ·
   « mcp server » · « agent skills ») deserve teaching posts that route to
   /integrations rooms; the register ranks, the post explains.
6. **Sitemap lastmod from git** — per-file real dates instead of the build
   stamp (crawl-hygiene SOTA).
7. **Operator (2 min)**: create the Ahrefs Site Audit project for nika.sh
   and connect GSC — the depends_on-class 404s then auto-flag weekly.
