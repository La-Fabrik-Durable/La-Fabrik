import { CLOUD_BOUNDS } from "@/data/world/cloudConfig";
import { WIND_BOUNDS } from "@/data/world/windConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";

export function useEnvironmentDebug(): void {
  useDebugFolder("Dynamic Wind", (folder) => {
    const { setWind, wind } = useWorldSettingsStore.getState();
    const controls = { ...wind };

    folder
      .add(controls, "speed", WIND_BOUNDS.speed.min, WIND_BOUNDS.speed.max)
      .step(WIND_BOUNDS.speed.step)
      .name("Wind speed")
      .onChange((speed: number) => setWind({ speed }));

    folder
      .add(
        controls,
        "direction",
        WIND_BOUNDS.direction.min,
        WIND_BOUNDS.direction.max,
      )
      .step(WIND_BOUNDS.direction.step)
      .name("Wind direction")
      .onChange((direction: number) => setWind({ direction }));

    folder
      .add(
        controls,
        "strength",
        WIND_BOUNDS.strength.min,
        WIND_BOUNDS.strength.max,
      )
      .step(WIND_BOUNDS.strength.step)
      .name("Wind strength")
      .onChange((strength: number) => setWind({ strength }));

    folder
      .add(
        controls,
        "noiseScale",
        WIND_BOUNDS.noiseScale.min,
        WIND_BOUNDS.noiseScale.max,
      )
      .step(WIND_BOUNDS.noiseScale.step)
      .name("Wind noise scale")
      .onChange((noiseScale: number) => setWind({ noiseScale }));
  });

  useDebugFolder("Environment", (folder) => {
    const { clouds, graphics, setClouds, setDynamicClouds } =
      useWorldSettingsStore.getState();
    const controls = {
      ...clouds,
      dynamicClouds: graphics.dynamicClouds,
    };

    folder
      .add(controls, "dynamicClouds")
      .name("Clouds")
      .onChange((dynamicClouds: boolean) => setDynamicClouds(dynamicClouds));

    folder
      .add(controls, "count", CLOUD_BOUNDS.count.min, CLOUD_BOUNDS.count.max)
      .step(CLOUD_BOUNDS.count.step)
      .name("Cloud count")
      .onChange((count: number) => setClouds({ count }));

    folder
      .add(controls, "minScale", CLOUD_BOUNDS.scale.min, CLOUD_BOUNDS.scale.max)
      .step(CLOUD_BOUNDS.scale.step)
      .name("Cloud min scale")
      .onChange((minScale: number) => setClouds({ minScale }));

    folder
      .add(controls, "maxScale", CLOUD_BOUNDS.scale.min, CLOUD_BOUNDS.scale.max)
      .step(CLOUD_BOUNDS.scale.step)
      .name("Cloud max scale")
      .onChange((maxScale: number) => setClouds({ maxScale }));

    folder
      .add(
        controls,
        "minRotation",
        CLOUD_BOUNDS.rotation.min,
        CLOUD_BOUNDS.rotation.max,
      )
      .step(CLOUD_BOUNDS.rotation.step)
      .name("Cloud min rotation")
      .onChange((minRotation: number) => setClouds({ minRotation }));

    folder
      .add(
        controls,
        "maxRotation",
        CLOUD_BOUNDS.rotation.min,
        CLOUD_BOUNDS.rotation.max,
      )
      .step(CLOUD_BOUNDS.rotation.step)
      .name("Cloud max rotation")
      .onChange((maxRotation: number) => setClouds({ maxRotation }));

    folder
      .add(
        controls,
        "minHeight",
        CLOUD_BOUNDS.height.min,
        CLOUD_BOUNDS.height.max,
      )
      .step(CLOUD_BOUNDS.height.step)
      .name("Cloud min height")
      .onChange((minHeight: number) => setClouds({ minHeight }));

    folder
      .add(
        controls,
        "maxHeight",
        CLOUD_BOUNDS.height.min,
        CLOUD_BOUNDS.height.max,
      )
      .step(CLOUD_BOUNDS.height.step)
      .name("Cloud max height")
      .onChange((maxHeight: number) => setClouds({ maxHeight }));

    folder
      .add(
        controls,
        "minSpeedMultiplier",
        CLOUD_BOUNDS.speedMultiplier.min,
        CLOUD_BOUNDS.speedMultiplier.max,
      )
      .step(CLOUD_BOUNDS.speedMultiplier.step)
      .name("Cloud min speed")
      .onChange((minSpeedMultiplier: number) =>
        setClouds({ minSpeedMultiplier }),
      );

    folder
      .add(
        controls,
        "maxSpeedMultiplier",
        CLOUD_BOUNDS.speedMultiplier.min,
        CLOUD_BOUNDS.speedMultiplier.max,
      )
      .step(CLOUD_BOUNDS.speedMultiplier.step)
      .name("Cloud max speed")
      .onChange((maxSpeedMultiplier: number) =>
        setClouds({ maxSpeedMultiplier }),
      );

    folder
      .add(controls, "castShadow")
      .name("Cloud cast shadow")
      .onChange((castShadow: boolean) => setClouds({ castShadow }));

    folder
      .add(controls, "receiveShadow")
      .name("Cloud receive shadow")
      .onChange((receiveShadow: boolean) => setClouds({ receiveShadow }));
  });
}
