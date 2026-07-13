<p align="center">
  <a href="https://nika.sh">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/brand/nika-logo-dark.svg">
      <img src="public/brand/nika-logo-light.svg" alt="Nika" width="220">
    </picture>
  </a>
</p>

# nika.sh · Intent as Code

The public site for [Nika](https://github.com/supernovae-st/nika), the open
language for AI workflows. The whole site lives inside a living device
frame · a near-black contour whose colour reads the section under it —
and the home's centrepiece is a scroll-driven film: the workflow file
travels in, bursts into its DAG, the recorded run chains through it, and
the plan lies down into a flat map. Every YAML fragment shown is real and
spec-validated; every number derives from the spec's canon.

**Live** · [nika.sh](https://nika.sh)
**License** · AGPL-3.0-or-later

## Stack

- **Vite + React 19 + TypeScript + react-router** · ~40 routes prerendered
  to static HTML (react-ssg), no server
- **three.js / @react-three/fiber** · the manifesto's drum sphere, the
  film's 3D plan scene, and the galaxy easter egg
- **CodeMirror 6** · the /play playground (spec-true validation, in-tab)
- **Tailwind v4** · utility layer over the engineered dark token system
- **Fonts** · Clash Display (Fontshare ITF FFL), Martian Grotesk + Martian
  Mono (OFL), self-hosted, subsetted (fontTools) with metric-twin fallbacks

## Develop

```sh
corepack enable          # pnpm via the packageManager pin
pnpm install
pnpm dev                 # http://localhost:5173
```

Gates (all must pass before pushing · CI re-runs them on every push/PR
via `.github/workflows/gate.yml`, plus a live-URL-contract presence check
on `dist/`):

```sh
pnpm check               # tsc --noEmit + icon-ontology sync
pnpm lint                # eslint, zero warnings
pnpm build               # tsc -b && vite build → dist/ (prerenders every route)
pnpm test                # vitest · models, i18n parity + the drift gates
pnpm visual              # pixel-compared goldens (per-OS · see AGENTS.md)
```

Dev helpers:

- `?it=<seconds>` freezes the hero intro at an exact beat
  (deterministic screenshots)
- type `nika` anywhere · the galaxy answers
- the full verification toolbelt (`scripts/`) is documented in
  [`AGENTS.md`](AGENTS.md) · shoot-routes, shoot-scroll, a11y-sweep,
  lighthouse-spot, size-budget, demo-drive

## Layout

```
src/
  shell/             nav capsule · root layout · scroll rail · footer
  fx/                EdgeAurora · the living device frame (bezel + aurora)
  sections/          the home chapters 01-14 · morph/ is the film
                     (ScrollMorph · the 3D plan scene · the flat DAG)
  pages/             Home · Play · Spec · Learn · Blog · Manifesto (8 locales) ·
                     Install · Convert · UseCases · Changelog · Errors
  scene/             drum sphere (manifesto) · galaxy easter egg
  content/           blog.generated.ts + the site changelog
content/blog/        the posts, markdown (compiled by scripts/build-blog.mjs)
public/
  install.sh         curl install entry (live URL · warns on pre-1.0 legacy)
  llms.txt           LLM-readable site summary (live URL)
  schema/ errors/    workflow JSON schema · error catalog (live URLs · PROJECTED)
```

**Generated content · never hand-edit**:
`src/canon.generated.ts` (every language count ·
nika-spec `canon-projectors.py`), `src/sections/usecases-yaml.generated.ts`
(the showcase explorer YAML + DAGs + templates · `showcase-projector.py`),
`src/content/blog.generated.ts` (from `content/blog/*.md` ·
`scripts/build-blog.mjs`), `public/schema/workflow.json` and
`public/errors/catalog.json` (projected from
[nika-spec](https://github.com/supernovae-st/nika-spec)). All drift-gated —
`pnpm test` fails when a generated module goes stale. Every other YAML
fragment in copy is hand-written but spec-validated · never invent shapes.

## Brand assets

The canonical public brand kit lives in `public/brand/` (served at
[nika.sh/brand/](https://nika.sh/brand/nika-logo-dark.svg)) · marks, tile,
logo lockups, the 16 px glyph. Naming, color roles and usage rules:
[`BRAND.md`](BRAND.md). Runtime files (`public/nika.svg`, `favicon.svg`,
`icon-*.png`) keep their frozen names · the visual goldens depend on them.

## Deploy

DigitalOcean App Platform, auto-deploy on push to `main` (spec in
`.do/app.yaml`). Static build → `dist/`, `404.html` as error document.
Full runbook · doctl, diagnosis, docs.nika.sh setup: [`DEPLOY.md`](DEPLOY.md).
Infra DRI: Nicolas.

## License

AGPL-3.0-or-later · a [SuperNovae Studio](https://supernovae.studio) creation
