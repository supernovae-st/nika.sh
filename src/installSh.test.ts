import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/* ── install.sh · the public installer validates the RIGHT binary ────────────
   The curl|sh contract, proven offline:
   · `--help` must print usage when the script ARRIVES VIA STDIN (under
     `curl | sh`, $0 is `sh` — the old `sed "$0"` read nothing and the pipe
     masked the failure behind exit 0)
   · the post-install probe must target the binary WE wrote
     ($INSTALL_DIR/nika), never a PATH shadow (a stale Homebrew nika)
   · the receipt is blocking: `nika --version` of the installed target must
     equal the pinned version — a mismatch is a non-zero exit, and a PATH
     shadow earns an explicit warning
   Helpers are probed by sourcing with NIKA_INSTALL_LIB_ONLY=1 (main skipped). */

const SCRIPT = join(process.cwd(), 'public', 'install.sh')

const fakeNika = (dir: string, versionLine: string): string => {
  mkdirSync(dir, { recursive: true })
  const bin = join(dir, 'nika')
  writeFileSync(bin, `#!/bin/sh\necho '${versionLine}'\n`, { mode: 0o755 })
  return bin
}

/* Sources the script with main disabled, then runs one helper. */
const probe = (body: string, env: Record<string, string>) =>
  spawnSync('sh', ['-c', `. "$NIKA_INSTALL_SH"; ${body}`], {
    encoding: 'utf8',
    env: { ...process.env, NIKA_INSTALL_SH: SCRIPT, NIKA_INSTALL_LIB_ONLY: '1', ...env },
  })

const withFixture = (fn: (dirs: { shadow: string; install: string }) => void) => {
  const root = mkdtempSync(join(tmpdir(), 'nika-install-sh-'))
  try {
    fn({ shadow: join(root, 'shadow'), install: join(root, 'install') })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe('install.sh --help', () => {
  it('prints usage when the script arrives via stdin (the curl|sh shape)', () => {
    const r = spawnSync('sh', ['-s', '--', '--help'], {
      input: readFileSync(SCRIPT, 'utf8'),
      encoding: 'utf8',
    })
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('Usage:')
    expect(r.stdout).toContain('--version')
  })

  it('prints usage when invoked as a file', () => {
    const r = spawnSync('sh', [SCRIPT, '--help'], { encoding: 'utf8' })
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('Usage:')
  })
})

describe('install.sh probe target', () => {
  it('installed_nika_cmd prefers the binary we wrote over a PATH shadow', () => {
    withFixture(({ shadow, install }) => {
      fakeNika(shadow, 'nika 9.9.9')
      fakeNika(install, 'nika 1.2.3')
      const r = probe('installed_nika_cmd', {
        NIKA_INSTALL_DIR: install,
        PATH: `${shadow}:${process.env.PATH}`,
      })
      expect(r.status).toBe(0)
      expect(r.stdout.trim()).toBe(join(install, 'nika'))
    })
  })
})

describe('install.sh version receipt', () => {
  it('passes when the installed target reports the pinned version', () => {
    withFixture(({ install }) => {
      fakeNika(install, 'nika 1.2.3')
      const r = probe('verify_installed_version', { NIKA_INSTALL_DIR: install, VERSION_NUM: '1.2.3' })
      expect(r.status).toBe(0)
      expect(r.stdout).toContain('1.2.3')
    })
  })

  it('is BLOCKING on a version mismatch', () => {
    withFixture(({ install }) => {
      fakeNika(install, 'nika 0.0.1')
      const r = probe('verify_installed_version', { NIKA_INSTALL_DIR: install, VERSION_NUM: '1.2.3' })
      expect(r.status).not.toBe(0)
      expect(r.stderr).toMatch(/mismatch/)
      expect(r.stderr).toContain('0.0.1')
    })
  })

  it('is blocking when the target reports no version at all', () => {
    withFixture(({ install }) => {
      fakeNika(install, 'not a version banner')
      const r = probe('verify_installed_version', { NIKA_INSTALL_DIR: install, VERSION_NUM: '1.2.3' })
      expect(r.status).not.toBe(0)
    })
  })

  it('warns explicitly when PATH resolves nika to a shadow', () => {
    withFixture(({ shadow, install }) => {
      fakeNika(shadow, 'nika 9.9.9')
      fakeNika(install, 'nika 1.2.3')
      const r = probe('verify_installed_version', {
        NIKA_INSTALL_DIR: install,
        VERSION_NUM: '1.2.3',
        PATH: `${shadow}:${process.env.PATH}`,
      })
      expect(r.status).toBe(0)
      expect(r.stderr).toContain(join(shadow, 'nika'))
    })
  })
})
