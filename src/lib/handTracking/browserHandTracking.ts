import {
  HAND_TRACKING_BROWSER_DELEGATE,
  HAND_TRACKING_BROWSER_MODEL_URL,
  HAND_TRACKING_BROWSER_WASM_URL,
} from "@/data/handTrackingConfig";
import type {
  HandTrackingHand,
  HandTrackingLandmark,
} from "@/types/handTracking/handTracking";
import { logger } from "@/utils/core/Logger";

type HandLandmarkerModule = typeof import("@mediapipe/tasks-vision");
type HandLandmarker = Awaited<
  ReturnType<HandLandmarkerModule["HandLandmarker"]["createFromOptions"]>
>;
type HandLandmarkerResult = ReturnType<HandLandmarker["detectForVideo"]>;

let handLandmarkerPromise: Promise<HandLandmarker> | null = null;
let handLandmarkerInstance: HandLandmarker | null = null;

function averageLandmarks(
  landmarks: HandTrackingLandmark[],
  indices: number[],
): HandTrackingLandmark {
  const point = indices.reduce(
    (current, index) => {
      const landmark = landmarks[index];
      if (!landmark) return current;

      return {
        x: current.x + landmark.x,
        y: current.y + landmark.y,
        z: current.z + landmark.z,
      };
    },
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: point.x / indices.length,
    y: point.y / indices.length,
    z: point.z / indices.length,
  };
}

function distance(
  pointA: HandTrackingLandmark,
  pointB: HandTrackingLandmark,
): number {
  return Math.sqrt(
    (pointA.x - pointB.x) ** 2 +
      (pointA.y - pointB.y) ** 2 +
      (pointA.z - pointB.z) ** 2,
  );
}

function isFist(landmarks: HandTrackingLandmark[]): boolean {
  const palmCenter = averageLandmarks(landmarks, [0, 5, 9, 13, 17]);
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  if (!wrist || !middleMcp) return false;

  const palmSize = distance(wrist, middleMcp);
  if (palmSize <= 0) return false;

  const foldedFingerCount = [8, 12, 16, 20].filter((index) => {
    const landmark = landmarks[index];
    if (!landmark) return false;

    return distance(landmark, palmCenter) / palmSize < 1.05;
  }).length;

  return foldedFingerCount >= 4;
}

export async function getBrowserHandLandmarker(): Promise<HandLandmarker> {
  handLandmarkerPromise ??= import("@mediapipe/tasks-vision").then(
    async ({ FilesetResolver, HandLandmarker }) => {
      const vision = await FilesetResolver.forVisionTasks(
        HAND_TRACKING_BROWSER_WASM_URL,
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_TRACKING_BROWSER_MODEL_URL,
          delegate: HAND_TRACKING_BROWSER_DELEGATE,
        },
        numHands: 2,
        runningMode: "VIDEO",
      });

      handLandmarkerInstance = handLandmarker;
      return handLandmarker;
    },
  );

  return handLandmarkerPromise;
}

export function releaseBrowserHandLandmarker(): void {
  const activeLandmarker = handLandmarkerInstance;
  const pendingLandmarker = handLandmarkerPromise;

  handLandmarkerInstance = null;
  handLandmarkerPromise = null;

  if (activeLandmarker) {
    activeLandmarker.close();
    return;
  }

  void pendingLandmarker
    ?.then((landmarker) => {
      landmarker.close();
    })
    .catch((error: unknown) => {
      logger.warn("HandTracking", "Browser JS landmarker release failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
}

export function convertBrowserHandResult(
  result: HandLandmarkerResult,
): HandTrackingHand[] {
  return result.landmarks.map((landmarks, index) => {
    const normalizedLandmarks = landmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
    }));
    const palmCenter = averageLandmarks(normalizedLandmarks, [0, 5, 9, 13, 17]);
    const handedness = result.handedness[index]?.[0];

    return {
      x: palmCenter.x,
      y: palmCenter.y,
      z: palmCenter.z,
      landmarks: normalizedLandmarks,
      handedness: handedness?.categoryName ?? "Unknown",
      isFist: isFist(normalizedLandmarks),
      score: handedness?.score ?? 0,
    };
  });
}
