import { useCallback, useState } from "react";
import * as THREE from "three";
import { RepairObjectModel } from "@/components/three/gameplay/RepairObjectModel";
import { RepairPromptVideo } from "@/components/three/gameplay/RepairPromptVideo";
import { GrabbableObject } from "@/components/three/interaction/GrabbableObject";
import { TriggerObject } from "@/components/three/interaction/TriggerObject";
import type {
  RepairMissionConfig,
  RepairMissionPartConfig,
} from "@/data/gameplay/repairMissions";
import type { Vector3Tuple } from "@/types/three/three";

const INSTALL_TARGET_POSITION: Vector3Tuple = [0, 0.8, 0];
const INSTALL_TARGET_VECTOR = new THREE.Vector3(...INSTALL_TARGET_POSITION);
const REPLACEMENT_START_OFFSETS: Vector3Tuple[] = [
  [-0.9, 1.35, 1.8],
  [0, 1.35, 2.15],
  [0.9, 1.35, 1.8],
];
const REPAIR_INSTALL_RADIUS = 1.1;

interface RepairRepairingStepProps {
  config: RepairMissionConfig;
  onRepair: () => void;
}

export function RepairRepairingStep({
  config,
  onRepair,
}: RepairRepairingStepProps): React.JSX.Element {
  const [placedPartIds, setPlacedPartIds] = useState<Record<string, boolean>>(
    {},
  );
  const replacementParts = getReplacementParts(config);
  const requiredReplacementPart = replacementParts.find(
    (part) => part.id === config.requiredReplacementPartId,
  );
  const requiredReplacementLabel =
    requiredReplacementPart?.label ?? config.label;
  const hasCorrectPartPlaced = Boolean(
    placedPartIds[config.requiredReplacementPartId],
  );
  const hasWrongPartPlaced = replacementParts.some(
    (part) =>
      part.id !== config.requiredReplacementPartId && placedPartIds[part.id],
  );
  const installColor = hasCorrectPartPlaced
    ? "#22c55e"
    : hasWrongPartPlaced
      ? "#ef4444"
      : "#f97316";
  const installFillColor = hasCorrectPartPlaced
    ? "#86efac"
    : hasWrongPartPlaced
      ? "#fecaca"
      : "#fed7aa";

  const handleReplacementPosition = useCallback(
    (partId: string, position: THREE.Vector3) => {
      const isPlaced =
        position.distanceTo(INSTALL_TARGET_VECTOR) <= REPAIR_INSTALL_RADIUS;
      setPlacedPartIds((current) => {
        if (current[partId] === isPlaced) return current;

        return { ...current, [partId]: isPlaced };
      });
    },
    [],
  );

  return (
    <group>
      <TriggerObject
        position={INSTALL_TARGET_POSITION}
        colliders="ball"
        label={
          hasCorrectPartPlaced
            ? `Installer ${requiredReplacementLabel}`
            : hasWrongPartPlaced
              ? `Mauvaise piece`
              : `Approcher ${requiredReplacementLabel}`
        }
        onTrigger={() => {
          if (!hasCorrectPartPlaced) return;

          onRepair();
        }}
      >
        <mesh>
          <torusGeometry args={[0.95, 0.045, 12, 96]} />
          <meshBasicMaterial color={installColor} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.9, 96]} />
          <meshBasicMaterial
            color={installFillColor}
            transparent
            opacity={0.35}
          />
        </mesh>
      </TriggerObject>

      {replacementParts.map((part, index) => {
        const offset =
          REPLACEMENT_START_OFFSETS[index % REPLACEMENT_START_OFFSETS.length] ??
          REPLACEMENT_START_OFFSETS[0]!;

        return (
          <GrabbableObject
            key={part.id}
            position={[
              config.case.position[0] + offset[0],
              config.case.position[1] + offset[1],
              config.case.position[2] + offset[2],
            ]}
            colliders="ball"
            handControlled
            label={`Prendre ${part.label}`}
            onPositionChange={(position) => {
              handleReplacementPosition(part.id, position);
            }}
          >
            <RepairObjectModel
              label={part.label}
              modelPath={part.modelPath ?? config.modelPath}
              scale={0.28}
            />
          </GrabbableObject>
        );
      })}

      <RepairPromptVideo src={config.interactUiPath} position={[0, 2.3, 0]} />
    </group>
  );
}

function getReplacementParts(
  config: RepairMissionConfig,
): readonly RepairMissionPartConfig[] {
  if (config.replacementParts.length > 0) return config.replacementParts;

  return [
    {
      id: config.requiredReplacementPartId,
      label: config.label,
      modelPath: config.modelPath,
    },
  ];
}
