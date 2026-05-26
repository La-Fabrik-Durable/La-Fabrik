import { WIND_BOUNDS } from "@/data/world/windConfig";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";

export function useEnvironmentDebug(): void {
  useDebugFolder("Environment", (folder) => {
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
}
