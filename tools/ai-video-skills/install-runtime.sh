#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILLS_DIR="$ROOT_DIR/.codex/skills"
VENV_DIR="$ROOT_DIR/.video-tools-venv"

failures=0

check_cmd() {
  local command_name="$1"
  local help_text="$2"
  if command -v "$command_name" >/dev/null 2>&1; then
    printf 'OK   %-12s %s\n' "$command_name" "$(command -v "$command_name")"
  else
    printf 'MISS %-12s %s\n' "$command_name" "$help_text"
    failures=$((failures + 1))
  fi
}

echo "== AI video runtime preflight =="
check_cmd git "Install Git."
check_cmd ffmpeg "Install FFmpeg with your operating system package manager."
check_cmd ffprobe "Usually included with FFmpeg."
check_cmd python3 "Install Python 3.11 or newer."
check_cmd node "Install Node.js 22 or newer for HyperFrames and Remotion."
check_cmd npm "Usually included with Node.js."
check_cmd yt-dlp "Optional but recommended for online video sources."

if command -v node >/dev/null 2>&1; then
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if (( node_major < 22 )); then
    echo "MISS Node.js 22+ is required by HyperFrames; current: $(node --version)"
    failures=$((failures + 1))
  else
    echo "OK   Node.js version $(node --version)"
  fi
fi

if [[ ! -f "$SKILLS_DIR/video-use/pyproject.toml" ]]; then
  echo "MISS video-use is not vendored. Run: bash tools/ai-video-skills/vendor.sh"
  failures=$((failures + 1))
fi

if [[ "${1:-}" == "--setup-video-use" ]]; then
  if ! command -v python3 >/dev/null 2>&1; then
    echo "Python is required before video-use can be installed." >&2
    exit 1
  fi
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/python" -m pip install --upgrade pip
  "$VENV_DIR/bin/python" -m pip install -e "$SKILLS_DIR/video-use"
  echo "video-use Python environment installed at $VENV_DIR"
  echo "Activate it with: source .video-tools-venv/bin/activate"
fi

echo
if (( failures > 0 )); then
  echo "$failures runtime prerequisite(s) still need attention. The skill files themselves are installed."
  exit 2
fi

echo "All required runtime checks passed."
echo "API keys are intentionally not stored in GitHub. Add them only in your local environment when a skill requests one."
