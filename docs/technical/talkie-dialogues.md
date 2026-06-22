# Talkie Dialogues

This document describes the Talkie system: the 3D walkie-talkie widget that appears when the Narrateur speaks.

## Overview

The Talkie is a decorative overlay rendered in the bottom-left corner of the screen. It consists of a 3D walkie-talkie model that slides up when the Narrateur is speaking and retracts when silent. Animated signal-line arcs appear on each side of the model during active dialogue.

The Talkie is not a dialogue engine. It is purely a visual indicator tied to the subtitle runtime. Dialogue playback, audio, and subtitles are managed separately — see [audio.md](./audio.md).

## Visibility Rules

The overlay is controlled by `useTalkieDialogueOverlayState` (`src/hooks/ui/useTalkieDialogueOverlayState.ts`).

Two conditions govern rendering:

| Condition | Value | Effect |
|---|---|---|
| `isVisible` | `true` when `mainState !== "intro"` OR when the intro has reached the `"reveal"` step | The `<aside>` element is mounted |
| `isNarratorDialogue` | `true` when `activeSubtitle.speaker === "Narrateur"` | Model slides up, signal lines appear, shake animation plays |

Before the `"reveal"` intro step, the overlay is hidden entirely so it does not interfere with the loading screen or video sequence.

## Components

### TalkieDialogueOverlay

**Path:** `src/components/ui/TalkieDialogueOverlay.tsx`

The root component. Mounted unconditionally inside `GameUI` (`src/components/ui/GameUI.tsx`) for the lifetime of the game scene.

Responsibilities:
- Reads `isVisible` and `isNarratorDialogue` from `useTalkieDialogueOverlayState`.
- Returns `null` when `isVisible` is false.
- Renders an isolated `<Canvas>` (R3F, orthographic, alpha) sized by CSS to `clamp(190px, 18vw, 300px)` square.
- Passes `active={isNarratorDialogue}` to `TalkieModel`.
- Renders two `TalkieSignalLines` (left and right) only while `isNarratorDialogue` is true.

The Canvas uses its own WebGL context, separate from the main 3D scene. Camera is orthographic at `zoom: 56`, positioned at `[0, 0, 4.2]`.

### TalkieModel

**Path:** `src/components/ui/talkie/TalkieModel.tsx`

Loads and renders the walkie-talkie GLB model. Driven by a single `active: boolean` prop.

Key behaviors:

- **Entry/exit animation**: GSAP tweens the outer group's `position.y` between `TALKIE_REST_Y` (`-1.55`, off-screen below) and `TALKIE_ACTIVE_Y` (`-0.38`). Rise uses `power3.out` over 720 ms; retraction uses `power2.out` over 500 ms.
- **Idle float**: `useFrame` drives a secondary inner group with sine-wave oscillations on `y` (amplitude ±0.055 units, period ~5.2 s) and on all three rotation axes (amplitude ±2.2°, independent periods). This runs continuously regardless of `active`.
- The GLB is preloaded via `useGLTF.preload` at module load time.
- The scene is cloned with `scene.clone(true)` so multiple instances would not share geometry state (currently only one instance exists).
- All meshes have `castShadow` and `receiveShadow` set to `false`, and `frustumCulled` set to `false`.

**Model asset:** `/models/talkie/model.glb` (served from R2 via `assetUrl()`).

### TalkieSignalLines

**Path:** `src/components/ui/talkie/TalkieSignalLines.tsx`

An `aria-hidden` SVG with three concentric arc paths, representing radio signal waves. Accepts a `side: "left" | "right"` prop. The CSS class `--left` mirrors the SVG horizontally so both sides use the same path data.

Animated by `talkie-signal-pulse` (CSS keyframe, 1 s infinite) defined in `src/index.css`. The animation runs only while the component is mounted, which is gated on `isNarratorDialogue`.

## Orchestration

No custom event bus or game action triggers the Talkie directly. The flow is:

```
playDialogueById()
  → AudioManager.playSound() (category: "dialogue")
  → timeupdate listener writes { speaker, text } to useSubtitleStore
      → useTalkieDialogueOverlayState reads activeSubtitle.speaker
          → isNarratorDialogue = (speaker === "Narrateur")
              → TalkieModel receives active={true}
              → TalkieSignalLines are mounted
```

When audio ends or is paused, `clearActiveSubtitle()` is called on the store, `isNarratorDialogue` drops to `false`, and the model retracts.

The Talkie reacts only to the `"Narrateur"` speaker. Dialogues from `"Fermier"` or `"Electricienne"` leave the model in its resting (off-screen) position.

## Data Dependencies

The Talkie has no own data format. It depends entirely on:

- `useSubtitleStore` — the `activeSubtitle` field written by `playDialogueById()`.
- `useGameStore` — `mainState` and `intro.currentStep` for the visibility gate.
- `DialogueSpeaker` type (`src/types/dialogues/dialogues.ts`): `"Narrateur" | "Fermier" | "Electricienne"`.

For the dialogue data format (manifest, SRT, cue indexes), see [audio.md](./audio.md#dialogues).

## Adding a New Talkie-Enabled Speaker

The Talkie is currently hardcoded to activate for `"Narrateur"` only. To make it react to another speaker:

1. Add the new speaker value to `DialogueSpeaker` in `src/types/dialogues/dialogues.ts`.
2. In `useTalkieDialogueOverlayState.ts`, update the `isNarratorDialogue` condition (rename the field if the semantics change):

   ```ts
   isNarratorDialogue: activeSubtitle?.speaker === "Narrateur"
     || activeSubtitle?.speaker === "NewSpeaker",
   ```

3. Add corresponding dialogue entries to `dialogues.json` and SRT cues to the appropriate voice file under `public/sounds/dialogue/subtitles/`.

To add a second independent Talkie widget for a different speaker with different visuals, mount a second `TalkieDialogueOverlay` variant in `GameUI` and pass the relevant speaker filter down through a new hook.

## Known Limitations

- The `active` state transitions are not interrupted gracefully if `active` flips while a GSAP tween is in progress. `gsap.killTweensOf()` is called first, so the previous tween stops at its current value before the new one starts; this can cause a brief positional jump on rapid speaker changes.
- The Talkie has no accessibility role or label. It is marked `aria-hidden="true"` throughout.
- Only one model asset path is supported. Swapping the model per speaker would require refactoring `TalkieModel` to accept a path prop.
