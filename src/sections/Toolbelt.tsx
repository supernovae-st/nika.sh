import { useRevealOnce } from './use-reveal-once'
import { CANON } from '../canon.generated'
import './v4-home.css'
import { SectionHead } from '../components/SectionHead'

/* ─── FIG 6.0 · The toolbelt (theme-dark · what you can permit) ────────────────
   Design doc §6 (FIG 6.0) — "what an agent can be permitted to use." The engine's
   capability inventory as a TECHNICAL LEDGER, not a marketing grid: a banner of
   headline counts (all from CANON · tabular-nums), then hairline-ruled registers
   — builtins (4 families), providers (local-first → Mistral/cloud → mock), extract
   modes, and MCP. The whole inventory is what you ALLOW — nothing here runs unless
   the file's permits: let it. Reads like the spec sheet on the back of an instrument.

   Spec-true BY CONSTRUCTION: every count + list derives from canon.generated.ts
   (projected from nika-spec canon.yaml · the SSOT). Hand-curated craft = the
   per-builtin glosses + provider display names only. A canon builtin that isn't
   glossed still renders (structural guard) — so the lists can never under-render.

   Monochrome: the only colour is the global aurora + a hairline verb-hue whisper
   on a register's marker tick. SSR-safe: pure DOM; the reveal is an
   IntersectionObserver added on mount, content visible by default. */

/* the 4 builtin families · craft layer (labels + glosses). The chips themselves
   DERIVE from CANON.builtinNames via the structural guard below. */
const FAMILIES: { label: string; tools: { n: string; d: string }[] }[] = [
  {
    label: 'Files',
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
    tools: [
      { n: 'jq', d: 'transform JSON' },
      { n: 'convert', d: 'between formats' },
      { n: 'validate', d: 'check a schema' },
      { n: 'json_diff', d: 'what changed' },
      { n: 'json_merge_patch', d: 'merge JSON' },
      { n: 'compose', d: 'chain tools' },
      { n: 'hash', d: 'fingerprint data' },
      { n: 'uuid', d: 'fresh id' },
      { n: 'date', d: 'now · parse · format' },
    ],
  },
  {
    label: 'Web',
    tools: [{ n: 'fetch', d: `get a page · ${CANON.extractModes} extract modes` }],
  },
  {
    label: 'Flow',
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

/* structural guard · every canonical builtin appears as a chip. A builtin added
   to canon.yaml but not yet glossed lands in Flow with a placeholder gloss, so
   the family chips can never silently drop below CANON.builtins. */
const GLOSSED = new Set(FAMILIES.flatMap((f) => f.tools.map((t) => t.n)))
for (const b of CANON.builtinNames) {
  if (!GLOSSED.has(b)) FAMILIES[FAMILIES.length - 1].tools.push({ n: b, d: 'see the docs' })
}

/* canonical provider ids → display names (craft layer · an un-named new canon id
   renders as its raw id, so the lists can never under-render). */
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
  mock: 'mock',
}
const display = (id: string) => PROVIDER_DISPLAY[id] ?? id
/* provider presentation order (studio convention): local/open-weight first,
   then Mistral + the rest of cloud, then mock. CANON.providerIdsCloud is already
   Mistral-led; CANON.providerIdsLocal carries the local runtimes. */
const LOCAL = CANON.providerIdsLocal.map(display)
const CLOUD = CANON.providerIdsCloud.map(display)
const TEST = CANON.providerIdsTest.map(display)
const MODES = CANON.extractModeNames

/* the verb hue feeding each register's marker tick (whisper · hairline only) */
const REG_HUE = [
  'var(--verb-invoke)', // builtins — reached via invoke
  'var(--verb-infer)', // providers — reached via infer
  'var(--verb-invoke)', // extract modes — fetch is a builtin (invoke)
  'var(--verb-agent)', // MCP — tools an agent can drive
]

function Chip({ n, d }: { n: string; d?: string }) {
  return (
    <span className="v4belt-chip">
      {n}
      {d ? <em>· {d}</em> : null}
    </span>
  )
}

export default function Toolbelt() {
  /* reveal the rows once, on first intersection (motion-safe; default visible;
     safety-net timer reveals anyway if the observer misfires) */
  const ref = useRevealOnce<HTMLElement>()

  return (
    <section
      ref={ref}
      id="toolbelt"
      aria-labelledby="toolbelt-title"
      className="theme-dark v4sec v4-flip v4-cv scroll-mt-24"
    >
      <div className="v4sec-wrap">
        <SectionHead fig="07" id="toolbelt-title" title={<>What an agent can be permitted to&nbsp;use.</>}>
          The language stays four verbs. The standard library does the rest:{' '}
          <b>{CANON.builtins} builtins</b>, <b>{CANON.providers} model providers</b>, and any of
          your <b>agent tools</b> (MCP servers) your editor already uses. All reached the same way:{' '}
          <code className="mono">invoke:</code>, and none of it runs unless the file&apos;s{' '}
          <code className="mono">permits:</code> allows it.
        </SectionHead>

        {/* the headline-count banner · big tabular numbers, hairline-separated */}
        <div className="v4belt-counts" data-rise style={{ ['--rise-delay' as string]: '160ms' }}>
          <div className="v4belt-count">
            <span className="v4belt-count-fig">01</span>
            <span className="v4belt-count-n">{CANON.builtins}</span>
            <span className="v4belt-count-label">builtin tools · nothing to install</span>
          </div>
          <div className="v4belt-count">
            <span className="v4belt-count-fig">02</span>
            <span className="v4belt-count-n">{CANON.providers}</span>
            <span className="v4belt-count-label">
              model providers · {CANON.providersLocal} local, {CANON.providersCloud} cloud, 1 mock
            </span>
          </div>
          <div className="v4belt-count">
            <span className="v4belt-count-fig">03</span>
            <span className="v4belt-count-n">{CANON.extractModes}</span>
            <span className="v4belt-count-label">
              extract modes on <code className="mono">fetch</code>
            </span>
          </div>
          <div className="v4belt-count">
            <span className="v4belt-count-fig">04</span>
            <span className="v4belt-count-n">
              MCP<span className="v4belt-count-unit">native</span>
            </span>
            <span className="v4belt-count-label">
              your agent tools (MCP) · any server, via the same verb
            </span>
          </div>
        </div>

        {/* the registers · hairline-ruled blocks · label rail + chips */}
        <div
          className="v4belt-registers"
          data-rise
          style={{ ['--rise-delay' as string]: '200ms' }}
        >
          {/* 6.5 · builtins — 4 families */}
          <div className="v4belt-reg">
            <div className="v4belt-reg-head">
              <span className="v4belt-reg-fig">
                <span
                  className="v4belt-reg-tick"
                  aria-hidden
                  style={{ ['--vh' as string]: REG_HUE[0] }}
                />
                Builtins
              </span>
              <span className="v4belt-reg-cap">
                The everyday tools. All called with <code>invoke:</code>.
              </span>
              <span className="v4belt-reg-count">{CANON.builtins} tools · 4 families</span>
            </div>
            <div className="v4belt-fams">
              {FAMILIES.map((f) => (
                <div key={f.label} className="min-w-0">
                  <p className="v4belt-fam-label">
                    <span className="v4belt-fam-dot" aria-hidden />
                    {f.label}
                    <span style={{ color: 'var(--v4-text-faint)' }}>· {f.tools.length}</span>
                  </p>
                  <div className="v4belt-chips">
                    {f.tools.map((t) => (
                      <Chip key={t.n} n={t.n} d={t.d} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6.6 · providers — local-first, then Mistral/cloud, then mock */}
          <div className="v4belt-reg">
            <div className="v4belt-reg-head">
              <span className="v4belt-reg-fig">
                <span
                  className="v4belt-reg-tick"
                  aria-hidden
                  style={{ ['--vh' as string]: REG_HUE[1] }}
                />
                Providers
              </span>
              <span className="v4belt-reg-cap">
                Pick per task or per file. <code>provider: ollama</code> runs offline.
              </span>
              <span className="v4belt-reg-count">{CANON.providers} total</span>
            </div>
            <div className="v4belt-fams">
              <div className="min-w-0">
                <p className="v4belt-fam-label">
                  <span className="v4belt-fam-dot" aria-hidden />
                  Local runtimes
                  <span style={{ color: 'var(--v4-text-faint)' }}>
                    · {CANON.providersLocal} · no cloud needed
                  </span>
                </p>
                <div className="v4belt-chips">
                  {LOCAL.map((p) => (
                    <Chip key={p} n={p} />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <p className="v4belt-fam-label">
                  <span className="v4belt-fam-dot" aria-hidden />
                  Cloud · open-weight first
                  <span style={{ color: 'var(--v4-text-faint)' }}>· {CANON.providersCloud}</span>
                </p>
                <div className="v4belt-chips">
                  {CLOUD.map((p) => (
                    <Chip key={p} n={p} />
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <p className="v4belt-fam-label">
                  <span className="v4belt-fam-dot" aria-hidden />
                  Test
                  <span style={{ color: 'var(--v4-text-faint)' }}>· {CANON.providersTest}</span>
                </p>
                <div className="v4belt-chips">
                  {TEST.map((p) => (
                    <Chip key={p} n={p} d="deterministic · zero keys · CI-runnable" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6.7 · extract modes — on fetch */}
          <div className="v4belt-reg">
            <div className="v4belt-reg-head">
              <span className="v4belt-reg-fig">
                <span
                  className="v4belt-reg-tick"
                  aria-hidden
                  style={{ ['--vh' as string]: REG_HUE[2] }}
                />
                Extract modes
              </span>
              <span className="v4belt-reg-cap">
                How <code>fetch</code> turns a page into typed output.
              </span>
              <span className="v4belt-reg-count">{CANON.extractModes} modes</span>
            </div>
            <div className="v4belt-chips">
              {MODES.map((m) => (
                <Chip key={m} n={m} />
              ))}
            </div>
          </div>

          {/* 6.8 · MCP — the open surface */}
          <div className="v4belt-reg">
            <div className="v4belt-reg-head">
              <span className="v4belt-reg-fig">
                <span
                  className="v4belt-reg-tick"
                  aria-hidden
                  style={{ ['--vh' as string]: REG_HUE[3] }}
                />
                MCP
              </span>
              <span className="v4belt-reg-cap">
                Any of your agent tools (MCP servers), reached as <code>mcp:</code>.
              </span>
              <span className="v4belt-reg-count">native · unbounded</span>
            </div>
            <div className="v4belt-chips">
              <Chip n="mcp:" d="the server your editor already uses" />
              <Chip n="stdio" />
              <Chip n="http" />
              <Chip n="default-deny" d="tools whitelisted in the file" />
            </div>
          </div>
        </div>

        <p className="v4belt-note" data-rise style={{ ['--rise-delay' as string]: '120ms' }}>
          every count derives from the spec&apos;s <code>canon.yaml</code> · never hand-typed
        </p>
      </div>
    </section>
  )
}
