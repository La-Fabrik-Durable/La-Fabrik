import { WATER_SHADER_CONFIG, WATER_SURFACES } from "@/data/world/waterConfig";
import { WaterSurface } from "@/world/water/WaterSurface";

export function WaterSystem(): React.JSX.Element | null {
  if (!WATER_SHADER_CONFIG.enabled) {
    return null;
  }

  return (
    <>
      {WATER_SURFACES.map((surface, index) => (
        <WaterSurface key={index} {...surface} />
      ))}
    </>
  );
}
