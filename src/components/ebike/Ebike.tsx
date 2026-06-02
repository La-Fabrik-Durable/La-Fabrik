import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EbikeGPSMap } from "@/components/ebike/EbikeGPSMap";
import { EbikeSpeedmeter } from "@/components/ebike/EbikeSpeedmeter";
import { InteractableObject } from "@/components/three/interaction/InteractableObject";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { useDebugFolder } from "@/hooks/debug/useDebugFolder";
import { useEbikeSounds } from "@/hooks/ebike/useEbikeSounds";
import {
  getObjectBottomOffset,
  useTerrainHeightSampler,
} from "@/hooks/three/useTerrainHeight";
import { animateCameraTransformTransition } from "@/world/GameCinematics";
import { useGameStore } from "@/managers/stores/useGameStore";
import {
  EBIKE_CAMERA_TRANSFORM,
  EBIKE_DROP_PLAYER_TRANSFORM,
  EBIKE_WORLD_SCALE,
  EBIKE_WORLD_ROTATION_Y,
} from "@/data/ebike/ebikeConfig";
import type { Vector3Tuple } from "@/types/three/three";
import "@/types/ebike/ebikeWindow";

const EBIKE_MODEL_PATH = "/models/ebike/model.gltf";

interface EbikeProps {
  position: Vector3Tuple;
}

export function Ebike({ position }: EbikeProps): React.JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(EBIKE_MODEL_PATH, {
    scope: "Ebike",
    position: position,
  });
  const model = useClonedObject(scene);
  const terrainHeight = useTerrainHeightSampler();
  const parkedPosition = useMemo<Vector3Tuple>(() => {
    const [x, y, z] = position;
    const height = terrainHeight.getHeight(x, z) ?? y;
    const bottomOffset = getObjectBottomOffset(model, [
      EBIKE_WORLD_SCALE,
      EBIKE_WORLD_SCALE,
      EBIKE_WORLD_SCALE,
    ]);

    return [x, height + bottomOffset, z];
  }, [model, position, terrainHeight]);
  const movementMode = useGameStore((state) => state.player.movementMode);
  const mainState = useGameStore((state) => state.mainState);
  const ebikeStep = useGameStore((state) => state.ebike.currentStep);
  const setMissionStep = useGameStore((state) => state.setMissionStep);
  const camera = useThree((state) => state.camera);
  const updateEbikeSounds = useEbikeSounds();
  const repairGameOwnsEbikeModel =
    mainState === "ebike" &&
    ebikeStep !== "locked" &&
    ebikeStep !== "waiting" &&
    ebikeStep !== "inspected";

  // Map active mainState to target repair zone coordinate
  const destPos = useMemo(() => {
    switch (mainState) {
      case "ebike":
        return { x: 8, y: 0, z: -6 };
      case "pylon":
        return { x: 64, y: 0, z: -66 };
      case "farm":
        return { x: -24, y: 0, z: 42 };
      default:
        return undefined;
    }
  }, [mainState]);

  // Throttled GPS start position to optimize pathfinding A* algorithm execution
  const [gpsStartPos, setGpsStartPos] = useState<{
    x: number;
    y: number;
    z: number;
  }>({
    x: parkedPosition[0],
    y: parkedPosition[1],
    z: parkedPosition[2],
  });
  const lastGpsUpdatePos = useRef<THREE.Vector3>(
    new THREE.Vector3(...parkedPosition),
  );

  // Use ref for internal state, and state for debug visualization (to avoid ref access during render)
  const restingPositionRef = useRef<Vector3Tuple>([
    parkedPosition[0],
    parkedPosition[1],
    parkedPosition[2],
  ]);
  const restingRotationRef = useRef<number>(EBIKE_WORLD_ROTATION_Y);
  const forkRef = useRef<THREE.Object3D | null>(null);

  // State for debug visualization (synced from refs during useFrame)
  const [showCameraPoints, setShowCameraPoints] = useState(true);
  const [debugRestingPosition, setDebugRestingPosition] =
    useState<Vector3Tuple>([
      parkedPosition[0],
      parkedPosition[1],
      parkedPosition[2],
    ]);

  useEffect(() => {
    if (movementMode === "ebike") return;

    restingPositionRef.current = parkedPosition;
    restingRotationRef.current = EBIKE_WORLD_ROTATION_Y;
    lastGpsUpdatePos.current.set(...parkedPosition);

    if (groupRef.current) {
      groupRef.current.position.set(...parkedPosition);
      groupRef.current.rotation.set(0, EBIKE_WORLD_ROTATION_Y, 0);
    }

    window.ebikeParkedPosition = parkedPosition;
    window.ebikeParkedRotation = EBIKE_WORLD_ROTATION_Y;
  }, [movementMode, parkedPosition]);

  useEffect(() => {
    if (!model) return;

    // Full recursive search — case-insensitive so it survives export renames.
    // Also tries the exact path Moto > * > Fourche as a fallback.
    let forkNode: THREE.Object3D | null = null;

    model.traverse((child) => {
      if (child.name.toLowerCase() === "fourche") {
        forkNode = child;
      }
    });

    if (forkNode) {
      forkRef.current = forkNode;
      console.log("[Ebike] Fork found:", (forkNode as THREE.Object3D).name);
    } else {
      // Print the full hierarchy tree so you can read the exact node names.
      const lines: string[] = [];
      function printTree(obj: THREE.Object3D, indent: number): void {
        lines.push(" ".repeat(indent * 2) + (obj.name || "(unnamed)"));
        for (const child of obj.children) {
          printTree(child, indent + 1);
        }
      }
      printTree(model, 0);
      console.warn(
        '[Ebike] No node matching "fourche" (case-insensitive) found.\nFull hierarchy:\n' +
          lines.join("\n"),
      );
    }
  }, [model]);

  useEffect(() => {
    if (!model) return;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [model]);

  useEffect(() => {
    window.ebikeVisualGroup = groupRef;
    window.ebikeParkedPosition = restingPositionRef.current;
    window.ebikeParkedRotation = restingRotationRef.current;
    return () => {
      window.ebikeVisualGroup = null;
      window.ebikeParkedPosition = null;
      window.ebikeParkedRotation = null;
    };
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (movementMode === "ebike") {
        // Sound plays whenever the bike is actually moving (speedFactor > 5 %),
        // not only while the input key is held.
        updateEbikeSounds({
          mounted: true,
          driving: (window.ebikeSpeedFactor ?? 0) > 0.05,
          breakdown: window.ebikeBreakdownActive === true,
        });

        restingPositionRef.current = [
          groupRef.current.position.x,
          groupRef.current.position.y,
          groupRef.current.position.z,
        ];
        restingRotationRef.current = groupRef.current.rotation.y;

        // Smoothly rotate the front fork ("fourche") on its local Z axis
        const steerFactor = window.ebikeSteerFactor ?? 0;
        if (forkRef.current) {
          // 10 degrees = 0.175 radians
          const targetForkRotation = steerFactor * 0.175;
          forkRef.current.rotation.z = THREE.MathUtils.lerp(
            forkRef.current.rotation.z,
            targetForkRotation,
            12 * delta,
          );
        }

        // Throttled GPS start position update to prevent performance loss
        const currentPos = groupRef.current.position;
        if (currentPos.distanceTo(lastGpsUpdatePos.current) > 2.0) {
          lastGpsUpdatePos.current.copy(currentPos);
          setGpsStartPos({ x: currentPos.x, y: currentPos.y, z: currentPos.z });
        }

        // Sync debug visualization state (throttled to avoid excessive re-renders)
        if (showCameraPoints) {
          setDebugRestingPosition([...restingPositionRef.current]);
        }
      } else {
        updateEbikeSounds({ mounted: false, driving: false, breakdown: false });
        groupRef.current.position.set(...restingPositionRef.current);
        groupRef.current.rotation.set(0, restingRotationRef.current, 0);

        // Reset fork rotation when parked
        if (forkRef.current) {
          forkRef.current.rotation.z = 0;
        }
      }
      window.ebikeParkedPosition = restingPositionRef.current;
      window.ebikeParkedRotation = restingRotationRef.current;
    }
  });

  // Debug visualization positions computed from state (not refs)
  const camPointPos: Vector3Tuple = [
    debugRestingPosition[0] + EBIKE_CAMERA_TRANSFORM.position[0],
    debugRestingPosition[1] + EBIKE_CAMERA_TRANSFORM.position[1],
    debugRestingPosition[2] + EBIKE_CAMERA_TRANSFORM.position[2],
  ];
  const dropPointPos: Vector3Tuple = [
    debugRestingPosition[0] + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
    debugRestingPosition[1] + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
    debugRestingPosition[2] + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
  ];
  const interactionLabel =
    mainState === "ebike"
      ? "Réparer l'e-bike"
      : movementMode === "walk"
        ? "Monter sur le bike"
        : "Descendre du bike";

  const handleInteract = useCallback((): void => {
    if (window.ebikeBreakdownActive === true) return;

    if (movementMode === "walk") {
      if (
        mainState === "ebike" &&
        (ebikeStep === "locked" || ebikeStep === "waiting")
      ) {
        setMissionStep("ebike", "inspected");
        return;
      }

      if (mainState === "ebike" && ebikeStep === "inspected") {
        setMissionStep("ebike", "fragmented");
        return;
      }

      const cameraOffset = new THREE.Vector3(
        ...EBIKE_CAMERA_TRANSFORM.position,
      );
      cameraOffset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        restingRotationRef.current,
      );

      const targetCamPos: Vector3Tuple = [
        restingPositionRef.current[0] + cameraOffset.x,
        restingPositionRef.current[1] + cameraOffset.y,
        restingPositionRef.current[2] + cameraOffset.z,
      ];

      const targetRotation: Vector3Tuple = [
        EBIKE_CAMERA_TRANSFORM.rotation[0],
        EBIKE_CAMERA_TRANSFORM.rotation[1] +
          THREE.MathUtils.radToDeg(restingRotationRef.current),
        EBIKE_CAMERA_TRANSFORM.rotation[2],
      ];

      animateCameraTransformTransition(targetCamPos, targetRotation, 1, () => {
        useGameStore.getState().setPlayerMovementMode("ebike");
      });
    } else {
      const currentPos = new THREE.Vector3();
      if (groupRef.current) {
        groupRef.current.getWorldPosition(currentPos);
      } else {
        currentPos.set(...position);
      }

      const targetCamPos: Vector3Tuple = [
        currentPos.x + EBIKE_DROP_PLAYER_TRANSFORM.position[0],
        currentPos.y + EBIKE_DROP_PLAYER_TRANSFORM.position[1],
        currentPos.z + EBIKE_DROP_PLAYER_TRANSFORM.position[2],
      ];

      // Get camera's current rotation in degrees so we keep the exact orientation during dismount
      const currentEuler = new THREE.Euler().setFromQuaternion(
        camera.quaternion,
        "YXZ",
      );
      const targetRotation: Vector3Tuple = [
        THREE.MathUtils.radToDeg(currentEuler.x),
        THREE.MathUtils.radToDeg(currentEuler.y),
        THREE.MathUtils.radToDeg(currentEuler.z),
      ];

      animateCameraTransformTransition(targetCamPos, targetRotation, 1, () => {
        useGameStore.getState().setPlayerMovementMode("walk");
      });
    }
  }, [movementMode, mainState, ebikeStep, setMissionStep, camera, position]);

  // Store handleInteract in a ref for use in debug folder callback
  const handleInteractRef = useRef(handleInteract);
  useEffect(() => {
    handleInteractRef.current = handleInteract;
  }, [handleInteract]);

  // Mutable object for lil-gui binding
  const debugState = useRef({ showCameraPoints: true });

  useDebugFolder("Ebike", (folder) => {
    folder
      .add(debugState.current, "showCameraPoints")
      .name("Show Camera Points")
      .onChange((value: boolean) => {
        setShowCameraPoints(value);
      });

    folder
      .add({ toggleRide: () => handleInteractRef.current() }, "toggleRide")
      .name("Monter / Descendre");
  });

  return (
    <>
      {!repairGameOwnsEbikeModel ? (
        <group
          ref={groupRef}
          position={parkedPosition}
          rotation={[0, EBIKE_WORLD_ROTATION_Y, 0]}
          scale={EBIKE_WORLD_SCALE}
        >
          <primitive object={model} />
          {/* radius 20 → ~7 unités monde (scale 0.35).
              Sphère omnidirectionnelle pour que le raycast fonctionne
              quelle que soit l'orientation de la caméra (montée ou à pied). */}
          <InteractableObject
            kind="trigger"
            label={interactionLabel}
            position={parkedPosition}
            radius={5}
            onPress={handleInteract}
          >
            <mesh>
              <sphereGeometry args={[8, 15, 12]} />
              <meshBasicMaterial colorWrite={false} color={"red"} depthWrite={false} />
            </mesh>
          </InteractableObject>

          {/* GPS + Speedmeter – same group so they are perfectly co-localised.
              GPS: full circle (Fresnel mask), renderOrder 10 000
              Speedmeter: upper-half arc overlay, renderOrder 10 001
              rotation: Math.PI/2 radians = 90° (NOT the number 90 which = ~116.6°) */}
          <group position={[2, 6, 0]} rotation={[0, -80, 0]}>
            <EbikeSpeedmeter width={3} height={1.5} position={[0, 0.4, 0]} gaugeInnerR={0.33} gaugeOuterR={0.445}
              gaugeWidth={2.5}
              gaugeHeight={2.1}
              gaugeOffsetX={0}
              gaugeOffsetY={-0.19}
            />
            <EbikeGPSMap
              width={1.3}
              height={1}
              startPos={gpsStartPos}
              destPos={destPos}
              mapImageUrl="/assets/world/gps/map_background.png"
              worldBounds={{
                minX: -166,
                maxX: 163,
                minZ: -142,
                maxZ: 138,
              }}
              zoom={4}
            />
          </group>
        </group>
      ) : null}

      {showCameraPoints && !repairGameOwnsEbikeModel && (
        <>
          {/* <mesh position={camPointPos}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="yellow"
              emissive="yellow"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={dropPointPos}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial
              color="cyan"
              emissive="cyan"
              emissiveIntensity={0.5}
            />
          </mesh> */}
        </>
      )}
    </>
  );
}
