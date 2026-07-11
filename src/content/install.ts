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
export const EXAMPLES_CMD = 'nika examples run 01-hello --model ollama/llama3.2:3b'
export const CHECK_CMD = 'nika check hello.nika.yaml'
export const RUN_CMD = 'nika run hello.nika.yaml'
export const WELCOME_CMD = 'nika welcome'
export const DOCTOR_CMD = 'nika doctor'

/* the zero-setup first file — no model, no key (exec only) */
export const HELLO_YAML = `nika: v1
workflow: hello
tasks:
  - id: greet
    exec:
      command: "echo hello from nika"
`

/* the first AI step — a free local model, nothing leaves the machine */
export const HELLO_AI_YAML = `nika: v1
workflow: hello-ai
model: ollama/llama3.2:3b   # local · free · swap for any provider in the catalog
tasks:
  - id: greet
    infer:
      prompt: "Say hello in one sentence."
`

/* ── « what you should see » · VERBATIM transcripts from the shipping binary ──
   Captured 2026-07-10 against nika 0.99.0 (the verified release binary)
   running the exact HELLO_YAML above. The honesty law: these frames render
   REAL output — re-capture when the CLI's voice changes, never hand-edit. */
export const VERSION_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: 'nika --version' },
  { kind: 'out', text: 'nika 0.99.0' },
]

export const FIRST_RUN_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: 'nika check hello.nika.yaml' },
  { kind: 'out', text: 'nika check · hello.nika.yaml' },
  { kind: 'ok', text: ' ✔ PLAN     1 wave(s) · 1 task(s) · max parallelism 1' },
  { kind: 'dim', text: '      wave 1 greet (exec · sh -c)' },
  { kind: 'ok', text: ' ✔ COST     no inference tasks · $0.00' },
  { kind: 'ok', text: ' ✔ SECRETS  no information-flow escapes' },
  { kind: 'ok', text: ' ✔ TYPES    every deep output reference fits its declared shape' },
  { kind: 'ok', text: ' ✔ TOOLS    every nika: tool names a canonical builtin' },
  { kind: 'ok', text: ' ✔ ARGS     every invoke arg key is declared + every required arg is present' },
  { kind: 'ok', text: ' ✔ SCHEMA   every authored schema: is satisfiable' },
  { kind: 'soft', text: ' ○ PERMITS  no boundary declared (engine floor only) · `--infer-permits` writes one' },
  { kind: 'dim', text: ' ↳ HINT     [permits] no `permits:` boundary declared — run `nika check --infer-permits` to generate the tightest one (default-deny once present)' },
  { kind: 'ok', text: ' ✔ audited · 1 task(s) · 1 wave(s) · permits none · est ≥$0.0000 · 1 hint' },
  { kind: 'out', text: '' },
  { kind: 'cmd', text: 'nika run hello.nika.yaml' },
  { kind: 'out', text: '  🦋 nika · hello · 1 tasks' },
  { kind: 'dim', text: '     permits ✓ engine floor (no boundary declared)' },
  { kind: 'out', text: '' },
  { kind: 'ok', text: '  ✔  greet  exec · echo  15ms' },
  { kind: 'dim', text: '  ── 1/1 done · $0.00 · elapsed 0.0s ─────────────────────────────' },
  { kind: 'dim', text: '    trace: .nika/traces/2026-07-10T08-20-33Z-f3ff.ndjson · 5 events · chain 202fd3b1a0501118265e09485183acb0b577e49fde3b6638e27e03dbf4a7d106' },
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
    a: 'The install script is plain curl — it honors the standard proxy variables for the download. The binary itself phones nothing home.',
    cmd: 'HTTPS_PROXY=http://proxy:8080 curl -LsSf https://nika.sh/install.sh | sh',
  },
  {
    q: 'checksum mismatch on the tarball',
    a: 'A mismatch means a corrupted or tampered download — don’t run it. Re-download both the tarball and SHA256SUMS from the release page and verify again.',
    cmd: 'sha256sum -c SHA256SUMS --ignore-missing',
  },
]
