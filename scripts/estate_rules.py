# Per-repo estate rules. The tool is shared and lives in nika-estate;
# these declarations are ours. FILES carries the per-file exceptions,
# PATTERNS the ordered globs that cover everything else (first-match-wins).
#
# ROOT, SELF, RULES and CLASSES are injected by the tool into this module
# namespace before it executes — undefined as far as a linter reading this
# file alone can tell, hence the noqa.
#
# This file REPLACES the site's pre-reconciliation estate.py fork
# (4 classes · imperative classify() · no ESTATE_PIN): the curated
# evidence moved here as DATA, the tool became the shared canonical one.
# Two evidence sources drive the derived rows, exactly like the fork did:
#   1. scripts/spec-resync.contract.json — the repo's machine-readable
#      derivation contract (sha256-pinned generators · pinned outputs ·
#      the exact nika-spec commit); its `runtime: copy` twins land in
#      `pinned-copy`, the rest in `generated`.
#   2. public/spec/shipped/PROVENANCE.json — the released engine the
#      shipped-clock surfaces were vendored from.

import json

_ROOT = ROOT  # noqa: F821 — injected by the tool

_GATE_YML = ".github/workflows/gate.yml"
_RESYNC_YML = ".github/workflows/spec-resync.yml"
_CONTRACT_PATH = "scripts/spec-resync.contract.json"

_contract = json.loads((_ROOT / _CONTRACT_PATH).read_text())
_engine = json.loads(
    (_ROOT / "public/spec/shipped/PROVENANCE.json").read_text()
).get("engine_version", "unknown")
_engine_pin = json.loads((_ROOT / ".github/nika-engine-pin.json").read_text())
_spec = _contract["spec"]
_spec_ref = f"{_spec['repository']}@{_spec['commit'][:12]}"
_release_ref = f"{_engine_pin['repository']}@{_engine_pin['engine_commit'][:12]} ({_engine_pin['release_tag']})"

_LENS = "scripts/lens/graph/build-lens.mjs"
_LENS_GATE = (
    "src/test/lens.test.ts + design-graph.test.ts (+ lens-census/nav/sets companions) "
    f"recompile + byte-diff — pnpm test in {_GATE_YML}"
)
_LENS_INPUTS = [
    "scripts/lens/graph/sets.yaml",
    "scripts/lens/graph/market-vocab.yaml",
    "the gated site sources sets.yaml declares (site facts + the spec spine)",
]
_ICONS = "design/build.mjs"
_ICONS_GATE = (
    "pnpm check → node design/build.mjs --check (drift + orphan sweep) — "
    f"the {_GATE_YML} typecheck step"
)
_ICONS_INPUTS = [
    "design/icons.yaml",
    "design/svg/**",
    "src/canon.generated.ts (builtin parity)",
    "src/styles/tokens.css (hue parity)",
]
_BLOG_GATE = f"src/test/blog.test.ts + src/test/blog-twins.test.ts — pnpm test in {_GATE_YML}"
_MEDIA_GATE = "scripts/media/validate-media.sh (the honesty + budget gate)"
_ENGINE_RESYNC_GATE = (
    "pnpm check → node scripts/engine-resync.mjs --check (offline digest re-verify "
    "of every vendored byte against public/engine/PROVENANCE.json + the pin · exit 5 on drift)"
)
_SHIPPED_TOOL = "node scripts/build-shipped-spec.mjs (deliberate manual vendor run — the build NEVER probes the binary)"
_SHIPPED_GATE = (
    "src/test/onpage-yaml.test.ts validates the on-page corpus against THIS shipped schema; "
    "the truth zoom renders the ratified↔shipped drift"
)
_LENS_CI_GATE = "pnpm lens:integrity (scripts/verify-lens-ci.mjs) + .github/workflows/lens-gates.yml"
_CATALOG_LAW = (
    "vendored-catalog law (build-shipped-spec.mjs header): the build never probes the binary — "
    "refresh is a deliberate manual run against the released engine"
)
_SYNC_NOTE = (
    "version strings rewritten by scripts/sync-version.mjs on release heal "
    "(.github/workflows/release-heal.yml) — bot-maintained fields inside an authored file"
)


def _auth(path, evidence, note=None):
    row = {"path": path, "class": "authored", "evidence": evidence}
    if note:
        row["note"] = note
    return row


def _gen(path, evidence, tool, gate, inputs, note=None):
    row = {
        "path": path,
        "class": "generated",
        "evidence": evidence,
        "derivation": {"tool": tool, "gate": gate, "inputs": inputs},
    }
    if note:
        row["note"] = note
    return row


def _pin(path, evidence, tool, gate, inputs, note=None):
    row = _gen(path, evidence, tool, gate, inputs, note)
    row["class"] = "pinned-copy"
    return row


# ── the spec-resync contract outputs (evidence source #1 · derived rows) ────

def _contract_rows():
    resync_gate = (
        f"{_RESYNC_YML} + pnpm spec-resync:verify (LENS-011 scripts/verify_generated_outputs.mjs — "
        f"literal path set AND byte digests vs {_CONTRACT_PATH})"
    )
    rows = {}
    for g in _contract["generators"]:
        for path in g["outputs"]:
            if g["runtime"] == "copy":
                src = f"{_spec_ref}:{g['path']}" if g["root"] == "spec" else g["path"]
                rows[path] = _pin(
                    path,
                    f"resync contract generator '{g['id']}' (runtime: copy) — byte-copy of {src} at the resync pin",
                    "node scripts/spec-resync-run.mjs (the pinned resync)",
                    resync_gate,
                    [".github/nika-spec-pin.json", src],
                )
            else:
                tool_repo = _spec_ref if g["root"] == "spec" else "supernovae-st/nika.sh"
                rows[path] = _gen(
                    path,
                    f"declared output of resync contract generator '{g['id']}' ({tool_repo} {g['path']} · generator sha256-pinned in the contract)",
                    f"{g['runtime']} {g['path']} (root: {g['root']} · via node scripts/spec-resync-run.mjs)",
                    resync_gate,
                    [".github/nika-spec-pin.json", f"{_spec_ref} (tree {_spec['tree'][:12]})"],
                )
    return rows


# ── per-file exceptions (matched before patterns · overrides win) ───────────

_OVERRIDES = [
    # ── the estate dance (E1 · the mirror rows every repo carries) ─────────
    {
        "path": SELF,  # noqa: F821
        "class": "pinned-copy",
        "evidence": "the shared estate tool, mirrored byte-for-byte from supernovae-st/nika-estate · editing it here is a lost gesture: change it upstream, bump ESTATE_PIN, re-mirror",
        "derivation": {
            "tool": "curl the tool from nika-estate at the rev named in ESTATE_PIN",
            "gate": "the `mirror` job byte-compares scripts/estate.py against nika-estate@ESTATE_PIN and fails the run on any difference",
            "inputs": ["ESTATE_PIN", "supernovae-st/nika-estate@<ESTATE_PIN>:scripts/estate.py"],
        },
    },
    {
        "path": "ESTATE_PIN",
        "class": "authored-pin",
        "evidence": "its own header: 'Bump deliberately: edit this' · the rev the shared estate tool is mirrored from, and the INPUT the mirror gate compares against",
    },
    # ── the two content pins (the site's derivation INPUTS) ────────────────
    {
        "path": ".github/nika-spec-pin.json",
        "class": "authored-pin",
        "evidence": "the resync INPUT — a deliberately bumped pin carrying the full nika-spec commit AND tree; its $comment narrates the LENS-011 trust model; advanced by the bot ONE-PR lane only, never HEAD",
        "note": "scripts/lens/repin-spec-resync-contract.mjs re-derives the resync contract FROM this pin; public/.well-known/nika-spec-pin.json is its byte-identical generated twin",
    },
    {
        "path": ".github/nika-engine-pin.json",
        "class": "authored-pin",
        "evidence": "the catalog seam INPUT (D1) — the full engine RELEASE commit AND tree the /catalog world derives from; advanced only at release trains, PR-only; its $comment narrates the trust model",
    },
    # ── the engine@release vendored lane (D1) ──────────────────────────────
    {
        "path": "public/engine/PROVENANCE.json",
        "class": "generated",
        "evidence": "the vendoring receipt: source commit+tree from the engine pin + sha256 of every vendored surface (sorted · timestamp-free — same pins, same bytes)",
        "derivation": {
            "tool": "node scripts/engine-resync.mjs --write (fetch BY SHA · verify commit+tree · vendor · receipt)",
            "gate": _ENGINE_RESYNC_GATE,
            "inputs": [".github/nika-engine-pin.json", f"{_release_ref} (the pinned release tree)"],
        },
    },
    {
        "path": "public/engine/adr/index.json",
        "class": "pinned-copy",
        "evidence": f"byte-copy of docs/adr/index.json at the pinned engine release ({_release_ref}) — the ADR machine index the /engineering world derives from",
        "derivation": {
            "tool": "node scripts/engine-resync.mjs --write",
            "gate": _ENGINE_RESYNC_GATE,
            "inputs": [".github/nika-engine-pin.json", f"{_release_ref}:docs/adr/index.json"],
        },
    },
    # ── the mégagraphe (the compiler's one authored input + its artifact) ──
    _auth(
        "scripts/graph/city.yaml",
        "the city as authored graph data (site voice · the ONE authored input the compiler accepts, declared voice to the doctor's §J.1 typing gate) — 13 canonical buildings (D-2026-07-29-N10 · the engine README city fence) + honest archives + lanes, every row citing what proves it",
    ),
    _gen(
        "public/nika-graph.json",
        "the mégagraphe artifact (graph_schema 1 · JSON-LD triples + evidence + provenance on every edge · sorted keys · zero timestamps — same pins, same bytes)",
        "node scripts/graph/build.mjs (pnpm graph · modular extractors → merger)",
        "pnpm check → node scripts/graph/doctor.mjs (typing §J.1 · inverses · evidence totality · exit 3/5) + src/test/graph-artifact.test.ts (determinism + the PATHS join) — pnpm test in " + _GATE_YML,
        [
            ".github/nika-spec-pin.json",
            ".github/nika-engine-pin.json",
            "ESTATE_PIN",
            "public/engine/catalog/*.toml (pinned-copy at the engine release)",
            "public/{errors,tools,providers,templates}/catalog.json (the gated projections)",
            "estate.yaml + scripts/graph/city.yaml (site voice)",
        ],
    ),
    # ── the vendored browser checker (release-asset lane) ──────────────────
    _gen(
        "src/lib/check-wasm/PROVENANCE.json",
        "the revendor receipt: release tag + commit + npm identity + wasm sha16, rewritten by the lane on every revendor",
        "node scripts/revendor-check-wasm.mjs v<X.Y.Z> (release-asset only, never a local build)",
        "src/test/check-wasm-oracle.test.ts (the wasm speaks the same engine version the captures pin) — pnpm test in " + _GATE_YML,
        [".github release asset supernovae-st-nika-check-wasm-<v>.tgz (sha256-verified against its published sidecar)"],
    ),
    # ── prose · policy · agent context ─────────────────────────────────────
    _auth("README.md", "prose entry surface · no generation marker"),
    _auth("AGENTS.md", "hand-written agent entry per the AGENTS.md convention"),
    _auth(".claude/CLAUDE.md", "hand-written agent context for this repo"),
    _auth("BRAND.md", "prose brand voice doc · no generation marker"),
    _auth("CONTRIBUTING.md", "prose contribution policy · no generation marker"),
    _auth("DEPLOY.md", "prose deploy runbook · no generation marker"),
    _auth("SECURITY.md", "prose security policy · no generation marker"),
    _auth(
        "THIRD_PARTY_NOTICES.md",
        "hand-kept third-party license record (fonts self-hosted · icon system declared house-owned)",
    ),
    # ── root configs ───────────────────────────────────────────────────────
    _auth(".gitattributes", "hand-kept git attributes"),
    _auth(".gitignore", "hand-kept ignore list"),
    _auth(".npmrc", "hand-kept npm config"),
    _auth(".nvmrc", "hand-kept node version pin"),
    _auth("package.json", "hand-kept manifest (scripts + pinned deps + packageManager)"),
    _auth("tsconfig.json", "hand-written TS project references root"),
    _auth("tsconfig.app.json", "hand-written TS config (app)"),
    _auth("tsconfig.node.json", "hand-written TS config (node tooling)"),
    _auth("vite.config.ts", "hand-written Vite config"),
    _auth("vitest.config.ts", "hand-written Vitest config"),
    _auth("eslint.config.js", "hand-written ESLint flat config"),
    _auth("react-ssg.config.ts", "hand-written SSG route config"),
    _auth("index.html", "hand-written Vite entry shell"),
    _auth(
        "site.config.ts",
        "hand-written site facts",
        note="scripts/lens/graph/build-lens.mjs rewrites a derived block in place when sets.yaml changes (build-lens.mjs:1715) — a bot-maintained region inside an authored file",
    ),
    _auth(
        "pending-error-codes.ts",
        "hand-kept escrow list — its own header: list a code the day the canon mints it, DELETE the entry the day the resync pin advances past the mint",
    ),
    _auth(
        ".do/app.yaml",
        "hand-written DigitalOcean App Platform spec",
        note="byte-pinned by the resync contract's publish_input_contract and the LENS integrity baseline — hand-edits must re-pin",
    ),
    # ── lockfiles (tool-maintained) ────────────────────────────────────────
    _gen(
        "pnpm-lock.yaml",
        "pnpm lockfile — tool-maintained, never hand-edited",
        "pnpm install (pnpm pinned via packageManager)",
        f"pnpm install --frozen-lockfile in {_GATE_YML} (+ deep-belts · visual.yml · lens-gates.yml)",
        ["package.json"],
    ),
    _gen(
        "scripts/media/package-lock.json",
        "npm lockfile for the media pipeline's own deps — tool-maintained",
        "npm install (scripts/media lane)",
        "none in CI — the media pipeline is a deliberate manual lane (scripts/media/README.md)",
        ["scripts/media/package.json"],
    ),
    _auth("scripts/media/package.json", "hand-kept manifest for the media pipeline lane"),
    # ── blog projections without in-file markers ───────────────────────────
    _gen(
        "public/rss.xml",
        "row of BLOG_GENERATED_MIRRORS in scripts/build-blog.mjs (OUT_RSS · build-blog.mjs:28)",
        "node scripts/build-blog.mjs",
        _BLOG_GATE,
        ["content/blog/*.md"],
    ),
    _gen(
        "public/llms-full.txt",
        "row of BLOG_GENERATED_MIRRORS in scripts/build-blog.mjs; its own header: 'The complete blog, newest first, as raw markdown (source: content/blog in the site repo)'",
        "node scripts/build-blog.mjs",
        f"src/test/llms.test.ts + src/test/blog.test.ts — pnpm test in {_GATE_YML}",
        ["content/blog/*.md"],
    ),
    _auth(
        "public/llms.txt",
        "hand-curated llms.txt (llmstxt.org) — NOT in BLOG_GENERATED_MIRRORS",
        note=f"{_SYNC_NOTE}; counts drift-gated by src/test/llms.test.ts + llms-urls.test.ts against the canon projection",
    ),
    # ── lens projections without in-file markers ───────────────────────────
    _gen(
        "public/i18n/untranslatables.json",
        "in-file 'derived_from: build-lens (the language graph)' key",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/ontology/language.json",
        "written by build-lens.mjs:1731 (the language-graph twin · language_graph shape)",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/map/constellation.svg",
        "written by build-lens.mjs:1730 — the served twin of src/assets/constellation.generated.svg",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "src/assets/constellation.generated.svg",
        "written by build-lens.mjs:1716 (.generated. basename · no textual marker inside the SVG)",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/redirects.json",
        "written by build-lens.mjs:1736 (redirects_format shape) — the append-only redirect registry (a published URL never 404s)",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/sitemap/index.html",
        "the lens redirect stub template (build-lens.mjs stub() · the redirects.json '/sitemap' row): meta-refresh + canonical, no prose comment",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/language/depends_on/index.html",
        "the lens redirect stub template (build-lens.mjs stub() · the redirects.json '/language/depends_on' → '/language/after' row): meta-refresh + canonical",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/method/index.html",
        "the lens redirect stub template (build-lens.mjs stub() · the redirects.json '/method' row): meta-refresh + canonical",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/design-palette.json",
        "in-file '_generated: scripts/lens/graph/build-lens.mjs — DO NOT EDIT' key",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    _gen(
        "public/design-tokens.dtcg.json",
        "in-file $description: 'AUTO-GENERATED by scripts/lens/graph/build-lens.mjs from sets.yaml design: + the nika-spec spine'",
        f"node {_LENS} (pnpm lens)",
        _LENS_GATE,
        _LENS_INPUTS,
    ),
    # ── the released binary's baked surfaces ───────────────────────────────
    _gen(
        "public/tools/catalog.json",
        f"version field '{_engine}' == the released engine; {_CATALOG_LAW}",
        "node scripts/build-tools.mjs (NIKA_BIN or `nika` on PATH)",
        f"src/test/tools.test.ts + src/test/version.test.ts — pnpm test in {_GATE_YML}",
        [f"nika {_engine} (the released binary's own tool catalog)"],
    ),
    _gen(
        "public/providers/catalog.json",
        f"version field '{_engine}' == the released engine; {_CATALOG_LAW}",
        "node scripts/build-providers.mjs (NIKA_BIN or `nika` on PATH)",
        f"src/test/providers.test.ts — pnpm test in {_GATE_YML}",
        [f"nika {_engine} (the released binary's own provider catalog)"],
    ),
    _pin(
        "public/spec/shipped/canon.yaml",
        f"byte-copy of what the RELEASED binary embeds (`nika spec --canon` · engine {_engine} per PROVENANCE.json) — the SHIPPED clock of the two-clocks doctrine (build-shipped-spec.mjs header)",
        _SHIPPED_TOOL,
        _SHIPPED_GATE,
        [f"nika {_engine} (the released binary)"],
    ),
    _pin(
        "public/spec/shipped/workflow.schema.json",
        f"byte-copy of what the RELEASED binary embeds (`nika spec --schema` · engine {_engine} per PROVENANCE.json) — the SHIPPED clock of the two-clocks doctrine",
        _SHIPPED_TOOL,
        _SHIPPED_GATE,
        [f"nika {_engine} (the released binary)"],
    ),
    _gen(
        "public/spec/shipped/PROVENANCE.json",
        f"the vendor run's receipt: engine_version {_engine} + source 'nika spec --schema / --canon'",
        _SHIPPED_TOOL,
        _SHIPPED_GATE,
        [f"nika {_engine} (the released binary)"],
    ),
    # ── the LENS pin/baseline lane ─────────────────────────────────────────
    _gen(
        _CONTRACT_PATH,
        "the versioned resync contract: sha256-pinned generators + outputs + toolchain + publish-input contract, all derived from the spec pin",
        "node scripts/lens/repin-spec-resync-contract.mjs (deliberate repin)",
        f"pnpm spec-resync:verify (LENS-011 scripts/verify_generated_outputs.mjs) + the spec-resync adversarial suite + {_RESYNC_YML}",
        [".github/nika-spec-pin.json", f"{_spec_ref} (the pinned spec tree)", "the generator scripts (sha256-pinned in the contract)"],
    ),
    _gen(
        "scripts/lens/contracts/integrity.v1.json",
        "digest baseline of the publish-input artifacts (path + sha256 census)",
        "node scripts/lens/repin-integrity.mjs (deliberate repin)",
        _LENS_CI_GATE,
        ["the tracked publish-input artifacts (digest census)"],
    ),
    _gen(
        "scripts/lens/contracts/carrier-universe.v1.json",
        "the exhaustive carrier census (authority: independent-exhaustive-carrier-universe)",
        "node scripts/lens/repin-carrier-universe.mjs (deliberate repin)",
        _LENS_CI_GATE,
        ["the census roots the contract declares (src/** · content/blog · public/** · scripts/build-*)"],
    ),
    _gen(
        "scripts/lens/contracts/release-attestation.v1.json",
        f"attestation of the pinned spec release closure (release_id spec-{_spec['commit'][:12]}…-stable); sha256-bound into .github/nika-spec-pin.json",
        "the repin lane (spec release closure)",
        _LENS_CI_GATE,
        [f"{_spec_ref} release identity"],
    ),
    _auth(
        "scripts/lens/fixtures/negative.v1.json",
        "hand-written adversarial negative fixture — the lens gates must FAIL on it",
    ),
    # ── public root singletons ─────────────────────────────────────────────
    _auth(
        "public/404.html",
        "hand-written static error shell — DigitalOcean's error_document serves it for un-prerendered deep links (pending-error-codes.ts header)",
    ),
    _auth(
        "public/docs/index.html",
        "hand-written courtesy redirect to docs.nika.sh — bespoke prose comment, NOT the lens stub template",
    ),
    _auth(
        "public/ontology/design/index.html",
        "static ontology landing page — design/build.mjs's output list excludes it and no other writer was found",
        note="unverified-default",
    ),
    _auth("public/robots.txt", "hand-kept crawler policy"),
    _auth("public/humans.txt", "hand-written humans.txt", note=_SYNC_NOTE),
    _auth(
        "public/install.sh",
        "hand-written installer",
        note="VERSION + VERSION_TRANSCRIPT rewritten by scripts/sync-version.mjs — the transcript is a REAL captured `nika --version` (honesty law: re-capture, never hand-edit)",
    ),
    _auth("public/.well-known/security.txt", "hand-kept RFC 9116 security contact"),
    _auth(
        "public/icons.svg",
        "hand-assembled social sprite",
        note="BYTE-FROZEN input: design/build.mjs READS it (build.mjs:87-100 — 'public/icons.svg is BYTE-FROZEN (the visual goldens shoot the footer)') — never regenerated",
    ),
    _auth("public/manifest.webmanifest", "hand-written PWA manifest"),
    _auth("public/favicon.ico", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("public/favicon.svg", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("public/icon-192.png", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("public/icon-512.png", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("public/icon-mask.png", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("public/apple-touch-icon.png", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("public/nika.svg", "studio brand asset — exported artwork, no in-repo generator"),
    _auth("src/assets/nika.svg", "studio brand asset — exported artwork, no in-repo generator"),
    # ── authored files carrying bot-maintained fields ──────────────────────
    _auth(
        "src/content.ts",
        "hand-written content constants",
        note="the ENGINE_VERSION constant is bot-healed on engine releases (.github/workflows/release-heal.yml → scripts/sync-version.mjs) — a bot-maintained field inside an authored file",
    ),
    _auth("src/content/learn.ts", "hand-written learn-track copy", note=_SYNC_NOTE),
    _auth("src/content/install.ts", "hand-written install copy", note=_SYNC_NOTE),
]

# Contract rows first, overrides win on collision (the fork's precedence).
_rows = _contract_rows()
for _row in _OVERRIDES:
    _rows[_row["path"]] = _row

FILES = list(_rows.values())

# ── ordered patterns — FIRST-MATCH-WINS (canonical dialect: ** crosses
#    segments · * stays within one · no **/ special form) ───────────────────

PATTERNS = [
    {
        "glob": "public/brand/icons/*.svg",
        "class": "generated",
        "evidence": "every member carries the in-file marker 'generated by design/build.mjs' (the served house icon catalog · grep -L verified 0 unmarked)",
        "derivation": {"tool": f"node {_ICONS} (pnpm icons)", "gate": _ICONS_GATE, "inputs": _ICONS_INPUTS},
    },
    {
        "glob": "public/brand/**",
        "class": "authored",
        "evidence": "studio brand artwork exports (logo · mark · tile suite) — no in-repo generator; THIRD_PARTY_NOTICES.md declares the set house-owned",
    },
    {
        "glob": "public/og*.png",
        "class": "generated",
        "evidence": "the OG card set — scripts/build-og-card.mjs shoots scripts/og-card.html per route/post deck (build-og-card.mjs header lists the plates)",
        "derivation": {
            "tool": "node scripts/build-og-card.mjs (headless Chrome shot)",
            "gate": f"src/test/og-cards.test.ts — pnpm test in {_GATE_YML}",
            "inputs": ["scripts/og-card.html", "the copy decks in scripts/build-og-card.mjs", "public/fonts/*"],
        },
    },
    {
        "glob": "public/blog/**",
        "class": "generated",
        "evidence": "the markdown twins scripts/build-blog.mjs projects from content/blog/*.md (build-blog.mjs:316 — 'public/blog/<slug>.md' with canon markers applied)",
        "derivation": {
            "tool": "node scripts/build-blog.mjs",
            "gate": _BLOG_GATE,
            "inputs": ["content/blog/*.md", "src/canon.generated.ts (canon marker values)"],
        },
    },
    {
        "glob": "public/media/**",
        "class": "generated",
        "evidence": "the run-explains media set — rendered by scripts/media/render-scenes.mjs (headless Chrome frame-stepping + ffmpeg) from real pty captures; 'every terminal pixel traces back to a raw pty capture of the real nika binary' (scripts/media/README.md)",
        "derivation": {
            "tool": "node scripts/media/render-scenes.mjs (deliberate manual lane)",
            "gate": _MEDIA_GATE,
            "inputs": ["scripts/media/scenes/*.html", "scripts/media/raw/*.ansi", "scripts/media/raw/manifest.json"],
        },
    },
    {
        "glob": "public/fonts/*.woff2",
        "class": "pinned-copy",
        "evidence": "third-party fonts self-hosted (Martian Grotesk/Mono · SIL OFL 1.1; Clash Display · Fontshare ITF FFL) per THIRD_PARTY_NOTICES.md",
        "note": "no upstream rev pin — pinned by the vendored bytes only",
    },
    {
        "glob": "public/library/*.nika.yaml",
        "class": "authored",
        "evidence": f"hand-crafted example workflows (SPDX headers · © SuperNovae Studio); src/test/onpage-yaml.test.ts validates them against the SHIPPED schema (engine {_engine})",
    },
    {
        "glob": "public/hero/*.nika.yaml",
        "class": "authored",
        "evidence": "the hero workflow + its deliberately broken twin — the INPUTS of scripts/build-hero-check.mjs (real `nika check` verdicts captured from the released binary, never invented)",
    },
    {
        "glob": "public/concepts/**",
        "class": "generated",
        "evidence": "lens redirect stubs (build-lens.mjs stub() · the redirects.json '/concepts/*' legacy_moves rows): meta-refresh + canonical — the append-only law: a published URL never 404s",
        "derivation": {"tool": f"node {_LENS} (pnpm lens)", "gate": _LENS_GATE, "inputs": _LENS_INPUTS},
    },
    {
        "glob": "public/engine/catalog/*.toml",
        "class": "pinned-copy",
        "evidence": f"byte-copies of crates/nika-catalog/data/*.toml at the pinned engine release ({_release_ref}) — the market catalog the /catalog world derives from · every byte receipted in public/engine/PROVENANCE.json",
        "derivation": {
            "tool": "node scripts/engine-resync.mjs --write (fetch BY SHA · verify commit+tree · vendor · receipt)",
            "gate": _ENGINE_RESYNC_GATE,
            "inputs": [".github/nika-engine-pin.json", f"{_release_ref} (the pinned release tree)"],
        },
    },
    {
        "glob": "tests/visual/golden/**",
        "class": "testimonial",
        "evidence": "visual-regression goldens — captured from the built site by scripts/visual-regress.mjs --update (pnpm visual:update), re-baked deliberately per platform (darwin/linux); .github/workflows/visual.yml pixel-compares against them — captured evidence of how the site RENDERED, not regenerable deterministically",
    },
    {
        "glob": "scripts/media/raw/**",
        "class": "testimonial",
        "evidence": "raw pty captures of the real released binary — 'raw/*.ansi (bytes, untouched)' + manifest.json (binary · commands · exit codes) per scripts/media/README.md · honesty law: no fake commands, no fake output, no hand-edited transcripts",
    },
    {
        "glob": "scripts/media/scenes/*.html",
        "class": "generated",
        "evidence": "scene pages built from the raw captures — 'gen-scenes.mjs: raw + manifest → scenes/*.html (GENERATED — never hand-edit)' (scripts/media/README.md) + in-file markers (grep -L verified 0 unmarked)",
        "derivation": {
            "tool": "node scripts/media/gen-scenes.mjs",
            "gate": _MEDIA_GATE,
            "inputs": ["scripts/media/raw/*.ansi", "scripts/media/raw/manifest.json", "scripts/media/ansi2html.mjs (mechanical ANSI→HTML)"],
        },
    },
    {
        "glob": "scripts/media/fixtures/**",
        "class": "authored",
        "evidence": "the runnable fixture workflows + items the captures ran (each dir runnable in place — scripts/media/README.md)",
    },
    {
        "glob": "scripts/lens/contracts/*.v1.json",
        "class": "authored",
        "evidence": "hand-written LENS policy contracts (declarative gate configuration — channels · gates · counts · features · presentation · snippets); the repinned digest baselines are listed individually in files:",
    },
    {
        "glob": "content/blog/**",
        "class": "authored",
        "evidence": "the authored blog sources — the markdown here is the SSOT the public/blog twins and generated modules mirror (+ the lane README)",
    },
    {
        "glob": "content/i18n/**",
        "class": "authored",
        "evidence": "the reviewed L1 translation corpus — one yaml per locale per page, en = the extraction twin (content/i18n/README.md); key parity gated by src/test/i18n.test.ts + i18n-lexicon.test.ts",
    },
    {
        "glob": "content/tool-usage/*.nika.yaml",
        "class": "authored",
        "evidence": "crafted minimal usage workflows (nika-check green) — inputs of scripts/build-tool-usage.mjs (its marker cites them)",
    },
    {
        "glob": "content/provider-usage/*.nika.yaml",
        "class": "authored",
        "evidence": "crafted per-provider donor workflows (nika: v1 headers · one per canonical provider) — inputs of scripts/build-provider-usage.mjs; the pricing shape they carry is the engine's models.dev-pinned snapshot",
    },
    {
        "glob": "design/**",
        "class": "authored",
        "evidence": "the icon system's SSOT + projector + artwork sources (design/icons.yaml · design/build.mjs · design/svg glyphs) — THIRD_PARTY_NOTICES.md: house set, no third-party icons",
    },
    {
        "glob": "docs/plans/*.md",
        "class": "authored",
        "evidence": "hand-written design/implementation plans",
    },
    {
        "glob": "patches/*.patch",
        "class": "authored",
        "evidence": "hand-maintained pnpm patches (vite-plugin-react-ssg) — applied by pnpm at install, authored diff, no generator",
    },
    {
        "glob": ".github/workflows/*.yml",
        "class": "authored",
        "evidence": "hand-written CI trust model (comments narrate design decisions); release-heal.yml + spec-resync.yml edit OTHER files, nothing writes these",
    },
    {
        "glob": "src/lib/check-wasm/pkg/**",
        "class": "pinned-copy",
        "evidence": "the @supernovae-st/nika-check-wasm package vendored VERBATIM from the GitHub release asset (sha256-verified against its published .sha256 sidecar) — the browser half of nika check, attested by the release train",
        "derivation": {
            "tool": "node scripts/revendor-check-wasm.mjs v<X.Y.Z> (release-asset only, never a local build)",
            "gate": "src/test/check-wasm-oracle.test.ts (same voice + same engine version as the captured binary) — pnpm test in " + _GATE_YML,
            "inputs": ["src/lib/check-wasm/PROVENANCE.json (the lane receipt)", "the release asset supernovae-st-nika-check-wasm-<v>.tgz"],
        },
    },
    {
        "glob": "src/**.generated.*",
        "class": "generated",
        "evidence": "every member carries its own AUTO-GENERATED marker naming its tool (scripts/lens/graph/build-lens.mjs · scripts/build-*.mjs · design/build.mjs · the nika-spec projectors); the exact-path contract outputs are excepted in files: with their precise derivations",
        "derivation": {
            "tool": "the tool each member's own header names (build-lens.mjs · build-*.mjs · design/build.mjs · canon/design/showcase projectors)",
            "gate": f"the named tool's drift suite — pnpm test byte-diff companions + pnpm check (design --check) in {_GATE_YML}",
            "inputs": ["the gated sources each member's header declares (sets.yaml · content/ · public/ catalogs · the spec pin)"],
        },
    },
    {
        "glob": "src/**",
        "class": "authored",
        "evidence": "hand-written site source (components · pages · sections · styles · lib · tests) — no generation marker",
    },
    {
        "glob": "scripts/**",
        "class": "authored",
        "evidence": "hand-written build/gate/verify tooling — these ARE the generators and judges (SPDX/design prose headers · no generation marker); estate.py excepted in files: (the mirror row)",
    },
    {
        "glob": "*",
        "class": "authored",
        "evidence": "root prose + config — no generation markers; the pinned/derived roots are excepted in files:",
    },
    {
        "glob": "**",
        "class": "authored",
        "evidence": "no evidence gathered — honesty over completeness (the catchall; anything landing here is reported under unverified:)",
        "note": "unverified-default",
    },
]
