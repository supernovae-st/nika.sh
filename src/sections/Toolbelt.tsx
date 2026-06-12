import { Plain } from '../components/ui'
import { CANON } from '../canon.generated'

/* ─── § the toolbelt · the standard library as a constellation ──────────────
   Spec-true by CONSTRUCTION: every count + every list derives from
   canon.generated.ts (projected from nika-spec canon.yaml · the SSOT).
   Hand-curated craft = the per-chip glosses + provider display names only.
   Hover a chip → its plain-words gloss. */

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
    tools: [{ n: 'fetch', d: `get a page · ${CANON.extractModes} extract modes` }],
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

/* canonical ids → display names (craft layer · a new canon id renders as its
   raw id until given a display name, so the lists can never under-render) */
const PROVIDER_DISPLAY: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  xai: 'xAI',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
  lmstudio: 'LM Studio',
  llamacpp: 'llama.cpp',
  localai: 'LocalAI',
  vllm: 'vLLM',
}
const display = (id: string) => PROVIDER_DISPLAY[id] ?? id
const CLOUD = CANON.providerIdsCloud.map(display)
const LOCAL = CANON.providerIdsLocal.map(display)
const MODES = CANON.extractModeNames

/* structural guard · every canonical builtin appears as a chip — a builtin
   added to canon.yaml but not yet glossed renders un-glossed in Flow. */
const GLOSSED = new Set(FAMILIES.flatMap((f) => f.tools.map((t) => t.n)))
for (const b of CANON.builtinNames) {
  if (!GLOSSED.has(b)) FAMILIES[FAMILIES.length - 1].tools.push({ n: b, d: 'see the docs' })
}

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
        The language stays four verbs. The standard library does the rest. {CANON.builtins}{' '}
        builtins, any MCP server your editor already uses, and {CANON.providers} model providers.
        All reached the same way:{' '}
        <code className="mono text-[14px] text-[var(--cyan)]">invoke:</code>.
      </p>
      <div className="mb-12">
        <Plain>
          Nika ships with the everyday tools: read files, fetch pages, transform data, ping you
          when it&apos;s done. Hover one to see what it does.
        </Plain>
      </div>

      {/* the builtins · 4 families · chips derive from CANON.builtinNames */}
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

      {/* the providers · sovereign local row FIRST + cloud row (counts from CANON) */}
      <div className="rv mt-5 grid gap-5 md:grid-cols-2">
        <div className="skeuo rounded-2xl px-6 py-5">
          <p className="mono mb-4 flex items-center gap-2.5 text-[11px] tracking-[0.24em] text-[var(--cyan)] uppercase">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--cyan)]"
              style={{ boxShadow: '0 0 8px var(--cyan)' }}
            />
            Local runtimes · {CANON.providersLocal} · no cloud needed
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
            the whole workflow runs offline. Plus <code className="mono text-[12px]">mock</code> —
            the deterministic test provider that makes workflows CI-runnable with zero keys.
          </p>
        </div>
        <div className="glass rounded-2xl px-6 py-5">
          <p className="mono mb-4 text-[11px] tracking-[0.24em] text-[var(--fg-dim)] uppercase">
            Cloud providers · {CANON.providersCloud}
          </p>
          <div className="flex flex-wrap gap-2">
            {CLOUD.map((p) => (
              <span key={p} className="tool-chip mono" style={{ ['--tc' as string]: '#aab4c9' }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
