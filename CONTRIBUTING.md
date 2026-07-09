# Contributing to nika.sh

Thanks for considering a contribution. This is the marketing/docs surface of Nika — it moves slower than the Rust engine repo, but it's where the organism meets the public.

## What lives here

- Landing + method + install pages
- Weekly changelog + monthly blog (MDX)
- Error code catalog
- Meta-artifacts (`/llms.txt`, `/design.md`, etc.)

If you want to contribute to the engine itself, see [supernovae-st/nika](https://github.com/supernovae-st/nika).
If you want to contribute to the design system, it lives IN this repo: [`BRAND.md`](BRAND.md) (identity + rules) and [`design/`](design/README.md) (the icon ontology — `icons.yaml` is the SSOT, `pnpm icons` projects it).

## Quick contributions (PR welcome, no issue needed)

- **Typo, broken link, grammar** — open a PR, single commit
- **New changelog entry** — add a file under `src/content/changelog/week-NN.mdx` following the template in existing entries
- **Blog post** — add a file under `src/content/blog/<slug>.mdx`. Aim for 2,400 words, single organ, problem → decision → resolution → rule derived
- **New error code** — add entry to `public/errors/catalog.json`, tests not required (schema validates at build)
- **Copy tightening** — propose alternatives in the PR description

## Larger contributions (open an issue first)

- Design changes (colors, fonts, layout)
- New pages
- New dependencies
- Deployment/infra changes

## Narrative rules

- **Vocabulary**: "organ" (not module), "admitted" (not added), "grew" (not shipped), "chrysalis" (not beta)
- **"emerge" is reserved** for v0.90 engine emergence — don't use it elsewhere
- **Butterfly 🦋** appears only at: favicon, changelog dev-log seals, 404, v0.90 page. Never in nav, never as decoration.

## Voice

- Direct, technical, AGPL-proud, occasionally funny, never try-hard
- No marketing filler ("supercharge", "cutting-edge", "revolutionary", "unleash")
- No pirate cosplay ("Ahoy matey", skull icons)
- Numbers grep-verified before publishing

## Commits

```
type(scope): short description

Longer body if needed. Explain why, not what (diff shows what).

Co-Authored-By: Nika 🦋 <nika@supernovae.studio>
```

**Types**: `feat`, `fix`, `docs`, `content`, `style`, `refactor`, `perf`, `chore`.

Never Claude co-author. Always Nika 🦋.

## Local dev

Requires Node 22 + pnpm 9 (`corepack enable`).

```bash
pnpm install --ignore-workspace   # --ignore-workspace only needed inside the supernovae-hq monorepo
pnpm dev                          # http://localhost:4321
```

See [`README.md`](./README.md#local-development) for the full command set (build, preview, check).

## License

AGPL-3.0-or-later. By contributing you agree your work is released under the same terms.

🦋
