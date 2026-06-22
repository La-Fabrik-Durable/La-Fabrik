# Intro & Tutorial System

This document covers the intro sequence and the two onboarding tutorials. For the broader mission state machine see `docs/technical/mission-flow.md`.

---

## Role in the Global Flow

The intro sequence runs once per visit, after the `/site` onboarding page has written its cookie. It gates entry into the main gameplay (`mainState === "intro"` until `completeIntro()` is called, at which point the store moves to `mainState === "ebike"`).

All intro state lives in `useGameStore` under `state.intro.currentStep` (type `GameStep`). Transitions are driven by components that call `setIntroStep(nextStep)` directly; there is no dedicated manager.

---

## Step Sequence

```
loading-map
    │  scene ready + music stop
    ▼
fade-to-video          (500 ms black overlay, zIndex 29)
    │  timeout
    ▼
video                  (IntroVideoPlayer, zIndex 1000)
    │  video ended or user skip
    ▼
dialogue-intro         (IntroDialogueOverlay, zIndex 999)
    │  audio ended or 12 s fallback
    ▼
reveal                 (IntroRevealOverlay, zIndex 998, 2 s fade)
    │  fade complete → canMove = true
    ▼
await-ebike-mount      (player can walk freely)
    │  movementMode === "ebike"
    ▼
ebike-intro-ride       (distance tracking via rAF)
    │  EBIKE_INTRO_BREAKDOWN_DISTANCE reached
    ▼
ebike-breakdown        (breakdown SFX + dialogue)
    │  dialogue done + movementMode === "walk"
    ▼
completed              → completeIntro() → mainState = "ebike"
```

---

## Components

### `IntroVideoPlayer`

**File:** `src/components/ui/intro/IntroVideoPlayer.tsx`

Renders a full-screen `<video>` playing `/cinematics/intro.mp4` (served from R2 via `assetUrl()`). Advances to `dialogue-intro` on video end. Skip is available via click, mouse move (shows hint), or `Enter`/`Space`.

### `IntroDialogueOverlay`

**File:** `src/components/ui/intro/IntroDialogueOverlay.tsx`

Black screen overlay that plays `SITE_DIALOGUE_IDS.introOrder` from the dialogue manifest and renders synced subtitles via `<Subtitles />`. Advances to `reveal` when audio ends. Safety fallback: if loading or playback fails, advances after 12 000 ms (`DIALOGUE_FALLBACK_TIMEOUT_MS`).

### `IntroRevealOverlay`

**File:** `src/components/ui/intro/IntroRevealOverlay.tsx`

Fades the black screen out over 2 000 ms (`REVEAL_DURATION_MS`). On completion it calls `setCanMove(true)` and moves to `await-ebike-mount`. Respects `prefers-reduced-motion` (transition set to `none`).

### `FadeToVideoOverlay`

**File:** `src/components/ui/intro/FadeToVideoOverlay.tsx`

Static black `position:fixed` div (zIndex 29). Shown while the scene finishes loading and during the 500 ms `fade-to-video` window. No logic of its own; mounted and unmounted by `page.tsx`.

### Overlay rendering in `page.tsx`

`src/pages/page.tsx` owns the switch that decides which overlay to render:

```ts
if (showFadeToVideoOverlay) return <FadeToVideoOverlay />;

switch (introStep) {
  case "video":          return <IntroVideoPlayer />;
  case "dialogue-intro": return <IntroDialogueOverlay />;
  case "reveal":         return <IntroRevealOverlay />;
  default:               return null;
}
```

`showFadeToVideoOverlay` is true during `loading-map` (once scene is ready) and `fade-to-video`.

### `EbikeIntroSequence`

**File:** `src/components/game/EbikeIntroSequence.tsx`

Handles everything after `reveal`:

| Step | What the component does |
|---|---|
| `await-ebike-mount` | Watches `movementMode`; when it becomes `"ebike"` advances to `ebike-intro-ride` |
| `ebike-intro-ride` | Polls `window.ebikeParkedPosition` each animation frame and accumulates travel distance |
| `ebike-breakdown` | Sets `window.ebikeBreakdownActive = true`, plays breakdown SFX, then schedules the breakdown dialogue after `EBIKE_BREAKDOWN_DIALOGUE_DELAY_MS` |
| After dialogue + dismount | Calls `completeIntro()` which transitions `mainState` to `"ebike"` |

Also renders `<MissionNotification>` during reveal/ride/breakdown, and during pylon mission transitions (`approaching`, `narrator-outro`).

---

## Tutorials

Both tutorials are session-scoped: once dismissed they do not reappear until the page is reloaded.

### `MovementTutorial`

**File:** `src/components/ui/tutorial/MovementTutorial.tsx`

Shows a ZQSD keycap grid. Visible during `reveal` and `await-ebike-mount` intro steps. Dismissed the first time the player presses any of Z, Q, S, D. No timeout fallback (the movement keys are required to progress anyway).

Trigger window (`MOVEMENT_TUTORIAL_STEPS`):

```ts
new Set(["reveal", "await-ebike-mount"])
```

### `HandTrackingTutorial`

**File:** `src/components/ui/tutorial/HandTrackingTutorial.tsx`

Shows a pair of hand icons. Visible during early ebike repair steps until MediaPipe detects at least one hand. Dismissed on first detection. Safety fallback: auto-dismisses after 5 000 ms (`HAND_TUTORIAL_FALLBACK_TIMEOUT_MS`) to avoid blocking the screen if the camera is unavailable.

Trigger window (`HAND_TUTORIAL_STEPS`):

```ts
new Set(["fragmented", "scanning", "inspected"])
```

Requires `mainState === "ebike"` and the ebike step to be in the set above.

### `TutorialOverlay`

**File:** `src/components/ui/tutorial/TutorialOverlay.tsx`

Shared presentational component. Accepts `icon: ReactNode` and `text: string`. Adds `aria-live="polite"` so screen readers announce the instruction. No internal state; mounting/unmounting is the parent's responsibility.

---

## Modifying the Intro Sequence

### Adding a new step

1. Add the new value to `GameStep` in `src/types/game.ts`.
2. Decide where it fits in the sequence and update the preceding step's "advance" logic to set your new step.
3. Create the overlay component (or reuse `TutorialOverlay`) and mount it in the `renderIntroOverlay` switch in `src/pages/page.tsx`.
4. The new step must either self-advance (via `setIntroStep`) or be advanced by an external signal.

### Adjusting timings

Constants are co-located in each component file:

| Constant | File | Default |
|---|---|---|
| `REVEAL_DURATION_MS` | `IntroRevealOverlay.tsx` | 2 000 ms |
| `DIALOGUE_FALLBACK_TIMEOUT_MS` | `IntroDialogueOverlay.tsx` | 12 000 ms |
| `LOADING_TO_VIDEO_FADE_MS` | `page.tsx` | 500 ms |
| `HAND_TUTORIAL_FALLBACK_TIMEOUT_MS` | `HandTrackingTutorial.tsx` | 5 000 ms |
| `EBIKE_INTRO_BREAKDOWN_DISTANCE` | `src/data/ebike/ebikeConfig.ts` | — |
| `EBIKE_BREAKDOWN_DIALOGUE_DELAY_MS` | `src/data/ebike/ebikeConfig.ts` | — |

### Changing the intro dialogue

The dialogue ID is `SITE_DIALOGUE_IDS.introOrder` (defined in `src/data/site/dialogueIds.ts`). The audio file and subtitle cue list live in the dialogue manifest loaded by `loadDialogueManifest()`.

### Skipping the intro (dev)

Open the debug panel (`?debug`) and set `introStep` directly in the GameStateDebugPanel, or call `useGameStore.getState().setIntroStep("completed")` from the browser console.
