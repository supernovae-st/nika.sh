import { Link } from 'react-router'
import { REPO, SPEC } from '../../content'
import type { ManifestoCopy } from '../../content/manifesto-copy'

/* ─── §05 · the close (W3 pure-move) · keeps its words and links but carries
   NO butterfly of its own: the shared SiteFooter's living particle butterfly
   right below is THE mark (one signature, one close · the double-footer fix) */
export function TheClose({ c }: { c: ManifestoCopy }) {
  return (
    <section id="mf-close" className="mf-prose mx-auto flex flex-col items-center px-6 pt-20 pb-28 text-center">
      <div className="rv mf-secreg w-full" aria-hidden>
        <span className="mf-secno">05</span>
        <span className="mf-secrule" />
      </div>
      <p className="rv mf-statement mf-grad mb-10">
        {c.close[0]}
        <br />
        {c.close[1]}
      </p>
      <p className="rv mono mt-2 text-[13px] tracking-[0.04em] text-[var(--cyan)]">
        {c.drumline}
      </p>
      <div className="rv mono mt-10 flex flex-wrap items-center justify-center gap-6 text-[12.5px]">
        <a
          href={SPEC}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--cyan)] transition-colors hover:text-[var(--fg)]"
        >
          {c.linkSpec}
        </a>
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]"
        >
          {c.linkGithub}
        </a>
        <Link to="/" className="text-[var(--fg-mute)] transition-colors hover:text-[var(--fg)]">
          {c.linkBack}
        </Link>
      </div>
    </section>
  )
}
