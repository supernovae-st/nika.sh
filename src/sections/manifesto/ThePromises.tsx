import { CANON } from '../../canon.generated'
import { REPO, SPEC } from '../../content'
import type { ManifestoCopy } from '../../content/manifesto-copy'

/* ─── §03 · the 5 promises · seam-kit panels (W3 pure-move) ──────────────────
   E3 · promise receipts · each promise points at its mechanism (the control
   is the proof, extended to the manifesto). Untranslated product-truth
   register (like code blocks) · counts DERIVE from the spec canon, never
   hand-typed. */
const RECEIPTS = [
  { t: `${CANON.providers} providers · ${CANON.providersLocal} local`, href: SPEC },
  { t: 'permits: default-deny', href: SPEC },
  { t: 'plain YAML · replayable trace', href: SPEC },
  { t: 'AGPL-3.0-or-later', href: REPO },
  { t: 'one binary · no daemon', href: REPO },
]

export function ThePromises({ c }: { c: ManifestoCopy }) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-24">
      <div className="rv mf-secreg" aria-hidden>
        <span className="mf-secno">03</span>
        <span className="mf-secrule" />
      </div>
      <p className="rv mono mb-3 text-center text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
        {c.promisesKicker}
      </p>
      <h2
        className="rv mb-12 text-center font-semibold tracking-tight"
        style={{ fontSize: 'clamp(1.7rem, 1rem + 2.4vw, 2.8rem)', lineHeight: 1.06 }}
      >
        {c.promisesTitle}
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {c.promises.map((p, i) => (
          <div
            key={p.n}
            className="rv mf-promise px-7 py-7"
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <span className="mf-promise-hud" aria-hidden />
            <div className="mf-promise-reg">
              <p className="mf-pn">{p.n}</p>
              <span className="mf-promise-rule" aria-hidden />
              <span className="mf-promise-tag" aria-hidden>
                promise
              </span>
            </div>
            <h3 className="mb-2.5 text-[18px] font-semibold text-[var(--fg)]">{p.t}</h3>
            <p className="text-[14.5px] leading-relaxed text-[var(--fg-mute)]">{p.d}</p>
            {RECEIPTS[i] ? (
              <a
                href={RECEIPTS[i].href}
                target="_blank"
                rel="noreferrer"
                className="mono mt-4 inline-block text-[11px] text-[var(--fg-dim)] transition-colors hover:text-[var(--cyan)]"
              >
                {RECEIPTS[i].t} ↗
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
