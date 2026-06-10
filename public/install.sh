#!/usr/bin/env bash
# shellcheck shell=bash
#
# Nika installer — https://nika.sh/install.sh
#
# Usage:
#   curl -LsSf https://nika.sh/install.sh | sh
#   curl -LsSf https://nika.sh/install.sh | sh -s -- --version 0.90.0
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

GITHUB_REPO="${NIKA_GITHUB_REPO:-SuperNovae-studio/nika}"
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
    Darwin) os="apple-darwin" ;;
    Linux)  os="unknown-linux-gnu" ;;
    *)      die "unsupported OS: $os (Nika supports macOS and Linux)" ;;
  esac

  case "$arch" in
    arm64|aarch64) arch="aarch64" ;;
    x86_64|amd64)  arch="x86_64" ;;
    *)             die "unsupported architecture: $arch" ;;
  esac

  printf '%s-%s' "$arch" "$os"
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
  # Normalize: "v0.90.0" ↔ "0.90.0"
  case "$VERSION" in
    v*) VERSION_TAG="$VERSION"; VERSION_NUM="${VERSION#v}" ;;
    *)  VERSION_TAG="v$VERSION"; VERSION_NUM="$VERSION" ;;
  esac
}

download_release() {
  local triple="$1"
  local tag="$VERSION_TAG"
  local asset="nika-${VERSION_NUM}-${triple}.tar.gz"
  local url="https://github.com/$GITHUB_REPO/releases/download/$tag/$asset"

  say "downloading $asset ($tag)"

  local tmp
  tmp=$(mktemp -d 2>/dev/null || mktemp -d -t nika)
  trap 'rm -rf "$tmp"' EXIT

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

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

need curl
need uname
need tar

TRIPLE=$(detect_platform)
say "platform: $TRIPLE"

# macOS: prefer brew unless user opted out or version was pinned
if [ "$USE_BREW" = '1' ] && [ "$VERSION" = "latest" ] \
   && [ "${TRIPLE#*apple-darwin}" != "$TRIPLE" ] \
   && have_brew; then
  if try_brew_install; then
    exit 0
  fi
fi

resolve_version
download_release "$TRIPLE"
print_path_hint

cat <<EOF

  ✓ Nika $VERSION_TAG installed
    run: nika --version
    docs: https://nika.sh
    source: https://github.com/$GITHUB_REPO
EOF
