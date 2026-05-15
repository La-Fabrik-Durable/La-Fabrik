import { useEffect, useState } from "react";
import type { MapNode } from "@/types/editor/editor";
import type { Vector3Tuple } from "@/types/three/three";
import { loadMapSceneData } from "@/utils/map/loadMapSceneData";
import { INSTANCED_MAP_EXCEPTIONS } from "@/world/vegetation/vegetationConfig";

export interface VegetationInstance {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

export interface InstancedMapEntry {
  modelPath: string;
  instances: VegetationInstance[];
}

export type VegetationData = Map<string, InstancedMapEntry>;

function mapNodeToInstance(node: MapNode): VegetationInstance {
  return {
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}

function extractVegetationData(
  mapNodes: MapNode[],
  models: Map<string, string>,
): VegetationData {
  const data: VegetationData = new Map();

  for (const node of mapNodes) {
    if (node.type !== "Object3D") continue;
    if (INSTANCED_MAP_EXCEPTIONS.has(node.name)) continue;

    const modelPath = models.get(node.name);
    if (!modelPath) continue;

    const entry = data.get(node.name);

    if (entry) {
      entry.instances.push(mapNodeToInstance(node));
    } else {
      data.set(node.name, {
        modelPath,
        instances: [mapNodeToInstance(node)],
      });
    }
  }

  return data;
}

export function useVegetationData(): {
  data: VegetationData | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<VegetationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const sceneData = await loadMapSceneData();

      if (!cancelled && sceneData) {
        setData(extractVegetationData(sceneData.mapNodes, sceneData.models));
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading };
}
