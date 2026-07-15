import { useRevealOnce } from '../sections/use-reveal-once'
import { CodeFile } from '../components/CodeFile'
import { MemberRows, Rails, HubFoot } from './hub-shared'
import { useHubHead, chapterHref } from './hub-lib'

/* ─── /boundary · hub Boundary (§4.7 · short and dense) ──────────────────────
   permits + secrets + the always-on floor. The home #the-boundary section
   stays the pitch; this hub is the reference: the four families and the
   three secret sources as anchored registers (descriptor-projected), the
   two laws, the exact YAML shape (a verbatim slice of the sha-pinned
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

  return (
    <main className="theme-dark hub-page" style={{ ['--hub-hue' as string]: '#ff7a3c' }}>
      <section ref={ref} aria-labelledby="hub-title" className="v4sec v4-in">
        <div className="v4sec-wrap hub-wrap">
          <header>
            <p className="v4-kick">the boundary</p>
            <h1 id="hub-title" className="v4-h2">
              The blast radius, in the file
            </h1>
            <p className="hub-opener">{hub.opener}</p>
            <p className="hub-authority">
              Defined by <a href={chapterHref('spec/01-envelope.md')}>spec/01 · the envelope</a>
            </p>
          </header>

          <section className="hub-sec" id="permits" aria-labelledby="permits-title">
            <h2 className="hub-sec-title" id="permits-title">
              {permits.title}
            </h2>
            <p className="hub-sec-note">
              Two laws, the whole model: absent, the engine floor applies · present, the
              boundary is default-deny and the body must fit it. <code>nika check --infer-permits</code>
              writes the tightest boundary the file can prove.
            </p>
            <MemberRows set={permits} />
            <div className="hub-pair">
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

          <section className="hub-sec" id="secrets" aria-labelledby="secrets-title">
            <h2 className="hub-sec-title" id="secrets-title">
              {secrets.title}
            </h2>
            <p className="hub-sec-note">{secrets.opener}</p>
            <MemberRows set={secrets} />
            <div className="hub-pair">
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

          <section className="hub-sec" id="ssrf-floor" aria-labelledby="floor-title">
            <h2 className="hub-sec-title" id="floor-title">
              The always-on floor
            </h2>
            <p className="hub-sec-note">
              Some refusals never negotiate: link-local and metadata endpoints are refused
              even when net.http allows a host pattern · secret values stay masked in every
              log and trace a run leaves · an exec allowlist matches argv soundly, never a
              substring. The floor is the part of the boundary you cannot turn off.
            </p>
            <Rails
              rails={[
                { kind: 'named by', label: 'NIKA-SEC-001 · SSRF refused', href: '/errors/NIKA-SEC-001' },
                { kind: 'proof', label: 'static vs runtime enforcement · /proof', href: '/proof#conformance' },
              ]}
            />
          </section>

          <HubFoot nodeId="layer:boundary" />
        </div>
      </section>
    </main>
  )
}
