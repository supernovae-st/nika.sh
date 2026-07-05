import { useRevealOnce } from './use-reveal-once'
import { VSCODE_EXT_URL, OPENVSX_EXT_URL } from '../content/install'
import './v4-home.css'

/* ─── FIG 9.5 · In your editor — the file becomes a canvas ────────────────────
   The extension beat: after the use-case gallery (WHAT you'd build) and
   before the ship log, the surface you LIVE in. One framed DOM vignette of
   the nika-lang canvas (content-first cards · verb LED spines · a mid-run
   frame) + the three claims the extension actually ships + the two store
   CTAs. No bitmap: the vignette is pure DOM in the site's own register,
   like Wedge's TRANSCRIPT — clearly an illustration, not a screenshot.

   HONESTY: every element of the vignette exists in the shipped extension
   (content-first cards · verb glyphs ◇▷◆ · duration/model chips · the ▶ Run
   pill with the static cost ceiling). The model shown is a LOCAL one per
   the F4 operator lock (no mock/echo on the marketing surface; local leads
   the catalog). Status glyphs: ✓ done · ◌ running · queued dims.

   Motion: the running card's LED pulses under motion-safe only; everything
   else is static. SSR-safe: pure DOM, zero effects beyond the shared
   reveal. */

type CardStatus = 'done' | 'running' | 'queued'

const CARDS: Array<{
  id: string
  verb: 'invoke' | 'infer' | 'exec'
  glyph: string
  body: string
  chip?: string
  status: CardStatus
  meta?: string
}> = [
  {
    id: 'fetch_pr',
    verb: 'invoke',
    glyph: '◆',
    body: 'nika:fetch · api.github.com/repos/…/pulls/42',
    status: 'done',
    meta: '0.6s',
  },
  {
    id: 'analyze_diff',
    verb: 'infer',
    glyph: '◇',
    body: 'Read the diff and produce a review plan: files touched, risk areas…',
    chip: 'ollama/llama3.2',
    status: 'running',
  },
  {
    id: 'post_comment',
    verb: 'exec',
    glyph: '▷',
    body: '$ gh pr comment $PR --body-file verdict.md',
    status: 'queued',
  },
]

const STATUS_GLYPH: Record<CardStatus, string> = {
  done: '✓',
  running: '◌',
  queued: '·',
}

export default function EditorCanvas() {
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section
      ref={ref}
      id="editor"
      aria-labelledby="editor-title"
      className="theme-dark v4sec scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          9.5
        </p>

        <h2 id="editor-title" className="v4wedge-thesis" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          <b>The file becomes a canvas.</b> Open any <code className="mono">.nika.yaml</code>{' '}
          in VS Code or Cursor — the prompts sit on the cards, a run lights the
          graph live, and every canvas edit lands back in the file.
        </h2>

        {/* THE VIGNETTE · a mid-run frame of the canvas, in DOM */}
        <div
          className="v4ed-frame v4-frame-canvas"
          data-rise
          style={{ ['--rise-delay' as string]: '140ms' }}
          role="img"
          aria-label="The Nika canvas in the editor: three content-first task cards — fetch_pr (invoke, done in 0.6 seconds), analyze_diff (infer on a local model, running), post_comment (exec, queued) — wired top to bottom, with a Run control and the workflow's static cost ceiling."
        >
          <p className="v4ed-tab" aria-hidden>
            pr-review.nika.yaml · canvas
          </p>

          <div className="v4ed-flow" aria-hidden>
            {CARDS.map((c) => (
              <article key={c.id} className={`v4ed-card v4ed-card--${c.verb} v4ed-card--${c.status}`}>
                <p className="v4ed-card-head">
                  <span className="v4ed-glyph">{c.glyph}</span>
                  <span className="v4ed-id">{c.id}</span>
                  <span className={`v4ed-status v4ed-status--${c.status}`}>
                    {STATUS_GLYPH[c.status]}
                    {c.meta ? ` ${c.meta}` : ''}
                  </span>
                </p>
                <p className="v4ed-card-body">{c.body}</p>
                {c.chip && <p className="v4ed-chip">{c.chip}</p>}
              </article>
            ))}
          </div>

          <p className="v4ed-pill" aria-hidden>
            <span className="v4ed-run">▶ Run</span>
            <span className="v4ed-cost">$0.00–$0.04 · audited before it runs</span>
          </p>
        </div>

        {/* the three claims — each one ships today, no roadmap verbs */}
        <ul className="v4ed-claims" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          <li>
            <b>The engine's judgment, as you type.</b> Diagnostics, completions
            and hovers come from <code className="mono">nika check</code> and
            the schema — codes, fixes and positions are the binary's, not the
            extension's.
          </li>
          <li>
            <b>Run, replay, scrub.</b> The run streams onto the graph live;
            any recorded run replays with a time-travel scrubber.
          </li>
          <li>
            <b>Audited before a token is spent.</b> Cost ceiling, permits
            boundary and secret flows are static facts on the cards — read
            them before you press Run.
          </li>
        </ul>

        <div className="v4ed-ctas" data-rise style={{ ['--rise-delay' as string]: '260ms' }}>
          {/* the Deno pattern: a vscode: deep link opens the extension page
              INSIDE the editor — the https store links stay as fallbacks */}
          <a href="vscode:extension/supernovae.nika-lang" className="v4every-link">
            Open in VS Code
          </a>
          <a href={VSCODE_EXT_URL} target="_blank" rel="noreferrer" className="v4every-link">
            Marketplace
            <span aria-hidden> ↗</span>
          </a>
          <a href={OPENVSX_EXT_URL} target="_blank" rel="noreferrer" className="v4every-link">
            Open VSX · Cursor / Windsurf
            <span aria-hidden> ↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
