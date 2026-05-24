import { Suspense } from "react";
import { InstancedVegetation } from "@/world/vegetation/InstancedVegetation";
import {
  type VegetationInstance,
  useVegetationData,
} from "@/world/vegetation/useVegetationData";
import {
  INSTANCED_MAP_CHUNK_SIZE,
  INSTANCED_MAP_NO_SHADOW_NAMES,
} from "@/world/vegetation/vegetationConfig";

function createChunkKey(instance: VegetationInstance): string {
  const [x, , z] = instance.position;
  const chunkX = Math.floor(x / INSTANCED_MAP_CHUNK_SIZE);
  const chunkZ = Math.floor(z / INSTANCED_MAP_CHUNK_SIZE);
  return `${chunkX}:${chunkZ}`;
}

function chunkInstances(
  instances: VegetationInstance[],
): Map<string, VegetationInstance[]> {
  const chunks = new Map<string, VegetationInstance[]>();

  for (const instance of instances) {
    const key = createChunkKey(instance);
    const chunk = chunks.get(key);

    if (chunk) {
      chunk.push(instance);
    } else {
      chunks.set(key, [instance]);
    }
  }

  return chunks;
}

export function VegetationSystem(): React.JSX.Element | null {
  const { data, isLoading } = useVegetationData();

  if (isLoading || !data) {
    return null;
  }

  return (
    <group name="instanced-map-system">
      {[...data.entries()].map(([modelName, entry]) => {
        if (entry.instances.length === 0) {
          return null;
        }

        const castShadow = !INSTANCED_MAP_NO_SHADOW_NAMES.has(modelName);
        const receiveShadow = castShadow;
        const chunks = chunkInstances(entry.instances);

        return [...chunks.entries()].map(([chunkKey, instances]) => (
          <Suspense key={`${modelName}:${chunkKey}`} fallback={null}>
            <InstancedVegetation
              modelPath={entry.modelPath}
              instances={instances}
              castShadow={castShadow}
              receiveShadow={receiveShadow}
            />
          </Suspense>
        ));
      })}
    </group>
  );
}
