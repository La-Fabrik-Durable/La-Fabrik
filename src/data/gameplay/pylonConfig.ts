import type { Vector3Tuple } from "@/types/three/three";

export const PYLON_WORLD_POSITION: Vector3Tuple = [43, 5, 45];

export const PYLON_DOWNED_ROTATION: Vector3Tuple = [0, 0, -1.4];

export const PYLON_UPRIGHT_ROTATION: Vector3Tuple = [0, 0, 0];

export const PYLON_FARMER_NPC_POSITION: Vector3Tuple = [
  PYLON_WORLD_POSITION[0] - 6,
  PYLON_WORLD_POSITION[1],
  PYLON_WORLD_POSITION[2] + 4,
];

export const PYLON_FARMER_NPC_AFTER_POSITION: Vector3Tuple = [
  PYLON_WORLD_POSITION[0] + 1,
  PYLON_WORLD_POSITION[1],
  PYLON_WORLD_POSITION[2] - 2,
];

export const PYLON_NARRATIVE_INTERACT_RADIUS = 3.5;

export const PYLON_STRAIGHTEN_ANIMATION_DURATION_MS = 2200;

export const PYLON_NARRATIVE_DIALOGUES = {
  electricOutage: "narrateur_coupureelec",
  searchCentral: "narrateur_fouillelecentre",
  brokenPylon: "narrateur_poteaueleccasse",
  farmerHelp: "fermier_coupdemain",
  powerRestored: "narrateur_courantrepare",
} as const;
