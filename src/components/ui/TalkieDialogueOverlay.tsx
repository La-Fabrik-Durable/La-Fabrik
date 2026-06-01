import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/managers/stores/useGameStore";
import { useSubtitleStore } from "@/managers/stores/useSubtitleStore";
import { GAME_STEPS } from "@/data/game/gameStateConfig";
import type { Vector3Tuple } from "@/types/three/three";

const TALKIE_MODEL_PATH = "/models/talkie/model.gltf";
const TALKIE_VIDEO_PATH = "/assets/world/UI/talkie-video.mp4";
const TALKIE_FIRST_VISIBLE_STEP = "reveal";
const TALKIE_FIRST_VISIBLE_STEP_INDEX = GAME_STEPS.indexOf(
  TALKIE_FIRST_VISIBLE_STEP,
);

const TALKIE_REST_Y = -1.55;
const TALKIE_ACTIVE_Y = -0.92;
const TALKIE_BASE_ROTATION: Vector3Tuple = [0.08, -0.52, -0.04];
const TALKIE_FLOAT_ROTATION_AMPLITUDE = THREE.MathUtils.degToRad(2.2);
const TALKIE_FLOAT_Y_AMPLITUDE = 0.055;
const TALKIE_SCREEN_TEXTURE_SIZE = 512;

interface TalkieModelProps {
  active: boolean;
}

interface TalkieVideoResources {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | null;
  material: THREE.MeshBasicMaterial;
  texture: THREE.CanvasTexture;
  video: HTMLVideoElement;
}

function createTalkieVideoResources(): TalkieVideoResources {
  const video = document.createElement("video");
  video.src = TALKIE_VIDEO_PATH;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const canvas = document.createElement("canvas");
  canvas.width = TALKIE_SCREEN_TEXTURE_SIZE;
  canvas.height = TALKIE_SCREEN_TEXTURE_SIZE;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
  });

  return { canvas, context, material, texture, video };
}

function TalkieModel({ active }: TalkieModelProps): React.JSX.Element {
  const { scene } = useGLTF(TALKIE_MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh | null>(null);
  const originalScreenMaterialRef = useRef<THREE.Material | null>(null);
  const videoResourcesRef = useRef<TalkieVideoResources | null>(null);

  useEffect(() => {
    const videoResources = createTalkieVideoResources();
    videoResourcesRef.current = videoResources;

    return () => {
      videoResources.video.pause();
      videoResources.video.removeAttribute("src");
      videoResources.video.load();
      videoResources.texture.dispose();
      videoResources.material.dispose();
      videoResourcesRef.current = null;
    };
  }, []);

  useEffect(() => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;
      }
    });

    const screen = model.getObjectByName("écran");
    if (screen instanceof THREE.Mesh) {
      screenRef.current = screen;
      originalScreenMaterialRef.current = Array.isArray(screen.material)
        ? (screen.material[0] ?? null)
        : screen.material;
    }
  }, [model]);

  useEffect(() => {
    const screen = screenRef.current;
    const originalMaterial = originalScreenMaterialRef.current;
    const videoResources = videoResourcesRef.current;

    if (!videoResources) return;

    if (screen) {
      screen.material = active
        ? videoResources.material
        : (originalMaterial ?? videoResources.material);
    }

    if (active) {
      void videoResources.video.play();
      return;
    }

    videoResources.video.pause();
  }, [active]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();
    const floatY = Math.sin(t * 1.2) * TALKIE_FLOAT_Y_AMPLITUDE;
    const targetY = (active ? TALKIE_ACTIVE_Y : TALKIE_REST_Y) + floatY;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.14,
    );

    groupRef.current.rotation.x =
      TALKIE_BASE_ROTATION[0] +
      Math.sin(t * 0.7) * TALKIE_FLOAT_ROTATION_AMPLITUDE;
    groupRef.current.rotation.y =
      TALKIE_BASE_ROTATION[1] +
      Math.sin(t * 0.55) * TALKIE_FLOAT_ROTATION_AMPLITUDE;
    groupRef.current.rotation.z =
      TALKIE_BASE_ROTATION[2] +
      Math.sin(t * 0.8) * TALKIE_FLOAT_ROTATION_AMPLITUDE;

    const videoResources = videoResourcesRef.current;

    if (active && videoResources?.context) {
      const { canvas, context, texture, video } = videoResources;
      context.fillStyle = "#02040a";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        const drawWidth =
          videoAspect > canvasAspect
            ? canvas.width
            : canvas.height * videoAspect;
        const drawHeight =
          videoAspect > canvasAspect
            ? canvas.width / videoAspect
            : canvas.height;
        const drawX = (canvas.width - drawWidth) / 2;
        const drawY = (canvas.height - drawHeight) / 2;

        context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
      }

      texture.needsUpdate = true;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, TALKIE_REST_Y, 0]}
      rotation={TALKIE_BASE_ROTATION}
    >
      <primitive
        object={model}
        position={[0, -3.25, 0]}
        rotation={[0, -1, 0]}
        scale={1.5}
      />
    </group>
  );
}

interface TalkieSignalLinesProps {
  side: "left" | "right";
}

function TalkieSignalLines({
  side,
}: TalkieSignalLinesProps): React.JSX.Element {
  return (
    <svg
      className={`talkie-dialogue-overlay__signals talkie-dialogue-overlay__signals--${side}`}
      viewBox="0 0 90 120"
      aria-hidden="true"
    >
      <path d="M18 48 C30 58 30 72 18 82" />
      <path d="M34 34 C56 52 56 78 34 96" />
      <path d="M52 20 C84 46 84 84 52 110" />
    </svg>
  );
}

export function TalkieDialogueOverlay(): React.JSX.Element | null {
  const activeSubtitle = useSubtitleStore((state) => state.activeSubtitle);
  const mainState = useGameStore((state) => state.mainState);
  const introStep = useGameStore((state) => state.intro.currentStep);
  const introStepIndex = GAME_STEPS.indexOf(introStep);
  const hasTalkieBeenRevealed =
    mainState !== "intro" || introStepIndex >= TALKIE_FIRST_VISIBLE_STEP_INDEX;
  const isNarratorDialogue = activeSubtitle?.speaker === "Narrateur";

  if (!hasTalkieBeenRevealed) return null;

  return (
    <aside
      className={`talkie-dialogue-overlay${isNarratorDialogue ? " talkie-dialogue-overlay--active talkie-dialogue-overlay--raised" : ""}`}
      aria-hidden="true"
    >
      {isNarratorDialogue ? <TalkieSignalLines side="left" /> : null}
      {isNarratorDialogue ? <TalkieSignalLines side="right" /> : null}
      <div className="talkie-dialogue-overlay__model-frame">
        <Canvas
          camera={{ position: [0, 0, 4.2], zoom: 62 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          orthographic
        >
          <ambientLight intensity={2.5} />
          <directionalLight position={[2, 3, 4]} intensity={2.8} />
          <Suspense fallback={null}>
            <TalkieModel active={isNarratorDialogue} />
          </Suspense>
        </Canvas>
      </div>
    </aside>
  );
}

useGLTF.preload(TALKIE_MODEL_PATH);
