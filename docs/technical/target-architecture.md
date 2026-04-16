# Target Architecture

This document describes the intended medium-term architecture for the project.

## Goals

- Keep `main` stable, `develop` as the integration branch, and `feat/*` for feature work.
- Keep the runtime split between scene composition, gameplay systems, debug tooling, and HTML UI.
- Keep one clear source of truth per concern.

## Intended Layers

### App Layer

- `App.tsx` should stay small and orchestration-oriented.
- It should mount the canvas scene and top-level HTML overlays.

### World Layer

- `src/world/` should contain only production scene objects and scene composition.
- Expected responsibilities:
  - world composition
  - map/environment/lighting
  - player controller
  - zones
  - post-processing used in production

### Debug Layer

- `src/utils/debug/` should contain only developer tooling.
- Expected responsibilities:
  - `lil-gui`
  - performance overlay
  - scene helpers
  - free camera and calibration controls

### UI Layer

- `src/components/ui/` should contain HTML overlays used by the player.
- Expected examples:
  - crosshair
  - loading screen
  - mission HUD
  - narrative overlays

### Gameplay Layer

- Gameplay state should eventually live in dedicated managers and thin hooks once those systems exist.
- Expected future concerns:
  - missions
  - zones
  - cinematics
  - audio
  - interactions

## Rules

- `world/` should not contain debug-only tooling.
- `debug/` should not own production gameplay systems.
- Shared types should live close to their domain and move outward only when they gain multiple real consumers.
- New files should only be created when they have an active runtime purpose.
