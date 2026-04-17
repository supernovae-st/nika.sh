# nika.sh — Roadmap

> Website-only roadmap. Engine milestones live in the engine repo — see
> [`supernovae-st/nika` ROADMAP](https://github.com/supernovae-st/nika/blob/nika-diamond/ROADMAP.md).

---

## Philosophy

- **Site = public witness.** Every Friday it reflects what grew that week. Site updates are never ahead of the engine; sometimes slightly behind (blog catches up).
- **Forever v0.x.** No marketing-launch inflation ("v1.0 site"). Quality > performative milestones.
- **Incremental improvement.** Each release ships 2–4 small things, not one big bang.
- **SEO = compound interest.** Every page indexed = one more doorway. Prioritize content breadth over feature depth.

---

## v0.1.0 — SHIPPED 2026-04-14 (Astro rewrite)

- [x] Rewrite Nuxt 4 → Astro 5 (static, 14 pages, 2.6s build)
- [x] Tailwind v4 via `@tailwindcss/vite`
- [x] MDX content collections (changelog + blog, typed via Zod)
- [x] Catalog-driven `/errors/[code]` (NIKA-001..005 seed)
- [x] Landing blockers: `/install.sh`, `/schema/workflow.json`, `/errors/catalog.json`, `/design.md`, `/llms.txt`, `/humans.txt`, `/changelog.xml`
- [x] 404 page with ASCII butterfly
- [x] Header/Footer with narrative vocabulary ("organ", "admitted", "grew")
- [x] `.do/app.yaml` — DigitalOcean App Platform deploy spec
- [x] `.claude/CLAUDE.md` for Claude Code DX
- [x] 3-agent review swarm: 6 P0 + 7 P1 fixed

---

## v0.2.0 — SEO hardening & design system wiring (target: week +1)

### SEO
- [ ] `og-default.png` (1200×630, butterfly + wordmark) → `public/og-default.png`
- [ ] Per-page OG image generation via `astro-og-canvas` or `satori` (title + page type composed at build)
- [ ] JSON-LD `SoftwareApplication` schema in `BaseLayout.astro`
- [ ] JSON-LD `Article` schema for blog + changelog posts
- [ ] JSON-LD `BreadcrumbList` for nested routes (`/errors/NIKA-042`, `/changelog/week-03`)
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Cloudflare page rule: 301 redirect non-trailing-slash → trailing-slash (or vice versa, match `trailingSlash` config)
- [ ] Rich Results test pass (`search.google.com/test/rich-results`)
- [ ] Core Web Vitals budget: LCP < 1.5s, CLS < 0.05, INP < 200ms
- [ ] PageSpeed Insights run on all 10 public pages, document baseline

### Design system integration
- [ ] Git submodule: `supernovae-st/nika-design-skill` at `design/`
- [ ] Rewrite `src/styles/global.css` to `@import` skill tokens, map via `@theme`
- [ ] Token rename pass: `var(--color-*)` → `var(--nika-*)` across all 8 `.astro` pages
- [ ] Palette reconciliation: decide site-adopts-skill OR skill-adopts-site (architect agent recommends site → skill)
- [ ] Trailing-slash redirect rule on DO/Cloudflare side (infra owner task)

### Self-hosted fonts
- [ ] Download Basteleur Bold + Moonlight (Velvetyne, OFL) → `public/fonts/`
- [ ] Download Departure Mono (Helena Zhang, custom free-commercial) → `public/fonts/`
- [ ] Download Recursive VF subset (Arrow Type, OFL) → `public/fonts/`
- [ ] Download JGS Font (Velvetyne, OFL) → `public/fonts/`
- [ ] Uncomment `@font-face` declarations (via skill tokens after submodule)
- [ ] Preload hero font (`<link rel="preload" href="/fonts/Basteleur-Bold.woff2">`)

### Technical SEO + DX
- [ ] Lighthouse CI in GitHub Actions (PR preview scores)
- [ ] Broken-link checker (`lychee` or `linkinator`) in GH Action
- [ ] `astro check` in pre-commit hook (optional `husky` or manual)

---

## v0.3.0 — Content breadth (target: week +3)

- [ ] `/vs/langchain` comparison page (long-tail SEO: "LangChain alternative")
- [ ] `/vs/n8n` comparison page
- [ ] `/vs/temporal` comparison page (workflow engine peer)
- [ ] `/faq` page with FAQ JSON-LD schema
- [ ] `/about` page with single photo of the desk (per NIKA_NARRATIVE_LOCKED §Site arch)
- [ ] Full-text search over changelog + blog (Pagefind — client-side, zero backend)
- [ ] OG images per-changelog (auto-generated with commit SHA + week number)
- [ ] RSS feed for blog (`/blog.xml`)
- [ ] Newsletter signup (if decided — ConvertKit / Buttondown)

---

## v0.4.0 — Playground & architecture (target: week +8)

- [ ] `/playground` — Leptos WASM workflow runner embedded as island (dogfood Rust)
   - Separate sibling repo `supernovae-st/nika-playground` compiled to WASM
   - Embedded via `<script type="module">` in Astro page
   - Not an iframe — same-origin for clipboard/fullscreen
- [ ] `/architecture` — R3F cosmic garden (per `NIKA_3D_WORLD_SPEC.md`)
   - Butterfly atelier, organ constellation, gate visualization
   - Desktop-only (`@media (min-width: 1280px)`), mobile fallback = static SVG
- [ ] `/stats` dashboard: live LOC, tests, mutation %, clippy status
   - Polling `github.com/supernovae-st/nika` via GitHub API at build time

---

## v0.5.0 — Podcast & community (target: month +3)

- [ ] `/podcast` quarterly episodes + transcripts
- [ ] `/podcast/episode-[N]` individual episode pages
- [ ] Audio player islands
- [ ] Transcript full-text indexed in search
- [ ] Discord embed / community section

---

## Deferred / considering

- [ ] i18n (EN + FR) — wait for traction signal (GitHub issues asking in French, etc.)
- [ ] Light mode — **LOCKED NO** per PRINCIPLES.md §1 of design skill. Not happening until post-engine-v1.0.
- [ ] Animated brand video hero — only at v0.90 engine emergence
- [ ] `/keys` page for `nika keys` subsystem (documentation extension)
- [ ] A11y audit with screen reader passes (deferred but on the radar)

---

## Non-goals

- ❌ User auth / accounts
- ❌ Payments / pricing page (AGPL, no SaaS — voice carries it in the words)
- ❌ Marketing attribution (no GA, no Segment, no pixels — privacy-first)
- ❌ CMS (MDX in-repo is the CMS, version-controlled)
- ❌ Comment system
- ❌ Testimonial carousel

---

## How to contribute

1. **Content** (blog, changelog, errors) → PR welcome, no issue needed
2. **Design** → open an issue, reference `PRINCIPLES.md` of the skill
3. **Tech** (dependency, Astro config) → open an issue first

Commits co-authored `Nika 🦋 <nika@supernovae.studio>`. Never Claude.

🦋
