import { useHead } from '@unhead/react'
import { Link, useLocation } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, ENGINE_VERSION, DOCS } from '../content'
import { CodeFile } from '../components/CodeFile'
import { CopyRow } from '../components/CopyRow'
import { InstallCommand } from '../components/InstallCommand'
import { TermCapture } from '../components/TermCapture'
import {
  INSTALL_SH_CMD,
  VERIFY_CMD,
  BINSTALL_CMD,
  NIX_RUN_CMD,
  INIT_CMD,
  WIRE_CMD,
  OLLAMA_PULL_CMD,
  EXAMPLES_CMD,
  CHECK_CMD,
  RUN_CMD,
  DOCTOR_CMD,
  WELCOME_CMD,
  HELLO_YAML,
  HELLO_AI_YAML,
  VERSION_TRANSCRIPT,
  FIRST_RUN_TRANSCRIPT,
  TROUBLE,
} from '../content/install'
import { useEffect, useState } from 'react'
import { localeOf, hreflangLinks } from '../lib/i18n'
import type { InstallCopy } from '../content/i18n-pages.generated'
import { ssrInstallCopy, loadInstallCopy } from '../lib/i18n-copy-access'
import { Island } from '../lib/ssg-island'
import { inline } from '../lib/i18n-inline'
import { INSTALL_LINKS } from '../content/install-links'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './install-page.css'

/* ─── /install · the canonical deep-link install target ───────────────────────
   ONE stable URL for docs / README / social (the nav CTA used to anchor to
   /#install, so there was no linkable install page). Six hairline-ruled ways
   in, in the order the engine README teaches them: brew · the install script ·
   manual/air-gapped · the editor extension · agents (`nika init` / `nika
   wire`) · first run (a free local model · F4: no mock/echo on the showcase
   surface). Every command and claim mirrors
   the engine README verbatim-in-substance — no invented flags, no invented
   version numbers (the plate interpolates ENGINE_VERSION).

   SSR-safe: pure DOM; CodeFile is server-rendered; copy affordances read
   navigator only inside click handlers. Prerendered via site.config PATHS. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })
  /* the L1 wiring (WO-10): the pathname's locale picks the reviewed copy —
     EN included (one shape, eight voices; the generated module IS the twin,
     so page↔twin drift cannot exist). Machine surfaces (commands ·
     transcripts · YAML) stay EN by law (L3 — the binary's voice). */
  const { pathname } = useLocation()
  const locale = localeOf(pathname)
  const lkey = locale.prefix || 'en'
  /* the register diet (anatomy-access recipe): SSG reads the whole record;
     the client's FIRST render rides this page's byte island; a locale hop
     pulls the async chunk once — the eight voices never ride the entry */
  const [got, setGot] = useState<{ lkey: string; T: InstallCopy | null }>(() => {
    if (import.meta.env.SSR) return { lkey, T: ssrInstallCopy()?.[lkey] ?? null }
    try {
      const el = document.getElementById(`ins-copy-${lkey}`) as HTMLTextAreaElement | null
      return { lkey, T: el?.value ? (JSON.parse(el.value) as InstallCopy) : null }
    } catch {
      return { lkey, T: null }
    }
  })
  useEffect(() => {
    if (got.lkey === lkey && got.T) return
    let live = true
    void loadInstallCopy(lkey).then((copy) => {
      if (live) setGot({ lkey, T: copy })
    })
    return () => {
      live = false
    }
  }, [lkey, got.lkey, got.T])
  /* a locale hop keeps the PREVIOUS voice for the chunk beat (~1 frame) —
     no blank flash; the effect swaps it. T is only null on a cold client
     mount without island or SSR, which the prerender makes impossible. */
  const T = got.T
  const t = (text: string) => inline(text, INSTALL_LINKS)
  /* head copy rides the same reviewed corpus (one shape, eight voices —
     the integrity sweep's title-dup law is what forced the honesty here);
     meta text is plain: the lede minus its inline marks */
  const plainLede = T ? T.lede.replace(/\*\*|\*|`/g, '') : ''

  useHead({
    title: T ? T.html_title : 'Install · Nika',
    /* per-page htmlAttrs — the MANIFESTO pattern, prod-proven to re-patch on
       SPA nav (a shell-level entry did not; the page-level one wins). A hop
       to a page that never states lang keeps the last one — the same
       standing debt the manifesto cluster has; static HTML is always right. */
    htmlAttrs: { lang: locale.bcp47 },
    link: [
      ...routeHead(pathname).link,
      ...hreflangLinks(pathname).map((l) => ({
        rel: 'alternate' as const,
        hreflang: l.hreflang,
        href: `https://nika.sh${l.href}`,
      })),
    ],
    meta: [
      ...routeHead(pathname).meta,
      {
        name: 'description',
        content: plainLede,
      },
      { property: 'og:title', content: T ? T.html_title : 'Install · Nika' },
      {
        property: 'og:description',
        content: T ? `${T.title} ${T.punch}` : '',
      },
      { property: 'og:image', content: 'https://nika.sh/og-install.png' },
      {
        property: 'og:image:alt',
        content: 'Nika install · one binary, your machine. Two minutes to your first run with a free local model.',
      },
      { name: 'twitter:title', content: T ? T.html_title : 'Install · Nika' },
      {
        name: 'twitter:description',
        content: T ? `${T.title} ${T.punch}` : '',
      },
      { name: 'twitter:image', content: 'https://nika.sh/og-install.png' },
    ],
  })

  if (!T) return null

  return (
    <main className="theme-dark v4page">
      {/* v4-in baked in the prerendered HTML — the poster law (see use-reveal-once.ts):
          on a one-section page the observer armed everything at hydration anyway;
          baking moves the arm to HTML time and the hero stops being a 4.7s LCP. */}
      <section ref={ref} aria-labelledby="ins-title" className="v4sec v4-in">
        <div className="v4sec-wrap">
          <Island id={`ins-copy-${lkey}`} payload={JSON.stringify(T)} />
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            {T.fig} · {ENGINE_VERSION}
          </p>
          <h1
            id="ins-title"
            className="v4sec-title ins-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            {T.title}
          </h1>
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch" data-rise style={{ ['--rise-delay' as string]: '90ms' }}>
            {T.punch}
          </p>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            {t(T.lede)}
          </p>
          <p className="v4page-stamp" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            {T.stamp}
          </p>

          <ol className="ins-steps" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {/* 1 · Homebrew */}
            <li className="ins-step" id="brew">
              <div className="ins-step-copy">
                <p className="ins-step-n">{T.steps.brew.n}</p>
                <h2 className="ins-step-title">{T.steps.brew.title}</h2>
                <p className="ins-step-plain">{t(T.steps.brew.plain)}</p>
              </div>
              <div className="ins-step-body ins-step-body--stack">
                <InstallCommand />
                {/* the anti-anxiety beat · what a good install answers (verbatim) */}
                <TermCapture title={T.capture_title} lines={VERSION_TRANSCRIPT} command="nika --version" />
              </div>
            </li>

            {/* 2 · the install script */}
            <li className="ins-step" id="script">
              <div className="ins-step-copy">
                <p className="ins-step-n">{T.steps.script.n}</p>
                <h2 className="ins-step-title">{T.steps.script.title}</h2>
                <p className="ins-step-plain">{t(T.steps.script.plain)}</p>
              </div>
              <div className="ins-step-body ins-step-body--stack">
                <CopyRow track="install-copy" cmd={INSTALL_SH_CMD} label={T.labels.one_liner} />
                <p className="ins-step-plain">{t(T.steps.script.plain2 ?? '')}</p>
                <CopyRow track="install-copy" cmd={BINSTALL_CMD} label={T.labels.binstall} />
                <CopyRow track="install-copy" cmd={NIX_RUN_CMD} label={T.labels.nix} />
              </div>
            </li>

            {/* 3 · manual / air-gapped */}
            <li className="ins-step" id="manual">
              <div className="ins-step-copy">
                <p className="ins-step-n">{T.steps.manual.n}</p>
                <h2 className="ins-step-title">{T.steps.manual.title}</h2>
                <p className="ins-step-plain">{t(T.steps.manual.plain)}</p>
              </div>
              <div className="ins-step-body">
                <CopyRow track="install-copy" cmd={VERIFY_CMD} label={T.labels.checksum} />
              </div>
            </li>

            {/* 4 · the editor extension */}
            <li className="ins-step" id="editor">
              <div className="ins-step-copy">
                <p className="ins-step-n">{T.steps.editor.n}</p>
                <h2 className="ins-step-title">{T.steps.editor.title}</h2>
                <p className="ins-step-plain">{t(T.steps.editor.plain)}</p>
              </div>
              <div className="ins-step-body" aria-hidden>
                <p className="ins-ghost mono">{T.steps.editor.ghost}</p>
              </div>
            </li>

            {/* 5 · agents */}
            <li className="ins-step" id="agents">
              <div className="ins-step-copy">
                <p className="ins-step-n">{T.steps.agents.n}</p>
                <h2 className="ins-step-title">{T.steps.agents.title}</h2>
                <p className="ins-step-plain">{t(T.steps.agents.plain)}</p>
              </div>
              <div className="ins-step-body ins-step-body--stack">
                <CopyRow track="install-copy" cmd={INIT_CMD} label={T.labels.repo_wiring} />
                <CopyRow track="install-copy" cmd={WIRE_CMD} label={T.labels.cursor_wiring} />
              </div>
            </li>

            {/* 6 · first run */}
            <li className="ins-step" id="first-run">
              <div className="ins-step-copy">
                <p className="ins-step-n">{T.steps.first_run.n}</p>
                <h2 className="ins-step-title">{T.steps.first_run.title}</h2>
                <p className="ins-step-plain">{t(T.steps.first_run.plain)}</p>
                <div className="ins-cmds">
                  <CopyRow track="install-copy" cmd={WELCOME_CMD} label={T.labels.welcome} />
                  <CopyRow track="install-copy" cmd={CHECK_CMD} label={T.labels.check} />
                  <CopyRow track="install-copy" cmd={RUN_CMD} label={T.labels.run} />
                  <CopyRow track="install-copy" cmd={OLLAMA_PULL_CMD} label={T.labels.ollama} />
                  <CopyRow track="install-copy" cmd={EXAMPLES_CMD} label={T.labels.example} />
                  <CopyRow track="install-copy" cmd={DOCTOR_CMD} label={T.labels.doctor} />
                </div>
              </div>
              <div className="ins-step-body ins-step-body--stack">
                <div className="ins-frame v4-frame-canvas">
                  <CodeFile yaml={HELLO_YAML} filename="hello.nika.yaml" wrap tips />
                </div>
                {/* the verdicts this exact file earns · captured from the real
                    binary (content/install.ts · the honesty law) */}
                <TermCapture title={T.capture_title} lines={FIRST_RUN_TRANSCRIPT} command="nika check hello.nika.yaml" />
                <div className="ins-frame v4-frame-canvas">
                  <CodeFile yaml={HELLO_AI_YAML} filename="hello-ai.nika.yaml" wrap tips />
                </div>
              </div>
            </li>
          </ol>

          {/* the honest snags · native accordions, mono register, each ≤4 lines */}
          <section className="ins-trouble" aria-labelledby="ins-trouble-title" data-rise>
            <h2 id="ins-trouble-title" className="ins-trouble-title mono">
              {T.trouble_title}
            </h2>
            {T.trouble.map((row, i) => (
              <details key={row.q} className="ins-trouble-item">
                <summary className="ins-trouble-q">{t(row.q)}</summary>
                <div className="ins-trouble-a">
                  <p>{t(row.a)}</p>
                  {TROUBLE[i]?.cmd ? <code className="ins-trouble-cmd">{TROUBLE[i].cmd}</code> : null}
                </div>
              </details>
            ))}
          </section>

          {/* the onward pointers */}
          <p className="ins-more" data-rise>
            {T.more.next}{' '}
            <Link to="/learn" className="ins-link">
              {T.more.learn}
            </Link>{' '}
            · <Link to="/use-cases" className="ins-link">
              {T.more.usecases}
            </Link>{' '}
            ·{' '}
            <a href={DOCS} target="_blank" rel="noreferrer" className="ins-link">
              {T.more.docs}
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
