import { useState } from 'react';

type Status = 'admitted' | 'growing' | 'planned';

interface Crate {
  id: string;
  label: string;
  x: number;
  y: number;
  status: Status;
}

// 35 crates — positions hand-tuned for organic star-map feel.
// Clusters: Core (center), Verbs (left), LLM providers (right),
//           Tools (bottom), Security (top).
const CRATES: Crate[] = [
  // ── Core cluster ──────────────────────────────────────────────────────
  { id: 'engine',    label: 'engine',    x: 360, y: 200, status: 'admitted' },
  { id: 'schema',    label: 'schema',    x: 305, y: 165, status: 'admitted' },
  { id: 'cli',       label: 'cli',       x: 360, y: 135, status: 'admitted' },
  { id: 'dag',       label: 'dag',       x: 408, y: 165, status: 'admitted' },
  { id: 'runtime',   label: 'runtime',   x: 420, y: 215, status: 'admitted' },
  { id: 'events',    label: 'events',    x: 390, y: 240, status: 'admitted' },
  { id: 'context',   label: 'context',   x: 320, y: 235, status: 'admitted' },
  { id: 'config',    label: 'config',    x: 255, y: 105, status: 'admitted' },
  { id: 'error',     label: 'error',     x: 290, y: 125, status: 'admitted' },

  // ── Verbs ─────────────────────────────────────────────────────────────
  { id: 'exec',      label: 'exec',      x: 185, y: 140, status: 'admitted' },
  { id: 'fetch',     label: 'fetch',     x: 155, y: 185, status: 'admitted' },
  { id: 'invoke',    label: 'invoke',    x: 175, y: 230, status: 'admitted' },
  { id: 'infer',     label: 'infer',     x: 215, y: 255, status: 'admitted' },
  { id: 'agent',     label: 'agent',     x: 220, y: 170, status: 'growing'  },

  // ── LLM providers ─────────────────────────────────────────────────────
  { id: 'llm',       label: 'llm',       x: 520, y: 155, status: 'admitted' },
  { id: 'anthropic', label: 'anthropic', x: 585, y: 115, status: 'admitted' },
  { id: 'openai',    label: 'openai',    x: 620, y: 158, status: 'admitted' },
  { id: 'google',    label: 'google',    x: 608, y: 205, status: 'admitted' },
  { id: 'mistral',   label: 'mistral',   x: 570, y: 240, status: 'admitted' },
  { id: 'ollama',    label: 'ollama',    x: 525, y: 210, status: 'admitted' },
  { id: 'gguf',      label: 'gguf',      x: 545, y: 270, status: 'planned'  },
  { id: 'groq',      label: 'groq',      x: 640, y: 248, status: 'planned'  },

  // ── Tools ─────────────────────────────────────────────────────────────
  { id: 'tools',     label: 'tools',     x: 330, y: 308, status: 'admitted' },
  { id: 'builtin',   label: 'builtin',   x: 380, y: 325, status: 'admitted' },
  { id: 'shell',     label: 'shell',     x: 265, y: 330, status: 'admitted' },
  { id: 'http',      label: 'http',      x: 300, y: 350, status: 'admitted' },
  { id: 'fs',        label: 'fs',        x: 350, y: 355, status: 'admitted' },
  { id: 'git',       label: 'git',       x: 408, y: 348, status: 'admitted' },
  { id: 'catalog',   label: 'catalog',   x: 450, y: 322, status: 'growing'  },
  { id: 'mcp',       label: 'mcp',       x: 490, y: 348, status: 'planned'  },

  // ── Security ──────────────────────────────────────────────────────────
  { id: 'security',  label: 'security',  x: 360, y: 68,  status: 'growing'  },
  { id: 'shield',    label: 'shield',    x: 302, y: 54,  status: 'growing'  },
  { id: 'taint',     label: 'taint',     x: 418, y: 54,  status: 'planned'  },

  // ── Misc / future ─────────────────────────────────────────────────────
  { id: 'ui',        label: 'ui',        x: 170, y: 282, status: 'admitted' },
  { id: 'registry',  label: 'registry',  x: 115, y: 248, status: 'planned'  },
];

// Constellation edges: [fromId, toId]
const EDGES: [string, string][] = [
  // Core spine
  ['cli', 'engine'], ['engine', 'schema'], ['engine', 'dag'],
  ['engine', 'runtime'], ['engine', 'events'], ['dag', 'context'],
  ['runtime', 'context'], ['cli', 'config'], ['schema', 'error'],
  ['error', 'engine'],
  // Verbs → engine
  ['exec', 'engine'], ['fetch', 'engine'], ['invoke', 'engine'],
  ['infer', 'engine'], ['agent', 'engine'],
  // Verbs lateral
  ['exec', 'config'], ['agent', 'exec'],
  // LLM cluster
  ['infer', 'llm'], ['llm', 'anthropic'], ['llm', 'openai'],
  ['llm', 'google'], ['llm', 'mistral'], ['llm', 'ollama'],
  ['runtime', 'llm'],
  // Tools cluster
  ['invoke', 'tools'], ['tools', 'builtin'], ['tools', 'shell'],
  ['tools', 'http'], ['tools', 'fs'], ['tools', 'git'],
  ['tools', 'catalog'],
  // Security cluster
  ['engine', 'security'], ['security', 'shield'], ['security', 'taint'],
  ['schema', 'security'],
  // UI
  ['cli', 'ui'], ['ui', 'registry'],
];

interface CrateConstellationProps {
  className?: string;
}

/**
 * CrateConstellation — SVG star map of Nika's 35-crate workspace.
 *
 * Three visual states:
 *   admitted → bright blue dot + glow (fully functional crate)
 *   growing  → pulsing green dot (crate in active development)
 *   planned  → dim outline circle (on the roadmap, not yet started)
 *
 * Hover highlights the crate + all its direct connections.
 * Pure SVG + SMIL for the pulse — no JS animation loop.
 */
export function CrateConstellation({ className = '' }: CrateConstellationProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const crateMap = new Map(CRATES.map(c => [c.id, c]));

  const isHighlighted = (id: string): boolean => {
    if (!hovered) return false;
    if (hovered === id) return true;
    return EDGES.some(
      ([a, b]) => (a === hovered && b === id) || (b === hovered && a === id)
    );
  };

  const counts = {
    admitted: CRATES.filter(c => c.status === 'admitted').length,
    growing:  CRATES.filter(c => c.status === 'growing').length,
    planned:  CRATES.filter(c => c.status === 'planned').length,
  };

  return (
    <div className={`constellation-wrap ${className}`}>
      <svg
        viewBox="0 0 720 400"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Nika crate constellation: ${counts.admitted} admitted, ${counts.growing} growing, ${counts.planned} planned`}
        role="img"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          {/* Admitted crate glow */}
          <filter id="cc-glow-blue" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Growing crate soft glow */}
          <filter id="cc-glow-green" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Highlight edge glow */}
          <filter id="cc-edge-glow" x="-20%" y="-400%" width="140%" height="900%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Constellation edges ─────────────────────────────────────── */}
        {EDGES.map(([fromId, toId]) => {
          const from = crateMap.get(fromId);
          const to   = crateMap.get(toId);
          if (!from || !to) return null;

          const active = hovered && (isHighlighted(fromId) || isHighlighted(toId));

          return (
            <line
              key={`${fromId}-${toId}`}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke={active ? 'oklch(0.62 0.195 258)' : 'oklch(0.27 0.020 258)'}
              strokeWidth={active ? 0.9 : 0.4}
              strokeOpacity={active ? 0.8 : 0.4}
              filter={active ? 'url(#cc-edge-glow)' : undefined}
              style={{ transition: 'stroke 0.18s, stroke-opacity 0.18s, stroke-width 0.18s' }}
            />
          );
        })}

        {/* ── Crate nodes ──────────────────────────────────────────────── */}
        {CRATES.map(crate => {
          const hi = isHighlighted(crate.id);
          const isHovered = hovered === crate.id;

          return (
            <g
              key={crate.id}
              onMouseEnter={() => setHovered(crate.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              {crate.status === 'admitted' && (
                <>
                  <circle
                    cx={crate.x} cy={crate.y} r={isHovered ? 7 : 5}
                    fill="oklch(0.62 0.195 258)"
                    filter="url(#cc-glow-blue)"
                    opacity={hi || !hovered ? 0.9 : 0.35}
                    style={{ transition: 'r 0.15s, opacity 0.15s' }}
                  />
                </>
              )}

              {crate.status === 'growing' && (
                <>
                  <circle
                    cx={crate.x} cy={crate.y} r={isHovered ? 6 : 4.5}
                    fill="oklch(0.69 0.150 160)"
                    filter="url(#cc-glow-green)"
                    opacity={hi || !hovered ? 0.85 : 0.3}
                    style={{ transition: 'r 0.15s, opacity 0.15s' }}
                  >
                    <animate
                      attributeName="r"
                      values={isHovered ? '5;7;5' : '3.5;5.5;3.5'}
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.85;0.45;0.85"
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}

              {crate.status === 'planned' && (
                <circle
                  cx={crate.x} cy={crate.y} r={isHovered ? 4.5 : 3}
                  fill="none"
                  stroke="oklch(0.33 0.024 258)"
                  strokeWidth={0.8}
                  opacity={hi ? 0.7 : !hovered ? 0.45 : 0.18}
                  style={{ transition: 'r 0.15s, opacity 0.15s' }}
                />
              )}

              {/* Label: always visible for admitted/growing, hover-only for planned */}
              <text
                x={crate.x}
                y={crate.y + (crate.status === 'planned' ? 13 : 16)}
                fill="oklch(0.55 0.012 258)"
                fontSize={crate.status === 'admitted' ? 8.5 : 7.5}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                letterSpacing="0.04em"
                opacity={
                  isHovered ? 0.95
                  : hi ? 0.75
                  : crate.status === 'planned' ? 0.2
                  : hovered ? 0.25
                  : 0.65
                }
                style={{ transition: 'opacity 0.15s' }}
              >
                {crate.label}
              </text>
            </g>
          );
        })}

        {/* ── Cluster region labels ────────────────────────────────────── */}
        {[
          { x:  88, y: 258, label: 'verbs' },
          { x: 640, y:  90, label: 'providers' },
          { x: 320, y: 382, label: 'tools' },
          { x: 245, y:  42, label: 'security' },
        ].map(({ x, y, label }) => (
          <text
            key={label}
            x={x} y={y}
            fill="oklch(0.38 0.012 258)"
            fontSize={8}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            letterSpacing="0.12em"
            opacity={hovered ? 0 : 0.55}
            style={{ transition: 'opacity 0.2s', textTransform: 'uppercase' }}
          >
            {label.toUpperCase()}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="constellation-legend">
        <span className="cc-legend-item cc-admitted">{counts.admitted} admitted</span>
        <span className="cc-sep">·</span>
        <span className="cc-legend-item cc-growing">{counts.growing} growing</span>
        <span className="cc-sep">·</span>
        <span className="cc-legend-item cc-planned">{counts.planned} planned</span>
      </div>
    </div>
  );
}

export default CrateConstellation;
