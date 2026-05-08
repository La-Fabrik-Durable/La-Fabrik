# Main Feature

This document explains the current repair-game prototype in La-Fabrik.

## What It Does

The main feature is a repair interaction sandbox mounted in the debug physics scene. It lets the player approach a repair case, open it, and interact with module slots that can show selectable models and exploded-model states.

The current user flow is:

1. Open the app with `?debug`.
2. Switch the scene to `Physics` in the debug panel.
3. Move close to the repair case.
4. Press the interaction key when prompted.
5. Watch the case open or close with sound feedback.
6. Interact with repair module slots to cycle/select repair models.

The production repair flow is now being moved toward reusable mission data for `bike`, `pylone`, and `ferme`. This lets the same future `RepairGame` component read one mission config instead of duplicating per-mission setup.

## Why It Matters

This feature validates the core repair fantasy before a full mission system exists. It tests whether repair objects, physical proximity, model selection, audio feedback, and exploded model visualization can work together in the 3D scene.

## Current Behavior

The repair case reacts to player proximity. When the player is close enough, it floats upward and rotates gently to signal interactivity. When the player moves away, it returns to its resting transform.

Interacting with the case toggles its open state. The lid animation is handled with GSAP because it is a discrete interaction animation, not a continuous per-frame loop.

Repair module slots are configured from static gameplay data. They render selectable repair models and can use exploded model visualization to show parts separated from their original positions.

## Key Files

- `src/world/debug/TestMap.tsx` mounts the repair-game prototype in the debug physics scene.
- `src/components/three/gameplay/RepairGameZone.tsx` composes the repair-game zone.
- `src/components/three/gameplay/RepairCaseObject.tsx` connects the repair case to trigger interaction and audio.
- `src/components/three/gameplay/RepairCaseModel.tsx` renders and animates the case model.
- `src/components/three/gameplay/RepairModuleSlot.tsx` renders repair slots and model selection behavior.
- `src/components/three/models/ExplodableModel.tsx` renders selectable models with split/exploded visualization.
- `src/data/gameplay/repairCaseConfig.ts` stores repair case model, sound, and animation constants.
- `src/data/gameplay/repairGameConfig.ts` stores repair zone and slot positions.
- `src/data/gameplay/repairGameModelCatalog.ts` stores selectable repair models.
- `src/data/gameplay/repairMissions.ts` stores reusable repair mission config for `bike`, `pylone`, and `ferme`.
- `src/managers/stores/useGameStore.ts` stores mission progression state and generic mission step helpers.

## Debug Requirements

The repair-game prototype currently requires:

- the app opened with `?debug`
- the debug scene set to `Physics`
- model assets available under `public/models/`
- sound assets available under `public/sounds/`

Frontend command:

```bash
npm run dev
```

Debug URL:

```txt
http://localhost:5173/?debug
```

## Related Hand Tracking

Hand tracking is a separate debug interaction layer. It can move grabbable physics objects with webcam input, but it is not yet integrated into the repair-game mission flow.

For hand tracking, run the Python backend separately:

```bash
source backend/.venv/bin/activate
python -m backend.main
```

## Current Limitations

- It is mounted only in the debug physics scene.
- The production `RepairGame` component is not mounted in the main game scene yet.
- Mission progression exists in Zustand, but the full repair mission flow is still being integrated.
- There is no central `GameManager` in this branch.
- Hand tracking is available as debug interaction input, not as final repair gameplay.
- The repair-game content is configured statically in `src/data/gameplay/`.
