# Mission Flow

This document describes the game intro flow and its current architecture.

## Source Of Truth

Mission flow state lives in the global game store:

```txt
src/managers/stores/useGameStore.ts
```

The store owns the `missionFlow` slice:

```ts
missionFlow: {
  activityCity: boolean;
  playerName: string;
  canMove: boolean;
  dialogMessage: string | null;
}
```

The active intro step is tracked separately as `introStep: GameStep` in the store root (not inside `missionFlow`). Components transition it via `setIntroStep`.

This keeps global gameplay state in Zustand instead of splitting it across a separate mission store or a gameplay manager.

## Managers Boundary

Managers stay responsible for local runtime services:

- `AudioManager` owns audio elements, audio pools, music playback, category volume, and stereo pan.
- `InteractionManager` owns transient focused/nearby/held interaction handles.

Mission progression is not owned by a manager. Components update the store through explicit actions such as `setIntroStep`, `setCanMove`, `showDialog`, and `hideDialog`.

## Runtime Components

- `src/components/game/EbikeIntroSequence.tsx` drives the intro sequence: reacts to `introStep` and triggers one-off side effects (audio, movement unlocks, step transitions).
- `src/components/zone/ZoneDetection.tsx` reads the camera position each frame and calls an `onEnter` callback when the player enters a configured zone. Zones are one-shot by default (re-entry ignored after the first trigger).
- `src/world/GameStageContent.tsx` mounts repair games and their mission-start triggers.
- `src/pages/page.tsx` mounts mission HTML overlays: `EbikeIntroSequence` and `DialogMessage`.
- `src/world/player/PlayerController.tsx` reads `missionFlow.canMove` as an additional movement lock.

## Step Sequence

`GameStep` is defined in `src/types/game.ts` and covers the full intro sequence:

```ts
type GameStep =
  | "loading-map"       // Asset loading
  | "fade-to-video"     // Black fade between loading and video
  | "video"             // intro.mp4 playback
  | "dialogue-intro"    // Post-video dialogues (black screen)
  | "reveal"            // Black fade → game visible
  | "await-ebike-mount" // Wait for interaction to mount e-bike
  | "ebike-intro-ride"  // Short ride before breakdown
  | "ebike-breakdown"   // Breakdown + dialogue before repair mission
  | "completed";        // Intro done
```

These steps do not replace `mainState` (which is `"intro" | RepairMissionId | "outro"`) or the repair mission step machine used by `RepairGame`.

`SiteStep` (`"disclaimer" | "welcome" | "situation" | "naming" | "transition"`) governs the `/site` onboarding page and is independent of `GameStep`.

## Zone Configuration

Zone configs live in:

```txt
src/data/gameplay/zones.ts
```

Each zone has an `id`, `position`, `radius`, `height`, and `oneShot` flag. `ZoneDetection` accepts an `onEnter` callback and a zone config — the one-shot guard lives inside the component via a ref, not in the store.

Current zones: `PYLON_APPROACH_ZONE`, `PYLON_ARRIVED_ZONE`.

## Rules

- Keep mission flow state in `useGameStore.missionFlow`.
- Keep the active intro step in `useGameStore.introStep` (type `GameStep`), updated via `setIntroStep`.
- Do not reintroduce `GameStepManager` for global state transitions.
- Do not create a second Zustand store for mission flow unless the state becomes independent from game progression.
- Keep side effects such as audio playback in components or service managers, but keep the state transition itself in the store.
- Keep per-frame values such as camera position and zone distance checks out of Zustand.
