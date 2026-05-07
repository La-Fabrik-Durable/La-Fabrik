import { createContext, useContext } from "react";

export interface AnimatedModelContextValue {
  play: (name: string, fade?: number) => void;
  stop: (fade?: number) => void;
  fadeTo: (name: string, fade?: number) => void;
  currentAnimation: string;
  isReady: boolean;
  setSpeed: (speed: number) => void;
  names: string[];
}

export const AnimatedModelContext =
  createContext<AnimatedModelContextValue | null>(null);

export function useAnimatedModel(): AnimatedModelContextValue {
  const context = useContext(AnimatedModelContext);
  if (!context) {
    throw new Error("useAnimatedModel must be used inside AnimatedModel");
  }

  return context;
}
