import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { useHead } from '@unhead/react'
import { useRevealOnce } from '../sections/use-reveal-once'
import { StampStrip } from '../components/StampStrip'
import { CodeFile } from '../components/CodeFile'
import { TEMPLATES, TEMPLATE_INDEX, type TemplateEntry } from '../content/templates.generated'
import { CANON } from '../canon.generated'
import { SPEC, routeHead } from '../content'
import '../sections/v4-home.css'
import './templates-page.css'

/* ─── /templates + /templates/:name · the skeleton register (theme-dark) ──────
   « Agents do not invent structure — they instantiate it. » The spec pack's
   ten SLOT-marked skeletons as an intent-routed register: you arrive with a
   phrase (« do this for EVERY item »), the row hands you the template and
   the patterns it locks in. One register page (the /errors · /tools ·
   /providers precedent); each :name deep-link prerenders its own landing,
   scrolls to its row and OPENS the full skeleton in the product panel.

   Spec truth: rows come from templates.generated.ts — a compiled projection
   of public/templates/catalog.json, itself derived from the nika-spec pack
   (README routing table + the *.nika.yaml files). Every skeleton is a
   COMPLETE valid workflow, conformance-gated upstream on every spec push —
   the shown-YAML-passes-check law holds by construction — and sha256-pinned
   here (the copy-fidelity law; the drift gate re-hashes).

   SSR-safe: /templates AND every /templates/<name> prerender (PATHS +
   TEMPLATE_PATHS in site.config.ts). The YAML is real <pre> DOM text. */

function TemplateRow({ entry, active }: { entry: TemplateEntry; active: boolean }) {
  return (
    <li id={entry.name} className={`tm-row${active ? ' tm-row--active' : ''}`}>
      <p className="tm-intent">
        <span className="tm-intent-mark" aria-hidden>
          «
        </span>
        {entry.intent}
        <span className="tm-intent-mark" aria-hidden>
          »
        </span>
      </p>
      <div className="tm-row-head">
        <a className="tm-name" href={`/templates/${entry.name}`}>
          {entry.name}
        </a>
        <span className="tm-slots" title="SLOT-marked decision points — fill these, nothing else">
          {entry.slots} slots
        </span>
        <span className="tm-file">{entry.file}</span>
      </div>
      <ul className="tm-patterns">
        {entry.patterns.map((p) => (
          <li key={p} className="tm-pattern">
            {p}
          </li>
        ))}
      </ul>
      {active ? (
        <div className="tm-skeleton">
          <CodeFile yaml={entry.yaml} filename={entry.file} />
          <p className="tm-pin" title="the copy-fidelity pin — the drift gate re-hashes this copy">
            sha256 {entry.sha256.slice(0, 16)}… · conformance-gated upstream ·{' '}
            <a href={`${SPEC}/blob/main/templates/${entry.file}`}>source</a>
          </p>
        </div>
      ) : (
        <p className="tm-open">
          <a href={`/templates/${entry.name}`}>open the skeleton →</a>
        </p>
      )}
    </li>
  )
}

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const { name: rawName } = useParams()
  const name = rawName?.toLowerCase()
  const hit = name ? TEMPLATE_INDEX[name] : undefined
  const miss = Boolean(name) && !hit

  const slotsTotal = useMemo(() => TEMPLATES.reduce((n, t) => n + t.slots, 0), [])

  const title = hit ? `${hit.name} · Nika templates` : 'Templates · Nika'
  const description = hit
    ? `The ${hit.name} skeleton — « ${hit.intent} ». ${hit.slots} SLOT-marked decision points; patterns locked: ${hit.patterns.join(', ')}. A complete, valid workflow.`
    : `The ${CANON.templates} instantiable skeletons agents route intents to — complete valid workflows with SLOT markers at every decision point. Machine twin: /templates/catalog.json.`

  useHead({
    title,
    link: routeHead(name ? `/templates/${name}` : '/templates').link,
    meta: [
      ...routeHead(name ? `/templates/${name}` : '/templates').meta,
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: 'https://nika.sh/og-templates.png' },
      {
        property: 'og:image:alt',
        content: 'Nika templates. Agents do not invent structure — they instantiate it.',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  })

  /* the deep-link lands ON its row (client effect — prerender unaffected) */
  useEffect(() => {
    if (!hit) {
      return
    }
    document.getElementById(hit.name)?.scrollIntoView({ block: 'start' })
  }, [hit])

  return (
    <main className="theme-dark tm-page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="tm-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the deterministic authoring path
          </p>
          <h1 id="tm-title" className="v4sec-title tm-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            {hit ? hit.name : 'Templates.'}
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            <b>Agents do not invent structure — they instantiate it.</b> Each skeleton below is a
            complete, valid workflow with <code># SLOT:</code> markers at every decision point:
            route your intent, copy, fill the slots, <code>nika check</code>, done. Machines read
            the same pack at <a href="/templates/catalog.json">/templates/catalog.json</a>; the
            originals live in <a href={`${SPEC}/tree/main/templates`}>the spec</a>, conformance-
            gated on every push.
          </p>

          {miss && (
            <div className="tm-miss" role="status" data-rise>
              <p className="tm-miss-name">{name}</p>
              <p>
                is not a template the pack ships. Route your intent in the register below, or
                check <a href="/templates/catalog.json">the machine catalog</a>.
              </p>
            </div>
          )}

          {/* the pack's dimensions, at a glance */}
          <StampStrip
            items={[
              { n: TEMPLATES.length, label: 'skeletons', sub: 'route · copy · fill' },
              { n: slotsTotal, label: 'slot markers', sub: 'the only blanks' },
              { n: 'valid', label: 'every file', sub: 'conformance-gated' },
              { n: 'sha256', label: 'every copy', sub: 'pinned, re-proven' },
            ]}
          />

          <ol className="tm-list" data-rise style={{ ['--rise-delay' as string]: '180ms' }}>
            {TEMPLATES.map((t) => (
              <TemplateRow key={t.name} entry={t} active={t.name === name} />
            ))}
          </ol>

          <p className="tm-foot" data-rise>
            The protocol is mechanical: route with the phrases above, instantiate, fill the slots,
            then <code>nika check</code> teaches anything you missed <b>before anything runs</b>.
            Try one in the <Link to="/play">playground</Link>, or <Link to="/install">install</Link>{' '}
            and start from a real file. <Link to="/spec">Read the spec →</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
