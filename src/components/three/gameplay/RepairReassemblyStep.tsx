import { useEffect } from "react";
import { RepairCompletionParticles } from "@/components/three/gameplay/RepairCompletionParticles";

interface RepairReassemblyStepProps {
  onSettled?: () => void;
  delayMs?: number;
}

/**
 * Visual layer for the reassembly phase. The actual collapse animation
 * (parts lerping back to their original positions) is driven by the
 * shared ExplodableModel mounted upstream by RepairGame, which keeps a
 * single instance alive across fragmented -> done so the model never
 * reloads or jumps between phases.
 *
 * This component now only renders the completion particles and emits a
 * settled signal after `delayMs` so the upstream flow can advance.
 */
export function RepairReassemblyStep({
  onSettled,
  delayMs = 0,
}: RepairReassemblyStepProps): React.JSX.Element {
  useEffect(() => {
    if (!onSettled) return undefined;
    if (delayMs <= 0) {
      onSettled();
      return undefined;
    }

    const timeoutId = window.setTimeout(onSettled, delayMs);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onSettled, delayMs]);

  return <RepairCompletionParticles />;
}
