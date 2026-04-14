# Skill — GSAP

GSAP is used exclusively for **cinematic sequences** and **UI transitions**. It is never used for per-frame 3D animation (that's `useFrame` + AnimationMixer).

## Cinematic timeline pattern

```ts
import gsap from "gsap";

export class CinematicManager {
  private static _instance: CinematicManager | null = null;
  private timeline: gsap.core.Timeline | null = null;

  static getInstance(): CinematicManager {
    if (!CinematicManager._instance) {
      CinematicManager._instance = new CinematicManager();
    }
    return CinematicManager._instance;
  }

  play(id: string, camera: THREE.Camera): void {
    this.timeline?.kill();

    this.timeline = gsap.timeline({
      onStart: () => {
        GameManager.getInstance().setPhase("cinematic");
        GameManager.getInstance().lockInput(true);
      },
      onComplete: () => {
        GameManager.getInstance().setPhase("exploring");
        GameManager.getInstance().lockInput(false);
      },
    });

    // Example: camera pan to workshop
    this.timeline
      .to(camera.position, {
        x: 5,
        y: 3,
        z: 10,
        duration: 2,
        ease: "power2.inOut",
      })
      .to(
        camera.rotation,
        { y: Math.PI / 4, duration: 1.5, ease: "power2.out" },
        "-=1",
      );
  }

  destroy(): void {
    this.timeline?.kill();
    this.timeline = null;
    CinematicManager._instance = null;
  }
}
```

## UI animation pattern

For HTML overlays (cinematic bars, dialogue fade-in):

```tsx
import { useRef, useEffect } from "react";
import gsap from "gsap";

export function CinematicBars({ visible }: { visible: boolean }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      gsap.to(topRef.current, { y: 0, duration: 0.6, ease: "power2.out" });
      gsap.to(bottomRef.current, { y: 0, duration: 0.6, ease: "power2.out" });
    } else {
      gsap.to(topRef.current, { y: -60, duration: 0.4, ease: "power2.in" });
      gsap.to(bottomRef.current, { y: 60, duration: 0.4, ease: "power2.in" });
    }
  }, [visible]);

  return (
    <>
      <div
        ref={topRef}
        style={
          {
            /* black bar top */
          }
        }
      />
      <div
        ref={bottomRef}
        style={
          {
            /* black bar bottom */
          }
        }
      />
    </>
  );
}
```

## Rules

- Always `.kill()` previous timeline before creating a new one
- Lock input via `GameManager.lockInput(true)` during cinematics
- Set phase to `'cinematic'` at start, restore to `'exploring'` at end
- Use `ease: 'power2.inOut'` for camera moves, `'power2.out'` for UI reveals
- Never use GSAP to animate values that R3F's `useFrame` already handles (positions updated every frame)
- Timelines are owned by `CinematicManager` — components trigger them, they don't create them
