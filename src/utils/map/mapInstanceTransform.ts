import type { MapNode, MapNodeInstanceTransform } from "@/types/map/mapScene";

export function mapNodeToInstanceTransform(
  node: MapNode,
): MapNodeInstanceTransform {
  return {
    position: node.position,
    rotation: node.rotation,
    scale: node.scale,
  };
}
