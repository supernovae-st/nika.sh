import { ENGINE_VERSION } from '../content'
import { PLATFORM_GUIDE_NAV, type PlatformGuideId } from './platform-guides-nav'

export interface PlatformGuideStep {
  label: string
  title: string
  body: string
  command?: string
}

export interface PlatformGuide {
  id: PlatformGuideId
  title: string
  shortTitle: string
  eyebrow: string
  description: string
  promise: string
  facts: { label: string; value: string }[]
  steps: PlatformGuideStep[]
  links: { label: string; to: string; external?: boolean }[]
}

const releaseVersion = ENGINE_VERSION.replace(/^v/, '')
const nav = (index: number) => {
  const [id, shortTitle, eyebrow, title, description] = PLATFORM_GUIDE_NAV[index]
  return { id, shortTitle, eyebrow, title, description }
}

/**
 * Native artifact names are projected from the current release identity.
 * platform-guides.test.ts proves both names exist in the vendored release
 * record, so this readable projection cannot silently outrun the train.
 */
export const ARM64_RELEASE_ASSETS = [
  `nika-linux-arm64-${releaseVersion}.tar.gz`,
  `nika-macos-arm64-${releaseVersion}.tar.gz`,
] as const

export const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    ...nav(0),
    promise: 'No translation layer. One installer detects arm64 and aarch64, selects the native archive, and verifies the release digest before extraction.',
    facts: [
      { label: 'macOS', value: 'arm64 · native archive' },
      { label: 'Linux', value: 'arm64 / aarch64 · native archive' },
      { label: 'integrity', value: 'SHA256SUMS before extraction' },
      { label: 'release', value: ENGINE_VERSION },
    ],
    steps: [
      {
        label: '01 · inspect',
        title: 'Confirm the machine.',
        body: 'The installer accepts arm64 and aarch64 and normalizes both to the release target named arm64.',
        command: 'uname -sm',
      },
      {
        label: '02 · install',
        title: 'Take the verified lane.',
        body: 'On macOS the script tries the official Homebrew tap first. On Linux it downloads the matching GitHub release archive.',
        command: 'curl -LsSf https://nika.sh/install.sh | sh',
      },
      {
        label: '03 · verify',
        title: 'Ask the binary which build landed.',
        body: 'The version response identifies the installed engine. The release room carries every archived digest beside the asset name.',
        command: 'nika --version',
      },
      {
        label: '04 · operate',
        title: 'Pick a model lane independently.',
        body: 'Architecture selects the Nika binary, not the model provider. Keep inference local or use a cloud seat with the same workflow shape.',
      },
    ],
    links: [
      { label: 'Current release and digests', to: `/releases/${ENGINE_VERSION}` },
      { label: 'Local model guide', to: '/install/local-models' },
      { label: 'Every model seat', to: '/catalog/models' },
    ],
  },
  {
    ...nav(1),
    promise: 'The workflow remains the contract on a remote host. A missing enforcement backend is named and strict runs refuse instead of silently pretending to be confined.',
    facts: [
      { label: 'targets', value: 'Linux arm64 · Linux x64' },
      { label: 'sandbox', value: 'bubblewrap detected at install' },
      { label: 'preflight', value: 'nika check before spend' },
      { label: 'receipt', value: 'local hash-chained trace' },
    ],
    steps: [
      {
        label: '01 · install',
        title: 'Install the native release.',
        body: 'The installer selects Linux arm64 or x64, verifies SHA256SUMS, and places the binary under ~/.nika/bin unless you choose another directory.',
        command: 'curl -LsSf https://nika.sh/install.sh | sh',
      },
      {
        label: '02 · enforce',
        title: 'Make the sandbox visible.',
        body: 'Install the bubblewrap package supplied by your Linux distribution. Without bwrap, exec and MCP children are unjailed and a permits-declaring workflow refuses with NIKA-1710.',
        command: 'command -v bwrap && bwrap --version',
      },
      {
        label: '03 · preflight',
        title: 'Check before the scheduler spends.',
        body: 'Run the deterministic check in the same checkout, with the same workflow and environment shape that the job will execute.',
        command: 'nika check workflow.nika.yaml',
      },
      {
        label: '04 · export',
        title: 'Keep stdout for the caller, the trace for proof.',
        body: 'Machine output returns the declared outputs as one JSON value. The run journal remains local for review, resume and verification.',
        command: 'nika run workflow.nika.yaml --output json',
      },
    ],
    links: [
      { label: 'The boundary', to: '/how/boundary' },
      { label: 'The proof', to: '/how/proof' },
      { label: 'Typed server failures', to: '/language/errors/NIKA-AUTH-006' },
      { label: 'Workflow jobs', to: '/workflows/jobs' },
    ],
  },
  {
    ...nav(2),
    promise: 'Local is a provider choice, not a second language. The workflow keeps the same model string, limits, permits, graph and trace.',
    facts: [
      { label: 'catalog seats', value: 'Ollama · LM Studio · llama.cpp · LocalAI · vLLM' },
      { label: 'built in', value: 'nika model pull · serve' },
      { label: 'network', value: 'loopback or local process' },
      { label: 'pricing', value: 'unpriced, never called free' },
    ],
    steps: [
      {
        label: '01 · choose',
        title: 'Pick the local seat that fits the machine.',
        body: 'The provider rooms name the environment, seed models and connection shape. Ollama is the shortest first lane; vLLM is a server lane.',
      },
      {
        label: '02 · pull',
        title: 'Start with a model small enough to finish.',
        body: 'This is the same local model used by the public install page. It needs no provider key.',
        command: 'ollama pull llama3.2:3b',
      },
      {
        label: '03 · rehearse',
        title: 'Run a shipped workflow against that seat.',
        body: 'The showroom file is spec-checked before execution and the model override is explicit on the command line.',
        command: 'nika try 01-hello --model ollama/llama3.2:3b',
      },
      {
        label: '04 · consolidate',
        title: 'Use the built-in lane when one binary matters.',
        body: 'The current release also carries nika model pull, list, rm and serve. Inspect the shipped command tree on the installed binary before choosing that operational lane.',
        command: 'nika model --help',
      },
    ],
    links: [
      { label: 'Local provider rooms', to: '/catalog/providers' },
      { label: 'Model catalog', to: '/catalog/models' },
      { label: 'Energy register', to: '/catalog/energy' },
      { label: 'First workflow', to: '/workflows/path/01-hello' },
    ],
  },
]
