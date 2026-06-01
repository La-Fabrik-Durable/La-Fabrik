import { useGameStore } from "@/managers/stores/useGameStore";
import { useDialoguePlayback } from "@/hooks/gameplay/useDialoguePlayback";
import { ZoneDetection } from "@/components/zone/ZoneDetection";
import { PylonDownedPylon } from "@/components/gameplay/pylon/PylonDownedPylon";
import { PylonFarmerNPC } from "@/components/gameplay/pylon/PylonFarmerNPC";
import { PylonNarratorOutro } from "@/components/gameplay/pylon/PylonNarratorOutro";
import { PYLON_ARRIVED_ZONE } from "@/data/gameplay/zones";
import { PYLON_NARRATIVE_DIALOGUES } from "@/data/gameplay/pylonConfig";

export function PylonNarrativeFlow(): React.JSX.Element | null {
  const mainState = useGameStore((state) => state.mainState);
  const step = useGameStore((state) => state.pylon.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const completeMission = useGameStore((state) => state.completeMission);

  useDialoguePlayback({
    enabled: mainState === "pylon" && step === "approaching",
    dialogueId: PYLON_NARRATIVE_DIALOGUES.electricOutage,
  });

  useDialoguePlayback({
    enabled: mainState === "pylon" && step === "arrived",
    dialogueId: PYLON_NARRATIVE_DIALOGUES.searchCentral,
  });

  useDialoguePlayback({
    enabled: mainState === "pylon" && step === "narrator-outro",
    dialogueId: PYLON_NARRATIVE_DIALOGUES.powerRestored,
    onComplete: () => completeMission("pylon"),
  });

  if (mainState !== "pylon") return null;

  if (step === "approaching") {
    return (
      <ZoneDetection
        zone={PYLON_ARRIVED_ZONE}
        onEnter={() => setMissionStep("pylon", "arrived")}
      />
    );
  }

  if (step === "arrived") {
    return (
      <>
        <PylonDownedPylon />
        <PylonFarmerNPC />
      </>
    );
  }

  if (step === "npc-return") {
    return <PylonDownedPylon />;
  }

  if (step === "narrator-outro") {
    return <PylonNarratorOutro />;
  }

  return null;
}
