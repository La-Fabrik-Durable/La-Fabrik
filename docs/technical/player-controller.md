# Player Controller

This document describes the player movement system as it exists today.

## Files

```
src/world/player/Player.tsx
src/world/player/PlayerCamera.tsx
src/world/player/PlayerController.tsx
src/data/player/playerConfig.ts
src/data/input/keybindings.ts
src/data/ebike/ebikeConfig.ts
```

## Role in the Architecture

`Player` is a composite component mounted by `World` after the scene readiness gate is satisfied (octree built, Rapier stage mounted). It owns the camera and all movement logic for the duration of the session.

`Player` renders two children:

- `PlayerCamera` — sets up mouse look and registers the camera for cinematics.
- `PlayerController` — drives physics, input, and camera position each frame. Returns `null` (no scene geometry).

The player is never mounted while the map is still loading. See `docs/technical/architecture.md` → Scene Loading.

## Spawn

`Player` receives a `spawnPosition: Vector3Tuple` from its parent. On mount (`useLayoutEffect`), the Three.js camera is placed at that position and optionally oriented toward `initialLookAt`.

`PlayerController` builds a `Capsule` (from `three-stdlib`) at the same position. The capsule's `end` point is the eye position; its `start` is offset down by `PLAYER_EYE_HEIGHT - PLAYER_CAPSULE_RADIUS`.

```ts
// src/data/player/playerConfig.ts
PLAYER_EYE_HEIGHT      = 1.75  // metres
PLAYER_CAPSULE_RADIUS  = 0.35  // metres
```

Production spawn position is defined in `src/data/player/playerConfig.ts` as `PLAYER_SPAWN_POSITION_GAME`. The physics debug scene uses `PLAYER_SPAWN_POSITION_PHYSICS` (origin, y = eye height).

## Movement Modes

The player can be in one of two modes, stored in `useGameStore` under `player.movementMode`:

| Mode | Speed | Controls |
|------|-------|----------|
| `"walk"` | 5 u/s | ZQSD (AZERTY) + Space to jump |
| `"ebike"` | up to 20 u/s | ZS to drive, QD to steer |

`setPlayerMovementMode(mode)` in `useGameStore` switches the mode and automatically updates `player.currentSpeed`.

### Mode Transitions

When `movementMode` changes, a `useEffect` in `PlayerController` handles the transition:

- **`"walk"` → `"ebike"`**: The capsule is teleported to `window.ebikeParkedPosition` (set by the ebike visual component). The camera is placed at `EBIKE_CAMERA_TRANSFORM` offset, oriented to match the parked bike rotation. `ebikeSpeedFactor` resets to 0.
- **`"ebike"` → `"walk"`**: FOV resets to 60°. The capsule is shifted 3 units sideways in the camera's forward direction (dismount offset).

## Physics Loop (`useFrame`)

Each frame:

1. **Delta cap**: `dt = Math.min(delta, PLAYER_MAX_DELTA)` (0.05 s max). Prevents tunnelling on frame drops.
2. **Fall respawn**: if `capsule.end.y < PLAYER_FALL_RESPAWN_Y` (-20), a timer accumulates. After `PLAYER_FALL_RESPAWN_DELAY` (3 s), the capsule and camera reset to `spawnPosition`.
3. **Early exit**: if `isPlayerInputLocked()` or `!canMove`, keys are cleared, velocity zeroed, frame exits.
4. **Wish direction**: built from key state against camera forward/right vectors projected onto XZ plane.
5. **Ebike speed ramp**: `ebikeSpeedFactor` ramps from 0 to 1 over `EBIKE_ACCELERATION_DURATION_MS`, and back to 0 over `EBIKE_DECELERATION_DURATION_MS`. Effective speed = `currentSpeed × ebikeSpeedFactor`.
6. **Acceleration / damping**: velocity accumulated with `PLAYER_ACCELERATION_MULTIPLIER`; XZ damped each frame via `exp(-PLAYER_XZ_DAMPING_FACTOR × dt)`.
7. **Gravity / jump**: gravity applied when airborne; jump sets `velocity.y = PLAYER_JUMP_SPEED` on the frame the player lands with jump buffered.
8. **Capsule translation**: capsule moved by `velocity × dt`.
9. **Octree collision**: up to `PLAYER_COLLISION_ITERATIONS` (3) passes. Floor normals > `PLAYER_FLOOR_NORMAL_MIN` (0.15) set `onFloor`. Velocity component against wall normals is cancelled.
10. **Terrain snap** (game scene only): `useTerrainHeightSampler` provides a height at the capsule's XZ. If the foot is within `PLAYER_GROUND_SNAP_DISTANCE` (0.22 m) of the terrain and falling, the capsule snaps up and `onFloor` is set.
11. **Camera update**: in walk mode, `camera.position` is copied from `capsule.end`. In ebike mode, the camera is offset by `EBIKE_CAMERA_TRANSFORM` rotated by `ebikeAngle`, with steering sway and a FOV boost proportional to speed (capped at +3°).

```ts
// src/data/player/playerConfig.ts
PLAYER_WALK_SPEED              = 5
PLAYER_EBIKE_SPEED             = 20
PLAYER_GRAVITY                 = 30
PLAYER_JUMP_SPEED              = 9
PLAYER_AIR_CONTROL_FACTOR      = 0.35
PLAYER_ACCELERATION_MULTIPLIER = 9
PLAYER_XZ_DAMPING_FACTOR       = 8
PLAYER_MAX_DELTA               = 0.05
PLAYER_FALL_RESPAWN_Y          = -20
PLAYER_FALL_RESPAWN_DELAY      = 3   // seconds
```

## Camera (`PlayerCamera`)

`PlayerCamera` mounts `PointerLockControls` (from `@react-three/drei`) targeting `#game-canvas`. Pointer lock is disabled while `isSettingsMenuOpen` is true.

On mount, the Three.js camera is registered with `setGlobalCamera` so the cinematic system can target it. On unmount, pointer lock is released and the reference is cleared.

Walk mode: camera position follows `capsule.end` every frame (set in `PlayerController`). Rotation is driven by `PointerLockControls` (mouse delta).

Ebike mode: `PointerLockControls` is still mounted but the camera rotation is overridden each frame in `PlayerController` using `camera.rotation.set(pitch, yaw, roll, "YXZ")`. Mouse look is effectively bypassed while on the bike.

## `canMove`

`missionFlow.canMove` in `useGameStore` is the primary movement gate. It is `false` on startup and set to `true` by `completeIntroState` when the intro sequence finishes.

When `canMove` is `false`, the `useFrame` loop clears all key state, zeros velocity, and returns immediately. The player cannot walk, look via the physics loop, or interact.

Two additional conditions block input without touching `canMove`:

- `isSettingsMenuOpen` (from `useSettingsStore`)
- `isCinematicPlaying` (from `useGameStore`)

These are checked by `isPlayerInputLocked()`, which reads store state imperatively (outside React render) to avoid stale closures in the frame loop.

`useRepairMovementLocked()` is a separate hook used by repair missions to set `canMove` to `false` during focused repair steps. It is not part of `PlayerController` itself.

## Input Bindings

Keys are defined in `src/data/input/keybindings.ts` for AZERTY layout:

| Action | Key |
|--------|-----|
| Forward | `z` |
| Backward | `s` |
| Left | `q` |
| Right | `d` |
| Jump | `Space` |
| Interact | `e` |
| Grab | Left mouse button |

Key listeners are registered once on mount (`useEffect` with empty deps). They call `isPlayerInputLocked()` imperatively on each event so the check is always current.

## Interaction Bridge

`PlayerController` is the sole owner of keyboard and mouse event listeners. It bridges raw input to semantic interaction actions via `InteractionManager.getInstance()`:

- `E` key down → `interaction.pressInteract()` if `focused.kind === "trigger"`
- Left mouse down → `interaction.pressInteract()` if `focused.kind === "grab"`
- Left mouse up → `interaction.releaseInteract()` if `holding`

`PlayerController` does not know what the focused object is — it only calls the manager. The manager dispatches the action to the focused object's registered handler. See `docs/technical/interaction.md` for the full interaction flow.

Hand tracking bypasses the mouse/keyboard path entirely. Grab via hand tracking is handled inside `GrabbableObject` using its own gesture hook.

## Ebike Global State

The ebike movement mode communicates with the visual ebike component via `window` globals. This avoids prop-drilling and Zustand round-trips inside the frame loop.

| Property | Written by | Read by |
|----------|------------|---------|
| `window.playerPos` | `PlayerController` | ebike visual |
| `window.ebikeAngle` | `PlayerController` | ebike visual |
| `window.ebikeSteerFactor` | `PlayerController` | ebike visual |
| `window.ebikeDriveInputActive` | `PlayerController` | ebike visual |
| `window.ebikeSpeedFactor` | `PlayerController` | ebike visual |
| `window.ebikeParkedPosition` | ebike visual | `PlayerController` (on mode switch) |
| `window.ebikeParkedRotation` | ebike visual | `PlayerController` (on mode switch) |
| `window.ebikeVisualGroup` | ebike visual | `PlayerController` (to drive mesh transform) |
| `window.ebikeBreakdownActive` | mission logic | `PlayerController` |

When `ebikeBreakdownActive` is true and the player is mounted, drive input is blocked. Once the bike decelerates to a stop, `PlayerController` calls `setPlayerMovementMode("walk")` automatically.

## How to Modify

**Change walk speed or jump height**: edit the constants in `src/data/player/playerConfig.ts`. `PLAYER_WALK_SPEED` and `PLAYER_EBIKE_SPEED` are also used by `setPlayerMovementMode` in `useGameStore`.

**Change eye height or capsule size**: edit `PLAYER_EYE_HEIGHT` and `PLAYER_CAPSULE_RADIUS` in `playerConfig.ts`. Both are used when building the capsule and when positioning the ebike visual mesh.

**Change ebike camera offset**: edit `EBIKE_CAMERA_TRANSFORM` in `src/data/ebike/ebikeConfig.ts`. The object contains `position` and `rotation` (degrees) tuples.

**Change ebike acceleration feel**: edit `EBIKE_ACCELERATION_DURATION_MS` and `EBIKE_DECELERATION_DURATION_MS` in `ebikeConfig.ts`.

**Add a new movement block condition**: add a check inside `isPlayerInputLocked()` in `PlayerController.tsx`, or set `canMove` to `false` via a new action in `useGameStore`. Prefer the `canMove` path for gameplay-driven blocks; prefer `isPlayerInputLocked()` for UI-driven blocks.

**Change keybindings**: edit `src/data/input/keybindings.ts`. All key constants are consumed from there.
