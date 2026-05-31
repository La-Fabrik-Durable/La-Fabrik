import { Suspense } from "react";
import { AnimatedModel } from "@/components/three/models/AnimatedModel";
import {
  CHARACTER_CONFIGS,
  CHARACTER_IDS,
  type CharacterConfig,
  type CharacterId,
} from "@/data/world/characters/characterConfig";
import { useTerrainSnappedPosition } from "@/hooks/three/useTerrainHeight";
import { useCharacterDebugStore } from "@/managers/stores/useCharacterDebugStore";

function CharacterModel({ id }: { id: CharacterId }): React.JSX.Element {
  const config: CharacterConfig = CHARACTER_CONFIGS[id];
  const state = useCharacterDebugStore((store) => store.characters[id]);
  const snappedPosition = useTerrainSnappedPosition(state.position);
  const position =
    config.snapToTerrain === false ? state.position : snappedPosition;

  return (
    <AnimatedModel
      modelPath={config.modelPath}
      defaultAnimation={state.animation}
      position={position}
      rotation={state.rotation}
      scale={state.scale}
    />
  );
}

export function CharacterSystem(): React.JSX.Element {
  return (
    <group name="character-system">
      {CHARACTER_IDS.map((id) => (
        <Suspense key={id} fallback={null}>
          <CharacterModel id={id} />
        </Suspense>
      ))}
    </group>
  );
}
