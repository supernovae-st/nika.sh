import { Link } from 'react-router'
import type { SdkGuide } from '../content/sdk'
import { CodeFile } from './CodeFile'
import { SdkCode } from './SdkCode'

export default function SdkGuideBody({ guide }: { guide: SdkGuide }) {
  return (
    <>
      <section className="sdk-guide-summary" aria-label="Guide contract" data-rise>
        <div className="sdk-console-head">
          <span>guide contract</span>
          <span>{guide.status}</span>
        </div>
        <p>{guide.promise}</p>
        <dl>
          {guide.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ol className="sdk-doc-steps" data-rise>
        {guide.sections.map((section) => (
          <li key={section.label} className="sdk-doc-step">
            <div className="sdk-doc-copy">
              <p className="sdk-kicker">{section.label}</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.points ? (
                <ul className="sdk-doc-points">
                  {section.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              ) : null}
              {section.note ? <aside>{section.note}</aside> : null}
            </div>
            {section.ascii ? (
              <figure className="sdk-ascii">
                <figcaption>system view</figcaption>
                <pre tabIndex={0}>{section.ascii}</pre>
              </figure>
            ) : section.code && section.language === 'yaml' ? (
              <CodeFile yaml={section.code} filename={section.filename} minimap={false} />
            ) : section.code ? (
              <SdkCode
                code={section.code}
                language={section.language}
                filename={section.filename}
              />
            ) : (
              <div className="sdk-doc-empty" aria-hidden>
                <span>contract</span>
                <strong>{guide.status}</strong>
              </div>
            )}
          </li>
        ))}
      </ol>

      <section className="sdk-related" aria-labelledby="sdk-related-title" data-rise>
        <div className="sdk-band-head">
          <p className="sdk-kicker">next doors</p>
          <h2 id="sdk-related-title">Keep the contract connected.</h2>
        </div>
        <div className="sdk-related-grid">
          <a href={guide.docsPath} target="_blank" rel="noreferrer">
            Full documentation<span className="acue acue--ext" aria-hidden>↗</span>
          </a>
          {guide.related.map((item) =>
            item.external ? (
              <a key={item.to} href={item.to} target="_blank" rel="noreferrer">
                {item.label}<span className="acue acue--ext" aria-hidden>↗</span>
              </a>
            ) : (
              <Link key={item.to} to={item.to}>
                {item.label}<span className="acue acue--r" aria-hidden>→</span>
              </Link>
            ),
          )}
        </div>
      </section>
    </>
  )
}
