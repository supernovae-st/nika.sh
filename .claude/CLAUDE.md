# nika.sh — Claude Code rules

The marketing site for [Nika](https://github.com/supernovae-st/nika), the AGPL workflow engine for AI.

## Stack

Astro 5 (static output) + Tailwind v4 (Vite plugin) + React islands + MDX.
Deployed to Scaleway Object Storage (Paris) + Cloudflare CDN.

## Design system

The design skill lives in `design/nika-design/` (git submodule from
`supernovae-st/nika-design-skill`). **For any UI work, read
`design/nika-design/SKILL.md` first.** It will direct you to load
`PRINCIPLES.md` (15 non-negotiable rules) and `references/forbidden.md`
(anti-slop firewall).

Palette tokens: `design/nika-design/tokens/colors.css`
Typography:     `design/nika-design/tokens/typography.css`
Spacing:        `design/nika-design/tokens/spacing.css`
Motion:         `design/nika-design/tokens/motion.css`

**Never create inline colors.** Always reference `var(--color-*)` from the
`@theme` block in `src/styles/global.css`, which maps to the skill tokens.

## Narrative rules (NIKA_NARRATIVE_LOCKED.md)

Governing sentence: "Nika is alive. Watch it grow."

Vocabulary:
- organ (not module/component)
- admitted (not added/merged)
- grew (not built/shipped)
- chrysalis (not beta/pre-release)
- emerge (RESERVED for v0.90 only)
- shadow zone (not tech debt/known issue)
- gate (not check/requirement)

## Butterfly scarcity

🦋 appears ONLY at:
- Favicon
- Changelog dev-log seal (footer of individual entries)
- v0.90 launch page (full unfold)

**Never in nav, never in body copy more than once per page, never as decoration.**

## Commands

```bash
pnpm install --ignore-workspace    # first time (parent monorepo quirk)
npx astro dev                      # dev server
npx astro build                    # static build → dist/
npx astro preview                  # preview build
npx astro check                    # type check
```

## Commits

```
Co-Authored-By: Nika 🦋 <nika@supernovae.studio>
```

Never Claude co-author. Always Nika 🦋.

## License

AGPL-3.0-or-later. Copyright © 2026 SuperNovae Studio.
