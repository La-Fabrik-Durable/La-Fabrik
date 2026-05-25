import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";

interface SkyModelProps {
  modelPath: string;
  fallbackModelPath?: string | undefined;
  fallbackScale?: number | undefined;
  materialSide?: THREE.Side | undefined;
  scale?: number | undefined;
  unlit?: boolean | undefined;
}

interface SkyModelContentProps {
  materialSide: THREE.Side;
  modelPath: string;
  scale: number;
  unlit: boolean;
}

interface SkyModelErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface SkyModelErrorBoundaryState {
  hasError: boolean;
}

const SKY_MODEL_SCALE = 1;
const SKY_MODEL_RENDER_ORDER = -1000;
const LEGACY_SKY_MODEL_PATH = "/models/sky/model.glb";

class SkyModelErrorBoundary extends Component<
  SkyModelErrorBoundaryProps,
  SkyModelErrorBoundaryState
> {
  constructor(props: SkyModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SkyModelErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function SkyModel({
  fallbackModelPath,
  fallbackScale = SKY_MODEL_SCALE,
  materialSide = THREE.BackSide,
  modelPath,
  scale = SKY_MODEL_SCALE,
  unlit = false,
}: SkyModelProps): React.JSX.Element {
  const fallback = fallbackModelPath ? (
    <SkyModelContent
      materialSide={materialSide}
      modelPath={fallbackModelPath}
      scale={fallbackScale}
      unlit={unlit}
    />
  ) : null;

  return (
    <SkyModelErrorBoundary key={modelPath} fallback={fallback}>
      <SkyModelContent
        materialSide={materialSide}
        modelPath={modelPath}
        scale={scale}
        unlit={unlit}
      />
    </SkyModelErrorBoundary>
  );
}

function SkyModelContent({
  materialSide,
  modelPath,
  scale,
  unlit,
}: SkyModelContentProps): React.JSX.Element {
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useLoggedGLTF(modelPath, {
    scope: "SkyModel",
    scale,
  });
  const model = useMemo(
    () => createSkyModel(scene, materialSide, unlit),
    [materialSide, scene, unlit],
  );

  useEffect(() => {
    return () => {
      disposeSkyModelMaterials(model);
    };
  }, [model]);

  useFrame(() => {
    groupRef.current?.position.copy(camera.position);
  });

  return (
    <group
      ref={groupRef}
      renderOrder={SKY_MODEL_RENDER_ORDER}
      scale={scale}
      frustumCulled={false}
    >
      <primitive object={model} />
    </group>
  );
}

function createSkyModel(
  scene: THREE.Object3D,
  materialSide: THREE.Side,
  unlit: boolean,
): THREE.Object3D {
  const model = scene.clone(true);

  model.traverse((object) => {
    object.frustumCulled = false;
    object.renderOrder = SKY_MODEL_RENDER_ORDER;

    if (!(object instanceof THREE.Mesh)) return;

    object.material = Array.isArray(object.material)
      ? object.material.map((material) =>
          createSkyMaterial(material, materialSide, unlit),
        )
      : createSkyMaterial(object.material, materialSide, unlit);
  });

  return model;
}

function createSkyMaterial<T extends THREE.Material>(
  material: T,
  materialSide: THREE.Side,
  unlit: boolean,
): THREE.Material {
  const skyMaterial = unlit
    ? createUnlitSkyMaterial(material)
    : material.clone();
  skyMaterial.side = materialSide;
  skyMaterial.depthTest = false;
  skyMaterial.depthWrite = false;

  return skyMaterial;
}

function createUnlitSkyMaterial(
  material: THREE.Material,
): THREE.MeshBasicMaterial {
  const sourceMaterial = material as THREE.MeshStandardMaterial;

  return new THREE.MeshBasicMaterial({
    color: sourceMaterial.color?.clone() ?? new THREE.Color("#ffffff"),
    map: sourceMaterial.map ?? null,
    opacity: sourceMaterial.opacity,
    toneMapped: false,
    transparent: sourceMaterial.transparent,
  });
}

function disposeSkyModelMaterials(model: THREE.Object3D): void {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    if (Array.isArray(object.material)) {
      for (const material of object.material) {
        material.dispose();
      }
      return;
    }

    object.material.dispose();
  });
}

useGLTF.preload("/models/skybox/skybox.gltf");
useGLTF.preload(LEGACY_SKY_MODEL_PATH);
