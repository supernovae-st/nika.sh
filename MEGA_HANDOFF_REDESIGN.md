# MEGA HANDOFF — nika.sh redesign (Aura/Nexus aesthetic)

> **Status**: Active. Created 2026-04-14.
> **Vision**: Aura.build / Nexus AI Platform aesthetic — editorial, modern,
> live-data-driven, cinematic motion, dashboard widgets showing Nika's
> growth in real-time.
>
> **Why this handoff**: previous iterations were "AI slop" (dot grid hero,
> ASCII boxes, mono fatigue, mixed typography). This document locks the new
> direction with concrete decisions, agent-validated stack, and an
> executable phase plan.

---

## 🔴 P0 FIXES (post-architect review 2026-04-14)

Before writing a single component — 3 blockers from architect pressure-test:

**P0-1 · Kill `@paper-design/shaders-react`** — **PolyForm Shield license**, NOT MIT.
Prohibits use in products competing with Paper. Contamination risk on AGPL project.
**→ Replace with** SVG `feGaussianBlur` eclipse (recipe in §color) OR hand-rolled WebGL
fragment shader (~80 LOC, zero dep) OR pure CSS radial-gradient.

**P0-2 · Bundle budget was ~50% undercount.** Real math: motion=34KB, NumberFlow=25KB,
cobe=5KB → ~150-200 KB realistic, not 92 KB.
**→ Fix** : use `LazyMotion` + `m` components (Motion 34KB → 4.6KB), add `size-limit`
CI check hard-blocking 120 KB gzipped.

**P0-3 · `src/data/*.json` gitignored without stubs = CI-fatal on fresh clone.**
**→ Fix** : commit `dashboard.stub.json` + `github-metrics.stub.json` with zero-values.
Build overwrites. 30 min work.

### P1 corrections

- `astro:fonts` + Geist Google Fonts: OT features `ss01` don't work via Google provider.
  → Use `fontProviders.fontsource()` OR npm `geist` package + `fontProviders.local()`.
- Motion v12.38 installed. Vendored Aceternity expects framer-motion 10-11. Breaking
  changes on `AnimatePresence` + `useSpring`. Audit migration before vendoring.
- `cargo nextest list --message-format json` doesn't give per-crate counts directly.
  Parse `testBinaryId`, group manually. +3-4h Phase 3.
- `repository_dispatch` needs PAT with `Actions: write` scope on nika.sh, not DO token.
- `backdrop-filter` over WebGL on Safari = known bug. Interpose DOM layer. +4h CSS.
- Mintlify → Starlight = **10-12 days realistic**, not 5 (Inkeep setup = 4-6h alone).

### Missing from original plan (add)

- **Rollback strategy**: branch `redesign`, staging bucket, tag known-good SHA before Phase 1.
- **CSP**: explicit `script-src`/`style-src`/`connect-src` for WebGL + external fonts.
- **Cross-repo JSON schema**: `dashboard.schema.json` versioned, validated in CI.

---

## 🎯 AURA TEMPLATE EXTRACTIONS (live Firecrawl scrape)

Agent 12 scraped 4 live Aura templates with Firecrawl v2 and extracted the ACTUAL HTML/CSS. Key findings:

### The 8 custom utility classes Aura uses

```
tactile-glass       → backdrop-blur glass surface with 1px border
btn-physical-light  → raised CTA with inset highlight + gradient
pipeline-shell      → vertical timeline container
pipeline-spine      → center line with animated beam
pipeline-beam       → scroll-driven progress glow
pipeline-step       → individual stage wrapper (alternates left/right)
step-copy           → text column (label + heading + description)
step-card           → card column (icon + metric + progress)
step-node           → center dot on the spine with ring + inner dot
```

### Floating pill nav (Nexus) — VERIFIED HTML

```html
<nav class="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)]
            max-w-5xl rounded-full tactile-glass px-4 py-3
            flex items-center justify-between
            transition-transform duration-500 hover:translate-y-[-2px]">
  <div class="flex items-center gap-8 pl-2">...</div>
  <a class="btn-physical-light rounded-full px-5 py-2 text-sm font-normal">Deploy Core</a>
</nav>
```

### Live status pill under hero

```html
<div class="inline-flex items-center gap-3 rounded-full tactile-glass px-3 py-1.5
            text-xs text-zinc-300 mb-8 shadow-2xl">
  <span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-500
               shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
  Nexus AI Gen-3 Architecture Online
</div>
```

### Status pill palette (LOCKED — steal this)

```html
<!-- NOMINAL (green) -->
<span class="text-[10px] text-emerald-400 font-mono border border-emerald-500/20
             bg-emerald-500/10 px-2 py-0.5 rounded">NOMINAL</span>

<!-- CRITICAL — INTENTIONALLY NEUTRAL ZINC, NOT RED -->
<span class="text-xs text-zinc-300 px-2 py-0.5 rounded
             border border-zinc-600/50 bg-zinc-700/50">CRITICAL</span>
```

**Critical insight**: CRITICAL is intentionally NOT red — Aura keeps palette cohesion. Steal this.

### Animated conic-gradient CTA (from Slash template) — the WOW button

```html
<button class="group flex overflow-hidden uppercase transition-all duration-500
               hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]
               text-xs font-semibold text-white tracking-widest rounded-full
               pt-4 pr-8 pb-4 pl-8 relative">
  <!-- Layer 1: rotating conic border -->
  <div class="absolute inset-0 -z-20 rounded-full overflow-hidden p-[1px]">
    <div class="absolute inset-[-100%]
                bg-[conic-gradient(from_0deg,transparent_0_300deg,#3B82F6_360deg)]"
         style="animation: beam-spin 3s linear infinite;"></div>
    <div class="absolute inset-[1px] rounded-full bg-[#020205]"></div>
  </div>
  <!-- Layer 2: inner surface + dot pattern -->
  <div class="-z-10 overflow-hidden bg-[#020205] rounded-full absolute inset-[2px]">
    <div class="absolute inset-0 bg-gradient-to-b from-zinc-800/60 to-transparent"></div>
    <div class="opacity-30 mix-blend-overlay absolute inset-0"
         style="background-image: radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px);
                background-size: 12px 12px; animation: dots-move 8s linear infinite"></div>
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2
                bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/30"></div>
  </div>
  <span class="relative z-10">Run a workflow</span>
</button>
```

Pure CSS, 4 layers, recolored to our blue brand. Use for primary hero CTA.

### SVG network mesh (pure SVG — NOT Three.js)

```html
<div class="rounded-[2rem] p-1 bg-gradient-to-b from-zinc-800/50 to-transparent
            relative overflow-hidden h-[450px] md:h-[550px]">
  <!-- Grid floor -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),
                                    linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]
              bg-[size:40px_40px] opacity-60"></div>
  <!-- Animated dashed data lines -->
  <svg viewBox="0 0 100 100" preserveAspectRatio="none"
       class="absolute inset-0 w-full h-full opacity-60"
       style="filter: drop-shadow(0 0 6px rgba(59,130,246,0.6));">
    <path d="M 25 35 Q 37 24 50 25" fill="none" stroke="#3B82F6" stroke-width="0.3"
          stroke-dasharray="1.2 1.2" class="animate-data-link"
          style="animation-duration: 3s;"/>
    <!-- 4 more paths -->
  </svg>
  <!-- Pulsing node -->
  <div class="absolute w-5 h-5" style="top: 35%; left: 25%;">
    <div class="absolute w-full h-full bg-blue-500/20 rounded-full animate-ping"></div>
    <div class="w-1.5 h-1.5 bg-white rounded-full animate-pulse-node"></div>
  </div>
</div>
```

**Key insight**: Aura uses SVG for network mesh, NOT Three.js. Lighter, iOS-safe, no WebGL cost.

### Mac terminal traffic lights with staggered blink

```html
<div class="flex gap-1.5 mr-4">
  <div class="w-3 h-3 rounded-full bg-zinc-800"
       style="animation:blinkNode 2s infinite"></div>
  <div class="w-3 h-3 rounded-full bg-zinc-800"
       style="animation:blinkNode 2s infinite .4s"></div>
  <div class="w-3 h-3 rounded-full bg-zinc-800"
       style="animation:blinkNode 2s infinite .8s"></div>
</div>
<div class="h-6 px-3 rounded-md tactile-inset flex items-center text-xs text-zinc-500
            font-mono tracking-widest border border-zinc-900">nexus_cluster_01</div>
```

### Typography on Nexus — NO italic serif

Nexus uses Inter weight 400 only. The italic serif pattern comes from the **Slash / Crypto Trading** template, using **Newsreader** (Google Fonts) not Instrument Serif:

```html
<h1 class="text-5xl md:text-7xl font-newsreader font-medium italic
           text-white mb-6 leading-[1.1] max-w-4xl tracking-tight">
  Trading infrastructure <br>
  <span class="not-italic text-transparent bg-clip-text
               bg-gradient-to-r from-purple-300 via-white to-indigo-300">
    for the decentralized era
  </span>
</h1>
```

**Pattern**: whole H1 italic serif + non-italic gradient span for the "promise" clause.

### Nexus hero — big sans only (alternative path)

```html
<h1 class="mx-auto max-w-5xl text-4xl sm:text-6xl lg:text-[5.2rem]
           font-normal tracking-tight text-zinc-50 leading-[0.95]
           drop-shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
  <span class="block">The intelligence layer for</span>
  <span class="block mt-2 text-zinc-300">next-gen models.</span>
</h1>
```

**2 paths available**: Nexus (Inter only, confident big sans) vs Slash (Newsreader italic + gradient). User choice per site mood.

### Giant serif watermark (Nexus decorative)

```html
<span class="absolute -top-10 -right-4 text-[180px] font-serif text-white opacity-[0.02]
             group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none
             leading-none group-hover:rotate-12 group-hover:scale-110">A</span>
```

Italic serif appears ONLY as background watermark in Nexus, at 2-6% opacity, rotating on hover. Elegant steal.

### Word-by-word rise-rotate reveal (Fintech SaaS / Stripe-style)

```html
<h1 class="text-5xl md:text-6xl lg:text-[5rem] leading-[1.05] tracking-tight
           text-slate-900 font-normal mb-6">
  <span class="inline-block overflow-hidden align-bottom">
    <span class="inline-block opacity-0 translate-y-[110%] rotate-3 origin-top-left
                 animate-reveal-word" style="animation-delay: 0.2s;">Financial</span>
  </span>
  <!-- repeated per word with +0.04s delay -->
</h1>
```

### Top 3 MUST STEAL for nika.sh

1. **Nexus nav + live status pill** — `tactile-glass` floating pill + glowing dot with narrative-verb phrasing
2. **Slash animated conic-gradient CTA** — 4-layer pure-CSS button with rotating blue beam
3. **Nexus vertical pipeline timeline** — perfect semantic match for Nika's 5 verbs (fetch → bind → infer → invoke → event). Rename Aura's stages.

### Tech stack reality check (verified from HTML)

| Aura uses | Required for us | Our choice |
|---|---|---|
| React + Vite SPA | No | Astro static + React islands |
| Tailwind + ~8 custom classes | ✅ keep classes | Write our own tactile-glass et al. |
| Iconify web component | ✅ easy | `lucide-react` or `@iconify/react` |
| Three.js via CDN (hero only) | **NO — kill it** | Replaces with SVG feGaussianBlur eclipse |
| Custom CSS keyframes (blinkNode, beam-spin, dots-move, radar-sweep, reveal-word, data-link, pulse-node) | ✅ | ~40 lines global CSS |
| IntersectionObserver `.reveal-item.reveal-active` | ✅ | Motion LazyMotion or custom IO |

**Zero patterns are proprietary to Aura.** Moat = AI generation workflow, not output. Output = shadcn-grade Tailwind.

---

## 0. Reference + agent research feeding this doc

Primary reference: **https://nexus-ai-platform.aura.build/**

Secondary references: aura.build templates · linear.app · vercel.com · resend.com · trigger.dev · convex.dev · cursor.com · cobe-globe demos · paper.design

**Agents that ran 2026-04-14** (background swarm):

| Agent | Focus | Status |
|---|---|---|
| 1 | Aura templates Firecrawl scrape | 🟡 in progress |
| 2 | Editorial typography (serif italic + sans) | ✅ done |
| 3 | Three.js eclipse + Unicorn Studio + widgets | ✅ done |
| 4 | Stack analysis (stay Astro vs switch) | ✅ done |
| 5 | Live dev evolution dashboard | ✅ done |
| 6 | Component blocks curation (Aceternity/Magic/Cult) | ✅ done |
| 7 | Animation choreography | ✅ done |
| 8 | Mintlify aesthetic upgrade | ✅ done |
| 9 | Brand voice + copy rewrite | ✅ done |
| 10 | SEO + meta strategy 2026 | ✅ done |
| 11 | Color + gradient + glow system (OKLCH) | ✅ done |
| 12 | Aura templates Firecrawl deep scrape | ✅ done |
| A | Architect pressure-test review | ✅ done |

---

## 1. Vision

**nika.sh becomes a live, editorial dashboard for Nika's evolution.**

Not a static brochure — a **living window into the chrysalis**. Every page has at
least one live data widget. Aesthetic = **editorial cinematic** (italic serif
punctuating sans-serif headlines) + **dashboard-grade interactive widgets**
(eclipse hero, network mesh, vertical pipeline, terminal demo, telemetry strip).

**Three pillars:**

1. **Editorial typography** — Geist Sans + Instrument Serif Italic. ONE serif
   word per headline. Tracking tight, optical-size aware.
2. **Live dev evolution** — GitHub API + Rust workspace introspection at
   build-time. Every counter is a real number. Nightly rebuild via cron.
3. **Cinematic motion** — eclipse hero with corona, vertical pipeline timeline,
   network mesh visualization, scroll-driven choreography. WOW without slop.

---

## 2. Stack (LOCKED — agent 4 verdict)

**STAY ON ASTRO 5.** Switch would cost 40-60h with zero user-facing benefit.
Astro's islands architecture = exactly the right primitive for marketing site
with heavy interactivity in localized zones (hero, dashboard, terminal) and
static content everywhere else.

**Add to current stack:**

| Lib | Bundle (gz) | Why | Lazy strategy |
|---|---|---|---|
| `motion@11+` (already in) | ~28 KB | Animations, scroll, springs | Above-fold + `client:visible` |
| `@number-flow/react` | ~8 KB | Animated digit-rolling counters | `client:visible` |
| `cobe` | ~12 KB | Globe (mesh provider visualization) | `client:visible` |
| `@paper-design/shaders-react` | ~15 KB | Mesh gradient + corona shaders | `client:visible` |
| `cmdk` + `@leeoniya/ufuzzy` | ~10 KB | Command palette (Cmd+K) | First key-press only |
| `lucide-react` (stable) | ~3-5 KB | Icons (tree-shaken) | Per page |
| Tremor *(optional)* | ~22 KB | Dashboard widget primitives | Dashboard pages only |
| GSAP `ScrambleTextPlugin` *(optional)* | ~15 KB | Hover scramble (free post-Webflow 2024) | Dynamic import on hover |

**TOTAL JS bundle target**: ~92 KB gzipped for full homepage. Comfortable
under 120 KB cap → Lighthouse 92-96 mobile.

**Skip these (slop or wrong fit):**
- ❌ Three.js dot grid hero (overused 2024)
- ❌ Unicorn Studio embed (vendor lock-in, ~70 KB UMD, no code control)
- ❌ Lottie (dead end in 2026)
- ❌ Recharts heavyweight (use shadcn/ui charts which wrap Recharts but tree-shake)
- ❌ React Flow (32 KB) for decorative DAG — use Motion-animated SVG instead (~6 KB)
- ❌ Switch to Next.js (rewrite cost > benefit for marketing site)

**DO NOT ADD as deps** — copy-paste libraries:
- Magic UI components (vendor into `src/components/magic/`)
- Aceternity UI components (vendor + patch `next/link` → `<a>`)
- Cult-UI patterns (copy what's needed)

---

## 3. Typography (LOCKED — agent 2 verdict)

### Stack

```
Display (sans):    Geist Variable    SIL OFL    free   ~45 KB subset Latin-1
Editorial italic:  Instrument Serif  SIL OFL    free   ~18 KB subset Latin-1
Body:              Geist             same as display
Mono (code):       Geist Mono        SIL OFL    free   ~18 KB subset Latin-1
```

Total typography budget: ~63 KB WOFF2 subsetted. Three files. Self-hosted via
`astro:fonts` experimental API.

### `astro.config.mjs`

```js
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  experimental: {
    fonts: [
      { provider: fontProviders.google(), name: 'Geist',
        cssVariable: '--font-sans', weights: ['400', '500', '600', '700'],
        display: 'swap', subsets: ['latin'] },
      { provider: fontProviders.google(), name: 'Geist Mono',
        cssVariable: '--font-mono', weights: ['400', '500'],
        display: 'swap', subsets: ['latin'] },
      { provider: fontProviders.google(), name: 'Instrument Serif',
        cssVariable: '--font-serif', styles: ['italic'], weights: ['400'],
        display: 'swap', subsets: ['latin'] },
    ],
  },
});
```

### Headline pattern (editorial italic accent)

```html
<h1 class="display">
  Workflows for AI <em>in a single YAML file.</em>
</h1>
```

```css
.display {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: clamp(2.5rem, 4vw + 1rem, 5rem);
  letter-spacing: -0.025em;
  line-height: 1.05;
  text-wrap: balance;
}
.display em {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.015em;
  font-size: 1.05em;  /* italic x-height differs */
}
```

### Rules (anti-slop)

- ✅ ONE italic word per headline. Never a whole italic phrase.
- ✅ Italic on the **noun** that matters ("YAML file", "Architecture", "Inference").
- ❌ Never on function words ("the", "of", "and").
- ✅ `text-wrap: balance` on all headlines.
- ✅ `font-feature-settings: 'ss01', 'kern', 'liga', 'calt'` globally.
- ✅ `size-adjust` + `ascent-override` on fallback to prevent CLS.

---

## 4. Color palette (LOCKED — BLUE brand)

### Surfaces

```css
--bg:           #08090C;   /* near-black, slight blue tint */
--surface:      #0F1117;
--surface-2:    #161922;
--surface-3:    #1E2230;
--border:       #1F2330;
--border-bright:#2D3243;
```

### Text

```css
--fg:        #FAFAFA;   /* white */
--fg-mute:   #A1A1AA;
--fg-dim:    #71717A;
--fg-ghost:  #3F3F46;
```

### Brand — BLUE

```css
--brand:        #3B82F6;   /* blue-500, primary CTA + brand */
--brand-hover:  #60A5FA;
--brand-soft:   #1E3A8A;   /* blue-900, glow halo */
```

### Accents (sparingly — status pills, chart highlights)

```css
--cyan:    #22D3EE;   /* code highlights, hover glows */
--violet:  #8B5CF6;   /* gradient companion */
--green:   #10B981;   /* NOMINAL pills, success */
--amber:   #F59E0B;   /* WARNING, "admitted" pulse */
--red:     #EF4444;   /* CRITICAL, errors */
```

### Gradient halos (for eclipse + glow effects)

```css
--glow-blue-violet: radial-gradient(circle at center,
  #3B82F6 0%, #8B5CF6 50%, transparent 100%);
--glow-cyan-emerald: radial-gradient(circle at center,
  #22D3EE 0%, #10B981 60%, transparent 100%);
```

---

## 5. Component inventory (priority-ranked from agent 6)

### MUST SHIP day 1 (P0, ~45 KB total)

1. **Hero with eclipse + floating pill nav** — Aceternity `Spotlight` + CSS radial-gradient sphere + Magic UI `Dock` for nav. (~14 KB)
2. **Editorial split-headline** — custom typography (no library). (~3 KB)
3. **Live status badge** — Magic UI `AnimatedShinyText` + pulsing dot. (~2 KB)
4. **Terminal demo** — Magic UI `<Terminal>` + `<TypingAnimation>` (vendored). (~5 KB)
5. **Trust strip** — Magic UI `Marquee` for provider logos. (~4 KB)
6. **Bento grid** — Magic UI `BentoGrid` + `MagicCard` per cell (scoped spotlight). (~4 KB)
7. **Mega-CTA** — Magic UI `AnimatedGradientText` + `ShimmerButton`. (~4 KB)

### v0.2 SHIP (P1)

8. **Vertical pipeline timeline** — Aceternity `Timeline` (scroll-draws line). (~7 KB)
9. **Network mesh** — Magic UI `AnimatedBeam` + `Globe` (cobe under). (~18 KB)
10. **Comparison table** — Origin UI variant (Nika vs LangChain vs n8n). (~3 KB)
11. **Live changelog feed** — Cult-UI `Announcement` block, build-time fetched. (~3 KB)
12. **Dashboard widget grid** — shadcn/ui charts + Tremor primitives. (~22 KB lazy)
13. **Mouse-follow spotlight** wrapper — Aceternity `Spotlight`. (~3 KB)

### v0.3 (P2)

14. **Code-vs-output split** — shadcn `ResizablePanel` + Motion-SVG DAG.
15. **Numbered capability index** — Cult-UI `Feature Grid` pattern.
16. **Cmd+K command palette** — `cmdk` + `uFuzzy` over docs/errors/changelog index.
17. **Architecture page** — interactive crate dependency graph (hand-rolled SVG).

---

## 6. Animation choreography (LOCKED — agent 7 verdict)

### Stack

- **Primary**: Motion (`motion/react` + `motion`) v11+ — declarative variants.
- **Counters**: NumberFlow (`@number-flow/react`) — digit-roll, tabular nums.
- **Cmd-K**: cmdk + uFuzzy — open-source standard.
- **Page transitions**: Astro `<ClientRouter />`.
- **Progress bar**: inline 40-line custom (no NProgress).
- **Scramble** (optional): GSAP `ScrambleTextPlugin` (free post-Webflow).
- **Skip Lenis** — native scroll is fine in 2026.

### Hero entry sequence (page load)

```
0ms     Header pill nav fade-in
100ms   Live status badge slide-in (+ pulsing dot)
300ms   Headline reveal — line-by-line gradient unmasks
500ms   Subtitle fade
700ms   CTAs slide-up
600ms   Eclipse scale-in 0.95→1 + corona pulse (concurrent)
1000ms  Trust strip fade
```

Pattern: Motion staggered variants with `when: "beforeChildren"`, single
shared ease curve `[0.22, 1, 0.36, 1]`, durations 150/300/450/700ms.

### Anti-slop reveal recipe

- Translate **8px max**, not 40
- Duration **400-500ms**, not 800
- Ease `[0.22, 1, 0.36, 1]` (ease-out-quint)
- Blur 6px → 0 (gated to `min-width: 768px`)
- Stagger siblings by **60ms**, not 150
- Trigger at `margin: -10%` (slightly before in view)
- `once: true` ALWAYS

### Mouse parallax — spring-physics, max ±8px

Linear/Vercel pattern: translate background layers by fraction of mouse delta,
clamp to ±8px on hero, ±4px cards, ±2px text. Disable below 768px (touch).
Disable on `prefers-reduced-motion`.

### Magnetic hover — primary CTAs only

Restraint. ONE button gets magnetic, not all. ±20% pull strength, spring
return. ~20 LOC custom (no library).

### Number counters — NumberFlow + IntersectionObserver

Trigger once on scroll-into-view (threshold 0.3). NumberFlow handles digit
rolling, locale formatting, `prefers-reduced-motion` automatically.

### Page transitions

Astro `<ClientRouter />` with persistent header (`transition:persist`) +
shared element morph for logo (`transition:name="logo"`). Inline progress bar
as the *real* transition signal.

---

## 7. Live data integration (LOCKED — agent 5 verdict)

### Pattern: build-time JSON + nightly cron + webhook on push

NO runtime polling. NO loading spinners. Data is fresh because rebuilds happen
nightly (06:00 Paris) AND on every push to `nika-diamond` branch.

### What's live (real numbers)

| Metric | Source | Cadence |
|---|---|---|
| Organs admitted | `find tools -name Cargo.toml \| wc -l` | Each build |
| LOC per crate | `tokei tools/` JSON output | Each build |
| Tests per crate | `cargo nextest list --message-format json` | Each build |
| Mutation score | `cargo mutants --json` | Weekly |
| Clippy warnings | `cargo clippy --message-format json` | Each build |
| Last commit | GitHub API `/repos/.../commits` | Each build |
| Stars / contributors | GitHub API `/repos/.../stats/contributors` | Each build |
| CI status | GitHub API `/repos/.../actions/runs` | Each build |
| 7-day commit activity | GitHub API `/repos/.../stats/participation` | Each build |

### Implementation

**`xtask` Rust binary** in `nika` repo (`tools/xtask/src/dashboard.rs`):
- Runs `tokei`, `nextest list`, `mutants`, `clippy`, `unwrap` count
- Aggregates per-crate
- Writes `dashboard.json`

**`scripts/fetch-github-metrics.ts`** in `nika.sh` repo:
- Octokit client, fine-grained PAT (read-only public repo metadata)
- Fetches: stars, forks, issues, last commit, releases, CI runs, contributors
- Writes `src/data/github-metrics.json`

**Astro top-level await** in `.astro` frontmatter:
```astro
---
import dashboard from '../data/dashboard.json';
import metrics from '../data/github-metrics.json';
---
<LiveStat to={dashboard.total_loc} />
<LiveStat to={metrics.stargazers_count} suffix=" ★" />
```

**GitHub Action `nightly-rebuild.yml`** in `nika.sh` repo:
- `cron: '0 5 * * *'` (06:00 Paris UTC+1)
- `repository_dispatch` trigger from nika repo's push hook
- Checks out both repos, runs `cargo xtask dashboard`, fetches GitHub metrics, builds, deploys

**`notify-site.yml`** in `nika` repo:
- Triggers on push to `nika-diamond`
- Calls `repository_dispatch` on `nika.sh` repo

### Three concrete dashboard widgets (ship in P1)

**Widget 1 — Crate Constellation Grid**
- 5×8 grid of 40 cells (one per planned crate)
- Each cell: name, status pill (admitted/in-progress/planned), LOC counter, mutation % bar
- Admitted glow emerald, in-progress amber pulse, planned slate-grey
- Click → modal with crate spec
- Visual: Stripe API grid + macOS Activity Monitor cores

**Widget 2 — Built This Week**
- 4 cells: commits-7d (NumberFlow + sparkline), lines added/removed, last commit card, contributors avatars
- Source: GitHub API `listCommits` filtered to last 7 days

**Widget 3 — Quality Gates Board**
- 12 tiny cards, one per gate (SPEC, TDD, IMPL, CLIPPY, MUTATION, etc.)
- Aggregate green/amber/red status per gate across admitted crates
- Click → per-crate breakdown
- Differentiator: no other Rust project ships this publicly

---

## 8. Mintlify decision (agent 8 verdict)

**SWITCH from Mintlify to Astro Starlight** for docs.nika.sh.

Reasoning:
1. **Cohesion** — same Astro stack as marketing site. Shared tokens/components/fonts. Pixel parity.
2. **Real custom components** — `<EclipseHero>`, `<Pipeline>`, `<TerminalDemo>`, `<LiveStat>`, `<CrateCard>` become first-class with typed props.
3. **Stable theme tokens** — Starlight tokens are documented + versioned. Mintlify CSS vars are unstable (break between releases).
4. **Cost** — Starlight + Astro = free. Mintlify is paid beyond small tier.
5. **AGPL alignment** — Starlight MIT, no SaaS lock-in.

**Migration cost**: ~1 week including content port (MDX largely portable),
component parity, search (Pagefind built-in, free), AI chat bolted on
(Inkeep widget), DNS cutover.

**Components to build in Starlight:**
- `<EclipseHero>` — landing pages
- `<Pipeline>` — "how it works" diagrams
- `<TerminalDemo>` — code examples with live typing
- `<LiveStat>` — embedded metrics
- `<CrateCard>` — crate references with admission status
- `<Timeline>` — chrysalis growth narrative

This unifies marketing + docs under one design system.

---

## 9. Page-by-page plan

### `/` (homepage redesign)

```
PILL NAV (sticky top, glass)

HERO
 • Live status badge (animated shiny text + pulsing dot)
 • Editorial headline with italic accent
 • Subtitle (clear, friendly)
 • 2 CTAs (filled blue + ghost)
 • Eclipse centerpiece (CSS radial-gradient sphere + Aceternity Spotlight)
 • Trust strip (provider logo marquee)

VITAL SIGNS (4-up NumberFlow counters with sparklines)
 5/40 organs · 10,434 LOC · 369 tests · 0 unwrap

PIPELINE (vertical Aceternity Timeline, scroll-draws line)
 Editorial: "How an *organ* grows"
 12 gates: SPEC → TDD → IMPL → CLIPPY → ... → ATOMIC COMMIT

TERMINAL DEMO (Magic UI Terminal, scroll-triggered loop)
 Editorial: "It runs *like this*."
 Real `nika run triage.nika.yaml` execution

DASHBOARD GRID (6-up bento, Tremor + custom)
 Crate Constellation · Quality Gates · Built This Week · CI Status
 Provider parity · Open PRs

NETWORK MESH (Magic UI AnimatedBeam + cobe Globe)
 Editorial: "Routes to *any provider*."
 Anthropic · OpenAI · Google · Mistral · Ollama · GGUF

LIVE CHANGELOG (last 3 dev logs as cards)
 Editorial: "Built in *public*."

MEGA CTA
 Editorial: "Watch it *grow*."
 GitHub button + Install button

FOOTER
```

### `/method` (editorial article)

Manifesto from `NIKA_NARRATIVE_LOCKED.md`. Geist sans body + Instrument Serif
italic for callouts. 12 gates as numbered list with hover state. 7 shadow zones
as cards with status pills.

### `/architecture` (NEW)

Interactive deep dive:
- L0 → L5 layered architecture diagram
- Click crate → side panel with spec, LOC, tests, deps, status
- Live data: admitted (green), in-progress (amber), planned (dim)
- Hand-rolled SVG with Motion `pathLength` animation (no React Flow — saves 26 KB)

### `/changelog`

Linear-style spine timeline. Each entry: date + version + organ admitted +
mutation score + numbers grep-verified.

### `/blog/[slug]`

Editorial article style. Geist sans body, Instrument Serif Italic for callouts,
inline `<code>` Geist Mono cyan, code blocks in Mac terminal mockup.

### `/errors/[code]`

NIKA-XXX in serif italic display, description, help, example in terminal mockup,
related codes as numbered cards.

### `/install`

Hero with looped curl typing terminal. Platform matrix in numbered grid.
Provider keys as accordion.

### `/play` (placeholder for v0.95)

Replace ASCII placeholder. Editorial "Not yet *grown*." headline. Mockup of
future Leptos WASM playground.

### `/404`

NO ASCII. Editorial: "*This route* was never compiled." Subtle eclipse bg.
Return-home CTA.

### `/stats` (NEW, optional)

Pure dashboard mode. Every metric, no marketing. For us internally + power users.

---

## 10. Phase plan

### Phase 1 — Foundation (8-12h)

- [ ] Lock palette + typography in `global.css` (Geist + Instrument Serif Italic via `astro:fonts`)
- [ ] Vendor Magic UI components into `src/components/magic/`
- [ ] Vendor Aceternity components into `src/components/aceternity/` (patch `next/link`)
- [ ] Build primitives: `<PillNav>`, `<Headline>`, `<Card>`, `<StatusPill>`, `<LiveStat>` (NumberFlow), `<Terminal>`, `<DotGrid>`, `<MeshBg>`
- [ ] Add deps: `motion`, `@number-flow/react`, `cobe`, `lucide-react`
- [ ] Astro `<ClientRouter />` integration
- [ ] Inline 40-LOC progress bar component

### Phase 2 — Hero + value prop (12-16h)

- [ ] Build `<HeroEclipse>` (CSS sphere + Aceternity Spotlight + Magic UI Dock floating nav)
- [ ] Editorial split-headline component
- [ ] `<TerminalDemo>` with Magic UI Terminal vendored, real `nika run` script
- [ ] Trust strip with Marquee
- [ ] Hero entry choreography (Motion staggered variants)
- [ ] Mouse-parallax depth (spring physics, ±8px max)
- [ ] Rebuild `index.astro` with new sections
- [ ] Update Header (PillNav glass) + Footer

### Phase 3 — Live data (12-16h)

- [ ] `xtask/dashboard` Rust binary in `nika` repo (tokei + nextest + mutants + clippy + unwrap)
- [ ] `scripts/fetch-github-metrics.ts` in `nika.sh` repo (Octokit + PAT)
- [ ] `<DashboardGrid>` (6-up bento with real data)
- [ ] `<LiveChangelog>` GitHub-fetched cards
- [ ] `<NetworkMesh>` (Magic UI AnimatedBeam + cobe Globe)
- [ ] `<Pipeline>` vertical timeline (Aceternity Timeline pattern)
- [ ] Nightly rebuild GH Action + repository_dispatch from nika repo

### Phase 4 — Page rewrites (12-16h)

- [ ] `/method` editorial rewrite
- [ ] `/architecture` (NEW) with interactive crate graph
- [ ] `/changelog` Linear spine refinement
- [ ] `/errors/[code]` editorial style
- [ ] `/install` looped curl terminal
- [ ] `/blog/[slug]` editorial article style
- [ ] `/play` editorial placeholder (no ASCII)
- [ ] `/404` editorial (no ASCII)
- [ ] `/stats` (NEW, optional)

### Phase 5 — Polish (6-8h)

- [ ] Cmd+K command palette (cmdk + uFuzzy + build-time index)
- [ ] OG images per page (build-time, Satori)
- [ ] JSON-LD structured data (SoftwareApplication, Article, BreadcrumbList)
- [ ] GSAP ScrambleText on stats hover (dynamic import)
- [ ] Lighthouse audit + perf tuning (target 92+ mobile)
- [ ] `prefers-reduced-motion` audit per component
- [ ] iOS Safari testing (backdrop-filter, WebGL)

### Phase 6 — Mintlify → Starlight migration (1 week)

- [ ] Scaffold Astro Starlight at `docs/` subdomain (or subroute)
- [ ] Port MDX content (Mintlify → Starlight components, mostly compatible)
- [ ] Build custom MDX components: `<EclipseHero>`, `<Pipeline>`, `<TerminalDemo>`, `<LiveStat>`, `<CrateCard>`, `<Timeline>`
- [ ] Share `tokens.css` with marketing site (single source of truth)
- [ ] Override Starlight `<Header>` with PillNav from marketing
- [ ] Search via Pagefind (Starlight built-in, free)
- [ ] AI chat via Inkeep widget (one-line embed)
- [ ] Plausible analytics
- [ ] DNS cutover `docs.nika.sh` → Starlight deploy
- [ ] Keep Mintlify alive 1 week as safety net

**Total budget**: ~50-65 hours. Spread over 5-7 working days.

---

## 11. Files to create/modify

### New files

```
src/components/
  ui/
    PillNav.astro
    Headline.astro
    StatusPill.astro
    Card.astro
    NumberedCard.astro
    DotGrid.astro
    MeshBg.astro
    ProgressBar.astro
  react/
    Eclipse.tsx          (CSS sphere + Aceternity Spotlight wrapper)
    LiveStat.tsx         (NumberFlow + IntersectionObserver)
    Terminal.tsx         (Magic UI Terminal vendored)
    Pipeline.tsx         (Motion useScroll + path draw)
    NetworkMesh.tsx      (Magic UI AnimatedBeam + cobe Globe)
    DashboardGrid.tsx    (Tremor + shadcn charts)
    LiveChangelog.tsx    (GitHub API-fetched build-time)
    CmdK.tsx             (cmdk + uFuzzy palette)
    MagneticButton.tsx   (custom 20-LOC magnetic CTA)
  magic/                 (vendored Magic UI: Terminal, Marquee, Dock, etc.)
  aceternity/            (vendored Aceternity: Spotlight, Timeline, etc.)

src/sections/
  HeroEclipse.astro
  VitalSigns.astro
  PipelineSection.astro
  TerminalDemoSection.astro
  DashboardSection.astro
  NetworkMeshSection.astro
  LiveChangelogSection.astro
  MegaCTA.astro

src/pages/
  architecture.astro     (NEW)
  stats.astro            (NEW, optional)

scripts/
  fetch-github-metrics.ts
  build-search-index.ts  (for Cmd+K)

src/data/                (gitignored, generated)
  dashboard.json
  github-metrics.json
  search-index.json

.github/workflows/
  nightly-rebuild.yml    (cron + repository_dispatch)

# In nika repo:
tools/xtask/
  Cargo.toml
  src/main.rs            (xtask entry)
  src/dashboard.rs       (tokei + nextest + mutants + clippy + unwrap)
.github/workflows/
  notify-site.yml        (repository_dispatch trigger on push)
```

### Files to modify

```
astro.config.mjs        (add astro:fonts experimental)
src/styles/global.css   (rebuild with editorial typography + new tokens)
src/pages/index.astro   (full rewrite with new sections)
src/pages/method.astro  (editorial rewrite)
src/pages/install.astro (looped terminal demo)
src/pages/changelog/*   (Linear spine refinement)
src/pages/errors/*      (editorial style)
src/pages/blog/*        (editorial article style)
src/pages/404.astro     (kill ASCII, editorial)
src/pages/play.astro    (kill ASCII, editorial)
src/components/Header.astro (PillNav glass)
src/components/Footer.astro (cleaner)
package.json            (deps: motion, @number-flow/react, cobe, cmdk, etc.)
```

### Files to DELETE

```
src/components/react/HeroDots.tsx    (Three.js dot grid — slop)
src/components/react/RevealText.tsx  (replace with cleaner Reveal)
src/components/react/Reveal.tsx      (rewrite minimal)
src/components/react/CountUp.tsx     (replaced by NumberFlow)
```

---

## 12. Performance budget

| Asset | Target | Notes |
|---|---|---|
| HTML | 15 KB | Astro slim output |
| CSS | 25 KB | Tailwind v4 JIT |
| JS critical (above fold) | 80 KB | Hero Eclipse + nav + minimal Motion |
| JS islands (lazy `client:visible`) | 80 KB | Terminal, Pipeline, Bento, Mesh |
| Fonts | 63 KB | Geist + Geist Mono + Instrument Serif Italic, subset Latin-1 |
| Images | < 200 KB | AVIF via Astro Image |
| **Total initial load** | **~380 KB** | Well under 1.6 MB green threshold |

**Lighthouse mobile projection**: 92-96 with discipline.

**iOS Safari risk** (per agent 3):
- `backdrop-filter` over WebGL canvas → interpose DOM layer
- `scroll-timeline` not in Safari yet → Motion fallback
- `view-transition-name` Safari TP only → feature-detect

---

## 13. Key decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-14 | Brand color → BLUE `#3B82F6` | User explicit ("nika est bleu pas orange") |
| 2026-04-14 | Editorial typography → Geist + Instrument Serif Italic | User showed Aura references; agent 2 confirmed canonical |
| 2026-04-14 | Stay Astro 5 (no Next.js switch) | Agent 4 verdict: switch cost 40-60h with zero user benefit |
| 2026-04-14 | Kill HeroDots Three.js dot grid | Slop in 2025-2026, doesn't differentiate |
| 2026-04-14 | Kill ASCII boxes + mono fatigue | "ASCII degueulasse" per user |
| 2026-04-14 | Live data via GitHub API + workspace stats at build-time | Honors "built in public" narrative; no runtime polling |
| 2026-04-14 | Add `/architecture` page with live crate graph | Differentiator vs other dev tools |
| 2026-04-14 | Mintlify → Astro Starlight | Cohesion + custom components + cost + AGPL alignment |
| 2026-04-14 | Skip Unicorn Studio | Vendor lock-in, ~70KB UMD, no code control |
| 2026-04-14 | Skip Lenis smooth-scroll | Native scroll fine in 2026, hurts a11y |
| 2026-04-14 | Skip GSAP except ScrambleTextPlugin (free post-Webflow) | Motion covers 95% of GSAP at smaller bundle |
| 2026-04-14 | Component vendoring (Magic + Aceternity) > npm deps | Tree-shake control, customization |
| 2026-04-14 | Cmd+K palette ship in v0.3, not v0.1 | Visible win but adds complexity |
| 2026-04-14 | Build-time data fetching > runtime polling | No spinners, deterministic, free caching |

---

## 14. Open questions

- [ ] **Italic font final choice**: Instrument Serif vs Fraunces vs PP Editorial New?
  - Default: Instrument Serif (free, canonical Aura pair). Open to Fraunces (variable, more personality) or upgrade to PP Editorial.
- [ ] **Dashboard widgets MVP**: ship 3 (Constellation, Built-This-Week, Quality Gates) or scope down to 2?
- [ ] **`/architecture` page**: ship in v0.1 or v0.2?
  - Recommended v0.2 (high-effort, but key differentiator).
- [ ] **`docs.nika.sh` migration timing**: this sprint or after marketing site stabilized?
  - Recommended after — too much surface to redo at once.
- [ ] **DO_TOKEN + DO_APP_ID for nightly rebuild trigger** — request from Nicolas.
- [ ] **GitHub PAT scope**: fine-grained read-only public repo metadata. Generate + add to GH secrets.

---

## 15. Risks + mitigations

| Risk | Mitigation |
|---|---|
| GitHub API rate limit | Authenticated PAT (5,000 req/h), cache 24h, fallback to last-known JSON |
| Bundle > 300KB JS | Lazy-load all islands `client:visible`, skip Tremor if not needed |
| Eclipse heavy on mobile | CSS-only fallback for `<lg`, R3F only on desktop |
| Magic UI `next/link` patches break on update | CI grep check: `rg "next/link" src/components/` fails build |
| Nightly rebuild fails | DO webhook fallback + GH Action Slack notification |
| Mintlify migration during launch sprint | Decouple — do marketing first, docs second |
| Performance regression | Lighthouse CI on every PR, fail at < 90 mobile |
| Live data adds visual noise | Counters + sparklines must be subtle, NumberFlow respects reduced motion |
| iOS Safari `backdrop-filter` over canvas fails | Interpose DOM layer between canvas and nav |

---

## 16. Reference list (real production sites studied)

- **Aura.build / Nexus AI Platform** — primary aesthetic reference
- **Linear.app** — restraint, glass nav, magnetic CTA, cmdk
- **Vercel.com** — gradient hero, Geist fonts, scroll choreography
- **Resend.com** — clean dark marketing, dashboard preview widgets
- **Trigger.dev** — workflow-engine peer, modern hacker
- **Convex.dev** — modern hacker technical
- **Cursor.com** — AI dev aesthetic
- **Bun.sh** — benchmarks dashboards
- **Stripe.com** — globe (cobe pattern), comparison tables
- **Cobe.dev** — Globe component reference

---

🦋 **Active. Implementation begins after user confirms direction. ETA 5-7 working days for full v0.1 + v0.2 ship.**
