# WebGL Context Lost - Investigation

## Résumé court

Le projet subit des pertes de contexte WebGL pendant les phases où le jeu active
ou prépare le hand tracking, les interactions physiques ou le repair game.

Le symptôme visible côté console est :

```txt
THREE.WebGLRenderer: Context Lost.
[ERROR] [WebGL] Context lost - attempting auto-restore
THREE.WebGLRenderer: Context Restored.
```

Le problème est bloquant parce que le hand tracking et le repair game sont au
coeur de l'expérience. Quand le contexte WebGL saute, la scène Three.js peut se
remonter, le joueur peut revenir au spawn, le pointer lock peut être perdu, et
les tests de gameplay deviennent instables.

## Ce qui fonctionne aujourd'hui

La page principale monte un `<Canvas>` React Three Fiber dans
`src/pages/page.tsx`.

`src/world/World.tsx` compose ensuite :

- la scène de jeu ou la scène de test physique ;
- le player ;
- les systèmes visuels de monde ;
- les gants de hand tracking ;
- les systèmes de debug.

Le hand tracking est centralisé dans
`src/providers/gameplay/HandTrackingProvider.tsx`.

Il peut utiliser deux sources :

- `browser` : MediaPipe JS dans le navigateur ;
- `backend` : backend Python local via WebSocket.

L'activation est déclenchée par :

- certaines étapes du repair game ;
- les zones d'interaction qui demandent explicitement les mains ;
- la scène Physique en debug, selon les objets présents.

## Problème observé

Les context lost arrivent dans plusieurs situations :

- entrée dans une zone d'interaction ;
- lancement du hand tracking ;
- lancement d'un repair game ;
- scène Physique avec `TestMap`, `Physics`, `AnimatedModel`, waypoints GPS et
  objets interactifs ;
- source browser JS ;
- source backend.

Le fait que le crash existe avec les deux sources indique que le problème n'est
probablement pas limité au backend Python ni à MediaPipe JS seul. Le hand
tracking semble être un déclencheur fort, mais il arrive au moment où plusieurs
ressources GPU et systèmes runtime se réveillent ensemble.

## Pourquoi c'est bloquant

Ce bug bloque la feature principale du projet :

- le repair game dépend du hand tracking pour valider certaines actions ;
- les interactions main sont nécessaires pour tester les objets grabbables ;
- un context lost casse la continuité du gameplay ;
- le joueur peut être replacé au spawn après reconstruction ;
- le pointer lock peut être perdu ;
- les logs deviennent difficiles à lire parce que le jeu tente de restaurer la
  scène en boucle ;
- le comportement n'est pas fiable pour une démo ou un déploiement.

Tant que ce problème n'est pas stable, on ne peut pas valider correctement :

- la mission e-bike ;
- la mission pylône ;
- la mission ferme ;
- les interactions main ;
- le switch browser/backend ;
- le comportement en build de production.

## Hypothèses principales

### 1. Pression GPU au lancement du hand tracking

MediaPipe browser peut créer ses propres ressources GPU. Si Three.js charge
déjà beaucoup de géométries, textures, ombres et modèles, l'ajout du hand
tracking peut faire passer le navigateur au-dessus d'une limite GPU.

Le stash contient une tentative de mitigation en forçant MediaPipe browser et le
backend à utiliser le CPU.

### 2. Activation trop brusque du runtime mains

Les logs montrent des transitions rapides :

```txt
Browser JS runtime starting
Runtime source selected
Runtime snapshot changed
Browser JS runtime stopped
Browser JS runtime starting
```

Ce type de start/stop rapide peut provoquer :

- création webcam ;
- création MediaPipe ;
- montage des gants ;
- update du state React ;
- re-render du monde ;
- stress GPU au même moment.

### 3. Les gants 3D sont montés trop tôt

Si les gants de hand tracking sont montés avant d'avoir de vraies mains
détectées, le jeu charge et prépare des modèles GPU sans utilité immédiate.

Le stash contient une tentative pour ne rendre les gants que lorsqu'une main
existe réellement dans le snapshot.

### 4. Re-upload textures / GLTF trop agressif

`src/utils/three/optimizeGLTFScene.ts` modifie des textures GLTF. Si cette
optimisation force trop souvent `needsUpdate`, mipmaps ou anisotropy, le
navigateur peut recharger beaucoup de textures vers le GPU.

Le stash limite cette pression en évitant de forcer les mipmaps et en abaissant
l'anisotropy.

### 5. Permission caméra au mauvais moment

Demander la caméra au moment exact où le joueur entre dans une interaction ou
lance le repair game ajoute un gros événement runtime au pire moment.

Le stash contient une tentative de warmup caméra pour obtenir la permission plus
tôt et réutiliser le stream au moment où le hand tracking devient nécessaire.

### 6. La scène Physique ajoute du bruit

La scène Physique est une scène de test volontairement riche :

- `Physics` Rapier ;
- `GrabbableObject` ;
- `TriggerObject` ;
- `RepairGame` ;
- `AnimatedModel` ;
- GPS preview ;
- waypoints verts ;
- player ;
- debug overlay.

Cette richesse est normale pour une scène de test, mais elle complique
l'investigation parce qu'elle active beaucoup de systèmes à la fois.

## Fichiers modifiés dans le stash

Le stash `stash@{0}` contient 28 fichiers modifiés, environ `+530 / -152`.
Il ne contient pas de fichiers untracked.

| Fichier                                                   | Rôle dans l'investigation                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `README.md`                                               | Note sur les commandes backend depuis la racine du repo.                                  |
| `backend/README.md`                                       | Documentation plus claire pour lancer le backend et réparer un `.venv` cassé.             |
| `backend/hand_tracker.py`                                 | Force le backend MediaPipe en CPU.                                                        |
| `docs/user/main-feature.md`                               | Ajustements de documentation utilisateur.                                                 |
| `public/sounds/dialogue/subtitles/fr/electricienne.srt`   | Ajustements de sous-titres, pas central pour le context lost.                             |
| `public/sounds/dialogue/subtitles/fr/narrateur.srt`       | Ajustements de sous-titres, pas central pour le context lost.                             |
| `src/components/debug/DebugPlayerModel.tsx`               | Ajustements de modèle debug player.                                                       |
| `src/components/three/handTracking/HandTrackingGlove.tsx` | Retire le preload automatique des gants pour réduire la pression GPU.                     |
| `src/components/three/interaction/GrabbableObject.tsx`    | Marque les grabbables qui nécessitent vraiment le hand tracking.                          |
| `src/components/three/interaction/InteractableObject.tsx` | Ajoute le flag `handTracking` aux interactables.                                          |
| `src/data/debug/testSceneConfig.ts`                       | Stabilise la scène Physique : sol, GPS, hauteur des waypoints.                            |
| `src/data/handTrackingConfig.ts`                          | Ajoute délai d'activation, TTL warmup caméra, delegate CPU browser.                       |
| `src/data/player/playerConfig.ts`                         | Corrige le spawn Physique avec `PLAYER_EYE_HEIGHT`.                                       |
| `src/hooks/debug/useSceneMode.ts`                         | Force `game` hors debug actif pour éviter des scènes debug en prod.                       |
| `src/hooks/handTracking/useBothFistsHold.ts`              | Sort le hold des deux poings de `useFrame` R3F vers `requestAnimationFrame`.              |
| `src/hooks/handTracking/useBrowserHandTracking.ts`        | Encadre `detectForVideo`, release MediaPipe en cleanup, gère les erreurs.                 |
| `src/hooks/three/useTerrainHeight.ts`                     | Ajustements terrain, liés au snap/player.                                                 |
| `src/lib/handTracking/browserHandTracking.ts`             | Force delegate CPU, garde une instance MediaPipe, ajoute `releaseBrowserHandLandmarker`.  |
| `src/lib/handTracking/handTrackingSession.ts`             | Ajoute warmup caméra, cache stream, timeout et consommation du stream préparé.            |
| `src/managers/InteractionManager.ts`                      | Ajoute `handTrackingNearby` pour ne pas activer les mains sur toute interaction.          |
| `src/pages/page.tsx`                                      | Gestion WebGL context lost/restored, DPR fixe, antialias off, release MediaPipe au crash. |
| `src/providers/gameplay/HandTrackingProvider.tsx`         | Ajoute activation différée, snapshot queued, warmup runtime.                              |
| `src/types/interaction/interaction.ts`                    | Ajoute `handTracking` et `handTrackingNearby` aux types interaction.                      |
| `src/utils/debug/Debug.ts`                                | Synchronise l'affichage du controller hand tracking source.                               |
| `src/utils/three/optimizeGLTFScene.ts`                    | Réduit la pression GPU des textures GLTF.                                                 |
| `src/world/World.tsx`                                     | Ne rend les gants que si une main correspondante est détectée.                            |
| `src/world/debug/TestMap.tsx`                             | Nettoie les logs, stabilise waypoints/GPS/scène Physique.                                 |
| `src/world/player/PlayerCamera.tsx`                       | Ajustements pointer lock/canvas ciblé.                                                    |

## Fichiers actuellement modifiés dans le worktree

Etat observé au moment de cette note :

| Fichier                                                   | Statut                                                    |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `public/models/talkie/*`                                  | Beaucoup d'anciennes textures/fichiers `.gltf` supprimés. |
| `public/models/talkie/model.glb`                          | Nouveau fichier non suivi.                                |
| `src/components/three/handTracking/HandTrackingGlove.tsx` | Modifié.                                                  |
| `src/data/debug/testSceneConfig.ts`                       | Modifié.                                                  |
| `src/data/gameplay/repairMissions.ts`                     | Modifié.                                                  |
| `src/data/handTrackingConfig.ts`                          | Modifié.                                                  |
| `src/data/player/playerConfig.ts`                         | Modifié.                                                  |
| `src/data/world/mapLodConfig.ts`                          | Modifié.                                                  |
| `src/hooks/handTracking/useBrowserHandTracking.ts`        | Modifié.                                                  |
| `src/hooks/handTracking/useRemoteHandTracking.ts`         | Modifié.                                                  |
| `src/lib/handTracking/browserHandTracking.ts`             | Modifié.                                                  |
| `src/lib/handTracking/handTrackingSession.ts`             | Modifié.                                                  |
| `src/pages/page.tsx`                                      | Modifié.                                                  |
| `src/providers/gameplay/HandTrackingProvider.tsx`         | Modifié.                                                  |
| `src/utils/debug/Debug.ts`                                | Modifié.                                                  |
| `src/utils/three/optimizeGLTFScene.ts`                    | Modifié.                                                  |
| `src/world/World.tsx`                                     | Modifié.                                                  |
| `src/world/debug/TestMap.tsx`                             | Modifié.                                                  |
| `src/world/player/Player.tsx`                             | Modifié.                                                  |
| `src/world/player/PlayerCamera.tsx`                       | Modifié.                                                  |
| `src/world/player/PlayerController.tsx`                   | Modifié.                                                  |
| `src/components/ui/RuntimeLoadingIndicator.tsx`           | Nouveau fichier non suivi.                                |
| `src/hooks/handTracking/useHandTrackingRuntimeWarmup.ts`  | Nouveau fichier non suivi.                                |
| `src/world/player/playerRuntimeSnapshot.ts`               | Nouveau fichier non suivi.                                |

Attention : les fichiers supprimés/nouveaux du talkie semblent être un sujet
séparé du context lost. Il faut les garder séparés dans les commits.

## Fichiers directement impactés par le bug

### Canvas et WebGL

- `src/pages/page.tsx`
- `src/world/World.tsx`
- `src/utils/three/optimizeGLTFScene.ts`

Ces fichiers influencent directement la charge GPU, la configuration du canvas,
les ressources GLTF et le comportement au context lost/restored.

### Hand tracking

- `src/providers/gameplay/HandTrackingProvider.tsx`
- `src/hooks/handTracking/useBrowserHandTracking.ts`
- `src/hooks/handTracking/useRemoteHandTracking.ts`
- `src/hooks/handTracking/useBothFistsHold.ts`
- `src/hooks/handTracking/useHandTrackingRuntimeWarmup.ts`
- `src/lib/handTracking/browserHandTracking.ts`
- `src/lib/handTracking/handTrackingSession.ts`
- `src/data/handTrackingConfig.ts`
- `src/components/three/handTracking/HandTrackingGlove.tsx`
- `backend/hand_tracker.py`

Ces fichiers contrôlent le déclenchement, la source, la caméra, MediaPipe, le
backend et le rendu visuel des mains.

### Interactions et repair game

- `src/components/three/interaction/GrabbableObject.tsx`
- `src/components/three/interaction/InteractableObject.tsx`
- `src/managers/InteractionManager.ts`
- `src/types/interaction/interaction.ts`
- `src/components/three/gameplay/RepairGame.tsx`
- `src/hooks/gameplay/useRepairMissionStep.ts`
- `src/hooks/gameplay/useRepairMovementLocked.ts`

Ces fichiers sont impactés parce que l'entrée dans une zone ou une étape repair
peut déclencher le hand tracking.

### Player et restauration après crash

- `src/world/player/Player.tsx`
- `src/world/player/PlayerCamera.tsx`
- `src/world/player/PlayerController.tsx`
- `src/world/player/playerRuntimeSnapshot.ts`
- `src/data/player/playerConfig.ts`

Ces fichiers influencent le spawn, la caméra, le pointer lock, et la possibilité
de récupérer la dernière position après un context lost.

### Scène Physique / debug

- `src/world/debug/TestMap.tsx`
- `src/data/debug/testSceneConfig.ts`
- `src/components/debug/DebugPlayerModel.tsx`
- `src/hooks/debug/useSceneMode.ts`
- `src/utils/debug/Debug.ts`

Ces fichiers ne sont pas forcément la cause racine, mais ils créent une scène de
stress utile pour reproduire le bug.

## Ce que le stash essayait de corriger

Le stash essaye de réduire le risque de context lost avec plusieurs leviers :

1. passer MediaPipe browser/backend en CPU ;
2. libérer MediaPipe quand le runtime s'arrête ou quand WebGL saute ;
3. éviter de monter les gants sans mains détectées ;
4. retarder l'activation du hand tracking pour éviter les start/stop violents ;
5. demander la caméra plus tôt et réutiliser le stream ;
6. réduire la charge GPU du canvas avec DPR fixe et antialias off ;
7. limiter les re-uploads de textures GLTF ;
8. distinguer les interactions qui demandent vraiment le hand tracking ;
9. restaurer WebGL avec une limite pour éviter les boucles infinies ;
10. conserver la position du joueur après restauration.

## Ce qui reste à prouver

Il faut encore isoler le déclencheur exact :

- crash avec hand tracking désactivé complètement ;
- crash avec source browser JS seulement ;
- crash avec source backend seulement ;
- crash avec gants 3D désactivés ;
- crash avec MediaPipe CPU ;
- crash avec `AnimatedModel` de TestMap désactivé ;
- crash avec GPS preview/waypoints désactivés ;
- crash avec shadows/antialias/DPR réduits ;
- crash en scène game réelle, pas seulement scène Physique.

## Plan d'investigation recommandé

1. Stabiliser le worktree et ne pas mélanger assets talkie, LOD, docs backend et
   context lost dans le même commit.
2. Garder le stash tant que le fix final n'est pas validé.
3. Créer un commit ou patch isolé pour les logs context lost seulement.
4. Ajouter un switch debug qui permet de couper séparément :
   - hand tracking runtime ;
   - gants 3D ;
   - MediaPipe browser ;
   - backend ;
   - GPS preview ;
   - AnimatedModel de TestMap.
5. Reproduire le bug avec une matrice claire.
6. Garder les changements qui diminuent réellement les context lost.
7. Supprimer les logs temporaires une fois le diagnostic terminé.

## Recommandation Git

Ne pas supprimer le stash maintenant.

Il contient du travail réel sur le context lost. Même s'il n'est pas parfait, il
sert de trace d'investigation et contient des morceaux utiles.

Avant de le supprimer, sauvegarder le patch :

```bash
git stash show -p stash@{0} > context-lost-stash.patch
```

Ensuite seulement, si tout a été repris dans des commits propres :

```bash
git stash drop stash@{0}
```

## Commits logiques proposés

Séparer en plusieurs commits pour éviter un gros commit illisible :

1. `docs: document webgl context lost investigation`
2. `fix: reduce handtracking gpu pressure`
3. `fix: delay handtracking activation`
4. `fix: preserve player state after webgl restore`
5. `fix: stabilize physics debug scene`
6. `docs: clarify backend handtracking setup`
