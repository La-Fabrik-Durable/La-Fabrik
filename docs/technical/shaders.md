# Shaders custom

## Vue d'ensemble

La-Fabrik utilise des `ShaderMaterial` Three.js pour des effets visuels qui ne peuvent pas être obtenus avec les matériaux standard (`MeshStandardMaterial`, `MeshBasicMaterial`, etc.). Les shaders custom permettent un contrôle total sur le pipeline GLSL — distorsion géométrique, patterns procéduraux, lighting maison.

Tous les shaders sont centralisés dans `src/shaders/` sous forme de fonctions factory TypeScript qui retournent un `ShaderMaterial` configuré. Pas de fichiers `.glsl` séparés : le GLSL est inliné dans les template strings pour simplifier l'import.

---

## Catalogue des shaders

### NetShader

**Fichier :** `src/shaders/NetShader.ts`  
**Utilisé dans :** `src/components/three/debug/NetTest.tsx`

#### Effet visuel

Grille rose/magenta sur fond sombre avec deux effets combinés :

1. **Distorsion pincushion** — les UV sont déformés depuis le centre, ce qui bombe la grille vers l'extérieur comme un écran CRT. L'intensité est contrôlée par `uPincushionStrength`.
2. **Bloom sur les lignes** — les lignes de la grille ont un halo lumineux additionné à leur couleur de base.

L'uniform `uTime` est incrémenté chaque frame dans `NetTest.tsx` via `useFrame`, mais la grille elle-même n'est pas encore animée (l'uniform est disponible pour une évolution future).

#### Uniforms

| Uniform | Type | Valeur par défaut | Rôle |
|---|---|---|---|
| `uTime` | `float` | `0` | Temps écoulé en secondes (incrémenté par `useFrame`) |
| `uGridScale` | `float` | `15.0` | Nombre de cellules de la grille sur chaque axe |
| `uPincushionStrength` | `float` | `0.4` | Intensité de la distorsion pincushion (0 = aucune) |
| `uBloomIntensity` | `float` | `0.3` | Intensité du halo lumineux sur les lignes |
| `uGridThickness` | `float` | `0.02` | Épaisseur des lignes (en fraction d'une cellule) |

#### Varyings

- `vUv` — coordonnées UV interpolées du vertex shader vers le fragment shader.

#### Fonctions GLSL internes

- `applyPincushion(uv, strength)` — applique la distorsion barrel/pincushion sur les UV.
- `grid(uv, scale, thickness)` — retourne un masque `[0, 1]` pour les lignes de la grille avec anti-aliasing via `smoothstep`.

#### Usage dans NetTest

```tsx
// src/components/three/debug/NetTest.tsx
const materialRef = useRef<THREE.ShaderMaterial>(null);

useFrame((_, delta) => {
  const timeUniform = materialRef.current?.uniforms.uTime;
  if (timeUniform) timeUniform.value += delta;
});
```

`createNetMesh()` est aussi exportée — elle crée un `PlaneGeometry(2, 2)` avec le shader déjà attaché, pratique hors contexte React/R3F.

---

### UnicolorShader

**Fichier :** `src/shaders/UnicolorShader.ts`  
**Utilisé dans :** non consommé actuellement (aucun import détecté dans `src/`)

#### Effet visuel

Matériau de couleur unie avec un éclairage directionnel simplifié calculé dans le fragment shader. Reproduit un rendu Lambertien (diffuse + ambient) sans dépendre du système de lumières Three.js — utile pour des meshes de debug ou des éléments qui doivent ignorer la scène lumineuse.

La direction de lumière est fixe à `vec3(1.0, 1.0, 1.0)` (diagonale haut-droite-avant), non configurable via uniform.

#### Uniforms

| Uniform | Type | Valeur par défaut | Rôle |
|---|---|---|---|
| `uColor` | `vec3` | _passé à la factory_ | Couleur de base du matériau |

#### Varyings

- `vNormal` — normale du vertex transformée dans l'espace caméra.
- `vPosition` — position du vertex dans l'espace caméra (calculée mais non utilisée dans le fragment shader actuel).

#### Calcul lumière

```glsl
float diffuse = max(dot(vNormal, lightDir), 0.0);
float ambient = 0.3;
vec3 finalColor = uColor * (ambient + diffuse * 0.7);
```

Contribution totale : 30% ambient + 70% diffuse max.

#### Instanciation

```ts
import { createUnicolorShader } from "@/shaders/UnicolorShader";
import { Color } from "three";

const mat = createUnicolorShader(new Color(0xff6699));
// ou en string CSS :
const mat2 = createUnicolorShader("#ff6699");
```

---

## Ajouter un shader

### 1. Créer le fichier dans `src/shaders/`

Nommer le fichier `NomEffetShader.ts`. Convention : une fonction factory `createNomEffetShader()` qui retourne un `ShaderMaterial`.

```ts
// src/shaders/ExempleShader.ts
import { ShaderMaterial } from "three";

export const createExempleShader = (): ShaderMaterial => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMonParam: { value: 1.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uMonParam;
      varying vec2 vUv;

      void main() {
        // effet ici
        gl_FragColor = vec4(vUv, 0.0, 1.0);
      }
    `,
  });
};
```

### 2. Consommer dans un composant R3F

Utiliser `useRef<THREE.ShaderMaterial>` pour accéder aux uniforms dans `useFrame` :

```tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createExempleShader } from "@/shaders/ExempleShader";

export function MonEffet() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <primitive object={createExempleShader()} ref={matRef} attach="material" />
    </mesh>
  );
}
```

### Bonnes pratiques

- **Préfixer les uniforms avec `u`** et les varyings avec `v` — convention déjà en place dans le projet.
- **Ne pas appeler `createXxxShader()` dans le JSX sans `useMemo`** — cela recrée le `ShaderMaterial` à chaque render. Soit utiliser `<primitive object={...} ref={matRef}>` avec une instance stable, soit mémoriser avec `useMemo`.
- **Documenter chaque uniform** dans ce fichier lors de l'ajout d'un nouveau shader.
