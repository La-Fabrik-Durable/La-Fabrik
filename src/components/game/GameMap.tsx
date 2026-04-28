import { useEffect, useState, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useOctreeGraphNode } from "@/hooks/useOctreeGraphNode";
import type { OctreeReadyHandler } from "@/types/3d";
import type { MapNode } from "@/types/editor";

const MAP_JSON_PATH = "/map.json";

interface GameMapProps {
  onOctreeReady: OctreeReadyHandler;
}

export function GameMap({ onOctreeReady }: GameMapProps): React.JSX.Element {
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [availableModels, setAvailableModels] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  useOctreeGraphNode(groupRef, onOctreeReady);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const nodesResponse = await fetch(MAP_JSON_PATH);
        if (!nodesResponse.ok) {
          console.warn("map.json not found");
          setIsLoading(false);
          return;
        }

        const nodes: MapNode[] = await nodesResponse.json();
        setMapNodes(nodes);

        const uniqueModelNames = [...new Set(nodes.map((n) => n.name))];
        const available = new Set<string>();

        for (const modelName of uniqueModelNames) {
          try {
            const modelUrl = `/models/${modelName}/model.gltf`;
            const modelResponse = await fetch(modelUrl);
            const contentType = modelResponse.headers.get("content-type") || "";
            if (contentType.includes("gltf") || contentType.includes("model")) {
              available.add(modelName);
            }
          } catch {
            /* empty */
          }
        }
        setAvailableModels(available);
      } catch (error) {
        console.error("Error loading map:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  const nodesToRender = useMemo(() => {
    return mapNodes.filter((node) => availableModels.has(node.name));
  }, [mapNodes, availableModels]);

  if (isLoading) {
    return <></>;
  }

  return (
    <group ref={groupRef}>
      {nodesToRender.map((node, index) => (
        <ModelInstance key={index} node={node} />
      ))}
    </group>
  );
}

function ModelInstance({ node }: { node: MapNode }): React.JSX.Element {
  const modelPath = `/models/${node.name}/model.gltf`;
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const { position, rotation, scale } = node;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.set(...rotation);
      groupRef.current.scale.set(...scale);
    }
  }, [position, rotation, scale]);

  return (
    <primitive
      ref={groupRef}
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
