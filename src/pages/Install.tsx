import { useHead } from '@unhead/react'
import { Link } from 'react-router'
import { useRevealOnce } from '../sections/use-reveal-once'
import { routeHead, ENGINE_VERSION, DOCS } from '../content'
import { CodeFile } from '../components/CodeFile'
import { CopyRow } from '../components/CopyRow'
import { InstallCommand } from '../components/InstallCommand'
import {
  INSTALL_SH_CMD,
  VERIFY_CMD,
  RELEASES_URL,
  VSCODE_EXT_URL,
  OPENVSX_EXT_URL,
  VSCODE_REPO,
  INIT_CMD,
  WIRE_CMD,
  EXAMPLES_CMD,
  CHECK_CMD,
  RUN_CMD,
  DOCTOR_CMD,
  HELLO_YAML,
  HELLO_AI_YAML,
} from '../content/install'
import '../sections/v4-home.css'
import '../shell/shell.css'
import './page-chrome.css'
import './install-page.css'

/* ─── /install · the canonical deep-link install target ───────────────────────
   ONE stable URL for docs / README / social (the nav CTA used to anchor to
   /#install, so there was no linkable install page). Six hairline-ruled ways
   in, in the order the engine README teaches them: brew · the install script ·
   manual/air-gapped · the editor extension · agents (`nika init` / `nika
   wire`) · first run (zero-key mock/echo). Every command and claim mirrors
   the engine README verbatim-in-substance — no invented flags, no invented
   version numbers (the plate interpolates ENGINE_VERSION).

   SSR-safe: pure DOM; CodeFile is server-rendered; copy affordances read
   navigator only inside click handlers. Prerendered via site.config PATHS. */

export function Component() {
  const ref = useRevealOnce<HTMLElement>({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' })

  useHead({
    title: 'Install — Nika',
    link: routeHead('/install').link,
    meta: [
      ...routeHead('/install').meta,
      {
        name: 'description',
        content:
          'Install Nika: one Rust binary via Homebrew, the install script, or a verified tarball. Editor extension, agent wiring, and a zero-key first run.',
      },
      { property: 'og:title', content: 'Install — Nika' },
      {
        property: 'og:description',
        content:
          'One binary, on your machine — brew, curl, or air-gapped tarball. First run needs no model and no API key.',
      },
      { name: 'twitter:title', content: 'Install — Nika' },
      {
        name: 'twitter:description',
        content: 'One binary, on your machine. First run needs no model and no API key.',
      },
    ],
  })

  return (
    <main className="theme-dark v4page">
      <section ref={ref} aria-labelledby="ins-title" className="v4sec">
        <div className="v4sec-wrap">
          {/* the masthead */}
          <p className="v4sec-fig" data-rise>
            FIG I · install · {ENGINE_VERSION}
          </p>
          <h1
            id="ins-title"
            className="v4sec-title ins-title"
            data-rise
            style={{ ['--rise-delay' as string]: '60ms' }}
          >
            One binary. Your machine.
          </h1>
          {/* the punch lede (F7) · the catchy line ABOVE the consumer TL;DR */}
          <p className="v4punch" data-rise style={{ ['--rise-delay' as string]: '90ms' }}>
            Two minutes to your first run.
          </p>
          <p className="v4sec-lede" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
            Nika is <b>one Rust binary</b>: no daemon, no account, no cloud required.
            Pick a way in below and run your first file with a <b>free local model</b>.
          </p>
          <p className="v4page-stamp" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
            macOS · Linux · air-gapped OK
          </p>

          <ol className="ins-steps" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
            {/* 1 · Homebrew */}
            <li className="ins-step" id="brew">
              <div className="ins-step-copy">
                <p className="ins-step-n">01 · homebrew</p>
                <h2 className="ins-step-title">The one-liner</h2>
                <p className="ins-step-plain">
                  macOS or Linux with Homebrew — on your <code>PATH</code> immediately.
                  Check it with <code>nika --version</code>.
                </p>
              </div>
              <div className="ins-step-body">
                <InstallCommand />
              </div>
            </li>

            {/* 2 · the install script */}
            <li className="ins-step" id="script">
              <div className="ins-step-copy">
                <p className="ins-step-n">02 · script</p>
                <h2 className="ins-step-title">Without Homebrew</h2>
                <p className="ins-step-plain">
                  Downloads the <b>verified release binary</b> into <code>~/.nika/bin</code> and
                  prints the single <code>PATH</code> line to add to your shell profile —
                  reopen the terminal and <code>nika --version</code> works.
                </p>
              </div>
              <div className="ins-step-body">
                <CopyRow cmd={INSTALL_SH_CMD} label="install script" />
              </div>
            </li>

            {/* 3 · manual / air-gapped */}
            <li className="ins-step" id="manual">
              <div className="ins-step-copy">
                <p className="ins-step-n">03 · manual</p>
                <h2 className="ins-step-title">Air-gapped, or by hand</h2>
                <p className="ins-step-plain">
                  Download the platform tarball and <code>SHA256SUMS</code> from the{' '}
                  <a href={RELEASES_URL} target="_blank" rel="noreferrer" className="ins-link">
                    latest release
                  </a>
                  , verify, then move <code>nika</code> onto your <code>PATH</code>. Nothing
                  phones home.
                </p>
              </div>
              <div className="ins-step-body">
                <CopyRow cmd={VERIFY_CMD} label="checksum verification" />
              </div>
            </li>

            {/* 4 · the editor extension */}
            <li className="ins-step" id="editor">
              <div className="ins-step-copy">
                <p className="ins-step-n">04 · editor</p>
                <h2 className="ins-step-title">The editor extension</h2>
                <p className="ins-step-plain">
                  <code>supernovae.nika-lang</code> — on the{' '}
                  <a href={VSCODE_EXT_URL} target="_blank" rel="noreferrer" className="ins-link">
                    VS Code Marketplace
                  </a>{' '}
                  and{' '}
                  <a href={OPENVSX_EXT_URL} target="_blank" rel="noreferrer" className="ins-link">
                    Open VSX
                  </a>{' '}
                  (Cursor · Windsurf · VSCodium). It auto-downloads the matching{' '}
                  <code>nika</code> release binary on first use, or reuses the one already on
                  your <code>PATH</code>. Any other editor: <code>nika lsp</code> speaks LSP
                  over stdio —{' '}
                  <a href={VSCODE_REPO} target="_blank" rel="noreferrer" className="ins-link">
                    source + issues
                  </a>
                  .
                </p>
              </div>
              <div className="ins-step-body" aria-hidden>
                <p className="ins-ghost mono">
                  completions · diagnostics · a view of the plan — in your editor
                </p>
              </div>
            </li>

            {/* 5 · agents */}
            <li className="ins-step" id="agents">
              <div className="ins-step-copy">
                <p className="ins-step-n">05 · agents</p>
                <h2 className="ins-step-title">Work with your agents</h2>
                <p className="ins-step-plain">
                  Nika is built to be <b>written by agents and reviewed by you</b>.{' '}
                  <code>nika init</code> drops the schema wiring + <code>AGENTS.md</code> into
                  your repo so Claude Code, Cursor, Codex and friends author valid workflows
                  on the first try; <code>nika wire</code> adds explicit agent-tool (MCP)
                  wiring where you want it.
                </p>
              </div>
              <div className="ins-step-body ins-step-body--stack">
                <CopyRow cmd={INIT_CMD} label="repo wiring" />
                <CopyRow cmd={WIRE_CMD} label="Cursor agent wiring" />
              </div>
            </li>

            {/* 6 · first run */}
            <li className="ins-step" id="first-run">
              <div className="ins-step-copy">
                <p className="ins-step-n">06 · first run</p>
                <h2 className="ins-step-title">Zero keys, zero setup</h2>
                <p className="ins-step-plain">
                  Your first workflow needs no model and no API key. Save the file, audit it
                  with <code>nika check</code> (plan · cost · secrets — before anything runs),
                  then <code>nika run</code>. Adding an AI step? The built-in{' '}
                  <code>mock/echo</code> model shows the shape offline — swap it for a local
                  model or any API when ready, and <code>nika doctor</code> tells you exactly
                  what&apos;s wired.
                </p>
                <div className="ins-cmds">
                  <CopyRow cmd={CHECK_CMD} label="static audit" />
                  <CopyRow cmd={RUN_CMD} label="run" />
                  <CopyRow cmd={EXAMPLES_CMD} label="offline example run" />
                  <CopyRow cmd={DOCTOR_CMD} label="environment check" />
                </div>
              </div>
              <div className="ins-step-body ins-step-body--stack">
                <div className="ins-frame v4-frame-canvas">
                  <CodeFile yaml={HELLO_YAML} filename="hello.nika.yaml" />
                </div>
                <div className="ins-frame v4-frame-canvas">
                  <CodeFile yaml={HELLO_AI_YAML} filename="hello-ai.nika.yaml" />
                </div>
              </div>
            </li>
          </ol>

          {/* the onward pointers */}
          <p className="ins-more" data-rise>
            Next:{' '}
            <Link to="/learn" className="ins-link">
              learn the file in 5 minutes
            </Link>{' '}
            · <Link to="/use-cases" className="ins-link">
              browse real workflows
            </Link>{' '}
            ·{' '}
            <a href={DOCS} target="_blank" rel="noreferrer" className="ins-link">
              full docs
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
