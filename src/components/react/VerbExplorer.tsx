import { useEffect, useRef, useState } from 'react';

type VerbId = 'exec' | 'invoke' | 'infer' | 'agent';

interface Verb {
  id: VerbId;
  label: string;
  tagline: string;
  description: string;
  yaml: string;
  color: string; // CSS var
}

const VERBS: Verb[] = [
  {
    id: 'exec',
    label: 'EXEC',
    tagline: 'Run a shell command',
    description:
      'Execute any shell command — stdout, stderr, exit code, with env injection ' +
      'and a timeout. A blocklist guards what can run; output streams as it happens. ' +
      'The primitive everything else is built on.',
    yaml: `tasks:
  - id: build
    exec:
      cmd: "cargo build --release"
      env:
        RUSTFLAGS: "-C opt-level=3"
      timeout: 300s
      capture: stdout`,
    color: 'var(--color-brand)',
  },
  {
    id: 'invoke',
    label: 'INVOKE',
    tagline: 'Call a tool',
    description:
      'Reach any MCP server — or one of 22 builtins: nika:fetch for HTTP, plus ' +
      'filesystem, git, GitHub, Slack, databases. The whole MCP ecosystem and a ' +
      'sharp standard library, one line each.',
    yaml: `tasks:
  - id: get-pr
    invoke:
      tool: "nika:fetch"
      args:
        url: "https://api.github.com/repos/\${{ vars.repo }}/pulls/\${{ vars.pr }}"
        headers:
          Authorization: "Bearer \${{ secrets.GH_TOKEN }}"
      output: pr_data`,
    color: 'var(--color-emerald)',
  },
  {
    id: 'infer',
    label: 'INFER',
    tagline: 'Call an LLM',
    description:
      'Provider-agnostic inference across 13 providers — Anthropic, OpenAI, ' +
      'Google, Mistral, Ollama, local GGUF. Structured output, vision, and ' +
      'extended thinking are first-class, not prompt hacks.',
    yaml: `tasks:
  - id: classify
    infer:
      provider: anthropic
      model: claude-opus-4-8
      prompt: |
        Classify this GitHub issue:
        \${{ tasks.get-pr.output.body }}
      structured:
        label:    string
        priority: enum(P0, P1, P2, P3)
        labels:   list(string)`,
    color: 'var(--color-violet)',
  },
  {
    id: 'agent',
    label: 'AGENT',
    tagline: 'Autonomous sub-agent',
    description:
      'Spawn an agent with a goal, tools, and a step budget. It plans, calls ' +
      'tools, reflects, returns a structured result — inside guardrails you set, ' +
      'so the loop stays verifiable. Agents compose: they delegate to other agents.',
    yaml: `tasks:
  - id: researcher
    agent:
      provider: anthropic
      model: claude-opus-4-8
      goal: |
        Research \${{ vars.topic }}.
        Produce a 500-word summary with 5 citations.
      tools: [web.search, web.fetch, fs.write]
      max_steps: 12
      structured:
        summary:   string
        citations: list(string)`,
    color: 'var(--color-amber)',
  },
];

const VERB_INDEX = VERBS.reduce<Record<string, number>>((acc, v, i) => {
  acc[v.id] = i;
  return acc;
}, {});

interface VerbExplorerProps {
  className?: string;
}

/**
 * VerbExplorer — interactive four-verb showcase.
 *
 * Left column: verb tabs with keyboard navigation (← →).
 * Right column: YAML code preview with a syntax-highlight-like coloring,
 *               description, and the verb's tagline.
 *
 * No motion dependency — pure CSS transitions.
 * ARIA: tablist / tab / tabpanel pattern.
 */
export function VerbExplorer({ className = '' }: VerbExplorerProps) {
  const [active, setActive] = useState<VerbId>('exec');
  const [prev, setPrev] = useState<VerbId | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const verb = VERBS[VERB_INDEX[active]];

  const activate = (id: VerbId) => {
    if (id === active) return;
    setPrev(active);
    setActive(id);
  };

  // Keyboard: ← → cycle through verbs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isTab = tabRefs.current.some(r => r === el);
      if (!isTab) return;

      const idx = VERB_INDEX[active];
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = VERBS[(idx + 1) % VERBS.length];
        activate(next.id);
        tabRefs.current[(idx + 1) % VERBS.length]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = VERBS[(idx - 1 + VERBS.length) % VERBS.length];
        activate(next.id);
        tabRefs.current[(idx - 1 + VERBS.length) % VERBS.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <div className={`verb-explorer ${className}`}>
      {/* ── Tab list ──────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Nika verbs"
        className="verb-tabs"
      >
        {VERBS.map((v, i) => (
          <button
            key={v.id}
            ref={el => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={v.id === active}
            aria-controls={`verb-panel-${v.id}`}
            id={`verb-tab-${v.id}`}
            tabIndex={v.id === active ? 0 : -1}
            className={`verb-tab${v.id === active ? ' is-active' : ''}`}
            style={{ '--verb-color': v.color } as React.CSSProperties}
            onClick={() => activate(v.id)}
          >
            <span className="verb-tab-label">{v.label}</span>
            <span className="verb-tab-line">{v.tagline}</span>
          </button>
        ))}
      </div>

      {/* ── Tab panels ────────────────────────────────────────────────── */}
      {VERBS.map(v => (
        <div
          key={v.id}
          role="tabpanel"
          id={`verb-panel-${v.id}`}
          aria-labelledby={`verb-tab-${v.id}`}
          hidden={v.id !== active}
          className="verb-panel"
        >
          <div className="verb-panel-inner">
            {/* Description */}
            <div className="verb-description">
              <div
                className="verb-badge mono-display mono-display-sm"
                style={{ color: verb.color }}
              >
                {v.label}
              </div>
              <h3 className="verb-headline">{v.tagline}</h3>
              <p className="verb-body">{v.description}</p>
            </div>

            {/* YAML code panel */}
            <div className="verb-code-wrap">
              <div className="verb-code-header">
                <span
                  className="verb-code-dot"
                  style={{ background: verb.color } as React.CSSProperties}
                  aria-hidden="true"
                />
                <span className="verb-code-filename">
                  example.nika.yaml
                </span>
                <span className="verb-code-tag">
                  {v.id}
                </span>
              </div>
              <pre
                className="verb-code-body"
                aria-label={`${v.label} verb YAML example`}
              >
                <YamlHighlight source={v.yaml} accentColor={v.color} />
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Minimal YAML syntax highlighter ─────────────────────────────────────────
// Tokenises YAML source into coloured spans. No library — pure string parsing.
// Rules: key:, string values, numbers, comments, template expressions.

function YamlHighlight({ source, accentColor }: { source: string; accentColor: string }) {
  const lines = source.split('\n');

  return (
    <>
      {lines.map((line, i) => (
        <span key={i} style={{ display: 'block' }}>
          <YamlLine line={line} accentColor={accentColor} />
          {'\n'}
        </span>
      ))}
    </>
  );
}

function YamlLine({ line, accentColor }: { line: string; accentColor: string }) {
  // Comment
  if (/^\s*#/.test(line)) {
    return <span style={{ color: 'var(--color-fg-ghost)' }}>{line}</span>;
  }

  // Key: value  (e.g. "  cmd: ...")
  const keyMatch = line.match(/^(\s*)([-\s]*)([\w-]+)(:)(.*)$/);
  if (keyMatch) {
    const [, indent, dash, key, colon, rest] = keyMatch;
    return (
      <>
        <span>{indent}{dash}</span>
        <span style={{ color: 'var(--color-cyan)' }}>{key}</span>
        <span style={{ color: 'var(--color-fg-dim)' }}>{colon}</span>
        <YamlValue value={rest} accentColor={accentColor} />
      </>
    );
  }

  return <span style={{ color: 'var(--color-fg-mute)' }}>{line}</span>;
}

function YamlValue({ value, accentColor }: { value: string; accentColor: string }) {
  if (!value.trim()) return <span>{value}</span>;

  // Highlight ${{ ... }} CEL template expressions inside strings (spec/04-variables ·
  // the one canonical substitution syntax · leading $ is part of the token).
  const parts = value.split(/(\$\{\{[^}]+\}\})/g);
  return (
    <span style={{ color: 'var(--color-emerald)' }}>
      {parts.map((part, i) =>
        /^\$\{\{/.test(part)
          ? <span key={i} style={{ color: accentColor }}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

export default VerbExplorer;
