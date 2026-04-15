# Skill — Best Practices

## Principles

Generate code that is **simple**, **understandable**, **reviewable**, **scalable**, **optimized**, and **modern**. Follow W3C web standards and platform conventions.

## Naming Conventions

### Files

| Type       | Convention                  | Example              |
| ---------- | --------------------------- | -------------------- |
| Components | PascalCase                  | `WorkshopZone.tsx`   |
| Hooks      | camelCase with `use` prefix | `useGameState.ts`    |
| Managers   | PascalCase                  | `GameManager.ts`     |
| Utils      | PascalCase                  | `Dispose.ts`         |
| Data       | PascalCase                  | `missions.ts`        |
| Shaders    | kebab-case                  | `hologram.vert.glsl` |

### Variables & Functions

| Type             | Convention           | Example                                       |
| ---------------- | -------------------- | --------------------------------------------- |
| Variables        | camelCase            | `activeZone`, `missionStep`                   |
| Functions        | camelCase            | `startMission()`, `setActiveZone()`           |
| Constants        | UPPER_SNAKE_CASE     | `MAX_SPEED`, `DEFAULT_PHASE`                  |
| React components | PascalCase           | `function WorkshopZone()`                     |
| React hooks      | camelCase with `use` | `useGameState()`, `useFrame()`                |
| Classes          | PascalCase           | `class GameManager`                           |
| Interfaces/Types | PascalCase           | `type GameSnapshot`, `interface ZoneData`     |
| Enums            | PascalCase           | `enum Phase` (prefer string literals instead) |

### CSS Classes (if applicable)

Use kebab-case:

```css
.mission-hud {
}
.narrative-overlay {
}
```

## File Structure

Every file starts with a route comment:

```ts
# route path src/world/zones/WorkshopZone.tsx
```

## Code Style

### Simplicity First

```ts
// Good — clear, direct
function getZoneRadius(zone: Zone): number {
  return zone.radius;
}

// Bad — over-abstracted
function getZoneRadius(zone: Zone): number {
  return zone[ZoneFields.RADIUS] ?? RADIUS_DEFAULTS[zone.type]?.default ?? 50;
}
```

### Early Return

```ts
// Good
if (!gltf) return null;
if (!visible) return null;

return <primitive object={gltf.scene} />;

// Bad
if (gltf && visible) {
  return <primitive object={gltf.scene} />;
}
return null;
```

### Destructuring

```ts
// Good
const { position, rotation, scale } = object;

// Good — explicit
const game = GameManager.getInstance();
const { phase, activeZone } = game.getState();
```

### Avoid Nested Callbacks

```ts
// Good — flat structure
useEffect(() => {
  const mixer = new THREE.AnimationMixer(model);

  return () => mixer.stopAllAction();
}, [model]);

// Bad — nested
useEffect(() => {
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(model);
  }, [model]);
}, []);
```

## TypeScript Rules

### Explicit Types for Exports

```ts
// Good — explicit return type
export function useGameState(): GameSnapshot {
  // ...
}

// Good — explicit parameter types
export function setPhase(phase: Phase): void {
  // ...
}
```

### Interface over Type (for object shapes)

```ts
// Good
interface ZoneData {
  id: string;
  position: [number, number, number];
  radius: number;
}

// OK — simple unions
type Phase = "loading" | "exploring" | "cinematic";
```

### Never use `any`

```ts
// Good
const ref = useRef<THREE.Group>(null);

// Bad
const ref = useRef<any>(null);
```

## React Patterns

### Component Structure

```tsx
# route path src/world/zones/WorkshopZone.tsx

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export function WorkshopZone() {
  const ref = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/workshop/ebike.glb");

  useFrame((_, delta) => {
    // per-frame logic
  });

  useEffect(() => {
    // setup
    return () => {
      // cleanup
    };
  }, []);

  return <primitive ref={ref} object={gltf.scene.clone()} />;
}
```

### Hooks Return Simple Values

```ts
// Good — returns simple object
export function useGameState() {
  const game = GameManager.getInstance();
  const [state, setState] = useState(game.getState());

  useEffect(() => {
    return game.subscribe(() => setState({ ...game.getState() }));
  }, [game]);

  return state;
}

// Bad — returns methods that modify state directly
export function useGameActions() {
  const game = GameManager.getInstance();
  return {
    setPhase: (p: Phase) => game.setPhase(p),
    startMission: (id: string) => game.startMission(id),
  };
}
```

## Performance

### useRef for Mutable Values

```ts
// Good — no re-render
const position = useRef(new THREE.Vector3());

// Bad — triggers re-render every frame
const [position, setPosition] = useState(new THREE.Vector3());
```

### Memoize Expensive Computations

```ts
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

const memoizedCallback = useCallback(
  (x: number) => doSomething(x),
  [dependency],
);
```

### Lazy Loading

```ts
// Components
const HeavyComponent = lazy(() => import("./HeavyComponent"));

// Assets
useGLTF.preload("/models/map/base.glb");
```

## Scalability

### Single Responsibility

```ts
// Good — focused component
export function WorkshopZone() {
  // Only handles workshop zone logic
}

// Bad — does everything
export function WorkshopZone() {
  // Handles zone logic + audio + cinematics + missions
}
```

### Separate Data from View

```ts
// Good — data in src/data/
// src/data/missions.ts
export const missions = {
  workshop: { steps: [...] },
};

// Bad — data inline
export function WorkshopZone() {
  const missions = [{ steps: [...] }]; // scattered everywhere
}
```

### Constants for Magic Numbers

```ts
// Good
const DEFAULT_CAMERA_DISTANCE = 5;
const ZONE_DETECTION_RADIUS = 20;

// Bad
mesh.position.set(5, 0, 0); // magic number
```

## Accessibility (W3C)

### Semantic HTML

```tsx
// Good
<button onClick={handleInteract} aria-label="Interact with bike">
  <Model />
</button>

// Bad
<div onClick={handleInteract}>
  <Model />
</div>
```

### Keyboard Navigation

```tsx
<button
  onClick={openDialogue}
  onKeyDown={(e) => e.key === "Enter" && openDialogue()}
>
  Talk
</button>
```

## Rules

1. **Simplicity** — Every line of code must be justified. If it's not obviously necessary, remove it.
2. **Readability** — Code is read 10x more than it's written. Optimize for the reader.
3. **Reviewability** — Pull requests should be understandable in < 5 minutes.
4. **Scalability** — Architecture should support growth without refactoring existing code.
5. **Performance** — Don't optimize prematurely, but don't introduce obvious bottlenecks.
6. **Modern** — Use ES2022+ features, TypeScript strict mode, React hooks over class lifecycle.
7. **W3C** — Follow web standards: semantic HTML, ARIA, keyboard navigation.
8. **No Over-Engineering** — Avoid patterns that add complexity without benefit (factories for 1 instance, generic wrappers for single use cases, etc.)
