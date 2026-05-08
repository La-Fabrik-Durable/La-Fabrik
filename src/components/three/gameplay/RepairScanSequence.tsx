import { useEffect, useState } from "react";
import { ExplodableModel } from "@/components/three/models/ExplodableModel";
import { RepairScanVisual } from "@/components/three/gameplay/RepairScanVisual";
import { REPAIR_SCAN_PART_SECONDS } from "@/data/gameplay/repairGameConfig";
import type { RepairMissionConfig } from "@/data/gameplay/repairMissions";
import type { ExplodedPart } from "@/utils/three/ExplodedModel";

interface RepairScanSequenceProps {
  config: RepairMissionConfig;
  onComplete: () => void;
}

export function RepairScanSequence({
  config,
  onComplete,
}: RepairScanSequenceProps): React.JSX.Element {
  const [parts, setParts] = useState<readonly ExplodedPart[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const activePart = parts[activePartIndex];

  useEffect(() => {
    if (parts.length === 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setActivePartIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= parts.length) {
          onComplete();
          return currentIndex;
        }

        return nextIndex;
      });
    }, REPAIR_SCAN_PART_SECONDS * 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activePartIndex, onComplete, parts.length]);

  return (
    <group>
      <ExplodableModel
        modelPath={config.modelPath}
        split
        onPartsReady={setParts}
      />
      <RepairScanVisual target={activePart?.object} />
    </group>
  );
}
