import { useState } from "react";
import { Text } from "@react-three/drei";
import { MainFeatureObject } from "@/components/three/MainFeatureObject";
import { ModelSelectorPlaceholder } from "@/components/three/ModelSelectorPlaceholder";

const ZONE_ORIGIN = [10, 0.4, -8] as const;
const ZONE_RADIUS = 4.2;

export function MainFeatureZone(): React.JSX.Element {
  const [caseOpen, setCaseOpen] = useState(false);

  return (
    <group>
      <mesh
        position={[ZONE_ORIGIN[0], 0.025, ZONE_ORIGIN[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[ZONE_RADIUS - 0.08, ZONE_RADIUS, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.72} />
      </mesh>

      <mesh
        position={[ZONE_ORIGIN[0], 0.02, ZONE_ORIGIN[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[ZONE_RADIUS, 96]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.12} />
      </mesh>

      <Text
        position={[ZONE_ORIGIN[0], 3.1, ZONE_ORIGIN[2] - 1.8]}
        rotation={[0, 0, 0]}
        fontSize={0.55}
        maxWidth={5.5}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#f8fafc"
        outlineWidth={0.025}
        outlineColor="#0f172a"
      >
        Pack de Relance Feature
      </Text>

      <MainFeatureObject
        position={[ZONE_ORIGIN[0], ZONE_ORIGIN[1], ZONE_ORIGIN[2]]}
        open={caseOpen}
        onToggle={() => setCaseOpen((value) => !value)}
      />

      <ModelSelectorPlaceholder
        label="Module A"
        position={[ZONE_ORIGIN[0] - 2.2, ZONE_ORIGIN[1], ZONE_ORIGIN[2] + 2.2]}
      />
      <ModelSelectorPlaceholder
        label="Module B"
        position={[ZONE_ORIGIN[0], ZONE_ORIGIN[1], ZONE_ORIGIN[2] + 2.6]}
      />
      <ModelSelectorPlaceholder
        label="Module C"
        position={[ZONE_ORIGIN[0] + 2.2, ZONE_ORIGIN[1], ZONE_ORIGIN[2] + 2.2]}
      />
    </group>
  );
}
