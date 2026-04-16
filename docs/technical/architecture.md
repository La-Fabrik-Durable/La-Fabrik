# Implemented Architecture

This document describes the code that exists today in the repository.

## Runtime Structure

- `src/App.tsx` mounts the `Canvas`, the 3D `World`, the debug perf overlay, and the HTML crosshair overlay.
- `src/world/World.tsx` composes the active 3D scene.
- `src/world/Map.tsx` loads and centers the blocking map model.
- `src/world/Lighting.tsx` owns the current ambient and directional light setup.
- `src/world/Environment.tsx` owns the current background color.
- `src/world/player/FPSController.tsx` provides the current player camera, pointer lock, and `ZQSD` movement.
- `src/utils/debug/` contains debug-only tooling such as `lil-gui`, scene helpers, and the free debug camera.
- `src/components/ui/Crosshair.tsx` is the only current HTML overlay component in use.

## Camera Modes

The application currently has two camera modes:

- `player`
  - controlled by `FPSController`
  - player height is `1.75m`
  - movement uses `ZQSD`
  - `E` is reserved for future interaction
- `debug`
  - controlled by `DebugCameraControls`
  - enabled from the debug panel

The active mode is stored in the debug subsystem and consumed through `src/hooks/debug/useCameraMode.ts`.

## Debug System

- `src/utils/debug/Debug.ts` is a singleton wrapper around `lil-gui`
- `src/utils/debug/DebugPerf.tsx` lazy-loads `r3f-perf`
- `src/utils/debug/scene/DebugHelpers.tsx` mounts grid and axes in debug mode
- `src/utils/debug/scene/DebugCameraControls.tsx` mounts the free camera in debug mode

## Current Limitations

- There is no gameplay state manager implemented yet.
- There are no zone systems, missions, dialogue systems, or cinematic systems implemented yet.
- Player movement currently uses a simple height clamp instead of real collision or ground detection.
- The map is currently a blocking preview scene, not a full playable world.
