# nika.sh 🦋

> The marketing site for [Nika](https://github.com/supernovae-st/nika) — the AGPL workflow engine for AI. Astro 5 + Tailwind v4, static output.

**Source** : [github.com/supernovae-st/nika.sh](https://github.com/supernovae-st/nika.sh)
**License** : AGPL-3.0-or-later

> The live site is not deployed yet — we ship when the engine crosses a quality bar worth pointing at.

---

## What's here

- `/` — landing ("Nika is alive. Watch it grow.")
- `/method` — manifesto, 12 gates, 7 shadow zones
- `/install` — curl, brew, cargo, platform matrix
- `/changelog` — weekly dev logs (Friday 18:00 Paris)
- `/blog` — monthly deep dives (one organ at a time)
- `/errors/[code]` — NIKA-XXX catalog reference
- `/play` — placeholder for future WASM playground
- `/404` — ASCII butterfly captain's log
- `/install.sh` — platform-detect installer script
- `/schema/workflow.json` — JSON Schema for `.nika.yaml` (used by the LSP)
- `/errors/catalog.json` — machine-readable error catalog
- `/design.md` — plain-markdown design system for AI agents
- `/llms.txt`, `/humans.txt`, `/changelog.xml` (RSS)

## Stack

```
Astro 5 (output: static, trailingSlash: always)
├── @tailwindcss/vite (Tailwind v4)
├── @astrojs/mdx       — changelog + blog
├── @astrojs/react     — islands for interactive components
├── @astrojs/sitemap   — auto-generated sitemap-index.xml
└── @astrojs/rss       — /changelog.xml feed
```

Zero JS on most pages. React islands only where needed. Shiki for code highlighting (`github-dark-dimmed`).

## Local development

Requires **Node 22** and **pnpm 9** (enabled via `corepack enable`).

```bash
# First time on this machine (monorepo quirk — parent supernovae-hq has a
# pnpm workspace that would otherwise pull this repo in). Safe to omit if
# you cloned this repo standalone.
pnpm install --ignore-workspace

# Dev server — http://localhost:4321
pnpm dev

# Production build — output → dist/
pnpm build

# Preview the built site locally
pnpm preview

# Type check
pnpm check
```

## Content structure

```
src/
├── pages/           Astro routes (.astro + dynamic /errors/[code])
├── components/
│   ├── ui/          Astro-only presentational components
│   └── react/       React islands (client:* directives)
├── content/
│   ├── blog/        MDX blog posts (Zod-typed)
│   └── changelog/   MDX weekly dev logs (Zod-typed)
├── layouts/         BaseLayout + shared page chrome
├── data/            JSON fixtures (build-time inputs)
├── styles/          global.css — Tailwind + tokens
└── lib/             TS helpers
```

## Deploy

Deployed to **DigitalOcean App Platform** on push to `main`. See [`.do/app.yaml`](./.do/app.yaml) for the full spec (build command, output dir, domains, routes).

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).

## Contributing

Content PRs welcome (changelog + blog + errors catalog). Design/stack PRs: open an issue first.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Conventions

- **Narrative vocabulary**: "organ" (not module), "admitted" (not added), "grew" (not shipped), "chrysalis" (not beta), "emerge" reserved for v0.90.
- **Butterfly 🦋 scarcity**: favicon, changelog dev-log seals, v0.90 launch page. Never in nav, never decorative.
- **Commits**: `Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`. Never Claude.

## Related repos

- [`supernovae-st/nika`](https://github.com/supernovae-st/nika) — the Rust workflow engine itself (AGPL, Diamond rewrite)
- [`supernovae-st/nika-client`](https://github.com/supernovae-st/nika-client) — TypeScript SDK
- [`supernovae-st/nika-design-skill`](https://github.com/supernovae-st/nika-design-skill) — design system + Claude Code skill
- [`supernovae-st/homebrew-tap`](https://github.com/supernovae-st/homebrew-tap) — `brew install supernovae-st/tap/nika`
- [`supernovae-st/nika-site-audit`](https://github.com/supernovae-st/nika-site-audit) — example Nika workflow: audit a website

---

🦋 SuperNovae Studio · Paris · 2026
