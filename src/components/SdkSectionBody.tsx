import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { SDK_DOCS, type SdkSectionId, type SdkSectionNavItem } from '../content/sdk-nav'
import { routeHead } from '../content'
import { collectionLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'

const DOORS: Record<SdkSectionId, readonly { label: string; to: string; note: string }[]> = {
  start: [
    { label: 'The nika.yaml control plane', to: '/sdk/project/nika-yaml', note: 'project truth' },
    { label: 'Install the engine', to: '/install', note: 'binary first' },
    { label: 'Copy a real workflow', to: '/workflows', note: 'spec-proven corpus' },
  ],
  project: [
    { label: 'CWD and monorepos', to: '/sdk/project/cwd-and-monorepos', note: 'align roots' },
    { label: 'Arming reference', to: '/sdk/project/arm-registry', note: 'the project clock' },
    { label: 'Resident server', to: '/sdk/operations/resident-server', note: 'stable firer' },
  ],
  local: [
    { label: 'Machine surfaces', to: '/how/proof', note: 'versioned JSON wires' },
    { label: 'The boundary', to: '/how/boundary', note: 'permits and secrets' },
    { label: 'Run events', to: '/sdk/runtime/events', note: 'journal in motion' },
  ],
  runtime: [
    { label: 'Trace specification', to: '/language/spec/trace', note: 'durable journal' },
    { label: 'Error register', to: '/language/errors', note: 'typed refusals' },
    { label: 'Run and cancel', to: '/sdk/local/run-and-cancel', note: 'live producer' },
  ],
  remote: [
    { label: 'Use LocalNika today', to: '/sdk/local/client', note: 'released path' },
    { label: 'Server surfaces', to: '/sdk/operations/server-surfaces', note: 'three different jobs' },
    { label: 'Integrations', to: '/integrations', note: 'existing stack' },
  ],
  operations: [
    { label: 'Resident server', to: '/sdk/operations/resident-server', note: 'stable local scheduler' },
    { label: 'Production runbook', to: '/sdk/operations/server-runbook', note: 'probe and investigate' },
    { label: 'CI without ambient authority', to: '/blog/ci-without-ambient-authority', note: 'admission pattern' },
  ],
  reference: [
    { label: 'SDK source', to: 'https://github.com/supernovae-st/nika-client', note: 'Apache-2.0' },
    { label: 'Language reference', to: '/language', note: 'workflow contract' },
    { label: 'Machine surfaces', to: '/how/proof', note: 'engine envelopes' },
  ],
}

export default function SdkSectionBody({ section, prev, next }: {
  section: SdkSectionNavItem
  prev?: SdkSectionNavItem
  next?: SdkSectionNavItem
}) {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })
  const path = `/sdk/${section.id}`
  const title = `${section.label} · TypeScript SDK · Nika`

  useHead({
    title,
    link: routeHead(path).link,
    meta: [
      ...routeHead(path).meta,
      { name: 'description', content: section.description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: section.description },
    ],
    script: [
      ldScript([
        crumbLd([{ name: 'SDK', path: '/sdk' }, { name: section.label }]),
        collectionLd({
          path,
          name: `${section.label} SDK guides`,
          description: section.description,
          total: section.guides.length,
        }),
      ]),
    ],
  })

  return (
    <section ref={ref} className="v4sec v4-in" aria-labelledby="sdk-section-title">
      <div className="v4sec-wrap sdk-wrap">
        <nav className="sdk-crumb td-crumb" aria-label="Breadcrumb" data-rise>
          <Link className="td-crumb-link" to="/sdk">← SDK</Link>
          <span className="sdk-card-status" data-status={section.status}>{section.status}</span>
        </nav>

        <div className="sdk-section-hero">
          <div>
            <p className="v4sec-fig" data-rise>{section.index} · {section.label}</p>
            <h1 id="sdk-section-title" className="v4sec-title sdk-section-title" data-rise>{section.title}</h1>
            <p className="v4sec-lede sdk-section-lede" data-rise>{section.description}</p>
          </div>
          <figure className="sdk-section-scope" data-rise>
            <figcaption><span>flight path</span><span>{section.guides.length} rooms</span></figcaption>
            <pre tabIndex={0}>{section.ascii}</pre>
            <ol>
              {section.guides.map((guide, index) => (
                <li key={guide.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <i data-status={guide.status}>{guide.status}</i>
                  {guide.label}
                </li>
              ))}
            </ol>
          </figure>
        </div>

        <div className="sdk-band" data-rise>
          <div className="sdk-band-head">
            <p className="sdk-kicker">rooms</p>
            <h2>Move in order or enter exactly where you need.</h2>
            <span>{section.guides.length} pages</span>
          </div>
          <div className="sdk-room-grid">
            {section.guides.map((guide, index) => (
              <Link className="sdk-room-card" key={guide.id} to={`/sdk/${guide.id}`}>
                <span>{section.index}.{String(index + 1).padStart(2, '0')}</span>
                <i data-status={guide.status}>{guide.status}</i>
                <h2>{guide.label}</h2>
                <p>{guide.summary}</p>
                <b aria-hidden>↗</b>
              </Link>
            ))}
          </div>
        </div>

        <div className="sdk-band" data-rise>
          <div className="sdk-band-head">
            <p className="sdk-kicker">connected systems</p>
            <h2>The SDK is one surface in the Nika graph.</h2>
            <span>no dead ends</span>
          </div>
          <div className="sdk-door-grid">
            {DOORS[section.id].map((door) => door.to.startsWith('http') ? (
              <a key={door.to} href={door.to} target="_blank" rel="noreferrer">
                <span>{door.note}</span><strong>{door.label}</strong><i aria-hidden>↗</i>
              </a>
            ) : (
              <Link key={door.to} to={door.to}>
                <span>{door.note}</span><strong>{door.label}</strong><i aria-hidden>→</i>
              </Link>
            ))}
            <a href={section.guides[0]?.docsPath ?? `${SDK_DOCS}/overview`} target="_blank" rel="noreferrer">
              <span>docs.nika.sh</span><strong>Open the deep manual</strong><i aria-hidden>↗</i>
            </a>
          </div>
        </div>

        <nav className="sdk-guide-walk" aria-label="Adjacent SDK sections" data-rise>
          {prev ? <Link to={`/sdk/${prev.id}`}>← {prev.label}</Link> : <span />}
          {next ? <Link to={`/sdk/${next.id}`}>{next.label} →</Link> : <Link to="/sdk">SDK graph →</Link>}
        </nav>
      </div>
    </section>
  )
}
