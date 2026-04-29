import type { ReactNode } from "react";
import { useSceneMode } from "@/hooks/debug/useSceneMode";
import { useInteraction } from "@/hooks/useInteraction";
import {
  HAND_TRACKING_IDLE_SNAPSHOT,
  HandTrackingContext,
} from "@/hooks/useHandTrackingSnapshot";
import { useRemoteHandTracking } from "@/hooks/useRemoteHandTracking";
import { isDebugEnabled } from "@/utils/debug/isDebugEnabled";

export function HandTrackingProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const sceneMode = useSceneMode();
  const { focused, holding } = useInteraction();
  const isInInteractionZone = focused !== null || holding;
  const enabled =
    isDebugEnabled() && sceneMode === "physics" && isInInteractionZone;
  const snapshot = useRemoteHandTracking({ enabled });

  return (
    <HandTrackingContext
      value={enabled ? snapshot : HAND_TRACKING_IDLE_SNAPSHOT}
    >
      {children}
    </HandTrackingContext>
  );
}
