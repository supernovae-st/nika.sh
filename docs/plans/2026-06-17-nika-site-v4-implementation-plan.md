# nika.sh v4 — Trust Landing · Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Companion design doc: `docs/plans/2026-06-17-nika-site-v4-trust-landing-design.md` (read it first).

**Goal:** Rebuild nika.sh as a calm, black-and-white, Cursor/Linear-grade trust
landing whose one big "wow" is a spec-true `.nika.yaml` that writes itself,
becomes a DAG, and executes in a 3D depth corridor with a live CLI/NDJSON log —
while the v3 cinematic galaxy is preserved as an easter egg.

**Architecture:** Keep the stack (Vite + React 19 + r3f + Tailwind v4). Make the
page **DOM-first and prerendered** (instant paint + SEO); the hero has zero
WebGL. WebGL is one **lazy, scroll-driven, off-screen-paused** corridor scene.
Every effect lives behind a declarative **EffectBudget** (per-section gating).
Reuse the existing `ShowcaseDag` + `RunSim` execution model; add a real
CLI/NDJSON event stream from the spec's actual formats.

**Tech Stack:** Vite 8 · React 19 · TypeScript 6 · Tailwind v4 ·
@react-three/fiber 9 / drei 10 / postprocessing · @uiw/react-codemirror (already
present, for the code panel) · **add:** `react-router` (data router),
`vite-plugin-react-ssg` (build-time prerender), `@unhead/react` (per-route meta),
`vitest` + `@testing-library/react` (logic tests).

**Conventions (non-negotiable, from AGENTS.md):**
- Gates before every commit: `pnpm check && pnpm lint && pnpm build` (0 warnings).
- Spec truth: every YAML shown is **projected from nika-spec**, never hand-typed.
- Live URLs are contracts: never delete `public/{install.sh,llms.txt,schema/*,errors/*,404.html}`.
- Scenes: ONE clock; **no drei `<Text>`** (labels are DOM); headless verify via
  swiftshader Chromium (`?it=N` freeze).
- Commit trailer: `Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`.
- Public repo: no strategy/brand content.

**Branch:** all work lands on `v4-trust-landing` (created in Task 0.1). `main`
stays v3 (auto-deploys) until v4 is merged.

**Verification vocabulary used below:**
- `GATES` = `pnpm check && pnpm lint && pnpm build` → all pass, 0 warnings.
- `UNIT` = `pnpm test <file>` (vitest) → pass.
- `SHOT` = `pnpm build && pnpm preview` then headless swiftshader screenshot of
  the route/section; eyeball against the design doc mockup.
- `SEO` = `grep` the prerendered `dist/<route>/index.html` for expected DOM.

---

## Phase 0 — Foundation & archival (infra; no visual change)

### Task 0.1: Archive v3, branch v4

**Files:** none (git only).

**Steps:**
1. `git status` → clean tree (commit/stash the 3 pending generated files first if needed).
2. Tag current site: `git tag site-v3-cinematic -m "v3 cinematic galaxy — preserved"`.
3. Branch: `git checkout -b v4-trust-landing`.
4. Bump `package.json` version `3.0.0` → `4.0.0-alpha.0`.
5. **Commit:** `chore(v4): branch v4-trust-landing, tag v3, bump 4.0.0-alpha.0`.

**Verify:** `git tag | grep site-v3-cinematic` and `git branch --show-current` = `v4-trust-landing`.

---

### Task 0.2: Add the test runner (vitest)

**Files:** Modify `package.json`; Create `vitest.config.ts`, `src/test/setup.ts`.

**Steps:**
1. `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom`.
2. Create `vitest.config.ts`:
   ```ts
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   export default defineConfig({
     plugins: [react()],
     test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true },
   })
   ```
3. `src/test/setup.ts`: `import '@testing-library/jest-dom'`.
4. Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
5. Add a trivial `src/test/smoke.test.ts` (`expect(1).toBe(1)`) → `pnpm test` passes.
6. **Commit:** `chore(test): add vitest + testing-library`.

**Verify:** `UNIT` (smoke passes). `GATES`.

---

### Task 0.3: Adopt React Router (data router) + migrate hash routes → paths

**Files:** Create `src/routes.tsx`, `src/shell/RootLayout.tsx`; Modify `src/App.tsx`
(becomes the `/` home route element), `src/main.tsx`, all `src/pages/*` (route
elements), every internal link (`#/x` → `/x`).

**Context:** Today routing is hand-rolled hash navigation inside `App.tsx`
(`#/blog`, `#/manifesto`, …). React Router is the prerequisite for SSG.

**Steps:**
1. `pnpm add react-router` (v7).
2. `src/routes.tsx` — central route table:
   ```tsx
   import type { RouteObject } from 'react-router'
   import RootLayout from './shell/RootLayout'
   export const routes: RouteObject[] = [
     { path: '/', element: <RootLayout />, children: [
       { index: true, lazy: () => import('./pages/Home') },
       { path: 'blog', lazy: () => import('./pages/Blog') },
       { path: 'learn', lazy: () => import('./pages/Learn') },
       { path: 'play', lazy: () => import('./pages/Play') },
       { path: 'manifesto', lazy: () => import('./pages/Manifesto') },
       // new pages added in Phase 4
     ]},
   ]
   ```
3. `src/shell/RootLayout.tsx` — `<Nav/> <Outlet/> <Footer/> <EdgeAurora/>` (Nav/Footer/EdgeAurora are stubs for now, filled in 0.6).
4. Move the current home JSX out of `App.tsx` into `src/pages/Home.tsx` (export `Component`/`element` per RR lazy convention). Keep it byte-for-byte for now (visual parity); we refactor sections in Phase 1+.
5. Replace hash-nav handlers with `<Link to="/x">`.
6. `src/main.tsx` → `createBrowserRouter(routes)` + `RouterProvider` (hydration wired in 0.4).
7. **Commit:** `refactor(routing): hash → React Router data router`.

**Verify:** `pnpm dev` → every old `#/x` page reachable at `/x`; no console errors. `GATES`.

---

### Task 0.4: Build-time prerender (SSG) for instant paint + SEO

**Files:** Modify `vite.config.ts`, `src/main.tsx`; Create `react-ssg.config.ts`.

**Context:** `vite-plugin-react-ssg` (wbbb0730) prerenders a React-Router SPA to
per-route static HTML at build (`closeBundle`), injects head tags, and emits
`window.__staticRouterHydrationData` for client hydration. (Confirmed via
Context7; if its API has shifted, the `vite-react-ssg` entry-based variant is the
fallback — same outcome.)

**Steps:**
1. `pnpm add -D vite-plugin-react-ssg @unhead/react`.
2. `vite.config.ts`: add `reactSsg()` to plugins (after `react()`).
3. `react-ssg.config.ts`: list static paths `['/', '/blog', '/learn', '/play', '/manifesto']` (extend in Phase 4).
4. `src/main.tsx`: switch `createRoot(...).render` → `hydrateRoot(...)` reusing `window.__staticRouterHydrationData` (per the lib's hydration snippet).
5. Per-route meta: add `useHead({ title, meta })` to `Home` + each page.
6. **Commit:** `feat(ssg): prerender routes to static HTML (instant paint + SEO)`.

**Verify:** `pnpm build` → `dist/index.html`, `dist/blog/index.html`, … each exist.
`SEO`: `grep -i "intent as code" dist/index.html` finds the headline **in the
HTML** (not just a JS bundle). `pnpm preview` → no hydration mismatch warnings.

---

### Task 0.5: Black & white token system

**Files:** Create `src/styles/tokens.css`; Modify `src/index.css` (import tokens, strip v3 cyan-wash globals as sections are migrated).

**Steps:**
1. `src/styles/tokens.css` — the monochrome palette (design doc §3.1):
   ```css
   :root {
     --bg: #0A0B0D; --bg-raised: #121317;
     --line: rgb(255 255 255 / 0.08);
     --text: #F4F5F7; --text-dim: #8A8F98; --text-faint: #5A606B;
     /* verb hues — used ONLY inside a live run (design doc §3.4) */
     --verb-infer: #5b8cff; --verb-exec: #ff7a3c;
     --verb-invoke: #22d3ee; --verb-agent: #b07bff;
   }
   ```
2. Wire into Tailwind v4 `@theme` so `bg-bg`, `text-dim`, `border-line` exist.
3. **Commit:** `feat(design): black & white token system`.

**Verify:** `GATES`. A scratch component using the tokens renders grayscale.

---

### Task 0.6: The shell — Nav, Footer, EdgeAurora

**Files:** Create `src/shell/Nav.tsx`, `src/shell/Footer.tsx`, `src/fx/EdgeAurora.tsx`; Modify `src/shell/RootLayout.tsx`.

**Steps:**
1. `Footer.tsx` — **port the existing v3 footer verbatim** (the SUPERNOVAE wordmark
   block, design doc §"footer kept"). Keep its markup; only swap colors to tokens.
2. `Nav.tsx` — sticky bar (design doc §7): logo · `Product ▾` mega-menu (3-col grouped) ·
   Docs · Spec · Blog · Changelog · GitHub ↗ · one solid `Install`. Transparent
   over hero → solid hairline on scroll (IntersectionObserver on a hero sentinel).
3. `EdgeAurora.tsx` — a fixed, `pointer-events:none` blurred conic-gradient ring
   hugging the viewport frame; `--aurora-intensity` CSS var (default ~0.06,
   "breathing"). Exposes `pulse()` (bumps intensity then decays) on a context so
   the run can beat it (design doc §3.2). Respect `prefers-reduced-motion`.
4. Wire all three into `RootLayout`.
5. **Commit:** `feat(shell): nav, footer (kept), reactive edge aurora`.

**Verify:** `SHOT` of any route → black page, hairline nav, footer intact, aurora barely visible/breathing. `GATES`.

---

## Phase 1 — The hero (DOM-first, instant, SEO)

### Task 1.0 (cross-repo): author the hero workflow in nika-spec

**Files (in the public [nika-spec](https://github.com/supernovae-st/nika-spec) repo):** Create
`examples/showcase/morning-brief.nika.yaml` (all 4 verbs, design doc §5.1);
regenerate `examples → usecases-yaml.generated.ts` via
`python3 scripts/showcase-projector.py --write`; regenerate canon if needed.

**Why:** AGENTS.md forbids hand-typed example YAML on the site. The hero file
MUST come from the projector so it stays spec-valid and drift-gated.

**Steps:**
1. In nika-spec, write `morning-brief.nika.yaml` (confirm `exec:`/`agent:` field
   names against `spec/02-verbs.md`; use `model: ollama/qwen2.5` — local-first).
2. Run the projector; confirm `morning-brief` appears in the website's
   `src/sections/usecases-yaml.generated.ts` with its `ShowcaseDag`.
3. Run the drift gate `--check`.
4. **Commit (spec repo):** `feat(showcase): morning-brief — hero workflow (4 verbs)`.
5. **Commit (website):** the regenerated `usecases-yaml.generated.ts` only.

**Verify:** the generated module exports `morning-brief` SHOWCASE_YAML + DAG; `--check` clean.

---

### Task 1.1: The code-file panel (reuse CodeMirror)

**Files:** Create `src/components/CodeFile.tsx`, `src/components/CodeFile.test.tsx`.

**Context:** `@uiw/react-codemirror` + `@codemirror/lang-yaml` are already deps and
already used (the UseCases YAML panel). Reuse them, read-only, monochrome theme,
plus a per-verb glyph gutter.

**Steps (TDD for the verb-glyph logic):**
1. **Failing test** `CodeFile.test.tsx`: `verbGlyph('infer') === '◇'`, `verbGlyph('exec') === '▷'`, `verbGlyph('invoke') === '◆'`, `verbGlyph('agent') === '✦'`; unknown → `'·'`.
2. `UNIT` → fails (no `verbGlyph`).
3. Implement `verbGlyph` + the `<CodeFile yaml glyphLines>` component (CodeMirror read-only, `--text`/`--text-dim`, no line wrap, a copy button).
4. `UNIT` → pass.
5. **Commit:** `feat(hero): monochrome CodeFile panel with verb glyphs`.

**Verify:** `UNIT`. `SHOT`: renders the `morning-brief` YAML crisply in grayscale.

---

### Task 1.2: The hero section (DOM, zero WebGL)

**Files:** Create `src/sections/Hero.tsx`; Modify `src/pages/Home.tsx`.

**Steps:**
1. `Hero.tsx` (design doc §4): `FIG 0.0` label · `<h1>Intent as Code.</h1>` (real
   text) · subhead · install line (`brew install …` + copy, version/OS micro-meta)
   · one solid `Install` CTA + flat `Star on GitHub` / `Read the spec` · the
   `<CodeFile>` showing `morning-brief`. Pure DOM + tokens. EffectBudget: `webgl:false, aurora:'idle'`.
2. Mount as the first thing in `Home.tsx`.
3. **Commit:** `feat(hero): DOM-first hero — instant, SEO, product-first`.

**Verify:** `SEO`: `dist/index.html` contains `<h1>Intent as Code.` and the subhead
text. `SHOT`: matches the §4 mockup. Lighthouse/`preview` first paint has the
headline without JS. `GATES`.

---

## Phase 2 — The Living File centerpiece

### Task 2.1: The run model (the heart — full TDD)

**Files:** Create `src/sections/living/run-model.ts`, `src/sections/living/run-model.test.ts`.

**Context:** Pure, deterministic function: given a `ShowcaseDag` (from the
generated module) + a scroll progress `t ∈ [0,1]`, return each node's state,
elapsed time, and the **event log** (both pretty-CLI lines and NDJSON events) up
to `t`. This drives both the 3D corridor and the textual stream, so it must be
unit-tested hard. Formats from design doc §5.4 (real spec formats).

**Steps (TDD):**
1. **Failing tests** `run-model.test.ts`:
   - `runStateAt(dag, 0)` → all nodes `pending`, empty log.
   - `runStateAt(dag, 1)` → all nodes `success`, log ends with `workflow.completed` + `exit:0`.
   - Topological correctness: node N is never `running`/`success` before all `deps` are `success`.
   - Parallel wave: two dep-free nodes both `running` at the same `t`.
   - NDJSON shape: every event has `{ kind, task_id?, payload }`; kinds drawn from the closed set (`workflow.started|completed`, `task.started|completed|failed|cancelled`, `infer.delta|usage|done`, `exec.output`, `invoke.result`).
   - Pretty line shape: a completed task yields `✓ <id>  T+mm:ss.ms  …`.
   - **Failure mode**: `runStateAt(dag, t, { failAt: 'report' })` → `report` `failure` with `{ code:'NIKA-EXEC-001', category, transient:false, task_id, attempt }`, downstream `ship` `cancelled`, log ends `exit:1`.
2. `UNIT` → fails.
3. Implement `run-model.ts`: derive per-wave time budget from `dag.waves`, map `t` → node states; synthesize CLI + NDJSON lines deterministically (no randomness — vary only by node index). Pull error codes from `public/errors/catalog.json` (import as JSON).
4. `UNIT` → all pass.
5. **Commit:** `feat(living): deterministic run-model (states + CLI + NDJSON)`.

**Verify:** `UNIT` green. This task gates 2.3/2.4 — do not proceed until solid.

---

### Task 2.2: Phase-2 visual — file → 2D DAG (reuse RunSim)

**Files:** Create `src/sections/living/FileToDag.tsx`; reference `src/sections/RunSim.tsx`, `src/sections/transform-data.ts` (VERB_COLOR).

**Steps:**
1. Extract the 2D node/edge SVG layout from `RunSim.tsx` into a reusable
   `<DagFlat dag nodeState>` (lines detach from `<CodeFile>` → nodes). Monochrome
   nodes; verb hue only on the `running` node (§3.4), via `--verb-*`.
2. Drive `nodeState` from `runStateAt` (Task 2.1).
3. **Commit:** `feat(living): file → 2D DAG morph (reuses RunSim layout)`.

**Verify:** `SHOT`: the §5.2 Phase-2 mockup; nodes grayscale, one tinted while running. `GATES`.

---

### Task 2.3: Phase-3 visual — the 3D depth corridor

**Files:** Create `src/scene/corridor/Corridor.tsx`, `src/scene/corridor/Grid.tsx`, `src/scene/corridor/Nodes.tsx`, `src/sections/living/LivingFile.tsx` (the sticky host).

**Context:** One **lazy** `<Canvas>`. The sticky host is ~300vh; its scroll
progress (`getBoundingClientRect`) feeds `useFrame`. Per-node activation uses the
drei `useScroll` math pattern (`range(start,dist)` to light a verb, `curve()` for
the focal bloom) applied to our own progress. **No drei `<Text>`** — node labels
are DOM overlays positioned from projected node coords.

**Steps:**
1. `LivingFile.tsx`: sticky 300vh wrapper; compute `progress ∈ [0,1]`; `React.lazy`
   the Canvas; mount only when within ~1.5 viewports (IntersectionObserver);
   `frameloop="demand"`/paused when off-screen.
2. `Grid.tsx`: perspective floor+horizon grid receding to a vanishing point (depth).
3. `Nodes.tsx`: place DAG nodes along the corridor near→far; camera dollies forward
   with `progress`; node at focal plane lights its verb (from `runStateAt`),
   triggers `EdgeAurora.pulse()` on completion.
4. DOM label overlay synced to projected positions.
5. Low-end/reduced-motion fallback: render `<DagFlat>` (2.2) instead of the Canvas.
6. **Commit:** `feat(living): 3D depth corridor (grid, forward camera, scroll-scrub)`.

**Verify:** `SHOT` (swiftshader, `?freeze` at several progress values) ≈ §5.2 Phase-3
mockup; labels crisp; `prefers-reduced-motion` → flat DAG. `GATES`.

---

### Task 2.4: The live event stream (CLI ↔ NDJSON)

**Files:** Create `src/sections/living/EventStream.tsx`, `src/sections/living/OutputPanel.tsx`.

**Steps:**
1. `EventStream.tsx`: renders the log from `runStateAt` with a `pretty | ndjson`
   toggle (design doc §5.4). Pretty: `▶/✓/·`, verb hue on the active row only.
   NDJSON: raw `{kind,…}` lines, dim. Monospace, generous leading.
2. `OutputPanel.tsx`: the `outputs:` JSON on "stdout" + `exit 0` (or the typed
   error block + `exit 1` in failure mode).
3. Lay `<LivingFile>` (corridor) + `<EventStream>` side-by-side in the sticky
   section; both consume the same `progress`.
4. **Commit:** `feat(living): live CLI/NDJSON event stream + outputs panel`.

**Verify:** `SHOT`: matches the §5.4 dual-surface mockup; toggle works; failure path
shows `NIKA-EXEC-001` + cancelled downstream. `GATES`.

---

## Phase 3 — The remaining home sections

> Each: a `src/sections/<Name>.tsx`, mounted in `Home.tsx` in design-doc order
> (§6), FIG-numbered, monochrome, EffectBudget-gated, `GATES` + `SHOT`, one commit.

- **Task 3.1 — `Verbs.tsx`** (FIG 2.0): 2×2 grid of `infer/exec/invoke/agent`, each
  with glyph + one-line gloss + a 2-line spec snippet. Verb hue as a hairline accent only.
- **Task 3.2 — `BeyondChat.tsx`** (FIG 3.0): file vs chat/API/platform. **The acid
  moment** — a dosed fluid/warp on fast scroll, settling to still (EffectBudget `acid:true`, single strong effect).
- **Task 3.3 — `OwnWorkflows.tsx`** (FIG 4.0): port the existing local-first / "Own
  your workflows" block (AGPL · 14 providers · local-first), recolored B/W.
- **Task 3.4 — `Toolbelt.tsx`** (FIG 5.0): live counts from `CANON`
  (`src/canon.generated.ts`: 23 builtins · 14 providers = 8 cloud led by Mistral, 5
  local, 1 mock · 9 extract modes). Never hand-typed. Provider order: local-first.
- **Task 3.5 — Use cases** (FIG 6.0): reuse `UseCases.tsx`, calmed + B/W; each card
  opens a mini run (reuse `run-model` + `DagFlat`).
- **Task 3.6 — `ChangelogPreview.tsx`** (FIG 7.0): latest 3–4 dated entries.
- **Task 3.7 — `Proof.tsx`** (FIG 8.0): named quotes (when available) + ONE big
  number; placed late. Until quotes exist, lead with GitHub stars / provider count.
- **Task 3.8 — Final CTA + footer** (FIG 9.0): `Try Nika` CTA above the kept footer.

---

## Phase 4 — New pages

- **Task 4.1 — `/spec`** (`src/pages/Spec.tsx`): language reference rendered from
  in-repo `public/schema/workflow.json` + `public/errors/catalog.json` + `CANON`.
  FIG-numbered, Linear-`Method` register. Register route + `react-ssg.config.ts` + `useHead`.
- **Task 4.2 — `/changelog`** (`src/pages/Changelog.tsx`): full dated log; source
  from engine release notes where possible (else local MDX). Register route + SSG + head.
- **Task 4.3 — `/use-cases`** (`src/pages/UseCasesPage.tsx`): gallery of all 27
  `SHOWCASE_YAML` workflows; each → a Living-File mini-run. Register route + SSG + head.

Each: **Commit** `feat(pages): <route>`; `SEO` (prerendered HTML has the page's H1) + `GATES`.

---

## Phase 5 — v3 easter egg, perf, polish, ship

- **Task 5.1 — v3 galaxy as easter egg** (`src/scene/galaxy/` lazy chunk +
  `src/fx/easter-egg.ts`): move the entire v3 scene behind a trigger (reload key,
  logo click, or typing `nika`) → "enter the galaxy"; lazy-loaded, never in the
  default bundle. **Commit** `feat(egg): v3 cinematic galaxy as enter-the-galaxy egg`.
  Verify: default `dist` bundle excludes the galaxy chunk (`du`/bundle report); trigger loads it.
- **Task 5.2 — reduced-motion + perf tiers** (`src/fx/perf-tier.ts`, TDD the
  tier-selection pure fn): coarse WebGL/devicePixelRatio probe → corridor degrades
  to `DagFlat`; DPR cap; every effect has a static fallback. `UNIT` + `SHOT` (emulate reduced-motion).
- **Task 5.3 — live-URL contracts**: confirm `public/{install.sh,llms.txt,schema/*,errors/*,404.html}` still served + in sync. `SEO` each.
- **Task 5.4 — final pass**: headless `SHOT` of every route; Lighthouse (perf/SEO/a11y) ≥ target; `GATES`. **Commit** `chore(v4): ship checklist green`.

---

## Definition of done (v4)
- Hero headline + copy present in prerendered HTML (SEO); first paint < ~300ms, 0 WebGL on hero.
- The Living File reads as a real engine: file → 2D DAG → 3D corridor → CLI/NDJSON
  stream → outputs, with a believable failure path (`NIKA-XXX`).
- Page is black & white; color only in the live run + the reactive aurora.
- All YAML projected from nika-spec; all counts from `CANON`; live URLs intact.
- v3 galaxy reachable only as the easter egg; default bundle excludes it.
- `GATES` green; headless screenshots match the design doc across routes.
- Merge `v4-trust-landing` → `main` (squash) only when the operator approves.

---

## Open questions to resolve during execution
(see design doc §12) — `/spec` bespoke vs docs redirect · `/changelog` source ·
proof: quotes vs big-number · corridor low-end fallback shape · verbs-in-run
strict-grayscale vs whisper (current default: **whisper on the active node**).
