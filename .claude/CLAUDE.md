# nika.sh — Claude Code rules

The public site for [Nika](https://github.com/supernovae-st/nika) — Intent
as Code. Cinematic Vite + React 19 + react-three-fiber single-page site.

## Stack

Vite + React 19 + TypeScript · @react-three/fiber + postprocessing ·
Tailwind v4 · static output → `dist/` · auto-deploys on push to `main`
(DigitalOcean App Platform · `.do/app.yaml` · pnpm frozen-lockfile).

## Gates (every push)

```sh
pnpm check && pnpm lint && pnpm build
```

## Rules

- Full agent contract in `AGENTS.md` (spec-truth · live URLs · scene rules ·
  copy discipline). Read it first.
- This repo is PUBLIC — never commit strategy/brand/research content.
- Spec-correct YAML only (supernovae-st/nika-spec) · 4 verbs · 22 builtins ·
  13 providers — counts derive from the spec `canon.yaml`.
- Commit trailer: `Co-Authored-By: Nika 🦋 <nika@supernovae.studio>`.
- Scene code: ONE clock for film beats · no troika `<Text>` · verify
  headless via swiftshader screenshots (`?it=N` freezes the intro).
