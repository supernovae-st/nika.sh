# nika.sh — Intent as Code

The public site for [Nika](https://github.com/supernovae-st/nika), the open
language for AI workflows. A cinematic single-page experience: one WebGL
galaxy scene (react-three-fiber), a scroll-driven camera journey, and the
whole pitch written into the dive.

**Live** · [nika.sh](https://nika.sh)
**License** · AGPL-3.0-or-later

## Stack

- **Vite + React 19 + TypeScript** — static output, no server
- **three.js / @react-three/fiber + postprocessing** — the galaxy scene,
  the butterfly intro, the curved-glass lens, the stargate warp
- **Tailwind v4** — utility layer over a hand-rolled cosmic design system
- **Fonts** — Clash Display (Fontshare ITF FFL), Martian Grotesk + Martian
  Mono (OFL), self-hosted

## Develop

```sh
corepack enable          # pnpm via the packageManager pin
pnpm install
pnpm dev                 # http://localhost:5173
```

Gates (all must pass before pushing — CI re-runs them on every push/PR
via `.github/workflows/gate.yml`, plus a live-URL-contract presence check
on `dist/`):

```sh
pnpm check               # tsc --noEmit
pnpm lint                # eslint, zero warnings
pnpm build               # tsc -b && vite build → dist/
```

Dev helpers:

- `?it=<seconds>` freezes the intro film at an exact beat
  (deterministic screenshots)
- type `nika` anywhere — the galaxy answers

## Layout

```
src/
  App.tsx            page assembly · hash-router-lite (#/blog · #/learn)
  content.ts         copy + spec-correct YAML (source: supernovae-st/nika-spec)
  scene/             the 3D film (galaxy · butterfly · director · lens · verbs)
  sections/          scroll story · transform · use cases · toolbelt ·
                     run simulator (break-it) · diagrams
  pages/             Blog · Learn
public/
  install.sh         curl install entry (live URL · warns on pre-1.0 legacy)
  llms.txt           LLM-readable site summary (live URL)
  schema/ errors/    workflow JSON schema · error catalog (live URLs · PROJECTED)
```

**Generated content — never hand-edit**:
`src/sections/usecases-yaml.generated.ts` (the showcase explorer YAML +
DAGs + the 6 templates), `public/schema/workflow.json` and
`public/errors/catalog.json` are all projected from
[nika-spec](https://github.com/supernovae-st/nika-spec) by
`scripts/showcase-projector.py --write` (drift-gated by `--check` in the
monorepo audit). Every other YAML fragment in copy is hand-written but
spec-validated — never invent shapes.

## Deploy

DigitalOcean App Platform, auto-deploy on push to `main` (spec in
`.do/app.yaml`). Static build → `dist/`, `404.html` as error document.
Full runbook — doctl, diagnosis, docs.nika.sh setup: [`DEPLOY.md`](DEPLOY.md).
Infra DRI: Nicolas.

## License

AGPL-3.0-or-later · a [SuperNovae Studio](https://supernovae.studio) creation
