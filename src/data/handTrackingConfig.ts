const HAND_TRACKING_LOCAL_WS_URL = "ws://localhost:8000/ws";
const HAND_TRACKING_PROD_WS_URL = "wss://handtracking.la-fabrik.fr/ws";

export const HAND_TRACKING_FRAME_WIDTH = 320;
export const HAND_TRACKING_FRAME_HEIGHT = 240;
export const HAND_TRACKING_TARGET_FPS = 10;
export const HAND_TRACKING_JPEG_QUALITY = 0.55;
export const HAND_TRACKING_CAMERA_TIMEOUT_MS = 8_000;
export const HAND_TRACKING_RESPONSE_TIMEOUT_MS = 1_500;
export const HAND_TRACKING_BROWSER_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
export const HAND_TRACKING_BROWSER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export function getHandTrackingWsUrl(): string {
  const configuredUrl = import.meta.env.VITE_HAND_TRACKING_WS_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  return import.meta.env.DEV
    ? HAND_TRACKING_LOCAL_WS_URL
    : HAND_TRACKING_PROD_WS_URL;
}
