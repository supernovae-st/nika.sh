import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { useHead } from '@unhead/react'
import { SDK_DOCS, SDK_GUIDE_NAV, SDK_PACKAGE, SDK_REPO, SDK_SECTIONS } from '../content/sdk-nav'
import { SITE, routeHead } from '../content'
import { collectionLd, crumbLd, ldScript } from '../lib/ld'
import { useRevealOnce } from '../sections/use-reveal-once'

const SdkCode = lazy(() => import('./SdkCode').then((m) => ({ default: m.SdkCode })))
const SdkProtocolLab = lazy(() => import('./SdkProtocolLab'))
const SdkRuntimeMap = lazy(() => import('./SdkRuntimeMap').then((m) => ({ default: m.SdkRuntimeMap })))

const QUICKSTART = `import { LocalNika } from '@supernovae-st/nika-client/local'

const nika = new LocalNika()
const report = await nika.check('workflows/hello.nika.yaml')

if (!report.clean) throw new Error('workflow refused')

const run = await nika.runToEnd('workflows/hello.nika.yaml', {
  maxCostUsd: 0.25,
})

console.log(run.ok, run.events.length)`

export default function SdkHubBody() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })
  const description =
    'The TypeScript SDK for Nika: drive the released binary today, consume typed run events, and inspect the HTTP client contract without confusing preview with production.'

  useHead({
    title: 'TypeScript SDK · Nika',
    link: routeHead('/sdk').link,
    meta: [
      ...routeHead('/sdk').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: 'TypeScript SDK · Nika' },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-integrations.png' },
      { name: 'twitter:title', content: 'TypeScript SDK · Nika' },
      { name: 'twitter:description', content: description },
    ],
    script: [
      ldScript([
        crumbLd([{ name: 'SDK', path: '/sdk' }]),
        collectionLd({ path: '/sdk', name: 'Nika TypeScript SDK', description, total: SDK_GUIDE_NAV.length }),
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          '@id': `${SITE}/sdk#client`,
          name: SDK_PACKAGE,
          codeRepository: SDK_REPO,
          programmingLanguage: 'TypeScript',
          runtimePlatform: 'Node.js 18+',
          license: 'https://www.apache.org/licenses/LICENSE-2.0',
        },
      ]),
    ],
  })

  return (
    <section ref={ref} className="v4sec v4-in sdk-hero" aria-labelledby="sdk-title">
      <div className="v4sec-wrap sdk-wrap">
        <div className="sdk-hero-grid">
          <div className="sdk-hero-copy">
            <p className="v4sec-fig" data-rise>SDK · TypeScript</p>
            <h1 id="sdk-title" className="v4sec-title sdk-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
              Build around the run.
            </h1>
            <p className="v4sec-lede sdk-lede" data-rise style={{ ['--rise-delay' as string]: '110ms' }}>
              Your application owns the experience. Nika owns the workflow contract, the
              boundary and the receipt. The TypeScript client keeps that separation typed.
            </p>
            <div className="sdk-hero-actions" data-rise style={{ ['--rise-delay' as string]: '150ms' }}>
              <Link className="sdk-primary" to="/sdk/start/quickstart">
                Start in TypeScript <span className="acue acue--r" aria-hidden>→</span>
              </Link>
              <a className="sdk-secondary" href={SDK_DOCS} target="_blank" rel="noreferrer">
                Open full docs <span className="acue acue--ext" aria-hidden>↗</span>
              </a>
              <a className="sdk-secondary" href={SDK_REPO} target="_blank" rel="noreferrer">
                View source <span className="acue acue--ext" aria-hidden>↗</span>
              </a>
            </div>
          </div>

          <div className="sdk-hero-console" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            <div className="sdk-console-head"><span>client status</span><span>contract truth</span></div>
            <div className="sdk-radar" aria-hidden>
              <span className="sdk-radar-ring sdk-radar-ring--1" />
              <span className="sdk-radar-ring sdk-radar-ring--2" />
              <span className="sdk-radar-core">N</span>
              <span className="sdk-radar-sweep" />
            </div>
            <dl className="sdk-status-list">
              <div><dt><span className="sdk-status-dot" data-status="live" /> local driver</dt><dd>live · check, run, plan, test, trace</dd></div>
              <div><dt><span className="sdk-status-dot" data-status="preview" /> HTTP client</dt><dd>preview · jobs, SSE, artifacts</dd></div>
              <div><dt><span className="sdk-status-dot" /> workflow service</dt><dd>not shipped · no false green</dd></div>
            </dl>
            <pre className="sdk-hero-ascii" aria-label="SDK contract topology" tabIndex={0}>{`APP
 ├─ local ─── LocalNika ─── nika binary       [ LIVE ]
 └─ remote ── Nika ──────── workflow service  [ PREVIEW ]`}</pre>
          </div>
        </div>

        <div className="sdk-band" data-rise>
          <div className="sdk-band-head">
            <p className="sdk-kicker">01 · documentation graph</p>
            <h2>One connected path, from project file to receipt.</h2>
            <span>{SDK_SECTIONS.length} systems · {SDK_GUIDE_NAV.length} guides</span>
          </div>
          <div className="sdk-section-grid">
            {SDK_SECTIONS.map((section) => (
              <article className="sdk-section-card" key={section.id}>
                <div className="sdk-section-card-head">
                  <span>{section.index}</span>
                  <span className="sdk-card-status" data-status={section.status}>{section.status}</span>
                </div>
                <Link className="sdk-section-card-main" to={`/sdk/${section.id}`}>
                  <p>{section.label}</p><h3>{section.title}</h3><span>{section.description}</span>
                </Link>
                <pre aria-hidden>{section.ascii}</pre>
                <ol>{section.guides.map((guide) => (
                  <li key={guide.id}><Link to={`/sdk/${guide.id}`}>{guide.label}<span aria-hidden>↗</span></Link></li>
                ))}</ol>
              </article>
            ))}
          </div>
        </div>

        <div className="sdk-band" data-rise>
          <div className="sdk-band-head">
            <p className="sdk-kicker">02 · the topology</p><h2>One language. Two transports.</h2><span>live first</span>
          </div>
          <Suspense fallback={<p className="sdk-guide-loading">Loading the runtime topology…</p>}><SdkRuntimeMap /></Suspense>
        </div>

        <div className="sdk-band" data-rise>
          <div className="sdk-band-head">
            <p className="sdk-kicker">03 · contract lab</p><h2>Inspect the seam before you build it.</h2><span>click each phase</span>
          </div>
          <p className="sdk-lab-lede">
            Follow the released local integration from audit to durable proof. Each phase binds
            application code to one explicit machine signal. Nothing here simulates a workflow run or invents a server.
          </p>
          <Suspense fallback={<p className="sdk-guide-loading">Loading the contract inspector…</p>}><SdkProtocolLab /></Suspense>
        </div>

        <div className="sdk-band sdk-first-run" data-rise>
          <div className="sdk-band-head">
            <p className="sdk-kicker">04 · first run</p><h2>The smallest honest integration.</h2><span>copy · run · inspect</span>
          </div>
          <div className="sdk-first-grid">
            <div className="sdk-first-copy">
              <p>
                Start with the local surface. It works against the released binary, uses no shell
                for process spawning and returns findings instead of hiding them behind exceptions.
              </p>
              <ol>
                <li><span>01</span><Link to="/install">Install the engine.</Link></li>
                <li><span>02</span><Link to="/sdk/start/project-setup">Found nika.yaml and the project boundary.</Link></li>
                <li><span>03</span><Link to="/workflows/path/01-hello">Copy a spec-proven workflow.</Link></li>
                <li><span>04</span><Link to="/sdk/start/quickstart">Add the typed audit and run.</Link></li>
              </ol>
            </div>
            <Suspense fallback={<div className="sdk-code"><pre className="sdk-code-well" tabIndex={0}><code>{QUICKSTART}</code></pre></div>}>
              <SdkCode code={QUICKSTART} language="typescript" filename="run.ts" />
            </Suspense>
          </div>
        </div>

        <div className="sdk-principles" data-rise>
          <p className="sdk-kicker">05 · the contract</p>
          <div className="sdk-principle-grid">
            <article><span>01</span><h2>Thin by design.</h2><p>The SDK carries transport and types. The engine keeps enforcement.</p></article>
            <article><span>02</span><h2>Unknown stays unknown.</h2><p>An unpriced model is never rewritten as free. A new report version warns.</p></article>
            <article><span>03</span><h2>Preview looks like preview.</h2><p>The HTTP client can be explored without pretending its server already ships.</p></article>
          </div>
        </div>

        <aside className="sdk-docs-bridge" data-rise>
          <div><p className="sdk-kicker">full manual · docs.nika.sh</p><h2>The site gives you the map. The docs carry the whole route.</h2></div>
          <p>
            Continue into setup, local execution, runtime events, remote preview, operations
            and the full method and type reference. Every guide links back to the exact language,
            workflow and proof surface it depends on.
          </p>
          <a className="sdk-primary" href={SDK_DOCS} target="_blank" rel="noreferrer">
            Enter the SDK manual <span className="acue acue--ext" aria-hidden>↗</span>
          </a>
        </aside>
      </div>
    </section>
  )
}
