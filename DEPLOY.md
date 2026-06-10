# Deploy — nika.sh

> **DRI infra · Nicolas.** Everything below runs against the SuperNovae
> DigitalOcean account. The app spec lives in this repo at `.do/app.yaml`
> — the dashboard mirrors it, the file is the source of truth.

## Current state (2026-06-10)

- `main` carries the v3 site (Vite + React 19 + r3f). Build verified
  locally: `pnpm check && pnpm lint && pnpm build` → `dist/`.
- **The live app is STALE**: nika.sh serves a build from 2026-01-07 (the
  old Nuxt site). No deployment has succeeded since January — either the
  DO GitHub App lost its connection to `supernovae-st/nika.sh`, or builds
  have been failing silently. This is the one thing to fix.
- DNS zone `nika.sh` is on DO nameservers (`ns1-3.digitalocean.com`).
  The Cloudflare IPs you see on `dig nika.sh` are DO App Platform's
  built-in CDN, not a separate Cloudflare account.

## 1 · doctl setup (one-time)

```sh
brew install doctl
doctl auth init          # paste an API token: cloud.digitalocean.com
                         # → API → Tokens → Generate (read+write)
doctl account get        # sanity: you're on the right team
```

## 2 · Diagnose the stale app

```sh
# find the app
doctl apps list --format ID,Spec.Name,DefaultIngress,UpdatedAt

# inspect recent deployments — look for ERROR phases or none since January
doctl apps list-deployments <APP_ID> \
  --format ID,Phase,Cause,CreatedAt | head -10

# read the failing build logs
doctl apps logs <APP_ID> --type build --deployment <DEPLOYMENT_ID>
```

Most likely causes, in order:

1. **GitHub connection broken** — dashboard → Apps → nika-sh → Settings
   → web component → Source: reconnect GitHub → `supernovae-st/nika.sh`
   branch `main`, re-enable *Autodeploy*.
2. **Stale build command** — the dashboard may still carry the old Nuxt
   or Astro command. Re-sync the spec from the repo (next section).
3. **Old Node version** — must be 22 (`NODE_VERSION=22` env, set in spec).

## 3 · Re-sync the spec + force a deploy

```sh
# from the repo root — pushes .do/app.yaml as the live spec
doctl apps update <APP_ID> --spec .do/app.yaml

# force an immediate rebuild of main
doctl apps create-deployment <APP_ID>

# follow it
doctl apps logs <APP_ID> --type build --follow
```

The expected build: `corepack enable && pnpm install --frozen-lockfile
&& pnpm build` · output `/dist` · index `index.html` · error `404.html`.
Node 22. The lockfile in the repo is install-ready (`pnpm@10.32.1` pinned
via `packageManager`).

## 4 · Verify after deploy

```sh
curl -s https://nika.sh/ | grep -o '<title>[^<]*'
# expect: <title>Nika · Intent as Code

curl -sI https://nika.sh/install.sh | head -1     # 200
curl -s  https://nika.sh/llms.txt | head -3       # current canon
curl -sI https://nika.sh/sitemap.xml | head -1    # 200
```

If the title is still the old one: the CDN caches `s-maxage=86400` — a
successful deploy purges it, so a stale title means the deploy didn't
land, not a cache problem.

## 5 · docs.nika.sh (NOT set up yet · two halves)

`docs.nika.sh` has **no DNS record today**. It is hosted by Mintlify
(separate from this app — the `.do/app.yaml` deliberately does not serve
it). Setup is split across two owners:

| Step | Where | Who |
|---|---|---|
| 1. Add custom domain `docs.nika.sh` in the Mintlify dashboard (project connected to `supernovae-st/nika-docs`) → Mintlify shows the exact CNAME target | dash.mintlify.com → Settings → Custom domain | **Thibaut** (owns the Mintlify project / supernovae-st org) |
| 2. Create the DNS record in the DO zone: `docs` CNAME → the target from step 1 (typically `cname.mintlify.app.`) | DO dashboard → Networking → Domains → nika.sh, or: `doctl compute domain records create nika.sh --record-type CNAME --record-name docs --record-data cname.mintlify.app. --record-ttl 3600` | **Nicolas** (DO account) |
| 3. Wait for cert issuance (Mintlify auto-provisions TLS once the CNAME resolves), then `curl -sI https://docs.nika.sh` → 200 | — | either |

Order matters: do step 1 first so Mintlify expects the domain when the
CNAME starts resolving.

## Reference

- App spec: [`.do/app.yaml`](.do/app.yaml) (domains nika.sh + www alias ·
  fra region · static site)
- Repo gates: `pnpm check && pnpm lint && pnpm build` — all green before
  any push to `main` (every push deploys).
- Live URL contracts (never delete): `/install.sh` · `/llms.txt` ·
  `/schema/workflow.json` · `/errors/catalog.json` · `/404.html` ·
  `/sitemap.xml` · `/robots.txt`.
