import type { ReactNode } from "react";
import { Component, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import {
  useHandTrackingGloveStatus,
  type HandTrackingGloveHandedness,
} from "@/hooks/handTracking/useHandTrackingGloveStatus";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import type { HandTrackingLandmark } from "@/types/handTracking/handTracking";
import { logModelLoadError } from "@/utils/three/modelLoadLogger";

const GLOVE_CONFIGS: Record<
  HandTrackingGloveHandedness,
  {
    modelPath: string;
    rootNodeName: string;
    scale: number;
  }
> = {
  left: {
    modelPath: "/models/gant_l/model.gltf",
    rootNodeName: "Armature",
    scale: 0.17,
  },
  right: {
    modelPath: "/models/gant_r/model.gltf",
    rootNodeName: "Hand_r",
    scale: 0.04,
  },
};

const HAND_SPACE_DISTANCE = 2.4;
const HAND_DEPTH_SCALE = 0.45;

const _cameraPosition = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _xAxis = new THREE.Vector3();
const _yAxis = new THREE.Vector3();
const _zAxis = new THREE.Vector3();
const _matrix = new THREE.Matrix4();
const _targetQuaternion = new THREE.Quaternion();
const _targetPosition = new THREE.Vector3();
const _wristPosition = new THREE.Vector3();
const _indexPosition = new THREE.Vector3();
const _middlePosition = new THREE.Vector3();
const _ringPosition = new THREE.Vector3();
const _pinkyPosition = new THREE.Vector3();

interface HandTrackingGloveProps {
  handedness: HandTrackingGloveHandedness;
}

interface HandTrackingGloveErrorBoundaryProps {
  children: ReactNode;
  handedness: HandTrackingGloveHandedness;
  modelPath: string;
}

class HandTrackingGloveErrorBoundary extends Component<
  HandTrackingGloveErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: HandTrackingGloveErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    useHandTrackingGloveStatus
      .getState()
      .setGloveStatus(this.props.handedness, "error");

    logModelLoadError(
      {
        modelPath: this.props.modelPath,
        scope: `HandTrackingGlove.${this.props.handedness}`,
        scale: GLOVE_CONFIGS[this.props.handedness].scale,
      },
      error,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) return null;

    return this.props.children;
  }
}

function landmarkToWorldPoint(
  landmark: HandTrackingLandmark,
  camera: THREE.Camera,
  target: THREE.Vector3,
): THREE.Vector3 {
  _cameraPosition.setFromMatrixPosition(camera.matrixWorld);
  target.set((1 - landmark.x) * 2 - 1, -landmark.y * 2 + 1, 0.5);
  target.unproject(camera);

  _direction.copy(target).sub(_cameraPosition).normalize();
  target
    .copy(_cameraPosition)
    .addScaledVector(
      _direction,
      HAND_SPACE_DISTANCE - landmark.z * HAND_DEPTH_SCALE,
    );

  return target;
}

function matchesHandedness(
  handHandedness: string,
  targetHandedness: HandTrackingGloveHandedness,
): boolean {
  return handHandedness.toLowerCase() === targetHandedness;
}

function HandTrackingGloveModel({
  handedness,
}: HandTrackingGloveProps): React.JSX.Element | null {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { hands } = useHandTrackingSnapshot();
  const setGloveStatus = useHandTrackingGloveStatus(
    (state) => state.setGloveStatus,
  );
  const config = GLOVE_CONFIGS[handedness];
  const modelPath = config.modelPath;
  const gltf = useLoggedGLTF(modelPath, {
    scope: `HandTrackingGlove.${handedness}`,
    scale: config.scale,
  });
  const gloveScene = useMemo(() => {
    const rootNode = gltf.scene.getObjectByName(config.rootNodeName);

    if (!rootNode) {
      throw new Error(`Missing glove root node ${config.rootNodeName}`);
    }

    return clone(rootNode);
  }, [config.rootNodeName, gltf.scene]);

  const hand = hands.find((candidate) =>
    matchesHandedness(candidate.handedness, handedness),
  );

  useEffect(() => {
    setGloveStatus(handedness, "loaded");
  }, [handedness, setGloveStatus]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const trackedHand = hands.find((candidate) =>
      matchesHandedness(candidate.handedness, handedness),
    );

    if (!group || !trackedHand || trackedHand.landmarks.length < 21) {
      if (group) group.visible = false;
      return;
    }

    group.visible = true;

    const wrist = trackedHand.landmarks[0];
    const indexMcp = trackedHand.landmarks[5];
    const middleMcp = trackedHand.landmarks[9];
    const ringMcp = trackedHand.landmarks[13];
    const pinkyMcp = trackedHand.landmarks[17];

    if (!wrist || !indexMcp || !middleMcp || !ringMcp || !pinkyMcp) {
      group.visible = false;
      return;
    }

    landmarkToWorldPoint(wrist, camera, _wristPosition);
    landmarkToWorldPoint(indexMcp, camera, _indexPosition);
    landmarkToWorldPoint(middleMcp, camera, _middlePosition);
    landmarkToWorldPoint(ringMcp, camera, _ringPosition);
    landmarkToWorldPoint(pinkyMcp, camera, _pinkyPosition);

    _targetPosition
      .copy(_wristPosition)
      .add(_indexPosition)
      .add(_middlePosition)
      .add(_ringPosition)
      .add(_pinkyPosition)
      .multiplyScalar(0.2);

    _yAxis.copy(_middlePosition).sub(_wristPosition).normalize();
    _xAxis.copy(_indexPosition).sub(_pinkyPosition).normalize();
    _zAxis.crossVectors(_xAxis, _yAxis).normalize();

    if (
      _xAxis.lengthSq() === 0 ||
      _yAxis.lengthSq() === 0 ||
      _zAxis.lengthSq() === 0
    ) {
      return;
    }

    _xAxis.crossVectors(_yAxis, _zAxis).normalize();
    _matrix.makeBasis(_xAxis, _yAxis, _zAxis);
    _targetQuaternion.setFromRotationMatrix(_matrix);

    group.position.lerp(_targetPosition, Math.min(1, delta * 18));
    group.quaternion.slerp(_targetQuaternion, Math.min(1, delta * 18));

    const palmLength = _wristPosition.distanceTo(_middlePosition);
    const scale = palmLength * config.scale;
    group.scale.setScalar(scale);
  });

  if (!hand) return null;

  return <primitive ref={groupRef} object={gloveScene} />;
}

export function HandTrackingGlove({
  handedness,
}: HandTrackingGloveProps): React.JSX.Element {
  const modelPath = GLOVE_CONFIGS[handedness].modelPath;

  return (
    <HandTrackingGloveErrorBoundary
      handedness={handedness}
      modelPath={modelPath}
    >
      <HandTrackingGloveModel handedness={handedness} />
    </HandTrackingGloveErrorBoundary>
  );
}

useGLTF.preload(GLOVE_CONFIGS.left.modelPath);
useGLTF.preload(GLOVE_CONFIGS.right.modelPath);
