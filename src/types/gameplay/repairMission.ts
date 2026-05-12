export type RepairMissionId = "bike" | "pylone" | "ferme";

export type MissionStep =
  | "locked"
  | "waiting"
  | "inspected"
  | "fragmented"
  | "scanning"
  | "repairing"
  | "reassembling"
  | "done";

export const REPAIR_MISSION_IDS = ["bike", "pylone", "ferme"] as const;

export const MISSION_STEPS = [
  "locked",
  "waiting",
  "inspected",
  "fragmented",
  "scanning",
  "repairing",
  "reassembling",
  "done",
] as const satisfies readonly MissionStep[];

export function isRepairMissionId(value: string): value is RepairMissionId {
  return (REPAIR_MISSION_IDS as readonly string[]).includes(value);
}

export function isMissionStep(value: string): value is MissionStep {
  return (MISSION_STEPS as readonly string[]).includes(value);
}

export function getNextMissionStep(step: MissionStep): MissionStep {
  switch (step) {
    case "locked":
      return "waiting";
    case "waiting":
      return "inspected";
    case "inspected":
      return "fragmented";
    case "fragmented":
      return "scanning";
    case "scanning":
      return "repairing";
    case "repairing":
      return "reassembling";
    case "reassembling":
    case "done":
      return "done";
  }
}

export function getPreviousMissionStep(step: MissionStep): MissionStep {
  switch (step) {
    case "locked":
    case "waiting":
      return "locked";
    case "inspected":
      return "waiting";
    case "fragmented":
      return "inspected";
    case "scanning":
      return "fragmented";
    case "repairing":
      return "scanning";
    case "reassembling":
      return "repairing";
    case "done":
      return "reassembling";
  }
}
