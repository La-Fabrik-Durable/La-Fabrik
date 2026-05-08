import type { RepairMissionId } from "@/managers/stores/useGameStore";
import type { Vector3Scale, Vector3Tuple } from "@/types/three/three";

export interface RepairMissionCaseConfig {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Scale;
}

export interface RepairMissionPartConfig {
  id: string;
  label: string;
  nodeName?: string;
  modelPath?: string;
}

export interface RepairMissionConfig {
  id: RepairMissionId;
  label: string;
  description: string;
  modelPath: string;
  stageUiPath: string;
  interactUiPath: string;
  brokenUiPath: string;
  case: RepairMissionCaseConfig;
  brokenParts: readonly RepairMissionPartConfig[];
  replacementParts: readonly RepairMissionPartConfig[];
}

const REPAIR_INTERACT_UI_PATH = "/assets/UI/interagir.webm";
const REPAIR_BROKEN_UI_PATH = "/assets/UI/cassé.webm";

const DEFAULT_REPAIR_CASE = {
  position: [0, 0.4, 1.8],
  rotation: [0, 0, 0],
  scale: 1.5,
} satisfies RepairMissionCaseConfig;

export const REPAIR_MISSIONS = {
  bike: {
    id: "bike",
    label: "E-bike",
    description:
      "Repair the damaged cooling module before relaunching the bike",
    modelPath: "/models/refroidisseur/model.gltf",
    stageUiPath: "/assets/UI/ebike.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    brokenParts: [
      {
        id: "bike-cooling-core",
        label: "Cooling core",
      },
    ],
    replacementParts: [
      {
        id: "bike-cooling-core-replacement",
        label: "Replacement cooling core",
        modelPath: "/models/refroidisseur/model.gltf",
      },
    ],
  },
  pylone: {
    id: "pylone",
    label: "Power pylon",
    description: "Generic description",
    modelPath: "/models/pylone/model.gltf",
    stageUiPath: "/assets/UI/centrale.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    brokenParts: [],
    replacementParts: [],
  },
  ferme: {
    id: "ferme",
    label: "Vertical farm",
    description: "Genreric description",
    modelPath: "/models/fermeverticale/model.gltf",
    stageUiPath: "/assets/UI/laferme.webm",
    interactUiPath: REPAIR_INTERACT_UI_PATH,
    brokenUiPath: REPAIR_BROKEN_UI_PATH,
    case: DEFAULT_REPAIR_CASE,
    brokenParts: [],
    replacementParts: [],
  },
} satisfies Record<RepairMissionId, RepairMissionConfig>;
