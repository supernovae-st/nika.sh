/* ─── SDK documentation graph · the browser-safe SSOT ──────────────────────
   Every SDK surface reads this one registry: route rooms, the hub, section
   pages, the guide rail, /map, llms.txt projections and the parity tests.
   The tutorial cargo stays in sdk.ts and reaches the client asynchronously.

   Status is a product contract, not decoration. `preview` means the typed
   client exists but its compatible workflow HTTP service does not ship.
   `mixed` means a page deliberately compares live local and preview remote
   surfaces and labels both at the point of use. */

export type SdkSectionId = 'start' | 'project' | 'local' | 'runtime' | 'remote' | 'operations' | 'reference'
export type SdkGuideStatus = 'live' | 'preview' | 'mixed'
export type SdkGuideId =
  | 'start/quickstart'
  | 'start/project-setup'
  | 'project/nika-yaml'
  | 'project/cwd-and-monorepos'
  | 'project/arm-registry'
  | 'project/policy-ladders'
  | 'project/runtime-state'
  | 'local/client'
  | 'local/check-and-plan'
  | 'local/run-and-cancel'
  | 'local/test-and-trace'
  | 'runtime/events'
  | 'runtime/errors'
  | 'runtime/receipts'
  | 'remote/client'
  | 'remote/jobs'
  | 'remote/streaming'
  | 'remote/artifacts'
  | 'remote/workflows'
  | 'remote/webhooks'
  | 'operations/ci'
  | 'operations/server-surfaces'
  | 'operations/resident-server'
  | 'operations/server-runbook'
  | 'operations/os-schedulers'
  | 'operations/deployment-topologies'
  | 'operations/security'
  | 'reference/configuration'
  | 'reference/methods'
  | 'reference/types'

export interface SdkGuideNavItem {
  id: SdkGuideId
  slug: string
  section: SdkSectionId
  label: string
  summary: string
  status: SdkGuideStatus
  docsPath: string
}

export interface SdkSectionNavItem {
  id: SdkSectionId
  index: string
  label: string
  title: string
  description: string
  status: SdkGuideStatus
  ascii: string
  guides: readonly SdkGuideNavItem[]
}

export const SDK_PACKAGE = '@supernovae-st/nika-client'
export const SDK_REPO = 'https://github.com/supernovae-st/nika-client'
export const SDK_DOCS = 'https://docs.nika.sh/sdk'

const guide = (
  section: SdkSectionId,
  slug: string,
  label: string,
  summary: string,
  status: SdkGuideStatus,
): SdkGuideNavItem => ({
  id: `${section}/${slug}` as SdkGuideId,
  slug,
  section,
  label,
  summary,
  status,
  docsPath: `${SDK_DOCS}/${section}/${slug}`,
})

export const SDK_SECTIONS: readonly SdkSectionNavItem[] = [
  {
    id: 'start',
    index: '01',
    label: 'Start',
    title: 'From install to a typed run.',
    description: 'Install both halves, choose a project boundary and get one workflow through check before application code can run it.',
    status: 'live',
    ascii: 'install  →  project  →  check  →  run',
    guides: [
      guide('start', 'quickstart', 'TypeScript quickstart', 'Install, audit and run a real workflow.', 'live'),
      guide('start', 'project-setup', 'Project setup', 'Found the real nika.yaml control plane, workflows and client boundary.', 'live'),
    ],
  },
  {
    id: 'project',
    index: '02',
    label: 'Project',
    title: 'Make the control plane explicit.',
    description: 'Choose the released nika.yaml profile, then align workflows, state and the project root.',
    status: 'live',
    ascii: 'nika.yaml  →  arm profile  →  firer  →  state',
    guides: [
      guide('project', 'nika-yaml', 'nika.yaml', 'Read its grammar, profiles and discovery.', 'live'),
      guide('project', 'cwd-and-monorepos', 'CWD and monorepos', 'Align project discovery and state roots.', 'live'),
      guide('project', 'arm-registry', 'Arm registry', 'Declare cadence, spend, silence and overlap.', 'live'),
      guide('project', 'policy-ladders', 'Policy ladders', 'Resolve spend, retention and provenance.', 'live'),
      guide('project', 'runtime-state', 'Runtime state', 'Place traces, ledgers and watermarks.', 'live'),
    ],
  },
  {
    id: 'local',
    index: '03',
    label: 'Local API',
    title: 'Drive the released engine.',
    description: 'Use LocalNika for the shipped path: argv-safe process control, machine reports, run events, goldens and trace verification.',
    status: 'live',
    ascii: 'TypeScript  →  argv + NDJSON  →  nika binary',
    guides: [
      guide('local', 'client', 'LocalNika client', 'Construct and probe the zero-dependency local driver.', 'live'),
      guide('local', 'check-and-plan', 'Check and plan', 'Read findings, cost, permits, requirements and waves.', 'live'),
      guide('local', 'run-and-cancel', 'Run and cancel', 'Stream a run, collect its outcome and cancel safely.', 'live'),
      guide('local', 'test-and-trace', 'Test and trace', 'Rehearse offline and verify the durable receipt.', 'live'),
    ],
  },
  {
    id: 'runtime',
    index: '04',
    label: 'Runtime',
    title: 'Turn the journal into product UI.',
    description: 'Consume additive events, branch on typed failures and keep transient presentation separate from the hash-chained receipt.',
    status: 'live',
    ascii: 'event*  →  outcome  →  trace  →  replay',
    guides: [
      guide('runtime', 'events', 'Run events', 'Render the NDJSON journal without guessing state.', 'live'),
      guide('runtime', 'errors', 'Errors and exits', 'Handle findings, process failures and exit contracts.', 'live'),
      guide('runtime', 'receipts', 'Receipts and replay', 'Keep proof after the process and interface are gone.', 'live'),
    ],
  },
  {
    id: 'remote',
    index: '05',
    label: 'Remote API',
    title: 'Build against the intended service contract.',
    description: 'Explore the typed HTTP, jobs, SSE, workflow, artifact and webhook surfaces without pretending a compatible reference service ships today.',
    status: 'preview',
    ascii: 'app  ⇢  HTTPS  ⇢  workflow service  [ preview ]',
    guides: [
      guide('remote', 'client', 'Remote client', 'Configure the future HTTP boundary and its retry policy.', 'preview'),
      guide('remote', 'jobs', 'Jobs', 'Submit, poll, cancel and settle remote work.', 'preview'),
      guide('remote', 'streaming', 'SSE streaming', 'Reconnect with Last-Event-Id and require a terminal event.', 'preview'),
      guide('remote', 'artifacts', 'Artifacts', 'Read text, JSON, bytes and large streams separately.', 'preview'),
      guide('remote', 'workflows', 'Workflow registry', 'List, paginate, reload and inspect workflow source.', 'preview'),
      guide('remote', 'webhooks', 'Webhooks', 'Verify timestamped HMAC signatures on raw bodies.', 'preview'),
    ],
  },
  {
    id: 'operations',
    index: '06',
    label: 'Operations',
    title: 'Admit work before it receives authority.',
    description: 'Operate live local processes and keep the future workflow HTTP boundary explicit.',
    status: 'mixed',
    ascii: 'audit  →  policy  →  rehearsal  →  protected run',
    guides: [
      guide('operations', 'ci', 'CI gate', 'Check, plan and rehearse before protected execution.', 'live'),
      guide('operations', 'server-surfaces', 'Server surfaces', 'Separate three server-shaped jobs.', 'mixed'),
      guide('operations', 'resident-server', 'Resident server', 'Run the stable project firer.', 'live'),
      guide('operations', 'server-runbook', 'Server runbook', 'Boot, probe and investigate resident serving.', 'live'),
      guide('operations', 'os-schedulers', 'OS schedulers', 'Bridge launchd or systemd to one firer.', 'live'),
      guide('operations', 'deployment-topologies', 'Deployment topologies', 'Choose the right process boundary.', 'mixed'),
      guide('operations', 'security', 'Security boundary', 'Keep argv, permits, budgets and secrets explicit.', 'live'),
    ],
  },
  {
    id: 'reference',
    index: '07',
    label: 'Reference',
    title: 'Every exported surface, one address.',
    description: 'Scan configuration defaults, method signatures and stable type shapes, with live and preview horizons visible beside every table.',
    status: 'mixed',
    ascii: 'config  ·  methods  ·  types  ·  source',
    guides: [
      guide('reference', 'configuration', 'Configuration', 'Local and remote constructor options with defaults.', 'mixed'),
      guide('reference', 'methods', 'Method index', 'Every LocalNika, jobs and workflows method at a glance.', 'mixed'),
      guide('reference', 'types', 'Type index', 'Reports, plans, events, jobs, artifacts and errors.', 'mixed'),
    ],
  },
] as const

export const SDK_GUIDE_NAV: readonly SdkGuideNavItem[] = SDK_SECTIONS.flatMap((section) => section.guides)
export const SDK_GUIDE_IDS: readonly SdkGuideId[] = SDK_GUIDE_NAV.map((item) => item.id)
export const SDK_SECTION_PATHS = SDK_SECTIONS.map((section) => `/sdk/${section.id}`)
export const SDK_GUIDE_PATHS = SDK_GUIDE_NAV.map((item) => `/sdk/${item.id}`)

export const sdkSection = (id: string) => SDK_SECTIONS.find((section) => section.id === id)
export const sdkGuide = (section: string, slug: string) =>
  SDK_GUIDE_NAV.find((item) => item.section === section && item.slug === slug)
