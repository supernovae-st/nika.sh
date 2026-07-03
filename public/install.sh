#!/usr/bin/env bash
# shellcheck shell=bash
#
# Nika installer — https://nika.sh/install.sh
#
# Usage:
#   curl -LsSf https://nika.sh/install.sh | sh
#   curl -LsSf https://nika.sh/install.sh | sh -s -- --version 1.0.0
#
# On macOS we try Homebrew first (supernovae-st/tap/nika), then fall back to
# downloading the release binary from GitHub. On Linux we always use the
# GitHub release asset path.
#
# Supports: macOS (arm64, x86_64), Linux (arm64, x86_64)
# License:  AGPL-3.0-or-later — © SuperNovae Studio

set -eu

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GITHUB_REPO="${NIKA_GITHUB_REPO:-supernovae-st/nika}"
INSTALL_DIR="${NIKA_INSTALL_DIR:-$HOME/.nika/bin}"
VERSION="${NIKA_VERSION:-latest}"
USE_BREW="${NIKA_USE_BREW:-1}"

# Parse flags (rudimentary, enough for `--version X` and `--no-brew`)
while [ $# -gt 0 ]; do
  case "$1" in
    --version)
      VERSION="${2:-latest}"
      shift 2
      ;;
    --version=*)
      VERSION="${1#--version=}"
      shift
      ;;
    --install-dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    --no-brew)
      USE_BREW=0
      shift
      ;;
    -h|--help)
      sed -n '3,14p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "nika-install: unknown flag '$1'" >&2
      exit 2
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

say()  { printf 'nika-install: %s\n' "$*"; }
warn() { printf 'nika-install: warning: %s\n' "$*" >&2; }
die()  { printf 'nika-install: error: %s\n' "$*" >&2; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || die "missing required tool: $1"
}

detect_platform() {
  local os arch
  os=$(uname -s)
  arch=$(uname -m)

  case "$os" in
    Darwin) os="macos" ;;
    Linux)  os="linux" ;;
    *)      die "unsupported OS: $os (Nika supports macOS and Linux)" ;;
  esac

  case "$arch" in
    arm64|aarch64) arch="arm64" ;;
    x86_64|amd64)  arch="x64" ;;
    *)             die "unsupported architecture: $arch" ;;
  esac

  printf '%s-%s' "$os" "$arch"
}

have_brew() {
  command -v brew >/dev/null 2>&1
}

try_brew_install() {
  say 'Homebrew detected — attempting brew install supernovae-st/tap/nika'
  if brew tap supernovae-st/tap 2>/dev/null && brew install supernovae-st/tap/nika; then
    say 'installed via Homebrew'
    return 0
  fi
  warn 'brew install failed — falling back to GitHub release asset'
  return 1
}

resolve_version() {
  # Resolve `latest` → concrete tag via GitHub redirect. No jq required.
  if [ "$VERSION" = "latest" ]; then
    local url
    url=$(curl -fsSLI -o /dev/null -w '%{url_effective}' \
      "https://github.com/$GITHUB_REPO/releases/latest" 2>/dev/null) \
      || die 'could not reach GitHub to resolve latest version'
    VERSION="${url##*/}"
    [ -n "$VERSION" ] && [ "$VERSION" != "latest" ] \
      || die 'failed to resolve latest release tag'
  fi
  # Pre-release coherence · anything below 1.0 is a pre-release of the
  # Diamond rewrite — the first public release is v1.0.0 (language v1 +
  # vertical slice · 1 Aug 2026). Same caveat as the Homebrew formula ·
  # this covers the GitHub-asset path.
  case "$VERSION" in
    v0.* | 0.*)
      warn 'this version is a pre-1.0 engine release candidate'
      warn 'the language envelope remains nika: v1; engine polish continues toward 1.0'
      ;;
  esac
  # Normalize: "v1.0.0" ↔ "1.0.0"
  case "$VERSION" in
    v*) VERSION_TAG="$VERSION"; VERSION_NUM="${VERSION#v}" ;;
    *)  VERSION_TAG="v$VERSION"; VERSION_NUM="$VERSION" ;;
  esac
}

download_release() {
  local platform="$1"
  local tag="$VERSION_TAG"
  local asset="nika-${platform}-${VERSION_NUM}.tar.gz"
  local url="https://github.com/$GITHUB_REPO/releases/download/$tag/$asset"

  say "downloading $asset ($tag)"

  # NOT `local`: the EXIT trap fires after this function returns, and under
  # `sh` (dash) a local is gone by then — with `set -u` the trap itself dies
  # with "tmp: parameter not set" AFTER a successful install, turning the
  # happy path into a non-zero exit (caught by the cold-VM e2e).
  tmp=$(mktemp -d 2>/dev/null || mktemp -d -t nika)
  trap 'rm -rf "${tmp:-}"' EXIT

  if ! curl -fsSL "$url" -o "$tmp/$asset"; then
    die "download failed: $url
      (check that release $tag exists on https://github.com/$GITHUB_REPO/releases)"
  fi

  tar -xzf "$tmp/$asset" -C "$tmp" \
    || die "failed to extract $asset"

  mkdir -p "$INSTALL_DIR" \
    || die "cannot create install dir: $INSTALL_DIR"

  # Expect a `nika` binary inside the tarball (possibly nested one level).
  local bin
  bin=$(find "$tmp" -maxdepth 3 -type f -name nika -perm -u+x 2>/dev/null | head -n 1)
  [ -n "${bin:-}" ] || die 'binary "nika" not found in release tarball'

  install -m 0755 "$bin" "$INSTALL_DIR/nika" \
    || die "could not install to $INSTALL_DIR/nika"

  say "installed: $INSTALL_DIR/nika"
}

print_path_hint() {
  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *)
      cat <<EOF

nika-install: add this to your shell profile (~/.zshrc, ~/.bashrc, etc.):

    export PATH="$INSTALL_DIR:\$PATH"

Then reopen your terminal or run: source ~/.zshrc
EOF
      ;;
  esac
}

installed_nika_cmd() {
  if command -v nika >/dev/null 2>&1; then
    command -v nika
    return 0
  fi
  if [ -x "$INSTALL_DIR/nika" ]; then
    printf '%s/nika\n' "$INSTALL_DIR"
    return 0
  fi
  return 1
}

has_wire_command() {
  local cmd
  cmd=$(installed_nika_cmd) || return 1
  "$cmd" --help 2>/dev/null | grep -Eq '^[[:space:]]+wire([[:space:]]|$)'
}

print_next_steps() {
  local wire_line
  if has_wire_command; then
    wire_line='    wire agents/editors: nika wire cursor   # or: nika wire all'
  else
    wire_line='    agent/editor MCP: use the extension setup, or upgrade when `nika wire` appears in `nika --help`'
  fi
  cat <<EOF

  ✓ Nika installed
    verify: nika --version
    diagnose: nika doctor
    scaffold this repo: nika init
$wire_line
    docs: https://nika.sh
    source: https://github.com/$GITHUB_REPO
EOF
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

need curl
need uname
need tar

PLATFORM=$(detect_platform)
say "platform: $PLATFORM"

# macOS: prefer brew unless user opted out or version was pinned
if [ "$USE_BREW" = '1' ] && [ "$VERSION" = "latest" ] \
   && [ "${PLATFORM#macos-}" != "$PLATFORM" ] \
   && have_brew; then
  if try_brew_install; then
    print_next_steps
    exit 0
  fi
fi

resolve_version
download_release "$PLATFORM"
print_path_hint
print_next_steps
