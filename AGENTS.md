# AGENTS.md — nika.sh (marketing site)

Vendor-neutral agent entry per the AGENTS.md convention (agents.md).
Claude Code users: `.claude/CLAUDE.md` carries the same rules in full.

## What this repo is

The Astro 5 static marketing site for Nika. Tailwind v4 + React islands
+ MDX. Auto-deploys on push to `main` (DigitalOcean).

## Non-negotiables

1. **Design skill first** — for ANY UI work read
   `design/nika-design/SKILL.md` (15 principles + anti-slop firewall).
   Never inline colors; use `var(--color-*)` tokens.
2. **Narrative vocabulary** (locked): organ (not module) · admitted
   (not merged) · grew (not shipped) · chrysalis (not beta) ·
   « emerge » RESERVED for v0.90 · 🦋 only favicon/changelog-seal/v0.90.
3. **Canon counts**: 4 verbs (`infer·exec·invoke·agent` — fetch is a
   builtin) · counts for builtins/providers come from the nika-spec
   `canon.yaml`; `public/llms.txt` must stay in sync with them.
4. Commit trailer: `Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`.
