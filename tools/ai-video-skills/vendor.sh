#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEST_DIR="$ROOT_DIR/.codex/skills"
LOCK_FILE="$ROOT_DIR/tools/ai-video-skills/LOCK.json"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

mkdir -p "$DEST_DIR" "$DEST_DIR/_licenses"

# Remove only directories created by earlier runs of this script.
if [[ -f "$DEST_DIR/.managed-skills.txt" ]]; then
  while IFS= read -r skill_name; do
    [[ -z "$skill_name" ]] && continue
    rm -rf "$DEST_DIR/$skill_name"
  done < "$DEST_DIR/.managed-skills.txt"
fi
rm -rf "$DEST_DIR/_licenses"
mkdir -p "$DEST_DIR/_licenses"

managed=()

copy_skill_dir() {
  local source_dir="$1"
  local skill_name="$2"
  local target_dir="$DEST_DIR/$skill_name"

  if [[ ! -f "$source_dir/SKILL.md" ]]; then
    echo "Missing SKILL.md in $source_dir" >&2
    exit 1
  fi

  rm -rf "$target_dir"
  mkdir -p "$target_dir"
  cp -a "$source_dir/." "$target_dir/"
  rm -rf "$target_dir/.git" "$target_dir/.github"
  managed+=("$skill_name")
}

clone_repo() {
  local repo="$1"
  local target="$2"
  git clone --depth 1 "https://github.com/${repo}.git" "$target" >/dev/null
}

# 1) HyperFrames — recommended core set only, avoiding the very large full repository.
HF_DIR="$WORK_DIR/hyperframes"
git clone --depth 1 --filter=blob:none --sparse https://github.com/heygen-com/hyperframes.git "$HF_DIR" >/dev/null
git -C "$HF_DIR" sparse-checkout set \
  skills/hyperframes \
  skills/hyperframes-core \
  skills/hyperframes-animation \
  skills/hyperframes-keyframes \
  skills/hyperframes-creative \
  skills/media-use \
  skills/hyperframes-cli \
  skills/hyperframes-registry >/dev/null

for name in hyperframes hyperframes-core hyperframes-animation hyperframes-keyframes hyperframes-creative media-use hyperframes-cli hyperframes-registry; do
  copy_skill_dir "$HF_DIR/skills/$name" "$name"
done
cp "$HF_DIR/LICENSE" "$DEST_DIR/_licenses/heygen-com-hyperframes.LICENSE"
HF_SHA="$(git -C "$HF_DIR" rev-parse HEAD)"

# 2) video-use — include its helper scripts and Python package metadata.
VU_DIR="$WORK_DIR/video-use"
clone_repo browser-use/video-use "$VU_DIR"
copy_skill_dir "$VU_DIR" "video-use"
rm -f "$DEST_DIR/video-use/.env"
cp "$VU_DIR/LICENSE" "$DEST_DIR/_licenses/browser-use-video-use.LICENSE"
VU_SHA="$(git -C "$VU_DIR" rev-parse HEAD)"

# 3) Remotion skills — copy every top-level skill published by the repository.
RM_DIR="$WORK_DIR/remotion-skills"
clone_repo remotion-dev/skills "$RM_DIR"
while IFS= read -r skill_file; do
  skill_dir="$(dirname "$skill_file")"
  skill_name="$(basename "$skill_dir")"
  copy_skill_dir "$skill_dir" "$skill_name"
done < <(find "$RM_DIR/skills" -mindepth 2 -maxdepth 2 -type f -name SKILL.md | sort)
if [[ -f "$RM_DIR/LICENSE" ]]; then
  cp "$RM_DIR/LICENSE" "$DEST_DIR/_licenses/remotion-dev-skills.LICENSE"
fi
RM_SHA="$(git -C "$RM_DIR" rev-parse HEAD)"

# 4) Claude Video /watch skill — self-contained runtime folder.
CV_DIR="$WORK_DIR/claude-video"
clone_repo bradautomates/claude-video "$CV_DIR"
copy_skill_dir "$CV_DIR/skills/watch" "watch"
cp "$CV_DIR/LICENSE" "$DEST_DIR/_licenses/bradautomates-claude-video.LICENSE"
CV_SHA="$(git -C "$CV_DIR" rev-parse HEAD)"

# 5) Seedance 2.0 prompt skills — keep English and Chinese as separate skills.
SD_DIR="$WORK_DIR/seedance2-skill"
clone_repo dexhunter/seedance2-skill "$SD_DIR"
mkdir -p "$DEST_DIR/seedance-prompt-en" "$DEST_DIR/seedance-prompt-zh"
cp "$SD_DIR/SKILL.md" "$DEST_DIR/seedance-prompt-en/SKILL.md"
cp "$SD_DIR/README.md" "$DEST_DIR/seedance-prompt-en/UPSTREAM_README.md"
cp "$SD_DIR/zh/SKILL.md" "$DEST_DIR/seedance-prompt-zh/SKILL.md"
cp "$SD_DIR/README-zh.md" "$DEST_DIR/seedance-prompt-zh/UPSTREAM_README.md"
managed+=("seedance-prompt-en" "seedance-prompt-zh")
cp "$SD_DIR/LICENSE" "$DEST_DIR/_licenses/dexhunter-seedance2-skill.LICENSE"
SD_SHA="$(git -C "$SD_DIR" rev-parse HEAD)"

printf '%s\n' "${managed[@]}" | sort -u > "$DEST_DIR/.managed-skills.txt"

cat > "$LOCK_FILE" <<EOF
{
  "generated_at_utc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sources": {
    "heygen-com/hyperframes": "$HF_SHA",
    "browser-use/video-use": "$VU_SHA",
    "remotion-dev/skills": "$RM_SHA",
    "bradautomates/claude-video": "$CV_SHA",
    "dexhunter/seedance2-skill": "$SD_SHA"
  }
}
EOF

echo "Vendored ${#managed[@]} project-local Codex skills into $DEST_DIR"
