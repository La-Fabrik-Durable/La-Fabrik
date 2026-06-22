# Zustand Stores

This document explains how Zustand is used in the current project.

## Why Zustand Exists Here

The project needs shared state that is durable enough to be read by multiple React and React Three Fiber systems.

Zustand is used for:

- game progression
- settings
- subtitle display

It is not used for high-frequency frame values. Values such as player velocity, temporary vectors, object positions during a grab, raycasts, and animation-loop data stay in refs or manager-local state.

## Store Locations

Current Zustand stores:

```txt
src/managers/stores/useGameStore.ts
src/managers/stores/useSettingsStore.ts
src/managers/stores/useSubtitleStore.ts
src/managers/stores/useRepairFocusStore.ts
src/managers/stores/useRepairMissionAnchorStore.ts
src/managers/stores/useSiteStore.ts
src/managers/stores/useWorldSettingsStore.ts
src/managers/stores/useMapPerformanceStore.ts
src/managers/stores/useCharacterDebugStore.ts
src/managers/stores/useDebugVisualsStore.ts
```

They are under `src/managers/stores/` because they are shared runtime state, not state owned by one visual component.

## Store Responsibilities

| Store                         | Responsibility                                                         |
| ----------------------------- | ---------------------------------------------------------------------- |
| `useGameStore`                | Durable game progression, mission steps, cinematic input lock          |
| `useSettingsStore`            | Menu visibility, volumes, and subtitle options                         |
| `useSubtitleStore`            | Currently displayed subtitle cue                                       |
| `useRepairFocusStore`         | Repair focus bubble state (active flag + world-space center)           |
| `useRepairMissionAnchorStore` | World-space anchor positions for each repair mission                   |
| `useSiteStore`                | Onboarding `/site` page step and selection state                       |
| `useWorldSettingsStore`       | Persisted world graphics, fog, wind, and cloud settings                |
| `useMapPerformanceStore`      | Debug visibility toggles for map model groups and individual models    |
| `useCharacterDebugStore`      | Per-character debug overrides for animation, position, rotation, scale |
| `useDebugVisualsStore`        | Debug overlay toggles for player model and octree visualization        |

## Managers vs Stores

Managers own imperative runtime objects and side effects.

Examples:

- `AudioManager` owns audio elements, music playback, sound pools, category volumes, and optional panner nodes.
- `InteractionManager` owns transient interaction handles and input-oriented focus/holding state.

Stores own durable shared state:

- current game phase
- mission sub-step
- progression flags
- settings values
- currently displayed subtitle cue

Rule of thumb:

- manager = runtime objects, side effects, frame-adjacent imperative logic
- store = shared state that UI, world, or gameplay components need to subscribe to

## Game Store Shape

`useGameStore` exposes the main game progression.

Main states:

| Main state | Role                            |
| ---------- | ------------------------------- |
| `intro`    | Onboarding and opening sequence |
| `ebike`    | E-bike repair sequence          |
| `pylon`    | Power pylon repair sequence     |
| `farm`     | Vertical farm repair sequence   |
| `outro`    | Ending sequence                 |

Other important state:

- `isCinematicPlaying`
- `intro`
- `ebike`
- `pylon`
- `farm`
- `outro`

Mission steps:

```ts
"locked" |
  "waiting" |
  "inspected" |
  "fragmented" |
  "scanning" |
  "repairing" |
  "reassembling" |
  "done";
```

`isCinematicPlaying` is read by `PlayerController` to ignore player input while camera timelines are active.

## Reading State In Components

Use selectors to read only what the component needs.

```tsx
import { useGameStore } from "@/managers/stores/useGameStore";

export function Example(): React.JSX.Element {
  const mainState = useGameStore((state) => state.mainState);

  return <p>Current state: {mainState}</p>;
}
```

This is better than reading the whole store, because the component re-renders only when `mainState` changes.

## Updating Game State

Prefer explicit actions from the store.

```ts
const advanceGameState = useGameStore((state) => state.advanceGameState);

advanceGameState();
```

For development and debug tooling, direct setters also exist:

```ts
const setMainState = useGameStore((state) => state.setMainState);

setMainState("ebike");
```

Direct setters are useful for debug panels, but production gameplay should prefer business actions such as:

- `advanceGameState`
- `completeEbike`
- `completePylon`
- `completeFarm`
- `completeMission`

Mission gameplay that can target `ebike`, `pylon`, or `farm` should prefer generic mission actions:

```ts
const setMissionStep = useGameStore((state) => state.setMissionStep);
const completeMission = useGameStore((state) => state.completeMission);

setMissionStep("ebike", "inspected");
completeMission("ebike");
```

This keeps reusable gameplay components such as `RepairGame` from duplicating mission-specific branches like `setEbikeState`, `setPylonState`, and `setFarmState`.

## Settings Store

`useSettingsStore` owns player-facing settings and forwards audio volume changes to `AudioManager`.

State:

- `isSettingsMenuOpen`
- `musicVolume`
- `sfxVolume`
- `dialogueVolume`
- `subtitlesEnabled`
- `subtitleLanguage`

Audio setters clamp values between `0` and `1`, then call:

```ts
AudioManager.getInstance().setCategoryVolume(category, nextVolume);
```

This keeps UI state and browser audio state synchronized.

## Subtitle Store

`useSubtitleStore` is intentionally tiny.

State/actions:

- `activeSubtitle`
- `setActiveSubtitle`
- `clearActiveSubtitle`

`playDialogueById()` writes to this store while dialogue audio plays. `Subtitles` reads from it and respects `useSettingsStore().subtitlesEnabled`.

## Repair Focus Store

`useRepairFocusStore` tracks whether a repair mini-game is in its focused phase (fragmented / scanning / repairing / reassembling).

When active, a dark sphere (`RepairFocusBubble`) expands around the repair model to visually isolate the player from the surrounding map.

State:

| Field    | Type           | Default     | Description                                 |
| -------- | -------------- | ----------- | ------------------------------------------- |
| `active` | `boolean`      | `false`     | Whether the focus bubble is expanded        |
| `center` | `Vector3Tuple` | `[0, 0, 0]` | World-space center of the bubble            |

Action:

- `setFocus(active, center?)` — enables or disables the bubble; `center` is optional and retains the previous value when omitted

Used by:

- `RepairGame` — writes `setFocus` when the mission step enters or leaves a focused phase
- `RepairFocusBubble` — reads `active` and `center` to drive the sphere scale animation

## Repair Mission Anchor Store

`useRepairMissionAnchorStore` holds the world-space position of each repair mission's origin, registered at mount time.

State:

| Field     | Type                                           | Description                              |
| --------- | ---------------------------------------------- | ---------------------------------------- |
| `anchors` | `Partial<Record<RepairMissionId, Vector3Tuple>>` | Map from mission id to world position    |

Action:

- `setAnchors(anchors)` — bulk-replaces the anchor map

Used by:

- `RepairGame` — registers its `position` prop so other systems can locate a mission's world origin without duplicating the prop

## Site Store

`useSiteStore` drives the pre-game onboarding flow served at `/site`.

State:

| Field                     | Type              | Default        | Description                                 |
| ------------------------- | ----------------- | -------------- | ------------------------------------------- |
| `currentStep`             | `SiteStep`        | `"disclaimer"` | Current screen in the onboarding sequence   |
| `selectedExperienceIndex` | `number \| null`  | `null`         | Experience selection made by the user       |
| `selectedSituationIndex`  | `number \| null`  | `null`         | Situation selection made by the user        |

`SiteStep` values in order: `"disclaimer"` → `"welcome"` → `"situation"` → `"naming"` → `"transition"`.

Actions: `setStep`, `setSelectedExperienceIndex`, `setSelectedSituationIndex`, `reset`.

Used by:

- `SiteDisclaimerScreen`, `SiteWelcomeScreen`, `SiteSituationScreen`, `SiteNamingScreen` — each screen reads `currentStep` and calls `setStep` to advance
- `SiteTransitionOverlay` — reads `currentStep` to trigger the fade-out transition

## World Settings Store

`useWorldSettingsStore` holds all adjustable world-rendering parameters and is persisted to `localStorage` under the key `la-fabrik-world-settings`.

State groups:

| Group      | Key fields                                           | Config source         |
| ---------- | ---------------------------------------------------- | --------------------- |
| `clouds`   | spread from `CLOUD_DEFAULTS`                         | `cloudConfig.ts`      |
| `fog`      | `density`, `near`, `far`, `mode`                     | `fogConfig.ts`        |
| `wind`     | `speed`, `direction`, `strength` (from `WIND_DEFAULTS`) | `windConfig.ts`    |
| `graphics` | `preset`, `dynamicGrass`, `dynamicTrees`, `dynamicClouds`, `shadowsEnabled`, `grassDensity` | `graphicsConfig.ts` |

Key actions: `setClouds`, `setFog`, `setWind`, `setWindSpeed`, `setWindDirection`, `setWindStrength`, `setGraphicsPreset`, `setGraphics`, `setDynamicGrass`, `setDynamicTrees`, `setDynamicClouds`, `setShadowsEnabled`, `setGrassDensity`, `resetToDefaults`.

Used by:

- `useCloudSettings`, `useFogSettings`, `useWind`, `useGraphicsSettings` — hooks that bridge store values to Three.js scene properties
- `useEnvironmentDebug` — debug panel for live-tweaking all world settings
- `GameSettingsMenu` — exposes the graphics preset to the player-facing settings UI

## Map Performance Store

`useMapPerformanceStore` provides debug-only visibility toggles for map models and model groups defined in `mapPerformanceConfig.ts`.

State:

| Field    | Type                                        | Default             |
| -------- | ------------------------------------------- | ------------------- |
| `groups` | `Record<MapPerformanceGroupName, boolean>`  | all `true`          |
| `models` | `Record<MapPerformanceModelName, boolean>`  | all `true`          |

A model is visible only if its own toggle is `true` **and** every group it belongs to is `true`. The helper `isMapModelVisible(name, visibility)` encodes this logic and is exported alongside the store.

Actions: `setGroupVisible`, `setModelVisible`, `resetVisibility`.

Used by:

- `MapInstancingSystem` — calls `isMapModelVisible` each frame to decide whether to render each instanced model
- `useMapPerformanceDebug` — debug panel for toggling individual models and groups

## Character Debug Store

`useCharacterDebugStore` holds per-character transform and animation overrides used exclusively by the debug panel.

State:

Each `CharacterId` key maps to a `CharacterDebugState`:

| Field       | Type           | Description                               |
| ----------- | -------------- | ----------------------------------------- |
| `animation` | `string`       | Name of the currently playing animation   |
| `position`  | `Vector3Tuple` | World position override                   |
| `rotation`  | `Vector3Tuple` | Euler rotation override (radians)         |
| `scale`     | `Vector3Tuple` | Scale override                            |

Initial values come from `CHARACTER_CONFIGS[id]` for each character defined in `characterConfig.ts`.

Actions: `setAnimation(id, animation)`, `setPosition(id, axis, value)`, `setRotation(id, axis, value)`, `setScale(id, axis, value)`. Each action performs an immutable update on the per-axis value using a shared `updateVector` helper.

Used by:

- `useCharacterDebug` — debug panel hook that reads and writes each character's state
- `CharacterSystem` — reads animation and transform values to drive character instances

## Debug Visuals Store

`useDebugVisualsStore` controls the visibility of low-level debug visualizations rendered in the Three.js scene.

State:

| Field             | Type      | Default | Description                                        |
| ----------------- | --------- | ------- | -------------------------------------------------- |
| `showPlayerModel` | `boolean` | `false` | Renders the invisible player collision capsule     |
| `showOctree`      | `boolean` | `false` | Renders the collision octree wireframe             |
| `octreeMaxDepth`  | `number`  | `8`     | Maximum octree depth level to display              |
| `octreeMinDepth`  | `number`  | `4`     | Minimum octree depth level to display              |
| `octreeLeavesOnly`| `boolean` | `true`  | Show only leaf nodes instead of all levels         |
| `octreeOpacity`   | `number`  | `0.35`  | Wireframe opacity                                  |
| `octreeFabrikOnly`| `boolean` | `false` | Restrict octree display to the La Fabrik mesh only |

Each field has a matching setter action (e.g. `setShowPlayerModel`, `setOctreeMaxDepth`).

Used by:

- `useDebugVisualsDebug` — debug panel hook that drives all toggles
- `DebugOctreeVisualization` — reads octree settings to render the collision wireframe
- `GameMapCollision` — reads `showPlayerModel` to optionally render the player capsule mesh

## World Integration

`src/world/GameStageContent.tsx` subscribes to `mainState` and mounts the repair-game content.

Current production repair placement:

```tsx
<RepairGame mission="ebike" position={[42.2399, 4.5484, 34.6468]} />
<RepairGame mission="pylon" position={[64, 0, -66]} />
<RepairGame mission="farm" position={[-24, 0, 42]} />
```

`RepairGame` reads the active mission step from the store and writes transitions through generic actions such as `setMissionStep` and `completeMission`.

Shared repair ids, mission steps, and runtime guards live in:

```txt
src/types/gameplay/repairMission.ts
```

Mission-specific behavior stays in:

```txt
src/data/gameplay/repairMissions.ts
```

That lets the repair flow stay reusable while each mission defines its own model, broken parts, replacement parts, prompts, and timing.

## UI Integration

`src/components/ui/GameUI.tsx` groups the HTML overlays used by the playable route.

Current overlays:

- `DebugOverlayLayout`: debug-only overlay shown with `?debug`
- `GameStateDebugPanel`: compact debug UI for viewing and switching main/sub states
- `Crosshair`: player aiming helper
- `InteractPrompt`: interaction prompt
- `RepairMovementLockIndicator`: indicator shown while repair steps lock movement
- `HandTrackingVisualizer`: hand tracking SVG fallback/debug visualization
- `Subtitles`: active dialogue subtitle overlay
- `GameSettingsMenu`: options menu and settings controls

## Regression Rules

- Do not store per-frame values in Zustand.
- Use `useRef` for high-frequency mutable values such as player velocity, temporary vectors, or animation-loop data.
- Use selectors instead of reading the whole store in components.
- Keep gameplay transitions inside store actions when possible.
- Keep debug-only controls behind `?debug`.
- Add new state only when a real runtime feature needs it.
- Keep settings side effects, such as audio category updates, inside settings actions rather than spreading them across UI components.

## Next Steps

- Move broader mission orchestration into a clearer layer if intro, mission, dialogue, and cinematic branching grows.
