import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { TermLine } from './TermFrame'
import type { TerminalCapture } from '../content/terminal-captures.generated'
import './term-frame.css'
import './living-terminal.css'

/* ─── LivingTerminal · the record player (WO-14 · W-A) ───────────────────────
   A terminal that REPLAYS recorded runs of the released binary — the
   whitelist-honesty law on its face: it says « record player, not a
   sandbox » in its own chrome, an off-list command answers with the
   teaching (install the binary; it runs anything), and every replayed
   byte is the vendored capture, verbatim. The whitelist IS the vendored
   registry (terminal-captures.generated · lazy chunk, loaded on mount —
   no hand-typed command can exist here). Entries with a machine twin
   (--format json) carry the human|json toggle: the dual voice, one run. */

interface HistoryItem {
  command: string
  lines: TermLine[]
  json?: string
  showJson?: boolean
  miss?: boolean
}

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

/* the engine prints its own doors (« full docs: https://nika.sh/errors/… ») —
   the terminal makes them WALKABLE (the U1 door law extended): site URLs
   become internal links, byte-verbatim text around them */
function linkify(text: string, key: number) {
  const parts = text.split(/(https:\/\/nika\.sh\/[\w\-/#]+)/g)
  if (parts.length === 1) return text
  return parts.map((p, i) =>
    p.startsWith('https://nika.sh/') ? (
      <Link key={`${key}-${i}`} className="lterm-door" to={p.slice('https://nika.sh'.length)}>
        {p}
      </Link>
    ) : (
      p
    ),
  )
}

export function LivingTerminal() {
  const [captures, setCaptures] = useState<TerminalCapture[] | null>(null)
  const [engine, setEngine] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [value, setValue] = useState('')
  const logRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let live = true
    void import('../content/terminal-captures.generated').then((m) => {
      if (!live) return
      setCaptures(m.TERMINAL_CAPTURES)
      setEngine(m.TERMINAL_ENGINE)
    })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'instant' })
  }, [history])

  const replay = (command: string) => {
    const c = normalize(command)
    if (!c) return
    const hit = captures?.find((x) => normalize(x.command) === c)
    setHistory((h) => [
      ...h,
      hit
        ? { command: hit.command, lines: hit.lines, json: hit.json }
        : {
            command: c,
            miss: true,
            lines: [
              {
                kind: 'soft',
                text: `not on this record — the terminal replays recorded runs of nika ${engine}, byte-verbatim.`,
              },
              {
                kind: 'soft',
                text: 'the real thing runs anything: brew install supernovae-st/tap/nika',
              },
            ],
          },
    ])
    setValue('')
  }

  return (
    <div className="lterm">
      <p className="lterm-face mono">
        record player, not a sandbox — recorded runs of nika {engine || '…'}, replayed
        verbatim · re-captured at every release
      </p>
      <div className="lterm-frame">
        <div className="lterm-log" ref={logRef} role="log" aria-label="Replayed output">
          {history.length === 0 && (
            <p className="lterm-hint mono">pick a recorded run below, or type it</p>
          )}
          {history.map((h, i) => (
            <div className="lterm-entry" key={i}>
              <div className="lterm-cmdrow mono">
                <span className="lterm-prompt" aria-hidden>
                  ›
                </span>{' '}
                {h.command}
                {h.json != null && (
                  <button
                    type="button"
                    className="lterm-dual mono"
                    aria-pressed={Boolean(h.showJson)}
                    onClick={() =>
                      setHistory((hs) =>
                        hs.map((x, xi) => (xi === i ? { ...x, showJson: !x.showJson } : x)),
                      )
                    }
                  >
                    {h.showJson ? 'json' : 'human'} · flip
                  </button>
                )}
              </div>
              {h.showJson && h.json != null ? (
                <pre className="lterm-json mono">{h.json}</pre>
              ) : (
                <pre className="tf-body lterm-out" role="group" aria-label={h.command}>
                  {h.lines.map((l, li) => (
                    <span key={li} className={`tf-line tf-line--${l.kind}`}>
                      {linkify(l.text, li)}
                      {'\n'}
                    </span>
                  ))}
                </pre>
              )}
            </div>
          ))}
        </div>
        <form
          className="lterm-inputrow"
          onSubmit={(e) => {
            e.preventDefault()
            replay(value)
          }}
        >
          <span className="lterm-prompt mono" aria-hidden>
            ›
          </span>
          <input
            className="lterm-input mono"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Replay a recorded command"
            placeholder="nika check hello.nika.yaml"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit" className="lterm-go mono">
            replay
          </button>
        </form>
      </div>
      <div className="lterm-chips" aria-label="The recorded runs">
        {(captures ?? []).map((c) => (
          <button key={c.id} type="button" className="lterm-chip mono" onClick={() => replay(c.command)}>
            {c.command}
          </button>
        ))}
      </div>
    </div>
  )
}
