---
name: video-director
description: Route video work across analysis, Seedance generation, editing, HyperFrames motion graphics, and Remotion templates while enforcing commercial delivery quality.
---

# Video Director Router

Use this skill first for video production tasks in this repository.

## Routing

- Reference-video analysis, scene timing, frame evidence, and transcript: use `watch`.
- Seedance 2.0 storyboard and generation prompts: use `seedance-prompt-zh` by default; consult `seedance-prompt-en` only when English output is required.
- Existing real-footage editing, filler removal, subtitles, pacing, and final MP4: use `video-use`.
- HTML/CSS/GSAP motion graphics, product intros, animated overlays, captions, and deterministic rendering: use `hyperframes` and its domain skills.
- React templates, repeatable batch production, data-driven video, and programmatic rendering: use the relevant `remotion-*` skill.

Do not use a more complex stack when a simpler one can produce a stable deliverable.

## Commercial priority

Always protect these in order:

1. Correct person, product, clothing, and main subject.
2. Correct color, structure, packaging, logo count, and logo position.
3. Complete dialogue, natural lip sync, and correct brand pronunciation.
4. Character and voice consistency.
5. Physically plausible actions without extra limbs, penetration, or object deformation.
6. Correct duration, shot logic, and continuity.
7. Camera movement, lighting, atmosphere, and visual polish.

Visual spectacle never overrides subject accuracy.

## Reference separation

Assign every reference one job:

- Video reference: camera movement, action rhythm, performance, edit rhythm, or transition only.
- Product image: color, shape, material, packaging, logo, and structural details.
- Character image: face, hair, age, body type, clothing, and temperament.
- Scene image: space, furnishing, composition, and lighting only.
- Audio reference: voice, pace, emotion, music, ambience, or sound effects only.

When references conflict, product images beat atmosphere images; specified character images beat strangers in reference footage; explicit user requirements beat free invention.

## Shot design

- One core job per shot.
- Prefer one main action plus one minor supporting action.
- A 15-second generation normally uses 3 to 5 shots.
- Split complex actions into ordered steps with explicit pauses and cut points.
- Avoid simultaneous speaking, running, object handling, wardrobe changes, and complicated hand work.

Stable actions include standing dialogue, slow walking, adjusting a cuff, slight turning, lifting a product, handing over a product, opening a door, sitting, looking at a phone, and slow camera push-ins or tracking.

## Multi-part continuity

Every independently generated segment must repeat the full locked description of the person, product, clothing, voice, scene, light direction, and logo details. Never rely only on phrases such as “same as before” or “continue the previous segment.”

End each segment on a clear connectable pose, camera position, light state, and audio state. Begin the next segment with the exact continuation action.

## Dialogue and text

Validate that spoken Chinese fits the duration with natural pauses. Mark brand names, numbers, dialect, and uncommon words as pronunciation risks.

Unless the user explicitly requests on-screen text:

- Do not generate subtitles.
- Do not generate Chinese text cards.
- Do not generate logo animation, watermarks, or decorative words.
- Treat dialogue as spoken audio or voice-over only.

Add subtitles in post-production when needed.

## Seedance prompt structure

A final prompt should contain only executable content under these sections:

1. Generation specification
2. Reference-material responsibilities
3. Locked subject details
4. Overall style
5. Timeline storyboard
6. Key controls
7. Project-specific failure avoidance

Before delivery, check duration, dialogue fit, action count, reference conflicts, product details, logo rules, continuity, and contradictory instructions.

## Quality decision

After reviewing a generated result, choose exactly one verdict:

- Ready to use
- Usable after simple editing
- Specific shots must be regenerated
- Entire video must be regenerated

Check product and logo first, then character, clothing, voice, lip sync, hands, physical logic, camera continuity, unwanted text, and whether the selling point is actually visible.

## Retry policy

Do not rewrite everything after one failure. Classify the failure as product, character, voice, text, action, camera, pacing, reference, or continuity. Change one primary variable, preserve successful parts, and explain what the revision is intended to fix.

After two repeated failures, simplify the action or reduce shots. After three, change the implementation method: product-only shot, fixed-camera dialogue, side/back view, post voice-over, post subtitles, or isolated shot replacement.
