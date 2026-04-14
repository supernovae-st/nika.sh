# nika.sh 🦋

> The marketing site for [Nika](https://github.com/supernovae-st/nika) — the AGPL workflow engine for AI.
> Astro 5 (static) + Tailwind v4. Hosted on Scaleway Object Storage (Paris) + Cloudflare CDN.

**Live** : [https://nika.sh](https://nika.sh)
**Source** : [github.com/supernovae-st/nika.sh](https://github.com/supernovae-st/nika.sh)
**License** : AGPL-3.0-or-later

---

## What's here

- `/` — landing ("Nika is alive. Watch it grow.")
- `/method` — manifesto, 12 gates, 7 shadow zones
- `/install` — curl, brew, cargo, platform matrix
- `/changelog` — weekly dev logs (Friday 18:00 Paris)
- `/blog` — monthly deep dives (one organ at a time)
- `/errors/[code]` — NIKA-XXX catalog reference
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

Design system: design/ (git submodule, planned)
  → supernovae-st/nika-design-skill
```

Zero JS on most pages. React islands only where needed. Shiki for code highlighting (`github-dark-dimmed`).

## Local development

```bash
# First time on this machine (monorepo quirk — supernovae/ has pnpm workspace)
pnpm install --ignore-workspace

# Dev
npx astro dev              # http://localhost:4321

# Build
npx astro build            # output → dist/

# Preview
npx astro preview

# Type check
npx astro check
```

## Deploy

**Push to `main` = site auto-deploys.** DigitalOcean App Platform is connected to this repo (managed by Nicolas).

Astro config needed on DO side:
- **Build command**: `pnpm install && pnpm build`
- **Output directory**: `dist/`
- **Framework preset**: Astro (or Static Site)

We manage the code. Nicolas manages the infrastructure.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).

## Contributing

Content PRs welcome (changelog + blog + errors catalog). Design/stack PRs: open an issue first.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Conventions

- **Narrative vocabulary**: "organ" (not module), "admitted" (not added), "grew" (not shipped), "chrysalis" (not beta), "emerge" reserved for v0.90.
- **Butterfly 🦋 scarcity**: favicon, changelog dev-log seals, v0.90 launch page. Never in nav, never decorative.
- **Design rules**: `design/nika-design/PRINCIPLES.md` (when submodule lands).
- **Commits**: `Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`.

## Related repos

- [`supernovae-st/nika`](https://github.com/supernovae-st/nika) — the Rust workflow engine itself
- [`supernovae-st/nika-design-skill`](https://github.com/supernovae-st/nika-design-skill) — design system + Claude Code skill
- [`supernovae-st/nika-client`](https://github.com/supernovae-st/nika-client) — TS SDK
- [`supernovae-st/nika-registry`](https://github.com/supernovae-st/nika-registry) — community workflows
- [`supernovae-st/homebrew-nika`](https://github.com/supernovae-st/homebrew-nika) — `brew tap supernovae-st/nika && brew install nika`

---

🦋 SuperNovae Studio · Paris · 2026
