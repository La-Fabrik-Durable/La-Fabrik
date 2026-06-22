# Système de cinématiques

## Vue d'ensemble

Les cinématiques de La Fabrik sont des séquences d'animation de caméra pilotées par des données JSON. Elles servent deux usages distincts :

1. **Cinématiques déclenchées par timecode** — jouées automatiquement à un instant précis du cycle de jeu (ex. la caméra drone de l'outro qui s'envole au-dessus de la ferme).
2. **Transitions de caméra impératives** — appelées directement depuis le code pour accompagner un changement d'état (ex. le passage en vue vélo dans `Ebike.tsx`).

Dans les deux cas, la caméra Three.js est animée via **GSAP** et le système verrouille les contrôles joueur pendant la durée de l'animation grâce au flag `isCinematicPlaying` du store global.

---

## Format `cinematics.json`

Le fichier `public/cinematics.json` est le manifeste de toutes les cinématiques déclenchées par timecode. Il est chargé au démarrage par `GameCinematics` et validé à la volée.

### Structure racine

```json
{
  "version": 1,
  "cinematics": [ /* CinematicDefinition[] */ ]
}
```

`version` doit valoir `1` — toute autre valeur lève une erreur de validation.

### `CinematicDefinition`

```json
{
  "id": "outro_farm_drone",      // identifiant unique (string)
  "timecode": 0,                 // délai en secondes depuis le démarrage de la scène
                                 // (optionnel — si absent, la cinématique n'est jamais
                                 // déclenchée automatiquement)
  "cameraKeyframes": [ /* CinematicCameraKeyframe[] */ ],
  "dialogueCues": [ /* CinematicDialogueCue[] — optionnel */ ]
}
```

### `CinematicCameraKeyframe`

```json
{
  "time": 0,                     // temps absolu dans la timeline de la cinématique (secondes)
  "position": [-24, 5, 65],      // position de la caméra [x, y, z]
  "target":   [-24, 2, 42]       // point visé par la caméra [x, y, z]
}
```

- Il faut **au minimum deux keyframes**.
- Les `time` doivent être **strictement croissants**.
- La durée de chaque segment est calculée automatiquement : `durée = keyframe[n].time - keyframe[n-1].time`.

### `CinematicDialogueCue` (optionnel)

```json
{
  "time": 3.5,                   // instant dans la timeline de la cinématique
  "dialogueId": "intro_narration" // identifiant dans dialogues.json
}
```

Les dialogues sont déclenchés en parallèle de l'animation caméra, sans bloquer la timeline GSAP.

---

## Exemple complet

```json
{
  "version": 1,
  "cinematics": [
    {
      "id": "outro_farm_drone",
      "timecode": 0,
      "cameraKeyframes": [
        { "time": 0,  "position": [-24, 5,  65],  "target": [-24, 2, 42] },
        { "time": 10, "position": [-24, 90, 200], "target": [-24, 0, 42] }
      ]
    }
  ]
}
```

La caméra part d'une position basse (hauteur 5) et monte progressivement jusqu'à une altitude de 90 en 10 secondes, tout en reculant sur l'axe Z — effet drone typique.

---

## Runtime — `GameCinematics`

**Fichier :** `src/world/GameCinematics.tsx`

### Montage

`GameCinematics` est un composant React Three Fiber (`useFrame` + `useEffect`) qui ne rend rien dans la scène (`return null`). Il est monté par `World.tsx` uniquement pendant l'état `"outro"` du jeu :

```tsx
{mainState === "outro" ? <GameCinematics /> : null}
```

Au montage, il charge en parallèle :
- `public/cinematics.json` via `loadCinematicManifest()`
- le manifeste de dialogues via `loadDialogueManifest()`

### Boucle de déclenchement (`useFrame`)

À chaque frame, le composant :

1. Calcule le **temps écoulé** depuis le montage (`clock.getElapsedTime() - startedAt`).
2. Parcourt toutes les cinématiques du manifeste.
3. Pour chaque cinématique dont le `timecode` est ≤ au temps écoulé et qui n'a pas encore été jouée, appelle `playCinematic()`.
4. Marque la cinématique comme jouée dans `playedCinematicsRef` (un `Set`) pour éviter toute répétition.

### Lecture d'une cinématique (`playCinematic`)

1. **Repositionnement immédiat** — la caméra est téléportée à la position du premier keyframe avant que GSAP démarre.
2. **Verrouillage des contrôles** — `useGameStore.setCinematicPlaying(true)` est appelé ; le pointer lock est relâché (`document.exitPointerLock()`).
3. **Construction de la timeline GSAP** — pour chaque segment entre keyframes consécutifs, deux tweens sont ajoutés en parallèle :
   - `camera.position` → position cible
   - `target` (vecteur `THREE.Vector3`) → point visé cible
   - Chaque tween utilise `ease: "power2.inOut"`.
   - La caméra exécute `camera.lookAt(target)` à chaque `onUpdate` pour rester orientée vers le point visé interpolé.
4. **Cues de dialogue** — chaque `dialogueCue` est planifié avec `timeline.call()` à son `time` respectif.
5. **Fin de cinématique** :
   - Si `mainState === "outro"` : le flag cinématique reste actif, et l'événement custom `"outro-cinematic-complete"` est émis sur `window`.
   - Sinon : `setCinematicPlaying(false)` est appelé pour rendre les contrôles au joueur.

### Easing

Tous les tweens utilisent `power2.inOut` (GSAP). Il n'y a pas de courbe de Bézier personnalisable par keyframe dans le format actuel.

---

## Transitions de caméra impératives

En dehors du système de manifeste, `GameCinematics.tsx` exporte deux fonctions utilitaires pour déclencher une transition depuis n'importe quel composant :

### `animateCameraTransition(targetPosition, targetLookAt, duration?, onComplete?)`

Anime la caméra vers une position + un point visé. Verrouille toujours les contrôles.

```ts
animateCameraTransition(
  [-10, 2, 30],   // position cible [x, y, z]
  [-10, 1, 10],   // point visé cible [x, y, z]
  1.5,            // durée en secondes (défaut : 1)
  () => { /* callback optionnel */ }
);
```

### `animateCameraTransformTransition(targetPosition, targetRotation, duration?, onComplete?, options?)`

Anime la caméra vers une position + une rotation exprimée en **degrés Euler (YXZ)**. La rotation est interpolée via SLERP de quaternions, ce qui évite le gimbal lock.

```ts
animateCameraTransformTransition(
  [0, 1.5, 5],    // position cible [x, y, z]
  [0, 180, 0],    // rotation cible en degrés [x, y, z], ordre YXZ
  0.8,
  () => { /* callback */ },
  { lockInput: false }  // ne verrouille pas les contrôles joueur
);
```

L'option `lockInput` (défaut `true`) permet de réaliser une transition purement cosmétique sans bloquer le joueur.

Ces fonctions partagent une timeline globale `cameraTransitionTimeline` — démarrer une nouvelle transition annule automatiquement la précédente (`.kill()`).

---

## Ajouter une cinématique

### 1. Cinématique automatique (déclenchée par timecode)

Ajouter une entrée dans `public/cinematics.json` :

```json
{
  "id": "ma_nouvelle_cinematique",
  "timecode": 5,
  "cameraKeyframes": [
    { "time": 0, "position": [0, 2, 10], "target": [0, 1, 0] },
    { "time": 4, "position": [0, 8, 20], "target": [0, 1, 0] }
  ],
  "dialogueCues": [
    { "time": 1.5, "dialogueId": "mon_dialogue" }
  ]
}
```

**Points de vigilance :**
- `timecode` est relatif au montage de `GameCinematics` (i.e. à l'entrée dans l'état `"outro"`).
- Si deux cinématiques ont le même `timecode`, elles se déclenchent toutes les deux ; la deuxième tuera la timeline GSAP de la première.
- Supprimer `timecode` rend la cinématique inactive (non déclenchée automatiquement).

### 2. Transition impérative depuis le code

Importer et appeler l'une des deux fonctions utilitaires :

```ts
import {
  animateCameraTransition,
  animateCameraTransformTransition,
} from "@/world/GameCinematics";

// Dans un handler d'événement, un useEffect, etc.
animateCameraTransition([x, y, z], [tx, ty, tz], 1, () => {
  // suite du flow après la transition
});
```

Aucune entrée JSON n'est nécessaire pour une transition impérative.

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `public/cinematics.json` | Données des cinématiques (manifeste) |
| `src/types/cinematics/cinematics.ts` | Types TypeScript du manifeste |
| `src/utils/cinematics/loadCinematicManifest.ts` | Chargement HTTP du manifeste |
| `src/utils/cinematics/cinematicManifestValidation.ts` | Validation et parsing runtime |
| `src/world/GameCinematics.tsx` | Runtime : lecture, déclenchement, transitions |
| `src/managers/stores/useGameStore.ts` | Flag `isCinematicPlaying` (verrouillage contrôles) |
