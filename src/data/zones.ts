import type { Zone } from "@/types/game";
import type { Vector3Tuple } from "@/types/3d";

export const ZONES: Zone[] = [
  {
    id: "fabrikExit",
    position: [-5, 25, -15] as Vector3Tuple,
    radius: 10,
    height: 20,
    targetStep: "bike",
  },
];
