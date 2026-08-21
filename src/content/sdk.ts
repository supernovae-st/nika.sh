import {
  SDK_GUIDE_NAV,
  SDK_PACKAGE,
  SDK_REPO,
  type SdkGuideId,
  type SdkGuideNavItem,
} from './sdk-nav'

export type SdkCodeLanguage = 'bash' | 'typescript' | 'json' | 'text' | 'yaml'

export interface SdkGuideSection {
  label: string
  title: string
  body: string
  code?: string
  language?: SdkCodeLanguage
  filename?: string
  note?: string
  ascii?: string
  points?: readonly string[]
}

export interface SdkGuide extends SdkGuideNavItem {
  eyebrow: string
  title: string
  description: string
  promise: string
  facts: { label: string; value: string }[]
  sections: SdkGuideSection[]
  related: { label: string; to: string; external?: boolean }[]
}

const nav = (id: SdkGuideId) => {
  const item = SDK_GUIDE_NAV.find((guide) => guide.id === id)
  if (!item) throw new Error(`missing SDK navigation item: ${id}`)
  return item
}

export { SDK_PACKAGE, SDK_REPO }

/* Project control-plane samples live once in the SDK cargo. A guide may show
   one released reader profile, but none gets to invent a second tree or a
   second `arm:` grammar. The cadence path in nika 0.111.0 accepts the arm
   profile and still refuses the project parser's traces/registry rungs. Keep
   these samples separate until those engine readers converge. */
const PROJECT_ARM_FILE = `nika: v1

ceiling: 0.50

arm:
  - workflow: workflows/daily-brief.nika.yaml
    cadence: "TZ=Europe/Paris 30 7 * * 1-5"
    où: local
    plafond: 0.20
    manqué: rattraper-une-fois
    chevauchement: sauter`

const PROJECT_POLICY_FILE = `nika: v1

ceiling: 0.50

traces:
  keep: 30d

registry:
  floor: provenanced`

const PROJECT_TREE = `project/
├── nika.yaml                  # project profile + optional armed beats
├── workflows/
│   ├── daily-brief.nika.yaml  # intent
│   └── release.nika.yaml
├── src/
│   ├── nika.ts                # LocalNika construction
│   └── release.ts             # product code
├── .nika/
│   ├── traces/                # run journals
│   └── arm/                   # firing ledgers + watermarks
├── package.json
└── .gitignore`

const SDK_GUIDE_BODIES: readonly SdkGuide[] = [
  {
    ...nav('start/quickstart'),
    eyebrow: 'start here · live',
    title: 'Your first typed run.',
    description:
      'Install the zero-dependency client, audit a real workflow, then run it through the local engine from TypeScript.',
    promise:
      'Start with the surface that ships. LocalNika drives the installed engine through versioned machine contracts, with no HTTP service and no runtime dependency.',
    facts: [
      { label: 'package', value: SDK_PACKAGE },
      { label: 'runtime deps', value: 'zero' },
      { label: 'transport', value: 'argv + NDJSON' },
      { label: 'engine', value: 'your local binary' },
    ],
    sections: [
      {
        label: '01 · install',
        title: 'Install both halves.',
        body: 'The package supplies the typed driver. The Nika release supplies the engine that actually checks and runs the workflow.',
        code: 'brew install supernovae-st/tap/nika\nnpm install @supernovae-st/nika-client\nnika init --project-file',
        language: 'bash',
        filename: 'terminal',
      },
      {
        label: '02 · take a real file',
        title: 'Use a workflow the spec already proves.',
        body: 'Copy the first file from the teaching path into workflows/hello.nika.yaml. nika.yaml governs the project around it; the *.nika.yaml file remains the executable intent.',
        note: 'Do not invent a second example dialect inside application code. The workflow remains the contract and the project file remains the control plane.',
      },
      {
        label: '03 · audit, then run',
        title: 'Keep the verdict in the control flow.',
        body: 'Findings are a typed result, not an exception. Only start the run after the report is clean and the cost shape fits your policy.',
        code: `import { LocalNika } from '@supernovae-st/nika-client/local'

const nika = new LocalNika()
const report = await nika.check('workflows/hello.nika.yaml')

if (!report.clean || report.cost?.has_unbounded) {
  console.error(report.findings)
  process.exit(1)
}

const run = await nika.runToEnd('workflows/hello.nika.yaml', {
  maxCostUsd: 0.25,
})

console.log({ ok: run.ok, events: run.events.length })`,
        language: 'typescript',
        filename: 'run.ts',
      },
      {
        label: '04 · execute',
        title: 'Run the application normally.',
        body: 'LocalNika resolves the binary from an explicit path, then NIKA_BIN, then PATH. The workflow path is passed as an argv value without a shell.',
        code: 'npx tsx run.ts',
        language: 'bash',
        filename: 'terminal',
      },
    ],
    related: [
      { label: 'Copy the first workflow', to: '/workflows/path/01-hello' },
      { label: 'Install the engine', to: '/install' },
      { label: 'Found the project boundary', to: '/sdk/start/project-setup' },
      { label: 'Read the LocalNika API', to: '/sdk/local/client' },
    ],
  },
  {
    ...nav('local/client'),
    eyebrow: 'local API · live',
    title: 'Drive the binary you ship.',
    description:
      'The complete LocalNika surface: check, dry-run plan, event stream, test, resume and trace verification.',
    promise:
      'The local driver is deliberately thin. It never reimplements the language or its boundary. It starts the binary without a shell and types the machine output the engine owns.',
    facts: [
      { label: 'module', value: `${SDK_PACKAGE}/local` },
      { label: 'check report', value: 'report_version 1' },
      { label: 'plan object', value: 'plan_version 1' },
      { label: 'run journal', value: 'AsyncIterable' },
    ],
    sections: [
      {
        label: '01 · configure',
        title: 'Choose the binary and working directory.',
        body: 'The default constructor reads NIKA_BIN and then PATH. Set cwd when traces and relative workflow paths should belong to another project root.',
        code: `import { LocalNika } from '@supernovae-st/nika-client/local'

const nika = new LocalNika({
  bin: '/opt/nika/bin/nika',
  cwd: '/srv/workflows',
})

console.log(await nika.version())`,
        language: 'typescript',
        filename: 'client.ts',
      },
      {
        label: '02 · inspect',
        title: 'Ask for the audit and the dry-run plan.',
        body: 'check returns findings, permits, requirements, waves and the honest cost floor. dryRunPlan returns the machine plan or rejects with the check report when the file is dirty.',
        code: `const report = await nika.check('release.nika.yaml', {
  model: 'mock/echo',
  nativeStrict: true,
})

const plan = report.clean
  ? await nika.dryRunPlan('release.nika.yaml')
  : null

console.log(plan?.waves, plan?.permits)`,
        language: 'typescript',
        filename: 'inspect.ts',
        note: 'min_path_total_usd is a floor. has_unbounded stays beside it so a missing price can never become zero by accident.',
      },
      {
        label: '03 · execute',
        title: 'Stream or collect.',
        body: 'run exposes events as they arrive and an outcome promise for the final exit contract. runToEnd drains the same stream and returns one buffered outcome.',
        code: `const handle = nika.run('release.nika.yaml', {
  vars: { environment: 'staging' },
  maxCostUsd: 0.5,
})

for await (const event of handle) {
  console.log(event.kind)
}

const outcome = await handle.outcome
console.log(outcome.exitCode, outcome.ok)`,
        language: 'typescript',
        filename: 'stream.ts',
      },
      {
        label: '04 · prove',
        title: 'Test and verify the receipt.',
        body: 'The offline test lane and trace verifier are first-class methods. The returned verdict keeps the engine exit code and the chain head.',
        code: `const golden = await nika.test('release.nika.yaml')
const trace = await nika.traceVerify()

if (!golden.passed || !trace.intact) process.exit(1)
console.log(trace.head)`,
        language: 'typescript',
        filename: 'prove.ts',
      },
    ],
    related: [
      { label: 'Run event guide', to: '/sdk/runtime/events' },
      { label: 'CI gate tutorial', to: '/sdk/operations/ci' },
      { label: 'The proof layer', to: '/how/proof' },
      { label: 'Source on GitHub', to: SDK_REPO, external: true },
    ],
  },
  {
    ...nav('runtime/events'),
    eyebrow: 'observability · live',
    title: 'Read the run while it happens.',
    description:
      'Consume the engine NDJSON journal as an AsyncIterable, then settle on one typed outcome and keep the trace as proof.',
    promise:
      'The event stream is the run journal in motion. Your UI can react to it, while the engine remains the sole owner of task state, terminal verdicts and the trace on disk.',
    facts: [
      { label: 'local transport', value: 'stdout NDJSON' },
      { label: 'discriminator', value: 'kind' },
      { label: 'terminal result', value: 'outcome promise' },
      { label: 'durable twin', value: 'hash-chained trace' },
    ],
    sections: [
      {
        label: '01 · open',
        title: 'Keep the handle whole.',
        body: 'The handle is both an AsyncIterable and a promise-backed result. Consume the journal, then await the final exit contract.',
        code: `const handle = nika.run('pipeline.nika.yaml')

for await (const event of handle) {
  renderEvent(event)
}

const result = await handle.outcome`,
        language: 'typescript',
        filename: 'events.ts',
      },
      {
        label: '02 · narrow',
        title: 'Treat the vocabulary as additive.',
        body: 'The local event type guarantees kind and leaves the rest open. Handle the kinds your product needs and keep an unknown branch so a newer engine does not break an older client.',
        code: `function renderEvent(event: { kind: string; [key: string]: unknown }) {
  switch (event.kind) {
    case 'task_started':
    case 'task_completed':
    case 'workflow_completed':
      console.log(event)
      break
    default:
      console.debug('new engine event', event.kind)
  }
}`,
        language: 'typescript',
        filename: 'render-event.ts',
        note: 'Do not infer success from the last event you happened to recognize. The settled outcome carries the exit contract.',
      },
      {
        label: '03 · cancel',
        title: 'Let the caller own cancellation.',
        body: 'Pass an AbortSignal into run. The child process receives the cancellation through the SDK process seam, while the outcome still records how the run settled.',
        code: `const controller = new AbortController()
const handle = nika.run('pipeline.nika.yaml', {
  signal: controller.signal,
})

setTimeout(() => controller.abort(), 30_000)`,
        language: 'typescript',
        filename: 'cancel.ts',
      },
      {
        label: '04 · verify',
        title: 'Use the trace for history.',
        body: 'A UI stream is transient presentation. The hash-chained trace is the durable receipt for review, resume and replay after the process is gone.',
        code: `const verdict = await nika.traceVerify()
if (!verdict.intact) {
  throw new Error(verdict.output)
}`,
        language: 'typescript',
        filename: 'verify.ts',
      },
    ],
    related: [
      { label: 'The trace contract', to: '/language/spec/trace' },
      { label: 'Replay without rerunning', to: '/blog/the-run-keeps-its-receipt' },
      { label: 'Local driver reference', to: '/sdk/local/client' },
      { label: 'HTTP stream preview', to: '/sdk/remote/streaming' },
    ],
  },
  {
    ...nav('remote/client'),
    eyebrow: 'HTTP + SSE · preview',
    title: 'The remote client contract.',
    description:
      'Jobs, workflows, artifacts, retries and SSE are typed now. The compatible HTTP server surface is not shipped yet.',
    promise:
      'The root package types the intended remote workflow API. It is useful for integration work now, but it needs a compatible HTTP surface that the reference engine does not ship today.',
    facts: [
      { label: 'module', value: SDK_PACKAGE },
      { label: 'transport', value: 'HTTP + SSE' },
      { label: 'auth', value: 'Bearer token' },
      { label: 'status', value: 'target-facing preview' },
    ],
    sections: [
      {
        label: '01 · status',
        title: 'Read this before you connect.',
        body: 'Do not point this client at the current nika serve command. That command is the resident cadence runner, not an HTTP API. Use LocalNika for production against the released binary today.',
        note: 'Preview means the TypeScript surface exists and is tested against fixtures. It does not mean a compatible public service is available.',
      },
      {
        label: '02 · construct',
        title: 'The intended remote boundary.',
        body: 'A compatible service supplies an HTTPS origin and bearer token. The client owns bounded retries, timeouts and a request semaphore.',
        code: `import { Nika } from '@supernovae-st/nika-client'

const nika = new Nika({
  url: process.env.NIKA_URL!,
  token: process.env.NIKA_TOKEN!,
  timeout: 30_000,
  retries: 2,
  concurrency: 24,
})`,
        language: 'typescript',
        filename: 'remote.ts',
      },
      {
        label: '03 · jobs',
        title: 'Submit, wait or stream.',
        body: 'The jobs namespace covers submission, status, cancellation, artifacts and an SSE stream with idle detection and Last-Event-Id reconnection.',
        code: `const { job_id } = await nika.jobs.submit('pipeline.nika.yaml', {
  topic: 'workflow engines',
})

for await (const event of nika.jobs.stream(job_id)) {
  console.log(event.type)
}`,
        language: 'typescript',
        filename: 'job.ts',
      },
      {
        label: '04 · artifacts',
        title: 'Keep large bytes out of memory.',
        body: 'Text, JSON, binary downloads and ReadableStream artifacts are separate methods. runAndCollect deliberately skips binary artifacts.',
        code: `const stream = await nika.jobs.artifactStream(job_id, 'dataset.csv')

for await (const chunk of stream) {
  await sink.write(chunk)
}`,
        language: 'typescript',
        filename: 'artifact.ts',
      },
    ],
    related: [
      { label: 'Use the live local driver', to: '/sdk/local/client' },
      { label: 'Understand the server names', to: '/sdk/operations/server-surfaces' },
      { label: 'Integrations', to: '/integrations' },
      { label: 'Source on GitHub', to: SDK_REPO, external: true },
    ],
  },
  {
    ...nav('operations/server-surfaces'),
    eyebrow: 'operations · live + preview',
    title: 'Three surfaces. Three jobs.',
    description:
      'Separate the stable resident firer, the local model endpoint and the future workflow HTTP API before you deploy anything.',
    promise:
      'The resident firer and local model endpoint ship in the released engine. The workflow HTTP API remains preview. Their trust boundaries and clients are different.',
    facts: [
      { label: 'resident firer', value: 'live · nika serve' },
      { label: 'project source', value: 'nika.yaml arm registry' },
      { label: 'local model service', value: 'live · model serve' },
      { label: 'SDK root module', value: 'workflow HTTP preview' },
    ],
    sections: [
      {
        label: '01 · cadence',
        title: 'nika serve watches the project clock.',
        body: 'The released resident firer reads nika.yaml, sends every due beat through the same firing law as nika arm fire, reloads valid edits and shuts down cleanly on signals.',
        note: 'It schedules local workflows. It is not an HTTP listener. In release 0.111 its arm-ready nika.yaml accepts nika, ceiling and arm, but not the direct-run traces or registry rungs.',
      },
      {
        label: '02 · inference',
        title: 'nika model serve hosts a local model.',
        body: 'This foreground command starts the local model lane and exposes an OpenAI-compatible chat endpoint for the engine to call over loopback.',
        code: 'nika model serve --model Qwen/Qwen3-0.6B-GGUF',
        language: 'bash',
        filename: 'terminal',
      },
      {
        label: '03 · application code',
        title: 'LocalNika is the shipped application seam.',
        body: 'For a Node application today, drive the binary directly. It preserves the engine verdicts without requiring a daemon or inventing an HTTP contract around the CLI.',
        code: `import { LocalNika } from '@supernovae-st/nika-client/local'

const nika = new LocalNika({ cwd: process.cwd() })
const result = await nika.runToEnd('workflow.nika.yaml')`,
        language: 'typescript',
        filename: 'app.ts',
      },
      {
        label: '04 · remote work',
        title: 'The HTTP workflow API is a separate horizon.',
        body: 'The root SDK module already describes jobs, workflows, SSE and artifacts. Treat it as a preview until a compatible service is released and its deployment contract is published.',
      },
    ],
    related: [
      { label: 'Operate the resident firer', to: '/sdk/operations/resident-server' },
      { label: 'Local models', to: '/install/local-models' },
      { label: 'HTTP client preview', to: '/sdk/remote/client' },
      { label: 'Project control plane', to: '/sdk/project/nika-yaml' },
    ],
  },
  {
    ...nav('operations/resident-server'),
    eyebrow: 'operations · live',
    title: 'Keep the project clock resident.',
    description:
      'Run nika serve on a container, VM or bare server so due arm entries fire through the released engine and its normal proof path.',
    promise:
      'nika serve is the stable resident firer, not an HTTP API. It watches nika.yaml, computes due beats, calls the one firer and leaves every decision in project state.',
    facts: [
      { label: 'command', value: 'nika serve' },
      { label: 'input', value: 'nika.yaml arm[]' },
      { label: 'network listener', value: 'none' },
      { label: 'delivery', value: 'at-least-once' },
    ],
    sections: [
      {
        label: '01 · rehearse',
        title: 'Separate calendar preview from a real fire.',
        body: '--dry says which beats are calendar-due and changes nothing. --once performs one sweep and exits. A real long-lived invocation waits on the wall clock until the next due slot.',
        code: 'nika serve --dry\nnika serve --once\nnika serve',
        language: 'bash',
        filename: 'terminal',
        note: '--dry does not take the beat lock or apply the complete missed-run, overlap, cost and execution policy. would fire is a calendar statement, not a promise.',
      },
      {
        label: '02 · reload',
        title: 'Keep the last valid registry alive.',
        body: 'The resident loop watches nika.yaml. A valid edit replaces the registry. A broken edit is reported and the last valid registry remains active while the next tick retries the file.',
        ascii: `nika.yaml mtime changes
        │
        ├── valid ── swap registry ── continue
        └── refused ─ report fault ── keep last good`,
      },
      {
        label: '03 · settle',
        title: 'Stop cleanly and read the ledger.',
        body: 'Ctrl-C and SIGTERM stop the resident loop at its signal boundaries. Each beat result travels in the stdout line and .nika/arm ledger. A completed once sweep exits clean even when an individual run failed or paused, so operations must read both channels.',
        points: [
          'stdout is one decision line per beat.',
          'history.ndjson carries claims, skips and receipts.',
          'the run trace carries workflow events and its exit contract.',
        ],
      },
      {
        label: '04 · deliver',
        title: 'Design effects for at-least-once delivery.',
        body: 'A crash after the durable claim but before its receipt leaves an unmatched claim. The engine never calls that exactly-once. Make external effects idempotent when a repeated fire must be harmless.',
        ascii: `claim appended ── run starts ── receipt appended
       │                 │
       └── crash here ───┴── visible orphan, never silent certainty`,
      },
    ],
    related: [
      { label: 'Arm registry', to: '/sdk/project/arm-registry' },
      { label: 'Runtime state', to: '/sdk/project/runtime-state' },
      { label: 'Production runbook', to: '/sdk/operations/server-runbook' },
      { label: 'Deployment topologies', to: '/sdk/operations/deployment-topologies' },
    ],
  },
  {
    ...nav('operations/server-runbook'),
    eyebrow: 'operations · production',
    title: 'Operate the process you actually have.',
    description:
      'Boot, supervise, probe, deploy and investigate the stable resident firer without inventing an HTTP health surface.',
    promise:
      'A production runbook names the project room, binary, state volume, signal path and evidence check. nika serve stays a foreground process that a normal supervisor can own.',
    facts: [
      { label: 'process model', value: 'foreground · one project' },
      { label: 'readiness', value: 'CLI probe · no HTTP' },
      { label: 'restart', value: 'supervisor policy' },
      { label: 'investigation', value: 'decision → ledger → trace' },
    ],
    sections: [
      {
        label: '01 · boot gate',
        title: 'Refuse the deploy before the loop starts.',
        body: 'Run the same released binary from the production working directory. Version, arm report and dry sweep prove binary resolution, project discovery and cadence parsing without starting a resident loop.',
        code: 'cd /srv/nika/project\n/usr/local/bin/nika --version\n/usr/local/bin/nika arm --plain\n/usr/local/bin/nika serve --dry --plain',
        language: 'bash',
        filename: 'preflight.sh',
        note: 'serve --dry is a calendar preview, not a full fire rehearsal. It does not prove provider credentials or external effects.',
      },
      {
        label: '02 · supervise',
        title: 'Keep Nika in the foreground.',
        body: 'Give systemd, a container runtime or another supervisor the process lifetime. Pin WorkingDirectory and ExecStart so login shells and PATH never become production configuration.',
        code: `[Service]
Type=simple
WorkingDirectory=/srv/nika/project
ExecStart=/usr/local/bin/nika serve --plain
EnvironmentFile=/etc/nika/project.env
Restart=on-failure
KillSignal=SIGTERM`,
        language: 'text',
        filename: 'nika-serve.service',
      },
      {
        label: '03 · probe',
        title: 'Do not curl a port that does not exist.',
        body: 'The resident firer exposes no HTTP health endpoint. Liveness is the supervised process. Configuration readiness is a separate nika arm probe from the same cwd. Workload truth lives in decision lines and durable state.',
        ascii: `process alive ─────────────── LIVENESS
nika arm exits 0 ─────────── CONFIG READINESS
beat decision + ledger ───── WORKLOAD TRUTH
trace verify ─────────────── RUN INTEGRITY`,
      },
      {
        label: '04 · deploy and inspect',
        title: 'Follow one evidence path.',
        body: 'Preflight a new file before replacement. The resident loop keeps the last valid registry on a refused edit. When a beat surprises you, start at its one-line decision, inspect the matching arm history, then verify the referenced workflow trace.',
        code: 'nika arm --plain\nnika trace ls\nnika trace verify .nika/traces/<run>.ndjson',
        language: 'bash',
        filename: 'incident.sh',
        note: 'The emitted launchd and systemd timers on the OS scheduler page are per-beat bridges. They are not supervisors for the resident nika serve process.',
      },
    ],
    related: [
      { label: 'Resident server semantics', to: '/sdk/operations/resident-server' },
      { label: 'CWD and monorepos', to: '/sdk/project/cwd-and-monorepos' },
      { label: 'Runtime state', to: '/sdk/project/runtime-state' },
      { label: 'Security boundary', to: '/sdk/operations/security' },
    ],
  },
  {
    ...nav('operations/os-schedulers'),
    eyebrow: 'operations · live',
    title: 'Bridge the project clock to the OS.',
    description:
      'Emit launchd or systemd user units that invoke the same nika arm fire path as the resident server.',
    promise:
      'Use the host scheduler when it already owns process lifetime, wakeups and restart policy. Nika emits the unit, but firing law, spend limits and receipts remain inside the engine.',
    facts: [
      { label: 'macOS', value: 'launchd user agent' },
      { label: 'Linux', value: 'systemd user timer + service' },
      { label: 'secrets', value: 'env file · never inline' },
      { label: 'firing path', value: 'nika arm fire' },
    ],
    sections: [
      {
        label: '01 · preview',
        title: 'Inspect generated units before they touch the host.',
        body: 'Without --write, the emitter prints the exact launchd or systemd unit. Review the binary path, working directory, calendar and environment file before installation.',
        code: 'nika arm --emit launchd\nnika arm --emit systemd',
        language: 'bash',
        filename: 'terminal',
      },
      {
        label: '02 · install',
        title: 'Write the user-scoped bridge deliberately.',
        body: 'The user scope is the live posture. Give the emitted service an explicit binary and environment file in production so a shell profile never becomes hidden deployment state.',
        code: `nika arm --emit systemd --write \\
  --mode user \\
  --nika-bin /usr/local/bin/nika \\
  --env-file /srv/nika/project.env`,
        language: 'bash',
        filename: 'terminal',
      },
      {
        label: '03 · preserve',
        title: 'Keep provider keys out of generated units.',
        body: 'The env file path belongs in the unit. Secret values stay in the protected file or host secret mechanism. The emitted bytes can be reviewed without leaking provider authority.',
        points: [
          'Generated unit: path, calendar, cwd and command.',
          'Protected env file: provider keys and deployment-only values.',
          'nika.yaml: arm-ready project controls and declarations, never secret bytes.',
        ],
      },
      {
        label: '04 · disarm',
        title: 'Leave an auditable suspension.',
        body: 'Removing an arm row does not narrate why it stopped. Mark the beat inactive with a reason and expiry. The disarm command teaches the unload gesture and can remove generated unit files without pretending it edited project intent.',
        code: `${PROJECT_ARM_FILE}
    actif: false
    raison: maintenance fournisseur
    jusqu_au: 2026-09-01`,
        language: 'yaml',
        filename: 'nika.yaml',
      },
    ],
    related: [
      { label: 'Resident server', to: '/sdk/operations/resident-server' },
      { label: 'Linux deployment', to: '/install/servers' },
      { label: 'Arm registry', to: '/sdk/project/arm-registry' },
      { label: 'Security boundary', to: '/sdk/operations/security' },
    ],
  },
  {
    ...nav('operations/deployment-topologies'),
    eyebrow: 'operations · decision guide',
    title: 'Choose the process boundary first.',
    description:
      'Match LocalNika, nika serve, the OS bridge, model serve or the preview HTTP client to the job each one actually owns.',
    promise:
      'A product request, a project clock, a host scheduler, an inference endpoint and a workflow API are different boundaries. Choosing by job prevents the word server from turning them into one false architecture.',
    facts: [
      { label: 'request-driven app', value: 'LocalNika · live' },
      { label: 'project-driven clock', value: 'nika serve · live' },
      { label: 'host-driven clock', value: 'arm --emit · live' },
      { label: 'remote workflow API', value: 'root SDK · preview' },
    ],
    sections: [
      {
        label: '01 · application',
        title: 'Use LocalNika when product code starts the run.',
        body: 'An API handler, worker or desktop application can check and spawn the released binary directly. The application owns cancellation and presentation. The engine owns the workflow, boundary and receipt.',
        code: `const run = nika.run('workflows/support.nika.yaml', {
  vars: { ticket: request.id },
  signal: request.signal,
})`,
        language: 'typescript',
        filename: 'worker.ts',
      },
      {
        label: '02 · clock',
        title: 'Use serve or the OS when time starts the run.',
        body: 'A container or VM with no scheduler keeps nika serve resident. A host already governed by launchd or systemd can emit user units. Both consume the same arm registry and end at the same firer.',
        ascii: `container / bare VM ── nika serve ──────┐
                                           ├── arm fire law
managed host ───────── launchd / systemd ──┘`,
      },
      {
        label: '03 · model',
        title: 'Use model serve only as an inference provider.',
        body: 'nika model serve listens on loopback with an OpenAI-compatible model API. The engine calls it for inference. It does not accept workflow jobs and application code should not confuse it with the SDK service horizon.',
        code: 'nika model serve --model Qwen/Qwen3-0.6B-GGUF --port 8712',
        language: 'bash',
        filename: 'terminal',
      },
      {
        label: '04 · horizon',
        title: 'Keep the root SDK behind a preview gate.',
        body: 'The root Nika client types a future jobs, workflows, SSE, artifacts and webhook service. The reference engine does not ship that compatible HTTP API today. Build adapters against the types, but do not route production traffic to nika serve.',
        note: 'The migration door is explicit: LocalNika is live now. The root remote client stays preview until a compatible workflow service and its deployment contract ship.',
      },
    ],
    related: [
      { label: 'Server surface truth table', to: '/sdk/operations/server-surfaces' },
      { label: 'LocalNika client', to: '/sdk/local/client' },
      { label: 'Remote client preview', to: '/sdk/remote/client' },
      { label: 'Project setup', to: '/sdk/start/project-setup' },
    ],
  },
  {
    ...nav('operations/ci'),
    eyebrow: 'tutorial · live',
    title: 'Refuse before CI spends.',
    description:
      'Turn the engine audit, the static cost floor and a mock rehearsal into one typed pull-request gate.',
    promise:
      'A pull request should prove the file is clean, bound the spend shape and rehearse the same graph on mock access before a protected job receives real authority.',
    facts: [
      { label: 'audit', value: 'check --json' },
      { label: 'rehearsal', value: 'mock/echo' },
      { label: 'spend policy', value: 'typed floor + unbounded flag' },
      { label: 'receipt', value: 'trace verify' },
    ],
    sections: [
      {
        label: '01 · pin',
        title: 'Install a known engine and client pair.',
        body: 'Pin both artifacts and print both versions. Their release numbers do not need to match; the local driver follows the versioned machine contract and must make any real compatibility floor explicit.',
        code: 'nika --version\nnpm ls @supernovae-st/nika-client',
        language: 'bash',
        filename: 'ci',
      },
      {
        label: '02 · audit',
        title: 'Fail on findings and unknown spend.',
        body: 'A clean boolean is necessary, but it is not the whole admission decision. Read the cost shape explicitly and reject an unbounded plan when the CI policy requires a dollar ceiling.',
        code: `const report = await nika.check('workflow.nika.yaml', {
  model: 'mock/echo',
  nativeStrict: true,
})

if (!report.clean) {
  console.error(report.findings)
  process.exit(2)
}

if (report.cost?.has_unbounded) {
  console.error('CI requires a bounded model price')
  process.exit(3)
}`,
        language: 'typescript',
        filename: 'gate.ts',
      },
      {
        label: '03 · inspect',
        title: 'Record what the engine plans.',
        body: 'The dry-run object gives reviewers the waves, task verbs, requirements and declared boundary without starting the workflow.',
        code: `const plan = await nika.dryRunPlan('workflow.nika.yaml')
console.log(JSON.stringify({
  workflow: plan.workflow,
  waves: plan.waves,
  permits: plan.permits,
}, null, 2))`,
        language: 'typescript',
        filename: 'gate.ts',
      },
      {
        label: '04 · rehearse',
        title: 'Run the graph without provider authority.',
        body: 'Use the mock model in pull requests. Give provider keys and deployment authority only to the protected job that needs them.',
        code: `const run = await nika.runToEnd('workflow.nika.yaml', {
  model: 'mock/echo',
  maxCostUsd: 0,
})

if (!run.ok) process.exit(run.exitCode)`,
        language: 'typescript',
        filename: 'gate.ts',
      },
    ],
    related: [
      { label: 'CI without ambient authority', to: '/blog/ci-without-ambient-authority' },
      { label: 'The boundary', to: '/how/boundary' },
      { label: 'Typed errors', to: '/language/errors' },
      { label: 'Local driver reference', to: '/sdk/local/client' },
    ],
  },
  {
    ...nav('start/project-setup'),
    eyebrow: 'start · project boundary',
    title: 'Give the SDK a place to stand.',
    description:
      'Organize the workflow, binary resolution, generated receipts and application entrypoint before the first production run.',
    promise:
      'A small boundary pays for itself: workflows stay reviewable, the binary is resolved explicitly, receipts have a predictable home and application code never contains a second workflow language.',
    facts: [
      { label: 'project control', value: 'nika.yaml' },
      { label: 'workflow source', value: '*.nika.yaml' },
      { label: 'application seam', value: 'LocalNika + cwd' },
      { label: 'runtime state', value: '.nika/traces + .nika/arm' },
    ],
    sections: [
      {
        label: '01 · layout',
        title: 'Put nika.yaml at the project root.',
        body: 'The root file owns the chosen project profile. The workflows directory owns intent. The SDK receives a workflow path and a cwd so the engine discovers that project root the same way git discovers .git.',
        ascii: PROJECT_TREE,
      },
      {
        label: '02 · found',
        title: 'Let the engine lay the starter.',
        body: 'The project file is optional, but any project that arms work or governs spend, retention or provenance should make it explicit. The scripted founding door never overwrites an existing file without --force.',
        code: 'nika init --project-file --recipe starter\nnika arm',
        language: 'bash',
        filename: 'terminal',
        note: 'For an armed project in release 0.111, keep nika.yaml to nika, ceiling and arm. The direct-run traces and registry rungs are live, but the cadence reader does not accept them yet.',
      },
      {
        label: '03 · resolve',
        title: 'Choose how the binary is found.',
        body: 'The explicit constructor option wins, then NIKA_BIN, then PATH. cwd is equally important: it anchors relative workflow paths, project-file discovery and .nika state.',
        code: `const nika = new LocalNika({
  bin: process.env.APP_NIKA_BIN,
  cwd: new URL('..', import.meta.url).pathname,
})`,
        language: 'typescript',
        filename: 'src/nika.ts',
      },
      {
        label: '04 · govern',
        title: 'Keep generated state out of source control.',
        body: 'Traces can contain run metadata and outputs. Arm ledgers record claims, skips and receipts. Persist them deliberately on a server, but do not commit them as source.',
        code: '.nika/traces/\n.nika/arm/\n.env',
        language: 'text',
        filename: '.gitignore',
      },
      {
        label: '05 · probe',
        title: 'Fail startup with a useful diagnosis.',
        body: 'Probe the binary once at service startup. A missing executable is an environment error; a dirty workflow remains a typed check report later.',
        code: `try {
  console.info('engine', await nika.version())
} catch (error) {
  console.error('Nika is unavailable', error)
  process.exit(3)
}`,
        language: 'typescript',
        filename: 'src/bootstrap.ts',
      },
    ],
    related: [
      { label: 'TypeScript quickstart', to: '/sdk/start/quickstart' },
      { label: 'Read nika.yaml', to: '/sdk/project/nika-yaml' },
      { label: 'Workflow teaching path', to: '/workflows' },
      { label: 'Deep documentation', to: 'https://docs.nika.sh/sdk/start/project-setup', external: true },
    ],
  },
  {
    ...nav('project/nika-yaml'),
    eyebrow: 'project control · live',
    title: 'The project starts at nika.yaml.',
    description:
      'Use the root project file for default spend and one released reader profile: armed beats, or run retention and provenance policy.',
    promise:
      'nika.yaml is the project control plane. It is optional when defaults are enough, closed when present, discovered from cwd toward the filesystem root and separate from each *.nika.yaml workflow. The released cadence reader does not yet compose every project key.',
    facts: [
      { label: 'filename', value: 'nika.yaml' },
      { label: 'discovery', value: 'cwd → ancestors' },
      { label: 'present grammar', value: 'closed · unknown keys refuse' },
      { label: 'absent file', value: 'built-in defaults' },
    ],
    sections: [
      {
        label: '01 · distinguish',
        title: 'One project file. Many workflow files.',
        body: 'The filenames encode different jobs in the released engine. nika.yaml governs the project. Files ending in .nika.yaml carry executable workflow intent. Application code points at a workflow while cwd anchors the project around it.',
        ascii: `nika.yaml                     PROJECT CONTROL
├── ceiling
├── arm[] ──────────────────┐  ARM PROFILE
└── traces · registry       │  RUN POLICY PROFILE
                            │ names
workflows/*.nika.yaml        │ WORKFLOW INTENT
└── tasks · permits · run ◀──┘`,
      },
      {
        label: '02 · arm profile',
        title: 'Use this file with arm and serve.',
        body: 'This profile passes both released readers. Every effect-bearing beat names its own spend ceiling and missed-run policy. Nothing important is inferred from a convenient default.',
        code: PROJECT_ARM_FILE,
        language: 'yaml',
        filename: 'nika.yaml',
        note: 'Release 0.111 limitation: traces and registry are valid project-run policy, but the cadence reader still refuses them. Do not add those blocks to a project operated by nika arm or nika serve yet.',
      },
      {
        label: '03 · run policy profile',
        title: 'Use these rungs for direct runs.',
        body: 'The project parser applies trace retention and registry provenance to direct workflow operations. This policy-only profile is live for the run path, but it is not accepted by the current arm and serve cadence path.',
        code: PROJECT_POLICY_FILE,
        language: 'yaml',
        filename: 'nika.yaml',
      },
      {
        label: '04 · discover',
        title: 'cwd selects the governing project.',
        body: 'Discovery walks from the working directory through its ancestors and stops at the first nika.yaml. This makes a nested Node service and a terminal invocation resolve the same project when both start inside the repo.',
        code: `const nika = new LocalNika({
  cwd: '/srv/my-project',
})

await nika.runToEnd('workflows/daily-brief.nika.yaml')`,
        language: 'typescript',
        filename: 'src/nika.ts',
        note: 'A missing project file is not an error. A malformed present file is a named refusal because a typo that silently disables policy is worse than no policy.',
      },
      {
        label: '05 · found and judge',
        title: 'Create it deliberately, then ask what is armed.',
        body: 'The init flag lays a commented starter. Bare nika arm judges an arm-ready profile, reports the next slots and schedules nothing. A policy-only profile is consumed by direct run operations instead.',
        code: 'nika init --project-file\nnika arm',
        language: 'bash',
        filename: 'terminal',
      },
    ],
    related: [
      { label: 'Project setup', to: '/sdk/start/project-setup' },
      { label: 'CWD and monorepos', to: '/sdk/project/cwd-and-monorepos' },
      { label: 'Arm registry', to: '/sdk/project/arm-registry' },
      { label: 'Policy ladders', to: '/sdk/project/policy-ladders' },
      { label: 'Deep project docs', to: 'https://docs.nika.sh/sdk/project/nika-yaml', external: true },
    ],
  },
  {
    ...nav('project/cwd-and-monorepos'),
    eyebrow: 'project roots · live',
    title: 'CWD is an operational decision.',
    description:
      'Align the process room, discovered project file, workflow paths and runtime state before a monorepo creates two invisible roots.',
    promise:
      'Project policy discovery walks upward. Direct-run trace storage does not. Set LocalNika cwd to the intended project root when one control plane and one evidence well are the goal.',
    facts: [
      { label: 'project lookup', value: 'cwd → first ancestor' },
      { label: 'direct traces', value: 'cwd/.nika/traces' },
      { label: 'arm state', value: 'project/.nika/arm' },
      { label: 'armed run traces', value: 'project/.nika/traces' },
    ],
    sections: [
      {
        label: '01 · separate the roots',
        title: 'Discovery and storage answer different questions.',
        body: 'The engine can discover an ancestor nika.yaml while a direct run still writes its trace under the process working directory. The arm and serve paths deliberately enter the discovered project root before firing, so their ledger and triggered-run traces live together there.',
        ascii: `/repo/apps/api/                 LocalNika cwd
├── .nika/traces/              direct-run receipts
└── ↑ discover
    /repo/nika.yaml             governing project
    /repo/.nika/arm/            firing ledger
    /repo/.nika/traces/         arm / serve run receipts`,
      },
      {
        label: '02 · align',
        title: 'Use the project root as the process room.',
        body: 'A root-aligned cwd gives relative workflow paths, project discovery, direct traces and armed state one explainable home. Resolve the absolute directory once at application startup.',
        code: `import { fileURLToPath } from 'node:url'
import { LocalNika } from '@supernovae-st/nika-client/local'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))

export const nika = new LocalNika({ cwd: projectRoot })

await nika.runToEnd('workflows/release.nika.yaml')`,
        language: 'typescript',
        filename: 'src/runtime/nika.ts',
      },
      {
        label: '03 · nest deliberately',
        title: 'A nested nika.yaml is a real boundary.',
        body: 'The first file found wins. Put a second nika.yaml under apps/api only when that service must have its own ceiling or project profile. Do not add one merely to shorten a path because it also changes which policy the engine applies.',
        ascii: `/repo/nika.yaml                  platform project
└── apps/
    ├── api/nika.yaml           API project boundary
    │   └── workflows/
    └── worker/                 inherits /repo/nika.yaml`,
        note: 'Review nested project files like package boundaries. A new file changes discovery for every process started below it.',
      },
      {
        label: '04 · inspect',
        title: 'Probe from the same room as production.',
        body: 'Run the report and trace listing with the exact working directory the service will use. A clean command from the repository root does not prove a nested deployment uses the same project or evidence store.',
        code: 'cd /srv/nika/project\nnika arm\nnika trace ls\nnika serve --dry',
        language: 'bash',
        filename: 'terminal',
      },
    ],
    related: [
      { label: 'Project setup', to: '/sdk/start/project-setup' },
      { label: 'Project runtime state', to: '/sdk/project/runtime-state' },
      { label: 'LocalNika configuration', to: '/sdk/reference/configuration' },
      { label: 'Resident server', to: '/sdk/operations/resident-server' },
    ],
  },
  {
    ...nav('project/arm-registry'),
    eyebrow: 'project clock · live',
    title: 'The file proposes. The machine disposes.',
    description:
      'Declare each armed workflow, cadence, execution locus, per-tick ceiling and missed-run policy in the project file.',
    promise:
      'An arm entry is a proposal with explicit money and failure semantics. Reading it schedules nothing. nika arm fire, emitted OS units and nika serve all end at the same firer.',
    facts: [
      { label: 'registry', value: 'nika.yaml · arm[]' },
      { label: 'report', value: 'nika arm · read-only' },
      { label: 'one-shot edge', value: 'nika arm fire' },
      { label: 'resident edge', value: 'nika serve' },
    ],
    sections: [
      {
        label: '01 · required truth',
        title: 'Every beat names what, when, cost and silence.',
        body: 'workflow and cadence choose the target and clock. plafond and manqué are also required. A default ceiling could spend what nobody approved, and a default miss policy could either duplicate work or lose it silently.',
        note: 'The current arm-ready top level is nika, ceiling and arm. traces and registry belong to the live direct-run policy profile until the engine readers converge.',
        points: [
          'workflow: a repo-relative *.nika.yaml path.',
          'cadence: readable time, five-field cron with TZ, or on-webhook.',
          'plafond: positive per-tick USD ceiling.',
          'manqué: rattraper, rattraper-une-fois or sauter.',
        ],
      },
      {
        label: '02 · optional policy',
        title: 'Say overlap, suspension and locus when they matter.',
        body: 'The same entry can govern overlap, post-skip behavior, local or cloud locus, suspension, tolerance, jitter and declared operator. Unsupported reserved behavior refuses instead of approximating.',
        points: [
          'où: local today, cloud as an explicit non-local locus.',
          'chevauchement: sauter or file in the live firer.',
          'actif: false travels with raison and jusqu_au.',
          'par declares a human; the machine key is still what authorizes.',
        ],
      },
      {
        label: '03 · inspect',
        title: 'Separate declared from proved.',
        body: 'Bare nika arm shows armed and suspended beats, their next slots and whether a ledger proves a prior fire. A registry row declares intent. Only the sidecar proves that the machine fired.',
        code: 'nika arm\nnika arm fire daily-brief',
        language: 'bash',
        filename: 'terminal',
      },
      {
        label: '04 · one firer',
        title: 'Keep every deployment door on one law.',
        body: 'A manual fire, a launchd unit, a systemd timer and the resident loop all apply the same due window, missed-run policy, overlap lock, per-tick ceiling and ledger append.',
        ascii: `nika.yaml arm[]
       │
       ├── nika arm fire ───────┐
       ├── launchd / systemd ───┼── ONE FIRER ── run + ledger
       └── nika serve ──────────┘`,
      },
    ],
    related: [
      { label: 'Resident server', to: '/sdk/operations/resident-server' },
      { label: 'OS scheduler bridge', to: '/sdk/operations/os-schedulers' },
      { label: 'Runtime state', to: '/sdk/project/runtime-state' },
      { label: 'Full arming reference', to: 'https://docs.nika.sh/reference/arm', external: true },
    ],
  },
  {
    ...nav('project/policy-ladders'),
    eyebrow: 'project policy · live',
    title: 'Make precedence visible.',
    description:
      'Resolve spend, retention and provenance through explicit ladders so a constructor, environment and project file never fight silently.',
    promise:
      'Each project knob has one precedence law. Invocation intent can narrow a run, environment can govern operational retention, and the project can raise a provenance floor but never lower the operator policy.',
    facts: [
      { label: 'run ceiling', value: 'invocation wins' },
      { label: 'trace retention', value: 'env knobs win' },
      { label: 'registry floor', value: 'maximum wins' },
      { label: 'beat ceiling', value: 'required per tick' },
    ],
    sections: [
      {
        label: '01 · spend',
        title: 'The closest explicit run ceiling wins.',
        body: 'LocalNika maxCostUsd becomes the per-invocation engine flag. Without it, the project ceiling applies. Without either, the engine falls to its built-in posture. An armed beat still names plafond because scheduling money cannot inherit an ambiguous default.',
        ascii: `LocalNika maxCostUsd / CLI flag
              ↓ wins
nika.yaml ceiling
              ↓ else
engine built-in default

arm[].plafond  = required per tick`,
      },
      {
        label: '02 · retention',
        title: 'Let deployment own trace retention.',
        body: 'The trace environment family overrides its matching project knob, then traces.keep supplies the project rung. This lets one immutable repo run under different retention obligations without editing the file on each host.',
        code: `nika: v1
traces:
  keep: 30d`,
        language: 'yaml',
        filename: 'nika.yaml',
        note: 'This rung is live on the direct run path. The current arm and serve cadence reader refuses traces, so keep it out of an armed project until the engine readers converge.',
      },
      {
        label: '03 · provenance',
        title: 'A project can only raise the registry floor.',
        body: 'The project registry.floor max-composes with the operator policy under ~/.nika. A repository can demand stronger provenance, but it cannot weaken the machine owner policy. This rung is live for direct workflow operations and not yet accepted by the current arm and serve reader.',
        ascii: `operator floor  ─┐
                 ├── MAX ── admitted artifact tier
project floor ───┘`,
      },
      {
        label: '04 · application',
        title: 'Bind the SDK to the same project root.',
        body: 'Construct LocalNika once with the service cwd and pass only invocation-specific decisions per call. Do not duplicate project policy inside a second application configuration object.',
        code: `export const nika = new LocalNika({ cwd: PROJECT_ROOT })

await nika.runToEnd('workflows/release.nika.yaml', {
  maxCostUsd: requestBudget,
  signal: request.signal,
})`,
        language: 'typescript',
        filename: 'src/nika.ts',
      },
    ],
    related: [
      { label: 'SDK configuration', to: '/sdk/reference/configuration' },
      { label: 'Security boundary', to: '/sdk/operations/security' },
      { label: 'Arm registry', to: '/sdk/project/arm-registry' },
      { label: 'Project file docs', to: 'https://docs.nika.sh/sdk/project/nika-yaml', external: true },
    ],
  },
  {
    ...nav('project/runtime-state'),
    eyebrow: 'project state · live',
    title: 'Persist proof, not mystery.',
    description:
      'Understand which .nika paths carry run journals, armed-beat claims, receipts and watermarks before a server volume is mounted.',
    promise:
      'Workflows and nika.yaml are source. .nika is runtime state. A production deployment chooses retention, backup and access policy for each lane instead of treating the directory as disposable cache.',
    facts: [
      { label: 'direct-run journal', value: 'cwd/.nika/traces/' },
      { label: 'arming ledger', value: 'project/.nika/arm/' },
      { label: 'source control', value: 'ignore generated state' },
      { label: 'unified layout', value: 'cwd = project root' },
    ],
    sections: [
      {
        label: '01 · map',
        title: 'Know every generated lane.',
        body: 'Traces belong to workflow runs. Arm state belongs to the project clock and is partitioned by beat label. The tree below is unified only when the direct process cwd is the project root, which is the recommended server setup.',
        ascii: `<project>/.nika/
├── traces/
│   └── <run>.ndjson
└── arm/
    └── <label>/
        ├── history.ndjson
        ├── last.json
        ├── watermark
        └── ledger.lock  # transient`,
      },
      {
        label: '02 · read',
        title: 'Use the SDK for run receipts.',
        body: 'LocalNika can verify the hash-chained run trace and returns its head and exit contract. The arm report reads the firing ledger separately and distinguishes a declared beat from a proved fire.',
        code: `const trace = await nika.traceVerify()
if (!trace.intact) throw new Error(trace.output)

console.log(trace.head, trace.exitCode)`,
        language: 'typescript',
        filename: 'verify.ts',
      },
      {
        label: '03 · persist',
        title: 'Give a resident server a durable volume.',
        body: 'Arm and serve enter the discovered project root before firing. A container that loses project/.nika on restart also loses recent triggered-run journals and the cadence watermark used to reason about silence. Mount that project state path with the retention and access controls the workload requires.',
        note: 'The delivery contract is at-least-once. A crash between a firing claim and its receipt remains visible in history.ndjson instead of being erased.',
      },
      {
        label: '04 · ignore',
        title: 'Keep generated state out of review diffs.',
        body: 'Ignore the live state by default. Export selected evidence packs or sealed receipts through a deliberate artifact path when a review or audit needs them.',
        code: '.nika/traces/\n.nika/arm/\n.env',
        language: 'text',
        filename: '.gitignore',
      },
    ],
    related: [
      { label: 'Receipts and replay', to: '/sdk/runtime/receipts' },
      { label: 'Resident server', to: '/sdk/operations/resident-server' },
      { label: 'Arm registry', to: '/sdk/project/arm-registry' },
      { label: 'CWD and monorepos', to: '/sdk/project/cwd-and-monorepos' },
    ],
  },
  {
    ...nav('local/check-and-plan'),
    eyebrow: 'local API · admission',
    title: 'Read the run before it exists.',
    description:
      'Turn check and dry-run output into an admission decision over findings, permits, requirements, cost and wave shape.',
    promise:
      'check answers whether the file is admissible. dryRunPlan answers what the clean file would ask the engine to schedule. Neither method spends a token or runs a command.',
    facts: [
      { label: 'report envelope', value: 'report_version 1' },
      { label: 'plan envelope', value: 'plan_version 1' },
      { label: 'cost meaning', value: 'floor + unbounded flag' },
      { label: 'authority', value: 'declared + needed' },
    ],
    sections: [
      {
        label: '01 · check',
        title: 'Treat findings as data.',
        body: 'A dirty workflow resolves to a report. Reserve exceptions for process failures such as an unavailable binary so product code can show every finding in one pass.',
        code: `const report = await nika.check('workflows/release.nika.yaml')

if (!report.clean) {
  for (const finding of report.findings) {
    console.error(finding.code, finding.message)
  }
}`,
        language: 'typescript',
        filename: 'admit.ts',
      },
      {
        label: '02 · cost',
        title: 'Never read the floor as a ceiling.',
        body: 'The static minimum can be zero while one model remains unpriced. The boolean beside the floor is part of the decision, not optional metadata.',
        points: [
          'min_path_total_usd is the cheapest statically known path',
          'has_unbounded means at least one spend branch lacks a finite ceiling',
          'a task usd value of null means unpriced, never free',
        ],
      },
      {
        label: '03 · plan',
        title: 'Inspect waves and authority.',
        body: 'Only ask for the plan after a clean report. The result carries task verbs, wave membership, requirements and permits in one versioned object.',
        code: `if (report.clean) {
  const plan = await nika.dryRunPlan('workflows/release.nika.yaml')
  renderPlan({
    waves: plan.waves,
    tasks: plan.tasks,
    permits: plan.permits,
    requirements: plan.requirements,
  })
}`,
        language: 'typescript',
        filename: 'plan.ts',
        ascii: `[ check ]
    │ clean
    ▼
[ plan v1 ] ── waves
    ├───────── permits
    ├───────── requirements
    └───────── cost floor`,
      },
      {
        label: '04 · skew',
        title: 'Survive additive engine releases.',
        body: 'Unknown report or plan versions keep the known subset and append driver warnings. Product code should surface those warnings and retain raw for diagnostics.',
      },
    ],
    related: [
      { label: 'LocalNika client', to: '/sdk/local/client' },
      { label: 'Run and cancel', to: '/sdk/local/run-and-cancel' },
      { label: 'Cost honesty', to: '/blog/the-two-clocks-behind-a-model-string' },
      { label: 'Machine surfaces', to: '/how/proof' },
    ],
  },
  {
    ...nav('local/run-and-cancel'),
    eyebrow: 'local API · execution',
    title: 'Own the stream and the settlement.',
    description:
      'Choose streaming or buffered execution, pass run overrides deliberately and cancel through an AbortSignal.',
    promise:
      'The run handle has two halves: an AsyncIterable journal for live presentation and one outcome promise for the exit contract. Keep both.',
    facts: [
      { label: 'stream', value: 'AsyncIterable<NikaEvent>' },
      { label: 'settlement', value: 'Promise<LocalRunOutcome>' },
      { label: 'cancellation', value: 'AbortSignal' },
      { label: 'spawn mode', value: 'argv, no shell' },
    ],
    sections: [
      {
        label: '01 · stream',
        title: 'Render events as they arrive.',
        body: 'The iterator yields each NDJSON object from stdout. Diagnostics stay on stderr and never enter the journal.',
        code: `const handle = nika.run('workflows/release.nika.yaml')

for await (const event of handle) {
  timeline.accept(event)
}

const outcome = await handle.outcome`,
        language: 'typescript',
        filename: 'run.ts',
      },
      {
        label: '02 · buffer',
        title: 'Use one call when the UI does not need progress.',
        body: 'runToEnd drains the same stream and returns the accumulated events with the settled exit code.',
        code: `const result = await nika.runToEnd('workflows/release.nika.yaml', {
  model: 'mock/echo',
  maxCostUsd: 0,
})

if (!result.ok) process.exit(result.exitCode)`,
        language: 'typescript',
        filename: 'batch.ts',
      },
      {
        label: '03 · cancel',
        title: 'Put the timeout in the caller.',
        body: 'Pass an AbortSignal so the owner of the request also owns cancellation. Clear application timers after settlement.',
        code: `const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 30_000)

try {
  await nika.runToEnd('workflows/release.nika.yaml', {
    signal: controller.signal,
  })
} finally {
  clearTimeout(timer)
}`,
        language: 'typescript',
        filename: 'timeout.ts',
      },
      {
        label: '04 · settle',
        title: 'Branch on the outcome, not the last event.',
        body: 'A consumer can ignore an event kind it does not know. It cannot infer success from that omission. The exit code remains the authoritative settlement.',
        ascii: `events:  started · task_* · ...
                         │
                         ▼
outcome: exit 0 | 1 | 2 | 3 | 4`,
      },
    ],
    related: [
      { label: 'Run event vocabulary', to: '/sdk/runtime/events' },
      { label: 'Errors and exits', to: '/sdk/runtime/errors' },
      { label: 'Receipts and replay', to: '/sdk/runtime/receipts' },
      { label: 'Local API methods', to: '/sdk/reference/methods' },
    ],
  },
  {
    ...nav('local/test-and-trace'),
    eyebrow: 'local API · proof',
    title: 'Rehearse, then verify the receipt.',
    description:
      'Use mock goldens for deterministic behavior and trace verification for the integrity of the recorded run journal.',
    promise:
      'Testing and trace verification answer different questions. A golden judges behavior; the chain judges whether recorded evidence stayed intact.',
    facts: [
      { label: 'golden', value: 'nika test' },
      { label: 'update', value: 'explicit only' },
      { label: 'trace check', value: 'nika trace verify' },
      { label: 'chain head', value: '64 hex or null' },
    ],
    sections: [
      {
        label: '01 · test',
        title: 'Run the offline golden.',
        body: 'The default test path compares against the stored expectation. It returns a verdict with the engine exit code and combined output.',
        code: `const verdict = await nika.test('workflows/release.nika.yaml')
if (!verdict.passed) {
  console.error(verdict.output)
  process.exit(verdict.exitCode)
}`,
        language: 'typescript',
        filename: 'test.ts',
      },
      {
        label: '02 · update',
        title: 'Make expectation changes visible.',
        body: 'Updating a golden is a separate call because replacing evidence should never hide inside the ordinary test path.',
        code: `await nika.test('workflows/release.nika.yaml', {
  update: true,
})`,
        language: 'typescript',
        filename: 'update-golden.ts',
      },
      {
        label: '03 · verify',
        title: 'Verify the latest or a named trace.',
        body: 'The bare verifier uses the workspace latest on current engines. Pass a path when the application already owns the exact receipt identity.',
        code: `const trace = await nika.traceVerify(
  '.nika/traces/release.ndjson',
)

if (!trace.intact) throw new Error(trace.output)
console.info('chain head', trace.head)`,
        language: 'typescript',
        filename: 'verify.ts',
      },
    ],
    related: [
      { label: 'Receipts and replay', to: '/sdk/runtime/receipts' },
      { label: 'CI gate', to: '/sdk/operations/ci' },
      { label: 'Testing guide', to: '/workflows' },
      { label: 'The proof layer', to: '/how/proof' },
    ],
  },
  {
    ...nav('runtime/errors'),
    eyebrow: 'runtime · failure model',
    title: 'Keep refusals typed.',
    description:
      'Separate file findings, workflow failure, environment failure, cancellation and remote transport errors.',
    promise:
      'One catch-all error handler erases the distinction between a file that was refused, a run that failed and infrastructure that disappeared. Keep those branches visible.',
    facts: [
      { label: 'check findings', value: 'resolved report' },
      { label: 'run failure', value: 'outcome exit code' },
      { label: 'spawn failure', value: 'rejected promise' },
      { label: 'remote hierarchy', value: 'NikaError' },
    ],
    sections: [
      {
        label: '01 · local audit',
        title: 'Do not catch a dirty file.',
        body: 'check resolves even when findings exist. This makes a complete diagnostic list available to editors, CI and applications.',
        code: `const report = await nika.check(file)
if (!report.clean) {
  return { accepted: false, findings: report.findings }
}`,
        language: 'typescript',
        filename: 'admission.ts',
      },
      {
        label: '02 · local run',
        title: 'Preserve the engine exit contract.',
        body: 'The outcome tells you whether the graph completed and why it did not. Do not flatten all non-zero exits into a generic exception.',
        ascii: `0  completed
1  workflow failed
2  findings or refusal
3  environment
4  paused`,
      },
      {
        label: '03 · remote preview',
        title: 'Narrow the client hierarchy.',
        body: 'The preview HTTP client exposes API, connection, timeout, job and cancellation classes. Catch the narrowest class that changes product behavior.',
        code: `try {
  await remote.jobs.run('release.nika.yaml')
} catch (error) {
  if (error instanceof NikaJobCancelledError) return 'cancelled'
  if (error instanceof NikaJobError) return 'failed'
  if (error instanceof NikaTimeoutError) return 'timed-out'
  throw error
}`,
        language: 'typescript',
        filename: 'remote-errors.ts',
      },
    ],
    related: [
      { label: 'Run and cancel', to: '/sdk/local/run-and-cancel' },
      { label: 'Type index', to: '/sdk/reference/types' },
      { label: 'Error register', to: '/language/errors' },
      { label: 'Troubleshooting docs', to: 'https://docs.nika.sh/guides/troubleshooting', external: true },
    ],
  },
  {
    ...nav('runtime/receipts'),
    eyebrow: 'runtime · durable proof',
    title: 'Let the interface disappear.',
    description:
      'Keep a hash-chained run journal that can be verified, inspected and replayed after the live stream is gone.',
    promise:
      'A progress UI is disposable. A trace is the durable twin of the run, with the event order and chain integrity needed for review and replay.',
    facts: [
      { label: 'format', value: 'NDJSON journal' },
      { label: 'integrity', value: 'hash chain' },
      { label: 'verification', value: 'offline' },
      { label: 'replay', value: 'no re-execution' },
    ],
    sections: [
      {
        label: '01 · record',
        title: 'Keep the trace identity.',
        body: 'The engine writes the receipt. Application code should store the path or run identity beside its own business record rather than copying event payloads into a second journal.',
        ascii: `live stream ───────→ UI
     │
     └──→ .nika/traces/<run>.ndjson
                      │
                verify · show · replay`,
      },
      {
        label: '02 · verify',
        title: 'Check integrity before trust.',
        body: 'traceVerify returns intact, the chain head and the engine exit code. Verification does not call a provider and does not execute a task.',
        code: `const receipt = await nika.traceVerify(tracePath)

auditLog.write({
  tracePath,
  intact: receipt.intact,
  chainHead: receipt.head,
})`,
        language: 'typescript',
        filename: 'receipt.ts',
      },
      {
        label: '03 · replay',
        title: 'Project history without rerunning work.',
        body: 'Use the CLI replay surface when an operator needs the original storyboard. The SDK stays focused on verification and leaves rendering to the engine.',
        code: 'nika trace show .nika/traces/<run>.ndjson\nnika trace replay .nika/traces/<run>.ndjson',
        language: 'bash',
        filename: 'terminal',
      },
    ],
    related: [
      { label: 'Test and trace', to: '/sdk/local/test-and-trace' },
      { label: 'Run events', to: '/sdk/runtime/events' },
      { label: 'Trace specification', to: '/language/spec/trace' },
      { label: 'Run receipts pattern', to: '/blog/the-run-keeps-its-receipt' },
    ],
  },
  {
    ...nav('remote/jobs'),
    eyebrow: 'remote preview · jobs',
    title: 'Submit, observe, settle.',
    description:
      'Use the jobs namespace for submission, status, cancellation, polling, event streaming and artifact collection.',
    promise:
      'The jobs API is already typed and fixture-tested. It remains a preview because the compatible workflow HTTP service is not part of the released engine.',
    facts: [
      { label: 'submit', value: 'POST /v1/run' },
      { label: 'status', value: 'GET /v1/status/:id' },
      { label: 'cancel', value: 'POST /v1/cancel/:id' },
      { label: 'service', value: 'not shipped' },
    ],
    sections: [
      {
        label: '01 · submit',
        title: 'Return the job identity immediately.',
        body: 'submit is the low-latency form. Persist job_id before opening an event stream so reconnects and support tools share one identity.',
        code: `const { job_id } = await nika.jobs.submit(
  'release.nika.yaml',
  { channel: 'stable' },
)`,
        language: 'typescript',
        filename: 'submit.ts',
      },
      {
        label: '02 · wait',
        title: 'Use polling when progress is not visible.',
        body: 'run submits and polls until a terminal status. Poll interval, timeout and backoff belong to client configuration.',
        code: `const job = await nika.jobs.run('release.nika.yaml')
console.log(job.status, job.exit_code)`,
        language: 'typescript',
        filename: 'wait.ts',
      },
      {
        label: '03 · cancel',
        title: 'Separate job cancellation from request abort.',
        body: 'jobs.cancel asks the service to cancel work. AbortSignal stops the caller waiting on a request. Products often need both actions.',
        code: `await nika.jobs.cancel(job_id)
const settled = await nika.jobs.status(job_id)`,
        language: 'typescript',
        filename: 'cancel-job.ts',
      },
      {
        label: '04 · horizon',
        title: 'Keep this behind an adapter.',
        body: 'The namespace is useful for integration work, tests and UI design today. Do not route production work to it until a compatible service release is published.',
      },
    ],
    related: [
      { label: 'Remote client', to: '/sdk/remote/client' },
      { label: 'SSE streaming', to: '/sdk/remote/streaming' },
      { label: 'Artifacts', to: '/sdk/remote/artifacts' },
      { label: 'Use LocalNika today', to: '/sdk/local/client' },
    ],
  },
  {
    ...nav('remote/streaming'),
    eyebrow: 'remote preview · SSE',
    title: 'Reconnect without inventing events.',
    description:
      'Consume the discriminated SSE union with idle detection, bounded reconnects and Last-Event-Id continuity.',
    promise:
      'A dropped TCP connection is not a terminal workflow result. The stream reconnects from the last event id and only settles normally after completed, failed or cancelled.',
    facts: [
      { label: 'transport', value: 'Server-Sent Events' },
      { label: 'resume header', value: 'Last-Event-Id' },
      { label: 'idle default', value: '60 seconds' },
      { label: 'reconnect default', value: '3 attempts' },
    ],
    sections: [
      {
        label: '01 · open',
        title: 'Stream from a persisted job id.',
        body: 'The AsyncIterable yields the typed event union. Terminal events end iteration; transport loss without one is an error.',
        code: `for await (const event of nika.jobs.stream(job_id)) {
  switch (event.type) {
    case 'task_start':
      ui.start(event.task_id, event.verb)
      break
    case 'task_complete':
      ui.complete(event.task_id, event.duration_ms)
      break
  }
}`,
        language: 'typescript',
        filename: 'stream.ts',
      },
      {
        label: '02 · tune',
        title: 'Bound the quiet and reconnect windows.',
        body: 'Set the idle timeout from the longest legitimate silence, then cap reconnect attempts so an outage cannot pin a worker forever.',
        code: `nika.jobs.stream(job_id, {
  idleTimeout: 120_000,
  maxReconnects: 5,
  reconnectDelay: 2_000,
  signal: request.signal,
})`,
        language: 'typescript',
        filename: 'stream-options.ts',
      },
      {
        label: '03 · model',
        title: 'Design for an additive union.',
        body: 'Handle the events the interface needs and keep an exhaustive telemetry branch. A newer service may add an event without changing existing meanings.',
        ascii: `id: 41  task_complete
       │
       × connection drops
       │
Last-Event-Id: 41
       ▼
id: 42  artifact_written`,
      },
    ],
    related: [
      { label: 'Jobs', to: '/sdk/remote/jobs' },
      { label: 'Local run events', to: '/sdk/runtime/events' },
      { label: 'Remote errors', to: '/sdk/runtime/errors' },
      { label: 'Remote type index', to: '/sdk/reference/types' },
    ],
  },
  {
    ...nav('remote/artifacts'),
    eyebrow: 'remote preview · outputs',
    title: 'Choose the right byte path.',
    description:
      'List artifacts, parse text or JSON, download bytes and stream large files without forcing every output into memory.',
    promise:
      'Format is part of the artifact contract. The SDK provides a separate method for text, JSON, bytes and ReadableStream so a large output cannot hide behind a convenient string.',
    facts: [
      { label: 'text', value: 'artifact()' },
      { label: 'JSON', value: 'artifactJson<T>()' },
      { label: 'bytes', value: 'artifactBinary()' },
      { label: 'large output', value: 'artifactStream()' },
    ],
    sections: [
      {
        label: '01 · inspect',
        title: 'List before downloading.',
        body: 'The artifact list carries name, size, format and content type. Let product policy choose which methods and destinations are allowed.',
        code: `const files = await nika.jobs.artifacts(job_id)
for (const file of files) {
  console.log(file.name, file.size, file.format)
}`,
        language: 'typescript',
        filename: 'artifacts.ts',
      },
      {
        label: '02 · parse',
        title: 'Make text and JSON explicit.',
        body: 'artifact returns text. artifactJson parses once and keeps its generic at the application boundary.',
        code: `const report = await nika.jobs.artifact(job_id, 'report.md')
const data = await nika.jobs.artifactJson<Result>(
  job_id,
  'result.json',
)`,
        language: 'typescript',
        filename: 'read.ts',
      },
      {
        label: '03 · stream',
        title: 'Keep large bytes out of the heap.',
        body: 'Use the ReadableStream form for datasets, images, audio or archives. Backpressure stays with the platform stream.',
        code: `const source = await nika.jobs.artifactStream(
  job_id,
  'dataset.csv',
)

await source.pipeTo(destination)`,
        language: 'typescript',
        filename: 'stream-artifact.ts',
      },
      {
        label: '04 · collect',
        title: 'Use runAndCollect for small non-binary sets.',
        body: 'The convenience path batches downloads and skips binary artifacts. It is not a replacement for a deliberate large-output policy.',
      },
    ],
    related: [
      { label: 'Jobs', to: '/sdk/remote/jobs' },
      { label: 'SSE artifact events', to: '/sdk/remote/streaming' },
      { label: 'Security boundary', to: '/sdk/operations/security' },
      { label: 'Method index', to: '/sdk/reference/methods' },
    ],
  },
  {
    ...nav('remote/workflows'),
    eyebrow: 'remote preview · registry',
    title: 'Browse the service workflow set.',
    description:
      'List every workflow, page large registries, request a rescan and inspect the raw source through one namespace.',
    promise:
      'The workflow namespace is a read and reload surface over the service registry. It does not create a second workflow representation.',
    facts: [
      { label: 'list all', value: 'auto-pagination' },
      { label: 'page size', value: 'caller controlled' },
      { label: 'cursor', value: 'workflow name' },
      { label: 'source', value: 'raw YAML text' },
    ],
    sections: [
      {
        label: '01 · list',
        title: 'Let the client follow pages.',
        body: 'list requests bounded pages until has_more is false. Use it for ordinary catalogs where holding the names is cheap.',
        code: `const workflows = await nika.workflows.list()
console.log(workflows.map((workflow) => workflow.name))`,
        language: 'typescript',
        filename: 'list.ts',
      },
      {
        label: '02 · page',
        title: 'Own pagination for large catalogs.',
        body: 'listPage returns one page and its has_more bit. Pass the last workflow name back as after.',
        code: `const page = await nika.workflows.listPage({ limit: 50 })
const after = page.workflows.at(-1)?.name`,
        language: 'typescript',
        filename: 'page.ts',
      },
      {
        label: '03 · source',
        title: 'Inspect the workflow, not a shadow object.',
        body: 'source returns the actual YAML text. Feed that text to an editor or audit surface that speaks the language contract.',
        code: `const yaml = await nika.workflows.source('release.nika.yaml')`,
        language: 'typescript',
        filename: 'source.ts',
      },
    ],
    related: [
      { label: 'Remote client', to: '/sdk/remote/client' },
      { label: 'Jobs', to: '/sdk/remote/jobs' },
      { label: 'Workflow language', to: '/language' },
      { label: 'Workflow corpus', to: '/workflows' },
    ],
  },
  {
    ...nav('remote/webhooks'),
    eyebrow: 'remote preview · signatures',
    title: 'Verify the raw body first.',
    description:
      'Validate timestamped HMAC-SHA256 webhook signatures with Web Crypto before parsing or dispatching an event.',
    promise:
      'Signature verification is a shipped SDK utility. The webhook producer belongs to the preview service horizon, so integrations can be built and tested without claiming a live endpoint.',
    facts: [
      { label: 'header', value: 'X-Nika-Signature' },
      { label: 'format', value: 't=<unix>,v1=<hex>' },
      { label: 'algorithm', value: 'HMAC-SHA256' },
      { label: 'default tolerance', value: '300 seconds' },
    ],
    sections: [
      {
        label: '01 · preserve',
        title: 'Read the request body as text.',
        body: 'The signature covers timestamp dot raw body. JSON parsing and reserialization can change bytes, so verification must happen first.',
        code: `const rawBody = await request.text()
const signature = request.headers.get('X-Nika-Signature') ?? ''

const valid = await Nika.verifyWebhook(
  rawBody,
  signature,
  process.env.NIKA_WEBHOOK_SECRET!,
)`,
        language: 'typescript',
        filename: 'webhook.ts',
      },
      {
        label: '02 · reject',
        title: 'Refuse stale and mismatched signatures.',
        body: 'The verifier checks timestamp tolerance, expected length and a constant-time character comparison. Return before parsing when it is false.',
        code: `if (!valid) {
  return new Response('invalid signature', { status: 401 })
}

const event = JSON.parse(rawBody)`,
        language: 'typescript',
        filename: 'webhook.ts',
      },
      {
        label: '03 · horizon',
        title: 'Test the verifier independently.',
        body: 'Use fixture payloads in application tests today. Enable network delivery only when the compatible service and its webhook contract are published.',
      },
    ],
    related: [
      { label: 'Remote client', to: '/sdk/remote/client' },
      { label: 'Security boundary', to: '/sdk/operations/security' },
      { label: 'Type index', to: '/sdk/reference/types' },
      { label: 'SDK source', to: SDK_REPO, external: true },
    ],
  },
  {
    ...nav('operations/security'),
    eyebrow: 'operations · authority',
    title: 'Keep the application seam narrow.',
    description:
      'Combine argv-safe process spawning, default-deny permits, explicit secrets, cost ceilings and caller-owned cancellation.',
    promise:
      'The SDK does not replace the engine boundary. It preserves it: no shell around workflow paths, no secret values in reports, no run past a caller ceiling and no ambient remote endpoint.',
    facts: [
      { label: 'process seam', value: 'spawn + argv array' },
      { label: 'workflow authority', value: 'permits' },
      { label: 'spend boundary', value: 'maxCostUsd' },
      { label: 'secret contract', value: 'names, never values' },
    ],
    sections: [
      {
        label: '01 · process',
        title: 'Keep paths out of a shell.',
        body: 'LocalNika calls spawn with an argv array. A workflow path remains one argument even when it contains spaces or attacker-adjacent text.',
        ascii: `unsafe: shell("nika run " + path)
safe:   spawn("nika", ["run", path, "--json"])
                         └── one argv value`,
      },
      {
        label: '02 · authority',
        title: 'Read permits before execution.',
        body: 'The check report and plan carry declared and needed authority. Application policy can refuse a net host, filesystem root, program or tool before run starts.',
        points: [
          'an absent permits block grants zero additional authority',
          'requirements expose secret names and model needs, never secret values',
          'nativeStrict can promote portability and native-first hints',
        ],
      },
      {
        label: '03 · spend',
        title: 'Pass a run ceiling after checking the shape.',
        body: 'Reject an unbounded static shape when policy requires one, then pass maxCostUsd so the engine owns the final start refusal.',
        code: `const report = await nika.check(file)
if (!report.clean || report.cost?.has_unbounded) {
  throw new Error('workflow is not admitted')
}

await nika.runToEnd(file, { maxCostUsd: 0.25 })`,
        language: 'typescript',
        filename: 'policy.ts',
      },
      {
        label: '04 · remote',
        title: 'Keep tokens out of source and logs.',
        body: 'The preview remote client accepts a bearer token. Load it from governed environment or identity plumbing, and use the logger interface without recording authorization headers.',
      },
    ],
    related: [
      { label: 'Check and plan', to: '/sdk/local/check-and-plan' },
      { label: 'CI gate', to: '/sdk/operations/ci' },
      { label: 'The boundary', to: '/how/boundary' },
      { label: 'Security documentation', to: 'https://docs.nika.sh/concepts/security', external: true },
    ],
  },
  {
    ...nav('reference/configuration'),
    eyebrow: 'reference · constructors',
    title: 'Configure only what the seam owns.',
    description:
      'Reference the LocalNika resolution options and the preview Nika HTTP, retry, polling, concurrency and logging options.',
    promise:
      'Local configuration selects a binary and working directory. Remote configuration selects an origin, credential and bounded transport policy. They are different trust boundaries.',
    facts: [
      { label: 'local module', value: `${SDK_PACKAGE}/local` },
      { label: 'remote module', value: SDK_PACKAGE },
      { label: 'Node floor', value: '18+' },
      { label: 'runtime deps', value: 'zero' },
    ],
    sections: [
      {
        label: '01 · local',
        title: 'LocalNikaOptions.',
        body: 'bin overrides the resolution ladder. cwd controls relative workflow paths and the workspace trace store.',
        code: `interface LocalNikaOptions {
  bin?: string
  cwd?: string
}`,
        language: 'typescript',
        filename: 'local-options.ts',
        points: [
          'bin default: explicit option, then NIKA_BIN, then nika on PATH',
          'cwd default: the current Node process directory',
        ],
      },
      {
        label: '02 · remote preview',
        title: 'NikaConfig.',
        body: 'url and token are required. Every remaining option has a bounded default and can be overridden without changing the resource namespaces.',
        code: `interface NikaConfig {
  url: string
  token: string
  timeout?: number
  retries?: number
  concurrency?: number
  pollInterval?: number
  pollTimeout?: number
  pollBackoff?: number
  fetch?: typeof fetch
  logger?: NikaLogger
}`,
        language: 'typescript',
        filename: 'remote-config.ts',
        note: 'Defaults: timeout 30s, retries 2, concurrency 24, poll interval 2s, poll timeout 5m, poll backoff 1.5.',
      },
      {
        label: '03 · environment',
        title: 'Use fromEnv for the preview client.',
        body: 'Nika.fromEnv reads NIKA_URL and NIKA_TOKEN, then applies explicit overrides. It throws at construction when either required value is missing.',
        code: `const nika = Nika.fromEnv({
  timeout: 15_000,
  concurrency: 8,
})`,
        language: 'typescript',
        filename: 'from-env.ts',
      },
    ],
    related: [
      { label: 'LocalNika client', to: '/sdk/local/client' },
      { label: 'Remote client', to: '/sdk/remote/client' },
      { label: 'Method index', to: '/sdk/reference/methods' },
      { label: 'Full docs reference', to: 'https://docs.nika.sh/sdk/reference/configuration', external: true },
    ],
  },
  {
    ...nav('reference/methods'),
    eyebrow: 'reference · method index',
    title: 'Scan the whole client.',
    description:
      'A compact index of every local method and every preview jobs, workflows, health and webhook method.',
    promise:
      'The index names the owner and return shape so application code can choose the smallest surface that solves its job.',
    facts: [
      { label: 'local owner', value: 'LocalNika' },
      { label: 'remote owners', value: 'Nika · jobs · workflows' },
      { label: 'event form', value: 'AsyncIterable' },
      { label: 'source', value: 'Apache-2.0' },
    ],
    sections: [
      {
        label: '01 · local live',
        title: 'LocalNika methods.',
        body: 'These methods drive the released binary and preserve its machine contracts.',
        ascii: `version()                  Promise<string>
check(file, options?)      Promise<LocalCheckReport>
dryRunPlan(file)           Promise<LocalPlan>
run(file, options?)        RunHandle
runToEnd(file, options?)   Promise<LocalRunOutcome>
test(file, { update? })    Promise<GoldenVerdict>
traceVerify(path?)         Promise<TraceVerdict>`,
      },
      {
        label: '02 · remote preview',
        title: 'Jobs and workflows.',
        body: 'The root client groups operations by resource. The compatible service is not shipped by the reference engine today.',
        ascii: `jobs.submit · status · cancel · run · stream
jobs.artifacts · artifact · artifactJson
jobs.artifactBinary · artifactStream · runAndCollect

workflows.list · listPage · reload · source`,
      },
      {
        label: '03 · system preview',
        title: 'Health and signatures.',
        body: 'health probes the service without authorization. verifyWebhook is a static Web Crypto utility and can be tested without a service.',
        code: `await nika.health()
await Nika.verifyWebhook(body, signature, secret)`,
        language: 'typescript',
        filename: 'system.ts',
      },
    ],
    related: [
      { label: 'Configuration', to: '/sdk/reference/configuration' },
      { label: 'Type index', to: '/sdk/reference/types' },
      { label: 'SDK source', to: SDK_REPO, external: true },
      { label: 'Full docs reference', to: 'https://docs.nika.sh/sdk/reference/methods', external: true },
    ],
  },
  {
    ...nav('reference/types'),
    eyebrow: 'reference · type index',
    title: 'Keep the contract visible in code.',
    description:
      'Map local reports, plans, outcomes and receipts beside the preview job, event, artifact, workflow and error types.',
    promise:
      'Types are the client boundary, not the language authority. Versioned engine payloads keep raw escape hatches, and remote unions remain additive.',
    facts: [
      { label: 'local discriminator', value: 'event.kind' },
      { label: 'remote discriminator', value: 'event.type' },
      { label: 'local escape hatch', value: 'raw' },
      { label: 'error base', value: 'NikaError' },
    ],
    sections: [
      {
        label: '01 · local live',
        title: 'Reports, plans and outcomes.',
        body: 'The local module exports the stable subset the driver guarantees and retains the full engine object when a newer release adds fields.',
        ascii: `LocalCheckReport
├── findings[] · cost · permits · requirements · waves
├── warnings[]
└── raw

LocalPlan
├── tasks[] · waves[][] · cost · permits · requirements
└── raw

LocalRunOutcome
└── exitCode · ok · events[]`,
      },
      {
        label: '02 · remote preview',
        title: 'Jobs, events and artifacts.',
        body: 'NikaEvent is a discriminated union. NikaJob owns terminal status, timestamps and the optional exit code. Artifact methods select the byte representation.',
        ascii: `JobStatus = pending | running | completed | failed | cancelled

NikaEvent =
  started | task_start | task_complete | task_failed
  artifact_written | completed | failed | cancelled`,
      },
      {
        label: '03 · errors',
        title: 'Catch from specific to general.',
        body: 'NikaJobCancelledError extends NikaJobError, which extends NikaError. API, connection and timeout errors are siblings under the same base.',
        ascii: `NikaError
├── NikaAPIError
├── NikaConnectionError
├── NikaTimeoutError
└── NikaJobError
    └── NikaJobCancelledError`,
      },
    ],
    related: [
      { label: 'Errors and exits', to: '/sdk/runtime/errors' },
      { label: 'Run events', to: '/sdk/runtime/events' },
      { label: 'SSE streaming', to: '/sdk/remote/streaming' },
      { label: 'Full docs reference', to: 'https://docs.nika.sh/sdk/reference/types', external: true },
    ],
  },
] as const

const BODY_INDEX = Object.fromEntries(
  SDK_GUIDE_BODIES.map((guide) => [guide.id, guide]),
) as Record<SdkGuideId, SdkGuide>

export const SDK_GUIDES: readonly SdkGuide[] = SDK_GUIDE_NAV.map((item) => BODY_INDEX[item.id])
export const SDK_GUIDE_INDEX = Object.fromEntries(
  SDK_GUIDES.map((guide) => [guide.id, guide]),
) as Record<SdkGuideId, SdkGuide>
