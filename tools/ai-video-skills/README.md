# AI Video Skills Workspace

This repository vendors a project-local Codex skill set for video analysis, editing, motion graphics, template rendering, and Seedance 2.0 prompt production.

## Installed sources

- `heygen-com/hyperframes` — core HyperFrames router, animation, keyframe, creative, media, CLI, and registry skills.
- `browser-use/video-use` — talking-head and real-footage editing workflow with helper scripts.
- `remotion-dev/skills` — published Remotion creation, documentation, markup, and related skills.
- `bradautomates/claude-video` — `/watch` video analysis skill with frame extraction and transcript support.
- `dexhunter/seedance2-skill` — English and Chinese Seedance 2.0 prompt-writing skills.

The generated project-local skills live in `.codex/skills/`. Source commit hashes are recorded in `LOCK.json`.

## Skill routing

Use the tools by responsibility rather than asking every tool to do everything:

1. `watch` — inspect a reference video, extract visual evidence, transcript, timing, and scene changes.
2. `seedance-prompt-zh` — turn the approved breakdown into a Seedance 2.0 generation prompt.
3. `video-use` — cut existing live-action footage, remove dead space, create subtitles, and render a finished edit.
4. HyperFrames skills — create HTML/CSS motion graphics, product introductions, animated captions, overlays, and deterministic renders.
5. Remotion skills — create React-based templates, batch videos, data-driven videos, and repeatable rendering projects.
6. `video-director` — local production router that keeps product, character, dialogue, continuity, and delivery quality above visual showmanship.

## Updating the vendored skills

Run locally:

```bash
bash tools/ai-video-skills/vendor.sh
```

Or run the GitHub Actions workflow named **Vendor AI video skills**. The workflow refreshes `.codex/skills/` and updates `LOCK.json`.

## Runtime check

```bash
bash tools/ai-video-skills/install-runtime.sh
```

To create the local Python environment required by `video-use`:

```bash
bash tools/ai-video-skills/install-runtime.sh --setup-video-use
```

Main runtime requirements:

- Node.js 22 or newer for HyperFrames
- FFmpeg and FFprobe
- Python 3.11 or newer for video-use helpers
- `yt-dlp` for downloading supported online video sources

API keys are never committed. ElevenLabs, Groq, OpenAI, or other provider keys must remain in local environment files or secret stores.

## Updating safely

The vendor script only removes directories listed in `.codex/skills/.managed-skills.txt`. The locally maintained `video-director` skill is deliberately excluded, so upstream updates cannot overwrite the production rules.
