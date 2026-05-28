import type { Vector3Tuple } from "@/types/three/three";
import type { RepairMissionId } from "@/types/gameplay/repairMission";

export const EBIKE_REPAIR_POSITION = [
  42.2399, 4.5484, 34.6468,
] as const satisfies Vector3Tuple;

const REPAIR_MISSION_POSITIONS = {
  ebike: EBIKE_REPAIR_POSITION,
  pylone: [64, 0, -66],
  ferme: [-24, 0, 42],
} as const satisfies Record<RepairMissionId, Vector3Tuple>;

export const REPAIR_MISSION_POSITION_ENTRIES = [
  { mission: "ebike", position: REPAIR_MISSION_POSITIONS.ebike },
  { mission: "pylone", position: REPAIR_MISSION_POSITIONS.pylone },
  { mission: "ferme", position: REPAIR_MISSION_POSITIONS.ferme },
] as const satisfies readonly {
  mission: RepairMissionId;
  position: Vector3Tuple;
}[];
