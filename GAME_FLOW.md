# Game Flow - La Fabrik

## Étapes du jeu

```
intro → start-intro → naming → bienvenue → star-move → outOfFabrik
```

---

## Détail des étapes

### 1. `intro` (initial)

- État initial au chargement du jeu
- Aucune action, juste une étape de départ

### 2. `start-intro`

- **Déclenchement** : Auto-transition depuis `intro` quand la scène est chargée
- **Action** : Joue l'audio d'intro via `AudioManager.playSoundWithCallback()`
- **Attente** : Attend que l'audio se termine
- **Transition** : Vers `naming` quand l'audio se termine

### 3. `naming`

- **Déclenchement** : Quand l'audio d'intro se termine
- **Action** : Affiche un input pour demander le prénom du joueur
- **Attente** : L'utilisateur entre son prénom et valide
- **Transition** : Vers `bienvenue` quand l'utilisateur valide

### 4. `bienvenue`

- **Déclenchement** : Quand l'utilisateur valide son prénom
- **Actions** :
  - Affiche "Bienvenue {prénom} !" à l'écran
  - Joue l'audio de bienvenue
- **Attente** : Attend que l'audio se termine
- **Transition** : Vers `star-move` quand l'audio se termine

### 5. `star-move`

- **Déclenchement** : Quand l'audio de bienvenue se termine
- **Action** : Active le mouvement du joueur (`setCanMove(true)`)
- **État** : Le joueur peut maintenant se déplacer librement
- **Zone** : La détection de zone devient active (ZoneDetection)

### 6. `outOfFabrik`

- **Déclenchement** : Quand le joueur entre dans la zone de sortie
- **Action** : Transition vers l'étape finale
- **Zone** : Détectée par `ZoneDetection` quand le joueur approche de la position configurée

---

## Fichiers clés

| Fichier                                  | Rôle                                                          |
| ---------------------------------------- | ------------------------------------------------------------- |
| `src/stateManager/GameStepManager.ts`    | Gère l'état global du jeu (étape actuelle, prénom, mouvement) |
| `src/components/game/GameFlow.tsx`       | Gère les transitions automatiques et la lecture audio         |
| `src/components/ui/IntroUI.tsx`          | Affiche l'input pour le prénom                                |
| `src/components/ui/BienvenueDisplay.tsx` | Affiche le message de bienvenue                               |
| `src/components/zone/ZoneDetection.tsx`  | Détecte quand le joueur entre dans une zone                   |
| `src/data/audioConfig.ts`                | Chemins des fichiers audio                                    |
| `src/data/zones.ts`                      | Configuration des zones de transition                         |

---

## Configuration audio

```typescript
// src/data/audioConfig.ts
export const AUDIO_PATHS = {
  intro: "/sounds/fa.mp3", // Audio joué pendant start-intro
  bienvenue: "/sounds/fa.mp3", // Audio joué pendant bienvenue
};
```

---

## Configuration des zones

```typescript
// src/data/zones.ts
export const ZONES: Zone[] = [
  {
    id: "fabrikExit",
    position: [50, 0, 50], // Position de la zone de sortie
    radius: 10, // Rayon de détection
    height: 20, // Hauteur de la zone (pour la visualisation)
    targetStep: "outOfFabrik", // Étape cible quand on entre dans la zone
  },
];
```

---

## Debug

En mode debug (`?debug` dans l'URL), on peut voir :

- **Game Step** : L'étape actuelle dans le panneau lil-gui
- **Player Position** : Position X, Y, Z du joueur en temps réel
- **Zone Visualization** : Anneaux visuels au sol pour les zones

---

## Notes techniques

- Le mouvement du joueur est bloqué tant que `canMove` est `false`
- `useSyncExternalStore` est utilisé pour synchroniser l'état du jeu avec React
- Les transitions sont gérées par le `GameStepManager` via le pattern singleton
- L'audio utilise un callback `onEnded` pour déclencher les transitions automatiques
