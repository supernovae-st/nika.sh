import { useEffect, useMemo, useRef, useState } from 'react';

interface Cmd {
  id: string;
  label: string;
  group: 'navigate' | 'install' | 'links';
  hint?: string;
  action: () => void;
}

function makeCmds(): Cmd[] {
  const go  = (href: string) => () => { window.location.href = href; };
  const ext = (url: string)  => () => { window.open(url, '_blank', 'noopener'); };
  const cp  = (text: string) => () => { navigator.clipboard?.writeText(text); };

  return [
    { id: 'nav-01', group: 'navigate', label: '§ 01 · Vital Signs',    action: go('/#vital-signs') },
    { id: 'nav-03', group: 'navigate', label: '§ 03 · Five Verbs',     action: go('/#five-verbs') },
    { id: 'nav-05', group: 'navigate', label: '§ 05 · The Workspace',  action: go('/#workspace') },
    { id: 'nav-06', group: 'navigate', label: '§ 06 · Providers',      action: go('/#providers') },
    { id: 'nav-07', group: 'navigate', label: '§ 07 · Chrysalis',      action: go('/#chrysalis') },
    { id: 'nav-cl', group: 'navigate', label: '§ 08 · Dev Logs',       action: go('/changelog/') },
    { id: 'cp-brew', group: 'install', label: 'Copy · brew install (macOS)',   hint: 'brew install…', action: cp('brew install supernovae-st/tap/nika') },
    { id: 'cp-curl', group: 'install', label: 'Copy · curl install (Linux)',   hint: 'curl -fsSL…',   action: cp('curl -fsSL https://nika.sh/install | sh') },
    { id: 'lk-gh',     group: 'links', label: 'GitHub → supernovae-st/nika ↗', action: ext('https://github.com/supernovae-st/nika') },
    { id: 'lk-method', group: 'links', label: 'Read the Method →',             action: go('/method/') },
    { id: 'lk-cl',     group: 'links', label: 'View Changelog →',              action: go('/changelog/') },
  ];
}

// Module-level constant — no re-allocation per render
const CMDS = makeCmds();

const GROUP_ORDER = ['navigate', 'install', 'links'] as const;
const GROUP_LABELS: Record<string, string> = {
  navigate: 'Navigate',
  install:  'Install',
  links:    'Links',
};

/**
 * CommandPalette — lightweight ⌘K / Ctrl+K command palette.
 *
 * Custom implementation (no cmdk) to avoid bundling @radix-ui/react-dialog.
 * Full keyboard nav: ↑↓ move, ↵ select, ESC close.
 * Body scroll-locked while open.
 *
 * ~900 bytes brotli (versus ~15KB for cmdk + Radix Dialog).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── open / close on ⌘K or Ctrl+K ──────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── body scroll lock + reset on open ──────────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setQuery('');
      setSel(0);
      // rAF ensures DOM has rendered before focusing
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // ── filter + group ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? CMDS.filter(c => c.label.toLowerCase().includes(q)) : CMDS;
  }, [query]);

  const groups = useMemo(() =>
    GROUP_ORDER
      .map(id => ({ id, label: GROUP_LABELS[id], items: filtered.filter(c => c.group === id) }))
      .filter(g => g.items.length > 0),
  [filtered]);

  // ── clamp selection when query changes ────────────────────────────────
  useEffect(() => setSel(0), [query]);

  const run = (cmd: Cmd) => {
    setOpen(false);
    cmd.action();
  };

  // ── keyboard nav inside the panel ─────────────────────────────────────
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setSel(s => Math.max(s - 1, 0)); break;
      case 'Enter':     e.preventDefault(); if (filtered[sel]) run(filtered[sel]); break;
      case 'Escape':    e.preventDefault(); setOpen(false); break;
    }
  };

  if (!open) return null;

  return (
    <div
      className="cmdk-backdrop"
      onClick={() => setOpen(false)}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="cmdk-panel"
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* ── Search input ────────────────────────────────────────── */}
        <div className="cmdk-search-row">
          <input
            ref={inputRef}
            type="text"
            className="cmdk-input"
            placeholder="Search commands…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmdk-esc-badge" onClick={() => setOpen(false)}>ESC</kbd>
        </div>

        {/* ── Results ─────────────────────────────────────────────── */}
        <div className="cmdk-list" role="listbox" aria-label="Commands">
          {groups.length === 0 && (
            <div className="cmdk-empty">No results.</div>
          )}
          {groups.map(group => {
            // start index of this group in the flat filtered array
            const gStart = filtered.findIndex(c => c.group === group.id);
            return (
              <div key={group.id} className="cmdk-group" role="presentation">
                <div className="cmdk-group-heading" aria-hidden="true">
                  {group.label}
                </div>
                {group.items.map((item, j) => {
                  const idx = gStart + j;
                  return (
                    <button
                      key={item.id}
                      className={`cmdk-item${idx === sel ? ' is-sel' : ''}`}
                      role="option"
                      aria-selected={idx === sel}
                      onClick={() => run(item)}
                      onMouseMove={() => setSel(idx)}
                      tabIndex={-1}
                    >
                      <span className="cmdk-item-label">{item.label}</span>
                      {item.hint && <code className="cmdk-item-hint">{item.hint}</code>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Footer hints ────────────────────────────────────────── */}
        <div className="cmdk-footer">
          <span className="cmdk-fhint"><kbd>↑↓</kbd> navigate</span>
          <span className="cmdk-fhint"><kbd>↵</kbd> select</span>
          <span className="cmdk-fhint"><kbd>⌘K</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
