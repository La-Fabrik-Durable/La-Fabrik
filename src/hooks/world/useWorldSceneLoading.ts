import { useCallback, useEffect, useState } from "react";
import type { Octree } from "three/addons/math/Octree.js";
import type { SceneMode } from "@/types/debug/debug";
import type { SceneLoadingChangeHandler } from "@/types/world/sceneLoading";
import { logger } from "@/utils/core/Logger";

interface UseWorldSceneLoadingOptions {
  onLoadingStateChange?: SceneLoadingChangeHandler | undefined;
  sceneMode: SceneMode;
}

interface UseWorldSceneLoadingResult {
  octree: Octree | null;
  gameplayReady: boolean;
  showGameStage: boolean;
  handleGameStageLoaded: () => void;
  handleGameMapLoaded: () => void;
  handleOctreeReady: (octree: Octree) => void;
}

export function useWorldSceneLoading({
  onLoadingStateChange,
  sceneMode,
}: UseWorldSceneLoadingOptions): UseWorldSceneLoadingResult {
  const [octree, setOctree] = useState<Octree | null>(null);
  const [gameMapLoaded, setGameMapLoaded] = useState(false);
  const [gameStageLoaded, setGameStageLoaded] = useState(false);
  const showGameStage = sceneMode === "game" && gameMapLoaded;
  const gameplayReady = showGameStage && gameStageLoaded && octree !== null;
  const sceneReady =
    (sceneMode === "game" && gameplayReady) ||
    (sceneMode === "physics" && octree !== null);

  const handleGameMapLoaded = useCallback(() => {
    logger.info("WorldSceneLoading", "GameMap loaded");
    setGameMapLoaded(true);
  }, []);

  const handleGameStageLoaded = useCallback(() => {
    logger.info("WorldSceneLoading", "GameStage loaded");
    setGameStageLoaded(true);
    onLoadingStateChange?.({
      currentStep: "Initialisation gameplay",
      progress: 0.96,
      status: "loading",
    });
  }, [onLoadingStateChange]);

  const handleOctreeReady = useCallback(
    (nextOctree: Octree) => {
      logger.info("WorldSceneLoading", "Octree ready");
      setOctree(nextOctree);
      onLoadingStateChange?.({
        currentStep: "Collision prête",
        progress: 0.92,
        status: "loading",
      });
    },
    [onLoadingStateChange],
  );

  useEffect(() => {
    onLoadingStateChange?.({
      currentStep: "Initialisation du jeu",
      progress: 0,
      status: "loading",
    });
  }, [onLoadingStateChange, sceneMode]);

  useEffect(() => {
    if (!sceneReady) return undefined;

    onLoadingStateChange?.({
      currentStep: "Gameplay prêt",
      progress: 0.96,
      status: "loading",
    });

    const timeoutId = window.setTimeout(() => {
      onLoadingStateChange?.({
        currentStep: "Gameplay prêt",
        progress: 1,
        status: "ready",
      });
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onLoadingStateChange, sceneReady]);

  return {
    octree,
    gameplayReady,
    showGameStage,
    handleGameStageLoaded,
    handleGameMapLoaded,
    handleOctreeReady,
  };
}
