import { Link } from 'react-router'
import { CopyRow } from './CopyRow'
import type { PlatformGuide } from '../content/platform-guides'

export default function PlatformGuideBody({ guide, assets }: { guide: PlatformGuide; assets: string[] }) {
  return (
    <>
      <section className="pg-console" aria-label="Deployment summary">
        <div className="pg-console-top mono">
          <span>deployment / {guide.id}</span>
          <span>status · supported</span>
        </div>
        <p className="pg-promise">{guide.promise}</p>
        <dl className="pg-facts">
          {guide.facts.map((fact) => (
            <div key={fact.label} className="pg-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        {guide.id === 'arm64' && (
          <div className="pg-assets" aria-label="Current ARM64 release assets">
            <p className="pg-assets-k mono">current native artifacts</p>
            {assets.map((asset) => <code key={asset}>{asset}</code>)}
          </div>
        )}
      </section>

      <section className="pg-procedure" aria-labelledby="pg-procedure-title">
        <div className="pg-section-head">
          <h2 id="pg-procedure-title">The operating path</h2>
          <span className="mono">four checks · one lane</span>
        </div>
        <ol className="pg-steps">
          {guide.steps.map((step) => (
            <li key={step.label} className="pg-step">
              <div className="pg-step-index mono">{step.label}</div>
              <div className="pg-step-copy">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              {step.command && (
                <div className="pg-step-command">
                  <CopyRow cmd={step.command} label="command" track="platform-guide-copy" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="pg-next" aria-labelledby="pg-next-title">
        <div className="pg-section-head">
          <h2 id="pg-next-title">Continue from evidence</h2>
          <span className="mono">no dead ends</span>
        </div>
        <div className="pg-links">
          {guide.links.map((item) => item.external ? (
            <a key={item.to} href={item.to} target="_blank" rel="noreferrer">{item.label}<span aria-hidden>↗</span></a>
          ) : (
            <Link key={item.to} to={item.to}>{item.label}<span aria-hidden>→</span></Link>
          ))}
        </div>
      </section>
    </>
  )
}
