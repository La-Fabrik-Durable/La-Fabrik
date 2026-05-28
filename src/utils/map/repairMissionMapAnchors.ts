import type { RepairMissionId } from "@/types/gameplay/repairMission";
import type { MapNode } from "@/types/map/mapScene";
import type { Vector3Tuple } from "@/types/three/three";

const REPAIR_MISSION_MAP_NODE_NAMES = {
  ebike: "ebike",
  pylon: "pylone",
  farm: "fermeverticale",
} as const satisfies Record<RepairMissionId, string>;

function isOriginPosition(position: Vector3Tuple): boolean {
  return position.every((value) => Math.abs(value) < 0.0001);
}

export function getRepairMissionMapAnchors(
  mapNodes: readonly MapNode[],
): Partial<Record<RepairMissionId, Vector3Tuple>> {
  const anchors: Partial<Record<RepairMissionId, Vector3Tuple>> = {};

  for (const [mission, mapName] of Object.entries(
    REPAIR_MISSION_MAP_NODE_NAMES,
  ) as [RepairMissionId, string][]) {
    const node = mapNodes.find(
      (candidate) =>
        candidate.name === mapName &&
        candidate.type === "Object3D" &&
        !isOriginPosition(candidate.position),
    );

    if (node) {
      anchors[mission] = node.position;
    }
  }

  return anchors;
}
