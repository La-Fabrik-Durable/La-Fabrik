# Pathfinding

Le système de pathfinding génère des itinéraires pour le GPS de l'Ebike : le joueur monte sur le vélo, un point de destination est calculé selon l'étape de mission courante, et l'écran GPS montre la route à suivre.

---

## Architecture

Le module expose deux implémentations A* indépendantes :

### 1. A* sur grille bitmap (`AStar.ts` + `Grid.ts` + `ImageToGrid.ts`)

Approche ancienne / générique. Une image N&B est chargée et convertie en grille booléenne (blanc = praticable). L'algorithme A* parcourt cette grille avec un mouvement 8-directionnel (orthogonal + diagonal). Heuristique : distance octile.

- `ImageToGrid.ts` — charge l'image via un canvas offscreen, seuille la luminosité pixel par pixel (défaut : 128) et produit un `Grid`.
- `Grid.ts` — structure de données 2D. Méthode `reset()` réinitialise les coûts entre deux calculs. `getNeighbors()` empêche le passage en diagonale si les deux voisins orthogonaux sont bloqués (no corner-cutting).
- `AStar.ts` — `findPath(grid, start, end, allowDiagonals)` : open set linéaire (tableau), fermeture par `Set`. Si la destination est non-praticable, bascule automatiquement vers le voisin praticable le plus proche.

**Statut actuel** : cette pipeline est exposée via `useGPS` et `GPSMinimap`, mais n'est pas utilisée en production sur l'Ebike. Elle reste disponible pour d'autres cas d'usage.

---

### 2. A* sur graphe de waypoints (`WaypointAStar.ts`)

Implémentation active utilisée par l'Ebike. Le réseau routier est un graphe de nœuds 3D chargé depuis `roadNetwork.json`.

**Structures de données** (`types.ts`) :

```ts
interface Waypoint {
  id: number;
  x: number;     // coordonnée monde Three.js
  y: number;
  z: number;
  connections: number[];  // IDs des waypoints voisins (graphe non orienté)
}

interface WaypointNode extends Waypoint {
  g: number;   // coût depuis le départ
  h: number;   // heuristique (distance euclidienne 3D vers la cible)
  f: number;   // g + h
  parent: WaypointNode | null;
}
```

**Algorithme** (`WaypointAStar.ts`) :

1. `findClosestWaypoint(waypoints, pos)` — snap de la position monde vers le waypoint le plus proche (distance euclidienne 3D).
2. `findWaypointPath(waypoints, startWorldPos, endWorldPos)` — snap start/end, copie les waypoints en `WaypointNode`, exécute A* sur le graphe de connexions. Coût de déplacement = distance euclidienne 3D entre nœuds adjacents. Retourne un tableau ordonné de `Waypoint`.

Open set : tableau avec recherche linéaire du minimum (acceptable pour un graphe de ~172 nœuds).

---

## Réseau de routes (`public/roadNetwork.json`)

Fichier JSON statique, tableau de `Waypoint`. Actuellement **172 nœuds**. Exemple :

```json
{
  "id": 4,
  "x": -3.35,
  "y": 6.48,
  "z": -22.71,
  "connections": [3, 5, 69, 157]
}
```

Les coordonnées sont en unités monde Three.js. Les connexions sont bidirectionnelles par convention (si A connecte B, B doit aussi lister A).

`EbikeGPSMap` charge ce fichier au montage depuis `/roadNetwork.json`, avec fallback sur `localStorage` (`la-fabrik-waypoints`) pour permettre un rechargement à chaud sans rebuild.

---

## Intégration

```
Ebike.tsx
  └── <EbikeGPSMap startPos={bikeWorldPos} destPos={missionTarget} />
        └── EbikeGPSMap.tsx
              ├── fetch("/roadNetwork.json")          → waypoints[]
              ├── findClosestWaypoint(waypoints, startPos)
              ├── findClosestWaypoint(waypoints, destPos)
              ├── findWaypointPath(waypoints, snappedStart, snappedDest)
              └── draw() @ 60 FPS → CanvasTexture sur ShaderMaterial
```

**`Ebike.tsx`** calcule `destPos` via un `useMemo` qui mappe `ebikeStep` (étape de mission courante dans le store) vers des coordonnées monde fixes. La prop est passée directement à `EbikeGPSMap`.

**`EbikeGPSMap.tsx`** gère intégralement le cycle de vie :
- chargement du réseau de routes et de l'image de fond (optionnelle)
- snap automatique des positions
- recalcul A* en `useMemo` (recalculé si `startPos`, `destPos` ou `waypoints` changent)
- rendu 60 FPS sur un `CanvasTexture` Three.js (animation du point pulsant sur la route)
- shader GLSL de masque circulaire Fresnel (bord fondu de l'écran GPS)

---

## Modifier le réseau de routes

### Ajouter un nœud

1. Ouvrir `public/roadNetwork.json`.
2. Ajouter un objet avec un `id` unique (incrémenter le max courant), les coordonnées monde `x`, `y`, `z`, et la liste `connections` des IDs voisins.
3. Mettre à jour les nœuds voisins existants pour qu'ils référencent ce nouvel `id` dans leur propre tableau `connections`.

### Supprimer un nœud

Retirer l'objet du tableau **et** purger son `id` de tous les tableaux `connections` des nœuds voisins. Un `id` orphelin dans `connections` est silencieusement ignoré par `findWaypointPath` (`nodeMap.get(neighborId)` retourne `undefined`).

### Ajouter une destination de mission

Dans `Ebike.tsx`, le `useMemo` qui calcule `destPos` mappe les étapes de mission à des coordonnées. Ajouter un cas dans ce switch/map en pointant vers un waypoint existant ou une coordonnée monde (le snap automatique trouvera le waypoint le plus proche).

### Rechargement à chaud (dev)

`EbikeGPSMap` lit d'abord `localStorage.getItem("la-fabrik-waypoints")`. Pour tester un réseau modifié sans serveur :

```js
localStorage.setItem("la-fabrik-waypoints", JSON.stringify([/* ... */]));
```

Recharger la page. Pour revenir au fichier statique : `localStorage.removeItem("la-fabrik-waypoints")`.

---

## Réglages de performance

| Paramètre | Emplacement | Effet |
|---|---|---|
| `canvasSize` | prop `EbikeGPSMap` | Résolution de la texture GPS (défaut 1024). Réduire améliore les perfs GPU. |
| `zoom` | prop `EbikeGPSMap` | Zoom centré sur le joueur (1 = vue globale). |
| Taille du graphe | `roadNetwork.json` | L'open set est linéaire ; au-delà de quelques centaines de nœuds, envisager un heap binaire. |
