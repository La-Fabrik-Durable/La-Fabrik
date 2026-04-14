# Skill — Three.js

## AnimationMixer

The standard way to play GLTF animations in this project:

```tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";

export function AnimatedObject() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/object.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    actions["Idle"]?.play();
    return () => {
      actions["Idle"]?.stop();
    };
  }, [actions]);

  return <primitive ref={group} object={scene.clone()} />;
}
```

### Manual mixer (when drei's useAnimations is not enough)

```tsx
const mixer = useRef<THREE.AnimationMixer | null>(null);

useEffect(() => {
  mixer.current = new THREE.AnimationMixer(gltf.scene);
  const clip = gltf.animations.find((a) => a.name === "Walk");
  if (clip) mixer.current.clipAction(clip).play();

  return () => {
    mixer.current?.stopAllAction();
    mixer.current = null;
  };
}, [gltf]);

useFrame((_, delta) => {
  mixer.current?.update(delta);
});
```

## Materials

- Prefer `meshStandardMaterial` for PBR
- Use `meshBasicMaterial` for unlit UI elements or hologram base
- Custom shaders go in `src/shaders/` as `.glsl` files

```tsx
<mesh>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial
    color="#4a90d9"
    roughness={0.4}
    metalness={0.6}
    map={diffuseTexture}
    normalMap={normalTexture}
  />
</mesh>
```

## Raycasting

In R3F, raycasting is built into the event system:

```tsx
<mesh
  onClick={(e) => {
    e.stopPropagation()
    // handle click on this mesh
  }}
  onPointerOver={() => setHovered(true)}
  onPointerOut={() => setHovered(false)}
>
```

For custom raycasting, use `useThree` to access the raycaster:

```tsx
const { raycaster, camera, scene } = useThree();
```

## Rules

- Never instantiate `THREE.WebGLRenderer` or `THREE.Scene` — R3F owns these
- Use `useThree()` to access renderer, camera, scene, gl, size
- Texture format: prefer `.jpg` for diffuse, `.png` for alpha, `.hdr`/`.exr` for HDRI
- Model format: always `.glb` (binary GLTF) — smaller and faster than `.gltf`
- Keep triangle count reasonable per zone: aim for < 100k tris visible at once
