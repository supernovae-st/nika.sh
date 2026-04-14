import { useEffect, useState } from 'react';

const CMDS = {
  mac:   'brew install supernovae-st/tap/nika',
  linux: 'curl -fsSL https://nika.sh/install | sh',
} as const;

type OS = keyof typeof CMDS;

/**
 * InstallSnippet — OS-detected install command with one-click copy.
 *
 * Detects macOS vs Linux via navigator.platform / navigator.userAgent.
 * Manual override tabs let the user switch.
 * Copy writes to navigator.clipboard and shows a ✓ for 2s.
 *
 * Zero dependencies beyond React. ~300 bytes brotli.
 */
export function InstallSnippet() {
  const [os, setOs] = useState<OS>('mac');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = (navigator.platform ?? navigator.userAgent).toLowerCase();
    if (/linux/.test(ua) && !/android/.test(ua)) setOs('linux');
  }, []);

  const cmd = CMDS[os];

  const copy = () => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="install-snippet">
      <div className="install-os-tabs" role="tablist" aria-label="OS">
        {(['mac', 'linux'] as OS[]).map(id => (
          <button
            key={id}
            role="tab"
            aria-selected={os === id}
            className={`install-os-tab${os === id ? ' is-active' : ''}`}
            onClick={() => { setOs(id); setCopied(false); }}
          >
            {id === 'mac' ? 'macOS' : 'Linux'}
          </button>
        ))}
      </div>
      <div className="install-cmd-row">
        <code className="install-cmd" aria-label="Install command">
          {cmd}
        </code>
        <button
          className={`install-copy${copied ? ' is-copied' : ''}`}
          onClick={copy}
          aria-label={copied ? 'Copied!' : 'Copy install command'}
          title={copied ? 'Copied!' : 'Copy'}
          data-cursor="copy"
        >
          {copied ? '✓' : '⎘'}
        </button>
      </div>
    </div>
  );
}

export default InstallSnippet;
