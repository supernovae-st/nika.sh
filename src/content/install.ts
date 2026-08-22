/* ─── /install page data · every fact mirrors the engine README ───────────────
   (github.com/supernovae-st/nika · the source of truth for install surfaces).
   Data module (react-refresh: component files must not export data). The two
   YAML files are schema-true against public/schema/workflow.json — gated by
   src/test/onpage-yaml.test.ts. */

import { REPO } from '../content'
import type { TermLine } from '../components/TermFrame'

/* the install script — downloads the verified release binary into ~/.nika/bin
   and prints the one PATH line to add to your shell profile. */
export const INSTALL_SH_CMD = 'curl -LsSf https://nika.sh/install.sh | sh'

/* manual / air-gapped verification (tarball + SHA256SUMS from the release) */
export const VERIFY_CMD = 'sha256sum -c SHA256SUMS --ignore-missing'
export const RELEASES_URL = `${REPO}/releases/latest`

/* the toolchain paths (engine README §Get started · both merged 2026-07-11):
   binstall fetches the PREBUILT release tarball (no compile · binary lands as
   `nika-cli` until the crates.io publish) · nix BUILDS the exact release
   source via the root flake (first run compiles, the store caches it). */
export const BINSTALL_CMD = `cargo binstall --git ${REPO} nika-cli`
export const NIX_RUN_CMD = 'nix run github:supernovae-st/nika'

/* the marketplace ids · the extension repo */
export const VSCODE_EXT_URL =
  'https://marketplace.visualstudio.com/items?itemName=supernovae.nika-lang'
export const OPENVSX_EXT_URL = 'https://open-vsx.org/extension/supernovae/nika-lang'
export const VSCODE_REPO = 'https://github.com/supernovae-st/nika-vscode'

/* agents · the one-command repo wiring */
export const INIT_CMD = 'nika init'
export const WIRE_CMD = 'nika wire cursor'

/* first run · a real local model leads (F4 · operator: no mock/echo on the
   marketing surface — the zero-key stub path lives in the DOCS only) */
export const OLLAMA_PULL_CMD = 'ollama pull llama3.2:3b'
/* V5 (0.107): the `examples` verb tree DIED — `nika try` is the showroom
   (bare lists the shelf, a slug rehearses it). Measured on the shipped
   binary: the old line exits rc=2 « unrecognized subcommand 'examples' ».
   The seat stays the model the row above just pulled, so this run answers
   for real — the F4 lock (no mock on the marketing surface) holds. */
export const EXAMPLES_CMD = 'nika try 01-hello --model ollama/llama3.2:3b'
export const CHECK_CMD = 'nika check hello.nika.yaml'
export const RUN_CMD = 'nika run hello.nika.yaml'
export const WELCOME_CMD = 'nika welcome'
export const DOCTOR_CMD = 'nika doctor'

/* the zero-setup first file — no model, no key (exec only). 0.106: an
   absent permits: is the EMPTY boundary, so even the hello declares its
   touch — two more lines, and the file IS the blast radius from day one. */
export const HELLO_YAML = `# first file after install · one exec, zero setup, zero keys
nika: hello
permits:
  exec: ["echo"]
tasks:
  greet:
    exec:
      command: ["echo", "hello", "from", "nika"]`

/* the first AI step — a free local model, nothing leaves the machine */
export const HELLO_AI_YAML = `# first model call · one local seat, one bounded sentence
nika: hello-ai
model: ollama/llama3.2:3b   # local · zero key · swap for any provider in the catalog
permits: {}
tasks:
  greet:
    infer:
      prompt: "Say hello in one sentence."
      max_tokens: 64

outputs:
  greeting: \${{ tasks.greet.output }}`

/* ── « what you should see » · VERBATIM transcripts from the shipping binary ──
   Captured 2026-08-19 against nika 0.113.0 (the verified release binary ·
   the macos-arm64 asset, sha256 checked against the release's SHA256SUMS)
   running the exact HELLO_YAML above from a bare directory. The honesty
   law: these frames render REAL output — re-capture when the CLI's voice
   changes, never hand-edit. */
export const VERSION_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: "nika --version" },
  { kind: 'out', text: "nika 0.113.0 (92199ced7)" },
]

export const FIRST_RUN_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: "nika check hello.nika.yaml" },
  { kind: 'out', text: "nika check · hello.nika.yaml" },
  { kind: 'ok', text: " ✔ PLAN     1 wave · 1 task · max parallelism 1" },
  { kind: 'dim', text: "      wave 1 greet (exec · echo)" },
  { kind: 'ok', text: " ✔ COST     no infer/agent tasks · $0.00 · exec + mcp spend unpriced" },
  { kind: 'ok', text: " ✔ SECRETS  no declared secret reaches an effect · model echo untracked" },
  { kind: 'ok', text: " ✔ TYPES    deep references fit the shapes tasks declare · builtin output has none" },
  { kind: 'ok', text: " ✔ TOOLS    every named nika: tool is canonical · globs + mcp: not checked" },
  { kind: 'ok', text: " ✔ ARGS     every builtin invoke arg key is declared + required args present" },
  { kind: 'ok', text: " ✔ SCHEMA   no known-unsatisfiable form in an authored schema: · $ref opaque" },
  { kind: 'ok', text: " ✔ GATES    no task proven dead · status literals in vocabulary" },
  { kind: 'ok', text: " ✔ WRITES   no two unordered tasks write the same static path · computed paths at run" },
  { kind: 'ok', text: " ✔ EXEC     no literal argv the exec floor refuses at run · a templated argv is the RUN's verdict" },
  { kind: 'ok', text: " ✔ PERMITS  literal + const: args fit the boundary · computed paths + symlinks are the RUN's verdict · exec outside the fs bounds" },
  { kind: 'ok', text: " ✔ TRIFECTA no lethal trifecta over the declared permits: without a human gate" },
  { kind: 'ok', text: " ✔ JOURNEY internal · 0 sources · 1 destination · 0 model endpoints · no secret reaches a cloud destination" },
  { kind: 'ok', text: " ✔ audited · 1 task · 1 wave · permits declared · est out ≤$0.0000 · 0 hints · risk supervised" },
  { kind: 'out', text: "" },
  { kind: 'cmd', text: "nika run hello.nika.yaml" },
  { kind: 'out', text: "  🦋 nika · hello · 1 task" },
  { kind: 'dim', text: "     permits ✓ declared boundary · exec outside the fs bounds" },
  { kind: 'out', text: "" },
  { kind: 'ok', text: "  ✔  greet  exec · echo  9ms" },
  { kind: 'dim', text: "  ── 1/1 done · $0.00 · elapsed 0.0s ─────────────────────────────" },
  { kind: 'dim', text: "    trace: .nika/traces/2026-08-18T23-26-42Z-0a8e.ndjson · 7 events · chain a145a48cf0d995069384cbd8332a067c01d7490f78190897cd6bdf46f40b90b6" },
]

/* ── troubleshooting · the four honest snags (each fix is verifiable) ────────── */
export const TROUBLE: { q: string; a: string; cmd?: string }[] = [
  {
    q: 'command not found: nika (after the install script)',
    a: 'The script installs to ~/.nika/bin and prints the exact PATH line to add to your shell profile (~/.zshrc, ~/.bashrc). Add it, reopen the terminal, and nika --version answers.',
    cmd: 'export PATH="$HOME/.nika/bin:$PATH"',
  },
  {
    q: 'macOS blocks the binary (manual tarball only)',
    a: 'A hand-downloaded binary carries the quarantine flag; brew and the install script don’t. Clear it once, or right-click → Open.',
    cmd: 'xattr -d com.apple.quarantine ./nika',
  },
  {
    q: 'behind a corporate proxy',
    a: 'The install script is plain curl; it honors the standard proxy variables for the download. The binary itself phones nothing home.',
    cmd: 'HTTPS_PROXY=http://proxy:8080 curl -LsSf https://nika.sh/install.sh | sh',
  },
  {
    q: 'checksum mismatch on the tarball',
    a: 'A mismatch means a corrupted or tampered download. Don’t run it. Re-download both the tarball and SHA256SUMS from the release page and verify again.',
    cmd: 'sha256sum -c SHA256SUMS --ignore-missing',
  },
]
