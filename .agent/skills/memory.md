# Skill — GPU Memory Management

## Principle

Dispose only what you own. Never blindly traverse and dispose shared or cached assets.

## What to dispose

| Resource                           | When to dispose                      |
| ---------------------------------- | ------------------------------------ |
| Custom `THREE.ShaderMaterial`      | When the component using it unmounts |
| `THREE.WebGLRenderTarget`          | When the pass or effect is destroyed |
| Manually created `THREE.Geometry`  | When no longer needed                |
| Manually created `THREE.Texture`   | When no longer needed                |
| Cloned scenes with owned materials | When the clone is removed            |

## What NOT to dispose

| Resource                         | Why                                             |
| -------------------------------- | ----------------------------------------------- |
| GLTF scenes loaded via `useGLTF` | drei caches them — disposing breaks other users |
| Textures loaded via `useTexture` | drei caches them — same reason                  |
| Shared materials from a GLTF     | Other instances may reference them              |

## Dispose utility

```ts
// src/utils/Dispose.ts
import * as THREE from "three";

export class Dispose {
  static material(material: THREE.Material): void {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    }
    material.dispose();
  }

  static mesh(mesh: THREE.Mesh): void {
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of materials) {
      if (mat) this.material(mat);
    }
  }

  static renderTarget(rt: THREE.WebGLRenderTarget): void {
    rt.texture.dispose();
    rt.dispose();
  }
}
```

## Usage in React components

```tsx
useEffect(() => {
  const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader });
  meshRef.current.material = material;

  return () => {
    Dispose.material(material);
  };
}, []);
```

## Usage in managers

```ts
destroy(): void {
  if (this.renderTarget) {
    Dispose.renderTarget(this.renderTarget)
    this.renderTarget = null
  }
  SomeManager._instance = null
}
```

## Rules

- Every `useEffect` that creates a GPU resource must return a cleanup that disposes it
- Every manager `destroy()` must dispose its owned GPU resources
- Never call `.dispose()` on assets returned by drei loaders (`useGLTF`, `useTexture`)
- When in doubt, don't dispose — a small leak is better than a crash from disposing shared resources
