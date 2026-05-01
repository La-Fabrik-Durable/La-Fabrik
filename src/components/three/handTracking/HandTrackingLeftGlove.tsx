import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { useHandTrackingSnapshot } from "@/hooks/handTracking/useHandTrackingSnapshot";
import { useLoggedGLTF } from "@/hooks/three/useLoggedGLTF";
import type { HandTrackingLandmark } from "@/types/handTracking/handTracking";

const LEFT_GLOVE_MODEL_URL = "/models/gant_l/model.gltf";
const HAND_SPACE_DISTANCE = 2.4;
const HAND_DEPTH_SCALE = 0.45;
const GLOVE_SCALE = 0.34;

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

function isLeftHand(handedness: string): boolean {
  return handedness.toLowerCase() === "left";
}

export function HandTrackingLeftGlove(): React.JSX.Element | null {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { hands } = useHandTrackingSnapshot();
  const gltf = useLoggedGLTF(LEFT_GLOVE_MODEL_URL, {
    scope: "HandTrackingLeftGlove",
    scale: GLOVE_SCALE,
  });
  const gloveScene = useMemo(() => clone(gltf.scene), [gltf.scene]);

  const leftHand = hands.find((hand) => isLeftHand(hand.handedness));

  useFrame((_, delta) => {
    const group = groupRef.current;
    const hand = hands.find((candidate) => isLeftHand(candidate.handedness));

    if (!group || !hand || hand.landmarks.length < 21) {
      if (group) group.visible = false;
      return;
    }

    group.visible = true;

    const wrist = hand.landmarks[0];
    const indexMcp = hand.landmarks[5];
    const middleMcp = hand.landmarks[9];
    const ringMcp = hand.landmarks[13];
    const pinkyMcp = hand.landmarks[17];

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
    const scale = palmLength * GLOVE_SCALE;
    group.scale.setScalar(scale);
  });

  if (!leftHand) return null;

  return <primitive ref={groupRef} object={gloveScene} />;
}

useGLTF.preload(LEFT_GLOVE_MODEL_URL);
