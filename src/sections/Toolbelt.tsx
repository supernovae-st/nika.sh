import { Plain } from '../components/ui'

/* ─── § the toolbelt · the standard library as a constellation ──────────────
   Spec-true (nika-spec canon.yaml v0.2): 4 verbs stay locked — everything
   else is a tool. 22 builtins in 4 families · 13 providers (8 cloud + 5
   local) · 9 extract modes on fetch. Hover a chip → its plain-words gloss. */

const FAMILIES: { label: string; c: string; tools: { n: string; d: string }[] }[] = [
  {
    label: 'Files',
    c: '#7fe9ff',
    tools: [
      { n: 'read', d: 'read a file' },
      { n: 'write', d: 'save a file' },
      { n: 'edit', d: 'patch a file' },
      { n: 'glob', d: 'find files' },
      { n: 'grep', d: 'search text' },
    ],
  },
  {
    label: 'Data',
    c: '#5b8cff',
    tools: [
      { n: 'jq', d: 'transform JSON' },
      { n: 'convert', d: 'between formats' },
      { n: 'validate', d: 'check a schema' },
      { n: 'json_diff', d: 'what changed' },
      { n: 'json_merge_patch', d: 'merge JSON' },
      { n: 'hash', d: 'fingerprint data' },
      { n: 'uuid', d: 'fresh id' },
      { n: 'date', d: 'now · parse · format' },
    ],
  },
  {
    label: 'Web',
    c: '#b07bff',
    tools: [{ n: 'fetch', d: 'get a page · 9 extract modes' }],
  },
  {
    label: 'Flow',
    c: '#ff7a3c',
    tools: [
      { n: 'assert', d: 'check a condition' },
      { n: 'done', d: 'end the loop' },
      { n: 'wait', d: 'pause' },
      { n: 'emit', d: 'send an event' },
      { n: 'log', d: 'say something' },
      { n: 'notify', d: 'ping a human' },
      { n: 'prompt', d: 'ask a human' },
      { n: 'inspect', d: 'debug a value' },
    ],
  },
]

const CLOUD = ['Anthropic', 'OpenAI', 'Gemini', 'DeepSeek', 'Mistral', 'xAI', 'Groq', 'OpenRouter']
const LOCAL = ['Ollama', 'LM Studio', 'llama.cpp', 'LocalAI', 'vLLM']
const MODES = ['article', 'markdown', 'links', 'feed', 'sitemap', 'selector', 'text', 'metadata', 'jq']

export default function Toolbelt() {
  return (
    <section id="toolbelt" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28 md:py-36">
      <p className="rv mono mb-4 text-[12px] tracking-[0.28em] text-[var(--cyan)] uppercase">
        § The toolbelt
      </p>
      <h2
        className="rv mb-3 font-semibold tracking-tight"
        style={{ fontSize: 'clamp(2rem, 1rem + 3.5vw, 3.6rem)', lineHeight: 1.02 }}
      >
        Everything else is a tool.
      </h2>
      <p className="rv max-w-[42rem] text-[17px] leading-relaxed text-[var(--fg-mute)]">
        The language stays four verbs. The standard library does the rest. 22 builtins, any MCP
        server your editor already uses, and 13 model providers. All reached the same way:{' '}
        <code className="mono text-[14px] text-[var(--cyan)]">invoke:</code>.
      </p>
      <div className="mb-12">
        <Plain>
          Nika ships with the everyday tools: read files, fetch pages, transform data, ping you
          when it&apos;s done. Hover one to see what it does.
        </Plain>
      </div>

      {/* the 22 builtins · 4 families */}
      <div className="rv grid gap-5 md:grid-cols-2">
        {FAMILIES.map((f) => (
          <div key={f.label} className="glass rounded-2xl px-6 py-5">
            <p
              className="mono mb-4 flex items-center gap-2.5 text-[11px] tracking-[0.24em] uppercase"
              style={{ color: f.c }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: f.c, boxShadow: `0 0 8px ${f.c}` }}
              />
              {f.label}
              <span className="text-[var(--fg-ghost)]">· {f.tools.length}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {f.tools.map((t) => (
                <span key={t.n} className="tool-chip mono" style={{ ['--tc' as string]: f.c }}>
                  {t.n}
                  <em>{t.d}</em>
                </span>
              ))}
              {f.label === 'Web' && (
                <span className="flex flex-wrap items-center gap-1.5 pl-1">
                  {MODES.map((m) => (
                    <span key={m} className="mode-chip mono">
                      {m}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* the 13 providers · cloud row + sovereign local row */}
      <div className="rv mt-5 grid gap-5 md:grid-cols-2">
        <div className="glass rounded-2xl px-6 py-5">
          <p className="mono mb-4 text-[11px] tracking-[0.24em] text-[var(--fg-dim)] uppercase">
            Cloud providers · 8
          </p>
          <div className="flex flex-wrap gap-2">
            {CLOUD.map((p) => (
              <span key={p} className="tool-chip mono" style={{ ['--tc' as string]: '#aab4c9' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="skeuo rounded-2xl px-6 py-5">
          <p className="mono mb-4 flex items-center gap-2.5 text-[11px] tracking-[0.24em] text-[var(--cyan)] uppercase">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cyan)]"
              style={{ boxShadow: '0 0 8px var(--cyan)' }}
            />
            Local runtimes · 5 · no cloud needed
          </p>
          <div className="flex flex-wrap gap-2">
            {LOCAL.map((p) => (
              <span key={p} className="tool-chip mono" style={{ ['--tc' as string]: '#7fe9ff' }}>
                {p}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--fg-mute)]">
            Point <code className="mono text-[12px]">provider: ollama</code> at your own machine and
            the whole workflow runs offline.
          </p>
        </div>
      </div>
    </section>
  )
}
