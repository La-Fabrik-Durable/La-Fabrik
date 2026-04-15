# Best Practices

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

| Type             | Convention           | Example                                   |
| ---------------- | -------------------- | ----------------------------------------- |
| Variables        | camelCase            | `activeZone`, `missionStep`               |
| Functions        | camelCase            | `startMission()`, `setActiveZone()`       |
| Constants        | UPPER_SNAKE_CASE     | `MAX_SPEED`, `DEFAULT_PHASE`              |
| React components | PascalCase           | `function WorkshopZone()`                 |
| React hooks      | camelCase with `use` | `useGameState()`, `useFrame()`            |
| Classes          | PascalCase           | `class GameManager`                       |
| Interfaces/Types | PascalCase           | `type GameSnapshot`, `interface ZoneData` |

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
```

### Avoid Nested Callbacks

```ts
// Good — flat structure
useEffect(() => {
  const mixer = new THREE.AnimationMixer(model);

  return () => mixer.stopAllAction();
}, [model]);
```

## TypeScript Rules

### Explicit Types for Exports

```ts
export function useGameState(): GameSnapshot { ... }

export function setPhase(phase: Phase): void { ... }
```

### Never use `any`

```ts
// Good
const ref = useRef<THREE.Group>(null);

// Bad
const ref = useRef<any>(null);
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

### Constants for Magic Numbers

```ts
const DEFAULT_CAMERA_DISTANCE = 5;
const ZONE_DETECTION_RADIUS = 20;
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

## Rules

1. **Simplicity** — Every line of code must be justified.
2. **Readability** — Code is read 10x more than it's written.
3. **Reviewability** — PRs should be understandable in < 5 minutes.
4. **Scalability** — Architecture should support growth without refactoring.
5. **Performance** — Don't optimize prematurely, but don't introduce obvious bottlenecks.
6. **Modern** — Use ES2022+ features, TypeScript strict mode, React hooks.
7. **W3C** — Follow web standards: semantic HTML, ARIA, keyboard navigation.
8. **No Over-Engineering** — Avoid patterns that add complexity without benefit.
