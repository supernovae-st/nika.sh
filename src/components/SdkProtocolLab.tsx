import { useState } from 'react'
import { Link } from 'react-router'

const PHASES = [
  {
    id: 'audit',
    index: '01',
    label: 'audit',
    signal: 'report_version',
    value: 'clean',
    route: '/sdk/local/check-and-plan',
    code: `const report = await nika.check(file, {
  nativeStrict: true,
})

if (!report.clean) {
  renderFindings(report.findings)
  return
}`,
    envelope: `{
  "report_version": 1,
  "clean": true,
  "findings": []
}`,
    note: 'Findings are product data. A rejected workflow never has to become an opaque exception.',
  },
  {
    id: 'admit',
    index: '02',
    label: 'admit',
    signal: 'cost floor',
    value: '$0.04',
    route: '/sdk/operations/security',
    code: `const plan = await nika.dryRunPlan(file)

if (plan.cost?.has_unbounded) refuse()
if ((plan.cost?.min_path_total_usd ?? 0) > budget) refuse()

showAuthority(plan.permits)
showRequirements(plan.requirements)`,
    envelope: `{
  "min_path_total_usd": 0.04,
  "has_unbounded": false,
  "tasks": [ … ]
}`,
    note: 'Admission belongs before execution. Cost, permits and requirements stay visible at the product boundary.',
  },
  {
    id: 'observe',
    index: '03',
    label: 'observe',
    signal: 'event',
    value: 'task_completed',
    route: '/sdk/runtime/events',
    code: `const run = nika.run(file, {
  maxCostUsd: budget,
  signal: request.signal,
})

for await (const event of run.events) {
  projectEvent(event)
}

const outcome = await run.outcome`,
    envelope: `{
  "kind": "task_completed",
  "fields": [ … ]
}`,
    note: 'The interface projects additive events. It waits for the outcome instead of guessing from one event shape.',
  },
  {
    id: 'prove',
    index: '04',
    label: 'prove',
    signal: 'chain',
    value: 'verified',
    route: '/sdk/runtime/receipts',
    code: `const verdict = await nika.traceVerify(
  tracePath,
)

if (!verdict.intact) refuseReceipt()

await storeReceipt({
  tracePath,
  chainHead: verdict.head,
})`,
    envelope: `{
  "intact": true,
  "head": "a74f…91c2",
  "exitCode": 0
}`,
    note: 'Proof survives the process and the interface. Verification happens before a copied trace is trusted.',
  },
] as const

export default function SdkProtocolLab() {
  const [activeId, setActiveId] = useState<(typeof PHASES)[number]['id']>('audit')
  const active = PHASES.find((phase) => phase.id === activeId) ?? PHASES[0]

  return (
    <div className="sdk-lab">
      <div className="sdk-lab-topline">
        <span><i /> local contract inspector</span>
        <span>deterministic · no network</span>
      </div>

      <div className="sdk-lab-flight" role="tablist" aria-label="Integration phases">
        {PHASES.map((phase, index) => (
          <div className="sdk-lab-flight-leg" key={phase.id}>
            <button
              id={`sdk-lab-tab-${phase.id}`}
              role="tab"
              type="button"
              aria-controls="sdk-lab-panel"
              aria-selected={active.id === phase.id}
              onClick={() => setActiveId(phase.id)}
            >
              <span>{phase.index}</span>
              <strong>{phase.label}</strong>
              <i>{active.id === phase.id ? 'selected' : 'inspect'}</i>
            </button>
            {index < PHASES.length - 1 ? <b aria-hidden>›</b> : null}
          </div>
        ))}
      </div>

      <div
        id="sdk-lab-panel"
        className="sdk-lab-panel"
        role="tabpanel"
        aria-labelledby={`sdk-lab-tab-${active.id}`}
      >
        <div className="sdk-lab-editor">
          <div className="sdk-lab-editor-head">
            <span><i /><i /><i /></span>
            <b>integration.ts</b>
            <em>TypeScript</em>
          </div>
          <pre tabIndex={0}><code>{active.code.split('\n').map((line, index) => (
            <span className="sdk-lab-code-line" key={`${active.id}-${index}`}>
              <i>{String(index + 1).padStart(2, '0')}</i><b>{line || ' '}</b>
            </span>
          ))}</code></pre>
        </div>

        <aside className="sdk-lab-telemetry">
          <div className="sdk-lab-orbit" aria-hidden>
            <i /><i /><i />
            <strong>{active.index}</strong>
          </div>
          <dl>
            <div><dt>signal</dt><dd>{active.signal}</dd></div>
            <div><dt>observed</dt><dd>{active.value}</dd></div>
            <div><dt>surface</dt><dd>LocalNika · live</dd></div>
          </dl>
          <pre tabIndex={0}>{active.envelope}</pre>
        </aside>
      </div>

      <div className="sdk-lab-caption">
        <p>{active.note}</p>
        <Link to={active.route}>Open {active.label} guide <span aria-hidden>→</span></Link>
      </div>
    </div>
  )
}
