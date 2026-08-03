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
export const HELLO_YAML = `nika: v1
workflow:
  id: hello
permits:
  exec: ["echo"]
tasks:
  greet:
    exec:
      command: ["echo", "hello", "from", "nika"]`

/* the first AI step — a free local model, nothing leaves the machine */
export const HELLO_AI_YAML = `nika: v1
workflow:
  id: hello-ai
model: ollama/llama3.2:3b   # local · free · swap for any provider in the catalog
tasks:
  greet:
    infer:
      prompt: "Say hello in one sentence."`

/* ── « what you should see » · VERBATIM transcripts from the shipping binary ──
   Captured 2026-07-28 against nika 0.107.2 (the verified release binary)
   running the exact HELLO_YAML above. The honesty law: these frames render
   REAL output — re-capture when the CLI's voice changes, never hand-edit. */
export const VERSION_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: 'nika --version' },
  { kind: 'out', text: 'nika 0.107.2' },
]

export const FIRST_RUN_TRANSCRIPT: TermLine[] = [
  { kind: 'cmd', text: 'nika check hello.nika.yaml' },
  { kind: 'out', text: 'nika check · hello.nika.yaml' },
  { kind: 'ok', text: ' ✔ PLAN     1 wave · 1 task · max parallelism 1' },
  { kind: 'dim', text: '      wave 1 greet (exec · echo)' },
  { kind: 'ok', text: ' ✔ COST     no inference tasks · $0.00' },
  { kind: 'ok', text: ' ✔ SECRETS  no information-flow escapes' },
  { kind: 'ok', text: ' ✔ TYPES    every deep output reference fits its declared shape' },
  { kind: 'ok', text: ' ✔ TOOLS    every nika: tool names a canonical builtin' },
  { kind: 'ok', text: ' ✔ ARGS     every invoke arg key is declared + every required arg is present' },
  { kind: 'ok', text: ' ✔ SCHEMA   every authored schema: is satisfiable' },
  { kind: 'ok', text: ' ✔ GATES    every task is statically reachable · status literals in vocabulary' },
  { kind: 'ok', text: ' ✔ PERMITS  body fits the declared boundary' },
  { kind: 'ok', text: ' ✔ TRIFECTA no lethal trifecta without a dominating human gate' },
  { kind: 'ok', text: ' ✔ audited · 1 task · 1 wave · permits declared · est ≥$0.0000 · 0 hints' },
  { kind: 'out', text: '' },
  { kind: 'cmd', text: 'nika run hello.nika.yaml' },
  { kind: 'out', text: '  🦋 nika · hello · 1 task' },
  { kind: 'dim', text: '     permits ✓ declared boundary · default-deny' },
  { kind: 'out', text: '' },
  { kind: 'ok', text: '  ✔  greet  exec · echo  13ms' },
  { kind: 'dim', text: '  ── 1/1 done · $0.00 · elapsed 0.0s ─────────────────────────────' },
  { kind: 'dim', text: '    trace: .nika/traces/2026-07-28T00-14-59Z-1e25.ndjson · 7 events · chain d1d0936cf6689561617e4d4df41132e9b1ba403d47611ee39353a946b1263d42' },
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
