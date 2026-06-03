import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { DebugPerf } from "@/components/debug/DebugPerf";
import { EbikeIntroSequence } from "@/components/game/EbikeIntroSequence";
import { EbikeRepairNarrator } from "@/components/game/EbikeRepairNarrator";
import { AppLoadingIndicator } from "@/components/ui/AppLoadingIndicator";
import { DialogMessage } from "@/components/ui/DialogMessage";
import { GameUI } from "@/components/ui/GameUI";
import {
  FadeToVideoOverlay,
  IntroDialogueOverlay,
  IntroRevealOverlay,
  IntroVideoPlayer,
} from "@/components/ui/intro";
import { SceneLoadingOverlay } from "@/components/ui/SceneLoadingOverlay";
import { INITIAL_SCENE_LOADING_STATE } from "@/data/world/sceneLoadingConfig";
import { useDebugStore } from "@/hooks/debug/useDebugStore";
import { useTransientLoadingIndicator } from "@/hooks/ui/useTransientLoadingIndicator";
import { releaseBrowserHandLandmarker } from "@/lib/handTracking/browserHandTracking";
import { AudioManager } from "@/managers/AudioManager";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useWorldSettingsStore } from "@/managers/stores/useWorldSettingsStore";
import { HandTrackingProvider } from "@/providers/gameplay/HandTrackingProvider";
import type { SceneLoadingState } from "@/types/world/sceneLoading";
import { hasSiteBeenVisitedToday } from "@/utils/cookies/siteVisitCookie";
import { logger } from "@/utils/core/Logger";
import { World } from "@/world/World";

const LOADING_TO_VIDEO_FADE_MS = 500;
const WEBGL_CONTEXT_RESTORE_DELAY_MS = 500;
const CANVAS_DPR: [number, number] = [1, 1];
const registeredWebglContextCanvases = new WeakSet<HTMLCanvasElement>();

export function HomePage(): React.JSX.Element | null {
  const navigate = useNavigate();
  const mainState = useGameStore((state) => state.mainState);
  const introStep = useGameStore((state) => state.intro.currentStep);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const pylonStep = useGameStore((state) => state.pylon.currentStep);
  const farmStep = useGameStore((state) => state.farm.currentStep);
  const setIntroStep = useGameStore((state) => state.setIntroStep);
  const graphicsPreset = useWorldSettingsStore(
    (state) => state.graphics.preset,
  );
  const cameraMode = useDebugStore((debug) => debug.getCameraMode());
  const handTrackingSource = useDebugStore((debug) =>
    debug.getHandTrackingSource(),
  );
  const sceneMode = useDebugStore((debug) => debug.getSceneMode());
  const dialogMessage = useGameStore(
    (state) => state.missionFlow.dialogMessage,
  );
  const hideDialog = useGameStore((state) => state.hideDialog);
  const { showLoading, visible: showTransientLoading } =
    useTransientLoadingIndicator();
  const [sceneLoadingState, setSceneLoadingState] = useState<SceneLoadingState>(
    INITIAL_SCENE_LOADING_STATE,
  );
  const sceneReadyRef = useRef(false);
  const cameraModeRef = useRef(cameraMode);
  const handTrackingSourceRef = useRef(handTrackingSource);
  const sceneModeRef = useRef(sceneMode);
  const runtimeLoadingSignal = `${graphicsPreset}:${mainState}:${ebikeStep}:${pylonStep}:${farmStep}`;
  const previousRuntimeLoadingSignalRef = useRef(runtimeLoadingSignal);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
    handTrackingSourceRef.current = handTrackingSource;
    sceneModeRef.current = sceneMode;
  }, [cameraMode, handTrackingSource, sceneMode]);

  useEffect(() => {
    sceneReadyRef.current = sceneLoadingState.status === "ready";
  }, [sceneLoadingState.status]);

  useEffect(() => {
    if (!hasSiteBeenVisitedToday()) {
      navigate({ to: "/site", replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!dialogMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      hideDialog();
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dialogMessage, hideDialog]);

  const handleSceneLoadingStateChange = useCallback(
    (nextState: SceneLoadingState) => {
      if (sceneReadyRef.current && nextState.status === "loading") {
        showLoading();
        return;
      }

      setSceneLoadingState((currentState) => {
        if (currentState.status === "ready" && nextState.status === "loading") {
          return currentState;
        }

        return {
          ...nextState,
          progress: Math.max(currentState.progress, nextState.progress),
        };
      });
    },
    [showLoading],
  );

  useEffect(() => {
    if (previousRuntimeLoadingSignalRef.current === runtimeLoadingSignal) {
      return;
    }

    previousRuntimeLoadingSignalRef.current = runtimeLoadingSignal;
    if (sceneLoadingState.status !== "ready") return;

    showLoading();
  }, [runtimeLoadingSignal, sceneLoadingState.status, showLoading]);

  useEffect(() => {
    if (introStep === "loading-map" && sceneLoadingState.status === "ready") {
      AudioManager.getInstance().stopMusic();
      setIntroStep("fade-to-video");
    }
  }, [introStep, sceneLoadingState.status, setIntroStep]);

  useEffect(() => {
    if (introStep !== "fade-to-video") return undefined;

    const timeoutId = window.setTimeout(() => {
      setIntroStep("video");
    }, LOADING_TO_VIDEO_FADE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [introStep, setIntroStep]);

  const handleCanvasCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      const canvas = gl.domElement;

      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFShadowMap;
      gl.shadowMap.autoUpdate = true;
      gl.shadowMap.needsUpdate = true;

      // The browser hands us a WEBGL_lose_context extension we can use to
      // ask the GPU to restore the context after a loss. Without this the
      // page stays frozen on a black canvas until the user reloads.
      const loseContextExt = gl.getContext().getExtension("WEBGL_lose_context");

      if (registeredWebglContextCanvases.has(canvas)) return;
      registeredWebglContextCanvases.add(canvas);

      const handleContextLost = (event: Event) => {
        event.preventDefault();
        releaseBrowserHandLandmarker();

        logger.error("WebGL", "Context lost - attempting auto-restore", {
          cameraMode: cameraModeRef.current,
          geometries: gl.info.memory.geometries,
          handTrackingSource: handTrackingSourceRef.current,
          sceneMode: sceneModeRef.current,
          textures: gl.info.memory.textures,
        });
        // Give the GPU a moment to free resources before asking it back.
        window.setTimeout(
          () => loseContextExt?.restoreContext(),
          WEBGL_CONTEXT_RESTORE_DELAY_MS,
        );
      };

      const handleContextRestored = () => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.shadowMap.autoUpdate = true;
        gl.shadowMap.needsUpdate = true;
        logger.info("WebGL", "Context restored", {
          cameraMode: cameraModeRef.current,
          handTrackingSource: handTrackingSourceRef.current,
          sceneMode: sceneModeRef.current,
        });
      };

      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
    },
    [],
  );

  // Don't mount the Canvas until we know we will not redirect to /site.
  // Without this guard the Canvas would mount, the effect above would fire
  // navigate, and the Canvas would unmount mid-load — leaking GLTF requests
  // and a WebGL context. The synchronous cookie check happens here AFTER
  // all hooks (rules of hooks) but BEFORE any expensive render.
  if (!hasSiteBeenVisitedToday()) return null;

  const showFadeToVideoOverlay =
    introStep === "fade-to-video" ||
    (introStep === "loading-map" && sceneLoadingState.status === "ready");
  const showSceneLoadingOverlay =
    introStep === "loading-map" || introStep === "fade-to-video";

  const renderIntroOverlay = () => {
    if (showFadeToVideoOverlay) return <FadeToVideoOverlay />;

    switch (introStep) {
      case "video":
        return <IntroVideoPlayer />;
      case "dialogue-intro":
        return <IntroDialogueOverlay />;
      case "reveal":
        return <IntroRevealOverlay />;
      default:
        return null;
    }
  };

  return (
    <HandTrackingProvider>
      <Canvas
        camera={{ position: [85, 60, 85], fov: 42 }}
        dpr={CANVAS_DPR}
        id="game-canvas"
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
        }}
        onCreated={handleCanvasCreated}
      >
        <Suspense fallback={null}>
          <World onLoadingStateChange={handleSceneLoadingStateChange} />
          <DebugPerf />
        </Suspense>
      </Canvas>
      <GameUI />
      {dialogMessage ? (
        <DialogMessage
          message={dialogMessage}
          duration={3000}
          onClose={hideDialog}
        />
      ) : null}
      {showSceneLoadingOverlay ? (
        <SceneLoadingOverlay state={sceneLoadingState} />
      ) : null}
      {showTransientLoading && !showSceneLoadingOverlay ? (
        <AppLoadingIndicator floating />
      ) : null}
      {renderIntroOverlay()}
      <EbikeIntroSequence />
      <EbikeRepairNarrator />
    </HandTrackingProvider>
  );
}
