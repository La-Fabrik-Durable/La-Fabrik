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

  private constructor() {
    // init logic
  }

  destroy(): void {
    // cleanup logic
    SomeManager._instance = null;
  }
}
```

## Managers in this project

| Manager              | File                                 | Role                                                                          |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| `AudioManager`       | `src/managers/AudioManager.ts`       | Music and SFX playback.                                                       |
| `InteractionManager` | `src/managers/InteractionManager.ts` | Focus, nearby, trigger, grab, and hand-grab interaction state.                |
| `GameManager`        | target-state only                    | Future single source of truth for phase, zone, mission, input lock, dialogue. |
| `CinematicManager`   | target-state only                    | Future GSAP timeline orchestrator.                                            |
| `ZoneManager`        | target-state only                    | Future zone entry/exit detection and LOD triggers.                            |

## GameManager is the orchestrator

```ts
export class GameManager {
  cinematic!: CinematicManager;
  audio!: AudioManager;
  zone!: ZoneManager;

  private constructor() {
    this.cinematic = CinematicManager.getInstance();
    this.audio = AudioManager.getInstance();
    this.zone = ZoneManager.getInstance();
  }
}
```

Components and hooks access other managers **through GameManager only**:

```ts
// Correct
GameManager.getInstance().cinematic.play("intro");

// Wrong — never import sub-managers directly in components
CinematicManager.getInstance().play("intro");
```

## Subscribe pattern (GameManager only)

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

Every `set*()` method calls `this.emit()` to notify subscribers.

## React bridge hook

```ts
// hooks/useGameState.ts
export function useGameState() {
  const game = GameManager.getInstance();
  const [state, setState] = useState(game.getState());

  useEffect(() => {
    return game.subscribe(() => setState({ ...game.getState() }));
  }, [game]);

  return state;
}
```

## Rules

- Max 4 managers total
- Only `GameManager` holds durable state with `subscribe()`
- Other managers are side-effect handlers — they do not store persistent state
- Always call `destroy()` on cleanup (App unmount)
- Never create manager instances with `new` — always use `.getInstance()`
