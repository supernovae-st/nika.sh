import { CodeFile } from '../components/CodeFile'
import type { FlagshipEntry } from '../flagships'
import { useRevealOnce } from './use-reveal-once'
import './v4-home.css'

/* ─── FIG 4.0 · The wedge (theme-dark · the manifesto beat) ───────────────────
   The missing "why" beat (research section #4): one two-tone thesis paragraph
   (white lead + dim rest · Linear register) over THE CAPTURE — a split showing
   the same morning ritual twice: LEFT as a chat session (dim, dashed,
   evaporating — the transcript fades out mid-panel), RIGHT as daily-brief
   .nika.yaml in the sharp product frame (the permanent register). The mono
   caption carries the thesis in six words: the session ends · the file stays.

   HONESTY: the file shown IS the hero's default tab (HERO_FILES[0] — schema-
   true, gated by src/test/onpage-yaml.test.ts), so the beat re-uses the ONE
   flagship object instead of inventing a second workflow. The transcript is
   an illustrative register (clearly a vignette, no fabricated product output).

   Static composition — the only motion is the section's shared motion-safe
   data-rise reveal. SSR-safe: pure DOM.

   (Wave S: the « what the file buys you » blue pledge plate that used to
   follow this beat is DELETED — operator verdict: off-register. The capture
   split IS the argument; the promises read as marketing filler after it.) */

const TRANSCRIPT: { who: 'you' | 'agent'; text: string }[] = [
  { who: 'you', text: 'check my inbox and calendar. what matters today?' },
  { who: 'agent', text: 'Scanning… 3 urgent threads, one meeting conflict. Want the brief?' },
  { who: 'you', text: 'yes, same format as yesterday’s' },
  { who: 'agent', text: 'I don’t have yesterday’s session. Rebuilding the steps from scratch…' },
]

export default function Wedge({ flagship }: { flagship: FlagshipEntry }) {
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section ref={ref} id="wedge" aria-labelledby="wedge-title" className="theme-dark v4sec scroll-mt-24">
      <div className="v4sec-wrap">
        <p className="v4sec-fig" data-rise>
          04
        </p>

        {/* the two-tone thesis · the manifesto, in one paragraph */}
        <h2 id="wedge-title" className="v4wedge-thesis" data-rise style={{ ['--rise-delay' as string]: '60ms' }}>
          <b>Useful AI work shouldn’t disappear into chats.</b> The prompts you
          perfect, the steps an agent improvises: they evaporate with the
          session. Nika turns the work into a file: readable, versioned,
          runnable. Workflows are files, not SaaS state.
        </h2>

        {/* THE CAPTURE · the same work, twice · ephemeral vs permanent */}
        <div className="v4wedge-split" data-rise style={{ ['--rise-delay' as string]: '140ms' }}>
          <div className="v4wedge-chat" role="img" aria-label="A chat session: the same morning ritual asked again, the assistant rebuilding the steps from scratch. The transcript fades out; the session state is gone.">
            <p className="v4wedge-chat-kicker" aria-hidden>
              a chat, every morning
            </p>
            {TRANSCRIPT.map((line, i) => (
              <p className="v4wedge-chat-line" key={i} aria-hidden>
                <span className={`v4wedge-chat-who v4wedge-chat-who--${line.who}`}>{line.who} ›</span>{' '}
                {line.text}
              </p>
            ))}
            <p className="v4wedge-chat-gone" aria-hidden>
              (session closed · the steps are gone)
            </p>
          </div>

          <span className="v4wedge-arrow" aria-hidden>
            →
          </span>

          <div className="v4wedge-file v4-frame-canvas">
            <CodeFile yaml={flagship.yaml} filename={flagship.filename} wrap />
          </div>
        </div>

        <p className="v4wedge-caption" data-rise style={{ ['--rise-delay' as string]: '200ms' }}>
          the session ends · the file stays
        </p>

      </div>
    </section>
  )
}
