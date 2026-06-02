import type { MapNode, MapNodeInstanceTransform } from "@/types/map/mapScene";

export function mapNodeToInstanceTransform(
  node: MapNode,
): MapNodeInstanceTransform {
  return {
    id: node.id,
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}
