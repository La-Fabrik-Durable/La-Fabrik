# Implemented Features

This document lists features that are actually implemented in the current codebase.

## Scene Preview

- Fullscreen React Three Fiber scene
- Blocking map loaded from `public/models/map/blocking/model.glb`
- Ambient and directional lighting
- Solid background environment color

## Camera Modes

- Player camera mode
  - eye height at `1.75m`
  - pointer lock mouse look
  - movement with `ZQSD`
  - vertical clamp to prevent falling below the map plane
- Debug camera mode
  - free orbit camera
  - switchable from the debug panel

## UI

- Center-screen crosshair shown only in player mode

## Debug Tooling

- `?debug` query param enables the debug panel
- `lil-gui` panel with camera mode selection
- debug lighting controls
- debug scene helpers
- `r3f-perf` overlay

## Not Implemented Yet

- missions
- interactions on `E`
- gameplay zones
- cinematics
- audio systems
- loading flow
- minimap and mission HUD
- collisions beyond the current simple player height clamp
