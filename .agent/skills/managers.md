# Skill — Singleton Managers

## Pattern

Every manager follows the exact same singleton structure:

```ts
export class SomeManager {
  private static _instance: SomeManager | null = null;

  static getInstance(): SomeManager {
    if (!SomeManager._instance) {
      SomeManager._instance = new SomeManager();
    }
    return SomeManager._instance;
  }

  private constructor() {}

  destroy(): void {
    SomeManager._instance = null;
  }
}
```

## Managers in this project

| Manager              | File                                 | Role                                                           |
| -------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `AudioManager`       | `src/managers/AudioManager.ts`       | Music and SFX playback.                                        |
| `InteractionManager` | `src/managers/InteractionManager.ts` | Focus, nearby, trigger, grab, and hand-grab interaction state. |

## Subscribe Pattern

```ts
private listeners = new Set<() => void>()

subscribe(listener: () => void): () => void {
  this.listeners.add(listener)
  return () => this.listeners.delete(listener)
}

private emit(): void {
  this.listeners.forEach((cb) => cb())
}
```

Managers that expose state to React call `this.emit()` from every `set*()` method that changes subscribed state.

## React Bridge Hook

```ts
// hooks/interaction/useInteraction.ts
const manager = InteractionManager.getInstance();

export function useInteraction(): InteractionSnapshot {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),
    manager.getState.bind(manager),
  );
}
```

## Rules

- Do not add a `GameManager` unless the feature requires a real shared gameplay state owner.
- Current managers may be imported directly.
- Keep singleton managers limited to side-effect services or shared interaction state.
- Always call `destroy()` on cleanup when a manager owns external resources.
- Never create manager instances with `new` — always use `.getInstance()`.
