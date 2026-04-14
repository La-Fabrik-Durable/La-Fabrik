# Skill — React Three Fiber

## Component pattern

Every 3D scene object is a React component. No class-based scene objects.

```tsx
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export function MyObject() {
  const ref = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/my-object.glb");

  useFrame((_, delta) => {
    // per-frame logic here
  });

  return <primitive ref={ref} object={gltf.scene.clone()} />;
}
```

## Rules

- Scene components return JSX with Three.js elements (`<mesh>`, `<group>`, `<primitive>`)
- Use `useRef` for mutable per-frame values — never `useState`
- Use `useFrame` for animation loops — never `requestAnimationFrame`
- Use `useGLTF` / `useTexture` from drei for asset loading — they handle caching
- Clone scenes with `.clone()` when reusing a GLTF in multiple places
- Cleanup in `useEffect` return — stop AnimationMixers, dispose owned resources

## Loading assets

```tsx
// Models
const gltf = useGLTF("/models/workshop/ebike.glb");

// Textures
const [diffuse, normal] = useTexture([
  "/textures/wall_diffuse.jpg",
  "/textures/wall_normal.jpg",
]);

// Preload (call outside component)
useGLTF.preload("/models/map/base.glb");
```

## Physics (Rapier)

```tsx
import { RigidBody, CuboidCollider } from "@react-three/rapier";

<RigidBody type="fixed">
  <CuboidCollider args={[10, 0.1, 10]} />
  <mesh>
    <boxGeometry args={[20, 0.2, 20]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>;
```

- Wrap physics scene in `<Physics>` component
- `type="fixed"` for static colliders (ground, walls)
- `type="dynamic"` for movable objects
- Player uses `type="dynamic"` with `lockRotations`

## Postprocessing

```tsx
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

<EffectComposer>
  <Bloom intensity={0.5} luminanceThreshold={0.9} />
  <Vignette offset={0.3} darkness={0.5} />
</EffectComposer>;
```

- Always wrap in `<EffectComposer>`
- Keep effects minimal for performance
- Disable heavy effects on low-end devices via Debug panel

## What NOT to do

- Do not use `new THREE.Scene()` or `new THREE.WebGLRenderer()` — R3F handles this
- Do not use `requestAnimationFrame` — use `useFrame`
- Do not store per-frame values in `useState` — use `useRef`
- Do not manually append to DOM — everything goes through `<Canvas>`
