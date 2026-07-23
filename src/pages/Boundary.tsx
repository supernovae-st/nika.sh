import { useMemo } from 'react'
import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { StampStrip } from '../components/StampStrip'
import { ERROR_CODES } from '../content/errors.generated'
import { REFERENCE_LAWS, GOVERNANCE_DIR } from '../sections/boundary/laws'
import { MemberRows, Rails, HubFoot } from './hub-shared'
import { useHubHead, chapterHref } from './hub-lib'
import '../sections/v4-home.css'
import './boundary-page.css'

/* ─── /boundary · the security boundary register (§4.7 · short and dense) ─────
   permits + secrets + the always-on floor, in the register grammar the
   /providers · /tools · /errors family speaks. The home #the-boundary section
   stays the pitch; this page is the reference: the permit families and the
   secret sources as anchored registers (descriptor-projected via hub-data —
   MemberRows keeps the citable anchor ids and the Inspector door), the two
   laws, the exact YAML shape (verbatim slices of the sha-pinned
   human-gated-ship skeleton). */

const PERMITS_EXCERPT = `permits:
  exec: ["echo"]
  tools: ["nika:assert", "nika:prompt", "nika:notify"]
  net: { http: ["hooks.slack.com"] }`

const SECRET_EXCERPT = `secrets:
  webhook:
    source: env
    key: TEAM_WEBHOOK_URL
    egress:
      - to: "nika:notify"
        host_from_self: true`

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.04, rootMargin: '0px 0px -6% 0px' })
  const hub = useHubHead(
    'boundary',
    'The boundary · the file declares its blast radius · Nika',
    'Permits fence a Nika run by family: exec, fs, net, tools. Absent means the engine floor, present means default-deny. Secrets stay masked references; the SSRF floor never turns off.',
  )
  const permits = hub.sets.find((s) => s.id === 'permit-families')!
  const secrets = hub.sets.find((s) => s.id === 'secret-sources')!
  /* the refusals this layer names: the NIKA-SEC namespace, filtered from the
     same generated registry /errors renders — a figure is derived, never
     typed (the lens count-source law) */
  const secCodes = useMemo(() => ERROR_CODES.filter((e) => e.code.startsWith('NIKA-SEC-')), [])

  return (
    <main className="theme-dark bd-page" style={{ ['--hub-hue' as string]: '#ff7a3c' }}>
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts) */}
      <section ref={ref} aria-labelledby="bd-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <p className="v4sec-fig" data-rise>
            the security boundary
          </p>
          <h1 id="bd-title" className="v4sec-title bd-title" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
            Boundary.
          </h1>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            The file declares its blast radius: <code>permits:</code> allowlists what runs, reads,
            writes and calls; <b>absent means the engine floor, present means default-deny</b>.
            Secrets stay masked references with scoped egress, and the SSRF floor never turns off.
            Machines read the exact shape at{' '}
            <a href="/schema/workflow.json">/schema/workflow.json</a>;{' '}
            <code>nika check --infer-permits</code> writes the tightest boundary a file can prove.
          </p>
          <p className="hub-authority bd-authority" data-rise>
            Defined by <a href={chapterHref('spec/01-envelope.md')}>spec/01 · the envelope</a>
          </p>

          {/* the boundary's dimensions, at a glance */}
          <StampStrip
            items={[
              {
                n: permits.members.length,
                label: 'permit families',
                sub: permits.members.map((m) => m.id).join(' · '),
              },
              {
                n: secrets.members.length,
                label: 'secret sources',
                sub: secrets.members.map((m) => m.id).join(' · '),
              },
              { n: secCodes.length, label: 'named refusals', sub: 'the NIKA-SEC register' },
              { n: 'always-on', label: 'the floor', sub: 'never negotiates' },
            ]}
          />

          <section
            className="bd-band"
            id="permits"
            aria-labelledby="permits-title"
            data-rise
            style={{ ['--rise-delay' as string]: '180ms' }}
          >
            <div className="cl-year-head">
              <h2 className="cl-year-n bd-band-n" id="permits-title">
                {permits.title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {permits.members.length} {permits.members.length === 1 ? 'family' : 'families'}
              </span>
            </div>
            <p className="bd-band-gloss">
              Two laws, the whole model: absent, the engine floor applies · present, the boundary
              is default-deny and the body must fit it. <code>nika check --infer-permits</code>{' '}
              writes the tightest boundary the file can prove.
            </p>
            <MemberRows set={permits} />
            <div className="bd-file">
              <CodeFile
                yaml={PERMITS_EXCERPT}
                filename="permits · the exact shape"
                sourceHref="https://github.com/supernovae-st/nika-spec/blob/main/templates/human-gated-ship.nika.yaml"
              />
            </div>
            <Rails
              rails={[
                { kind: 'room', label: 'permits', href: '/language/permits' },
                { kind: 'named by', label: 'NIKA-SEC-004 · body outside the boundary', href: '/errors/NIKA-SEC-004' },
                { kind: 'try it', label: 'break a boundary on /play', href: '/play' },
              ]}
            />
          </section>

          <section
            className="bd-band"
            id="secrets"
            aria-labelledby="secrets-title"
            data-rise
            style={{ ['--rise-delay' as string]: '210ms' }}
          >
            <div className="cl-year-head">
              <h2 className="cl-year-n bd-band-n" id="secrets-title">
                {secrets.title}
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {secrets.members.length} {secrets.members.length === 1 ? 'source' : 'sources'}
              </span>
            </div>
            <p className="bd-band-gloss">{secrets.opener}</p>
            <MemberRows set={secrets} />
            <div className="bd-file">
              <CodeFile
                yaml={SECRET_EXCERPT}
                filename="a secret · masked, egress-scoped"
                sourceHref="https://github.com/supernovae-st/nika-spec/blob/main/templates/human-gated-ship.nika.yaml"
              />
            </div>
            <Rails
              rails={[
                { kind: 'room', label: 'secrets', href: '/language/secrets' },
                { kind: 'guide', label: 'the security model · docs', href: 'https://docs.nika.sh/concepts/security' },
              ]}
            />
          </section>

          <section
            className="bd-band"
            id="ssrf-floor"
            aria-labelledby="floor-title"
            data-rise
            style={{ ['--rise-delay' as string]: '240ms' }}
          >
            <div className="cl-year-head">
              <h2 className="cl-year-n bd-band-n" id="floor-title">
                The always-on floor
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">never off</span>
            </div>
            <p className="bd-band-gloss">
              Some refusals never negotiate: link-local and metadata endpoints are refused even
              when net.http allows a host pattern · secret values stay masked in every log and
              trace a run leaves · an exec allowlist matches argv soundly, never a substring. The
              floor is the part of the boundary you cannot turn off.
            </p>
            <Rails
              rails={[
                { kind: 'named by', label: 'NIKA-SEC-005 · SSRF refused', href: '/errors/NIKA-SEC-005' },
                { kind: 'proof', label: 'static vs runtime enforcement · /proof', href: '/proof#conformance' },
              ]}
            />
          </section>

          {/* the written law · the boundary's rules as numbered public
              documents (nika-spec governance/). The rows link the documents
              themselves — the register states each law's substance, the
              click lands on its full text and status. */}
          <section
            className="bd-band"
            id="laws"
            aria-labelledby="laws-title"
            data-rise
            style={{ ['--rise-delay' as string]: '270ms' }}
          >
            <div className="cl-year-head">
              <h2 className="cl-year-n bd-band-n" id="laws-title">
                The written law
              </h2>
              <span className="cl-year-rule" aria-hidden />
              <span className="cl-year-count">
                {REFERENCE_LAWS.length} numbered laws
              </span>
            </div>
            <p className="bd-band-gloss">
              Every rule of the boundary is a numbered proposal (NEP) in the spec&rsquo;s
              public governance: written, reviewable, versioned before it binds the
              engine. The register below states each law&rsquo;s substance; the number
              links its full text.
            </p>
            <ul className="hub-members">
              {REFERENCE_LAWS.map((law) => (
                <li key={law.id} className="hub-member" id={law.id.toLowerCase()}>
                  <span className="hub-member-id">
                    <a href={law.href} target="_blank" rel="noreferrer">
                      {law.id}
                    </a>
                  </span>
                  <span className="hub-member-gloss">{law.gloss}</span>
                </li>
              ))}
            </ul>
            <Rails
              rails={[
                { kind: 'index', label: 'the governance register · nika-spec', href: GOVERNANCE_DIR },
                { kind: 'process', label: 'NEP-0000 · how a law is made', href: 'https://github.com/supernovae-st/nika-spec/blob/main/governance/nep-0000-the-nep-process.md' },
              ]}
            />
          </section>

          <p className="bd-foot" data-rise>
            Permits are checked before anything runs, and the floor keeps refusing while it does:
            every refusal lands in the <Link to="/errors">error register</Link> with a stable
            code. Break a boundary in the <Link to="/play">playground</Link>, or{' '}
            <Link to="/install">install</Link> and let <code>nika check --infer-permits</code>{' '}
            write yours. <Link to="/spec">Read the spec →</Link>
          </p>

          <HubFoot nodeId="layer:boundary" />
        </div>
      </section>
    </main>
  )
}
