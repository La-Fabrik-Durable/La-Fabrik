# Chunk Streaming

This document describes the world chunk streaming system used to reduce the number of visible triangles in the game scene.

## Why chunk streaming exists

The full map contains hundreds of instanced vegetation and crop assets (arbres, buissons, champdesoja, etc.). At peak, the total triangle count exceeds 69 million triangles when all instances are visible simultaneously — roughly 10 FPS on a mid-range machine.

A single `THREE.InstancedMesh` that covers the entire map has one global bounding sphere. If any part of that sphere is in the camera frustum, Three.js keeps the whole batch. Splitting instances into a grid of smaller chunks means entire off-screen or far chunks can be removed from the scene entirely.

The streaming system mounts and unmounts React subtrees as the player camera moves. Unmounted chunks remove their `InstancedMesh` objects from the Three.js scene graph, which reduces the triangle count the GPU has to process.

Streaming is intentionally limited to:

- the player camera in game mode (`sceneMode === "game" && cameraMode === "player"`)
- vegetation and instanced map assets (not terrain, buildings, or collision geometry)

In debug camera mode the full map is always visible.

## Configuration

### `chunkStreamingConfig.ts`

```
src/data/world/chunkStreamingConfig.ts
```

The top-level switch and grid parameters:

| Parameter        | Default | Description                                                              |
| ---------------- | ------: | ------------------------------------------------------------------------ |
| `enabled`        |  `true` | Master switch. Set to `false` to disable streaming globally.             |
| `chunkSize`      |    `35` | Grid cell side length in world units. Instances are bucketed by this.    |
| `loadRadius`     |    `50` | Distance from camera at which a chunk is loaded (ultra preset default).  |
| `unloadRadius`   |    `65` | Distance at which an active chunk is unloaded (ultra preset default).    |
| `updateInterval` |   `250` | Milliseconds between camera distance checks inside `useFrame`.           |

`loadRadius` and `unloadRadius` from this file are only used as the default argument of `useVisibleWorldChunks`. The actual radii in production come from `graphicsConfig.ts` per-preset (see below).

### `graphicsConfig.ts` — per-preset radii

```
src/data/world/graphicsConfig.ts
```

Each graphics preset overrides the load/unload radii and can disable streaming entirely:

| Preset | `chunkLoadRadius` | `chunkUnloadRadius` | `chunkStreamingEnabled` |
| ------ | ----------------: | ------------------: | ----------------------- |
| low    |                10 |                  18 | true                    |
| medium |                20 |                  30 | true                    |
| high   |                30 |                  40 | true                    |
| ultra  |                50 |                  65 | true                    |
| max    |                50 |                  65 | false (full map loaded) |

The hysteresis gap between load and unload radii (e.g. 30 vs 40 on `high`) prevents thrashing when the camera sits near a chunk boundary.

## Chunk grid

```
src/utils/world/chunkInstances.ts
```

`createWorldInstanceChunks` partitions a flat array of positioned instances into grid cells. Each cell key is `"chunkX:chunkZ"` where `chunkX = Math.floor(x / chunkSize)`. The center of a cell is the arithmetic mean of the positions it contains (not the geometric center of the grid cell), which is used later for camera-distance comparisons.

```ts
export interface WorldInstanceChunk<TInstance extends PositionedInstance> {
  centerX: number;   // mean X of instances in this cell
  centerZ: number;   // mean Z of instances in this cell
  chunkKey: string;  // "chunkX:chunkZ"
  instances: TInstance[];
}
```

This function is called once per system on mount or when instance data changes. The result is stable across frames.

## `useVisibleWorldChunks`

```
src/hooks/world/useVisibleWorldChunks.ts
```

The core hook that filters the full chunk list down to the chunks that should be mounted.

```ts
function useVisibleWorldChunks<TChunk extends WorldChunkLike>(
  chunks: readonly TChunk[],
  streamingEnabled: boolean,
  visibilityConfig: WorldChunkVisibilityConfig = CHUNK_CONFIG,
): readonly TChunk[]
```

### How it works

On every `useFrame` tick, if `updateInterval` ms have elapsed, `updateActiveChunks` runs:

1. For each chunk, compute `Math.hypot(chunk.centerX - cameraX, chunk.centerZ - cameraZ)`.
2. If the chunk was already active, compare against `unloadRadius`. If it was inactive, compare against `loadRadius`. This is the hysteresis that prevents ping-pong at chunk edges.
3. Build the new `Set<string>` of active chunk keys.
4. If the set is identical to the previous one (`areSetsEqual`), skip the React state update entirely to avoid unnecessary re-renders.
5. Otherwise, call `setActiveChunkKeys` which triggers a re-render and the `useMemo` filter below.

The `useMemo` filters the `chunks` array to the active keys. When `streamingEnabled` is false the full list is returned unchanged.

### Guard: first frame

On the very first frame before any `useFrame` tick has run, `activeChunkKeys` is empty. Rather than rendering nothing, the `useMemo` falls back to a direct distance check against `loadRadius`. This prevents a one-frame flash of an empty scene.

## Integration in the scene

Two systems consume the hook:

### `VegetationSystem`

```
src/world/vegetation/VegetationSystem.tsx
```

Renders `arbre`, `sapin`, `buisson`, `champdeble`, `champdesoja`, `champsdetournesol`. Per-type chunks are produced by `createVegetationChunks`, which calls `createWorldInstanceChunks` internally. The visible chunk list from `useVisibleWorldChunks` is mapped to `<InstancedVegetation>` subtrees inside a `<Suspense fallback={null}>`. When a chunk leaves the visible set, its React key is removed from the render list and React unmounts the subtree, which disposes the `InstancedMesh` and merged geometry.

LOD model paths are also computed per-chunk at `updateInterval` cadence by `useVegetationChunkModelPaths`. The `key` on `<Suspense>` includes the model path, so a LOD switch causes a clean remount rather than an in-place model swap.

### `MapInstancingSystem`

```
src/world/map-instancing/MapInstancingSystem.tsx
```

Renders repeated static map assets (pylones, éoliennes, etc.) configured in `mapInstancingConfig.ts`. The same `createWorldInstanceChunks` + `useVisibleWorldChunks` pattern applies. Visible chunks render `<InstancedMapAsset>` subtrees.

### `streamingEnabled` guard

Both systems compute `streamingEnabled` with the same condition:

```ts
const streamingEnabled =
  streaming &&
  CHUNK_CONFIG.enabled &&
  graphicsPresetConfig.chunkStreamingEnabled &&
  sceneMode === "game" &&
  cameraMode === "player";
```

When false, `useVisibleWorldChunks` returns the full chunk list unfiltered, so all chunks are always mounted.

## Cleanup

Chunk cleanup is handled entirely through React unmounting. When a chunk leaves the `visibleChunks` array, React removes the corresponding `<InstancedVegetation>` or `<InstancedMapAsset>` from the tree. Each component is responsible for disposing GPU resources it created locally (merged geometries, material clones). Resources owned by `useGLTF`'s cache must not be disposed.

## How to modify streaming distance

To change the streaming radii, edit the preset table in `graphicsConfig.ts`:

```ts
high: {
  chunkLoadRadius: 30,   // increase to load more chunks earlier
  chunkUnloadRadius: 40, // keep at least 10 units above loadRadius
  ...
}
```

Keep `unloadRadius > loadRadius` to preserve the hysteresis gap.

To disable streaming for a specific preset only, set `chunkStreamingEnabled: false` for that entry. The full map will be loaded at startup (current behavior of the `max` preset).

To disable streaming globally across all presets, set `enabled: false` in `chunkStreamingConfig.ts`.

## How to add a new streamable system

1. Define an instance type that includes `position: Vector3Tuple`.
2. Call `createWorldInstanceChunks(instances)` to get a `WorldInstanceChunk[]`. Wrap each entry in your system-specific chunk shape; the chunk shape must satisfy `WorldChunkLike` (fields: `centerX`, `centerZ`, `key`).
3. Compute `streamingEnabled` using the same four-condition guard as `VegetationSystem`.
4. Call `useVisibleWorldChunks(chunks, streamingEnabled, { loadRadius, unloadRadius })` with radii from the active graphics preset.
5. Map `visibleChunks` to React subtrees. Each subtree should be wrapped in `<Suspense fallback={null}>` with a stable `key` tied to the chunk key (and model path if LOD applies).
6. Dispose only GPU resources the component created locally on unmount.
