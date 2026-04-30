import type { ReactNode } from "react";
import { Component, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useClonedObject } from "@/hooks/three/useClonedObject";
import { ExplodedModel } from "@/utils/three/ExplodedModel";
import type { ModelTransformProps, Vector3Tuple } from "@/types/three/three";
import { toVector3Scale } from "@/utils/three/scale";

interface ModelErrorBoundaryProps {
  children: ReactNode;
  position?: Vector3Tuple | undefined;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn("Failed to load explodable model", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <MissingModelFallback position={this.props.position} />;
    }

    return this.props.children;
  }
}

interface ExplodableModelInnerProps extends ModelTransformProps {
  modelPath: string;
  split: boolean;
  splitDistance?: number;
}

export function ExplodableModel(
  props: ExplodableModelInnerProps,
): React.JSX.Element {
  return (
    <ModelErrorBoundary key={props.modelPath} position={props.position}>
      <ExplodableModelInner {...props} />
    </ModelErrorBoundary>
  );
}

function ExplodableModelInner({
  modelPath,
  split,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  splitDistance = 1.2,
}: ExplodableModelInnerProps): React.JSX.Element {
  const { scene } = useGLTF(modelPath);
  const model = useClonedObject(scene);
  const explodedModel = useMemo(
    () => new ExplodedModel(model, { distance: splitDistance }),
    [model, splitDistance],
  );
  const parsedScale = toVector3Scale(scale);

  useEffect(() => {
    explodedModel.setSplit(split);
  }, [explodedModel, split]);

  useFrame((_, delta) => {
    explodedModel.update(delta);
  });

  return (
    <group position={position} rotation={rotation} scale={parsedScale}>
      <primitive object={model} />
    </group>
  );
}

function MissingModelFallback({
  position = [0, 0, 0],
}: {
  position?: Vector3Tuple | undefined;
}): React.JSX.Element {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#7f1d1d" wireframe />
    </mesh>
  );
}
