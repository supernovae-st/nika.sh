/* ─── /install page data · every fact mirrors the engine README ───────────────
   (github.com/supernovae-st/nika · the source of truth for install surfaces).
   Data module (react-refresh: component files must not export data). The two
   YAML files are schema-true against public/schema/workflow.json — gated by
   src/test/onpage-yaml.test.ts. */

import { REPO } from '../content'

/* the install script — downloads the verified release binary into ~/.nika/bin
   and prints the one PATH line to add to your shell profile. */
export const INSTALL_SH_CMD = 'curl -LsSf https://nika.sh/install.sh | sh'

/* manual / air-gapped verification (tarball + SHA256SUMS from the release) */
export const VERIFY_CMD = 'sha256sum -c SHA256SUMS --ignore-missing'
export const RELEASES_URL = `${REPO}/releases/latest`

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
model: ollama/llama3.2:3b   # local · free · swap for any of the 14 providers
tasks:
  - id: greet
    infer:
      prompt: "Say hello in one sentence."
`
