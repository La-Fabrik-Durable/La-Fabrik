import { useFrame, useThree } from "@react-three/fiber";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import { logger } from "@/utils/core/Logger";
import { disposeModelMaterials } from "@/utils/three/dispose";

interface SkyModelProps {
  fallbackModelPath?: string | undefined;
  fallbackScale?: number | undefined;
  fallbackColor?: string | undefined;
  materialSide?: THREE.Side | undefined;
  modelPath: string;
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
  label: string;
  modelPath: string;
}

interface SkyModelErrorBoundaryState {
  hasError: boolean;
}

const SKY_MODEL_SCALE = 1;
const SKY_MODEL_RENDER_ORDER = -1000;

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

  componentDidCatch(error: Error): void {
    logger.warn(
      "SkyModel",
      `${this.props.label} model failed; using fallback`,
      {
        error,
        modelPath: this.props.modelPath,
      },
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function SkyModel({
  fallbackColor,
  fallbackModelPath,
  fallbackScale = SKY_MODEL_SCALE,
  materialSide = THREE.BackSide,
  modelPath,
  scale = SKY_MODEL_SCALE,
  unlit = false,
}: SkyModelProps): React.JSX.Element {
  const colorFallback = fallbackColor ? (
    <color attach="background" args={[fallbackColor]} />
  ) : null;

  const fallback = fallbackModelPath ? (
    <SkyModelErrorBoundary
      key={fallbackModelPath}
      fallback={colorFallback}
      label="Fallback sky"
      modelPath={fallbackModelPath}
    >
      <SkyModelContent
        materialSide={materialSide}
        modelPath={fallbackModelPath}
        scale={fallbackScale}
        unlit={unlit}
      />
    </SkyModelErrorBoundary>
  ) : (
    colorFallback
  );

  return (
    <SkyModelErrorBoundary
      key={modelPath}
      fallback={fallback}
      label="Primary sky"
      modelPath={modelPath}
    >
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
      disposeModelMaterials(model);
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
  const hasStandardProperties =
    "isMeshStandardMaterial" in material && material.isMeshStandardMaterial;
  const sourceMaterial = hasStandardProperties
    ? (material as THREE.MeshStandardMaterial)
    : null;

  return new THREE.MeshBasicMaterial({
    color: sourceMaterial?.color?.clone() ?? new THREE.Color("#ffffff"),
    map: sourceMaterial?.map ?? null,
    opacity: material.opacity,
    toneMapped: false,
    transparent: material.transparent,
  });
}
