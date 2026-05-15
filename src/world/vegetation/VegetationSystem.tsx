import { Suspense } from "react";
import { InstancedVegetation } from "@/world/vegetation/InstancedVegetation";
import { useVegetationData } from "@/world/vegetation/useVegetationData";

export function VegetationSystem(): React.JSX.Element | null {
  const { data, isLoading } = useVegetationData();

  if (isLoading || !data) {
    return null;
  }

  return (
    <group name="instanced-map-system">
      {[...data.entries()].map(([modelName, entry]) => {
        if (entry.instances.length === 0) {
          return null;
        }

        return (
          <Suspense key={modelName} fallback={null}>
            <InstancedVegetation
              modelPath={entry.modelPath}
              instances={entry.instances}
              castShadow={true}
              receiveShadow={true}
            />
          </Suspense>
        );
      })}
    </group>
  );
}
