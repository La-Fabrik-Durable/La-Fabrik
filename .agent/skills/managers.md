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

## Target-State GameManager

`GameManager` does not exist in the current implementation. The following pattern is target-state guidance only and should not be applied until the manager exists in code.

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

When a `GameManager` exists, components and hooks should access other managers through it:

```ts
// Correct
GameManager.getInstance().cinematic.play("intro");

// Wrong — never import sub-managers directly in components
CinematicManager.getInstance().play("intro");
```

## Target-State Subscribe Pattern

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

In that target-state manager, every `set*()` method calls `this.emit()` to notify subscribers.

## Target-State React Bridge Hook

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

- Do not add a `GameManager` unless the feature requires a real shared gameplay state owner.
- Current managers may be imported directly until the target-state orchestrator exists.
- Keep singleton managers limited to side-effect services or shared interaction state.
- Always call `destroy()` on cleanup when a manager owns external resources.
- Never create manager instances with `new` — always use `.getInstance()`.
