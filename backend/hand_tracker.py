from __future__ import annotations

import base64
import math
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


@dataclass(frozen=True)
class HandData:
    x: float
    y: float
    z: float
    landmarks: list[dict[str, float]]
    handedness: str
    is_pinch: bool
    pinch_distance: float
    score: float

    def to_payload(self) -> dict[str, float | str | bool | list[dict[str, float]]]:
        return {
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "landmarks": self.landmarks,
            "handedness": self.handedness,
            "isPinch": self.is_pinch,
            "pinchDistance": self.pinch_distance,
            "score": self.score,
        }


class HandTracker:
    def __init__(self, max_hands: int = 2) -> None:
        model_path = Path(__file__).with_name("hand_landmarker.task")
        if not model_path.exists():
            raise FileNotFoundError(
                "Missing hand_landmarker.task. Run `python backend/download_model.py`.",
            )

        base_options = python.BaseOptions(model_asset_path=str(model_path))
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=max_hands,
        )
        self._detector = vision.HandLandmarker.create_from_options(options)

    def detect_from_base64_jpeg(self, image_base64: str) -> list[HandData]:
        image_data = base64.b64decode(image_base64, validate=True)
        image_buffer = np.frombuffer(image_data, dtype=np.uint8)
        frame = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Invalid JPEG frame")

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self._detector.detect(mp_image)
        return self._to_hands(result)

    def close(self) -> None:
        self._detector.close()

    def _to_hands(self, result: vision.HandLandmarkerResult) -> list[HandData]:
        hands: list[HandData] = []
        if not result.hand_landmarks or not result.handedness:
            return hands

        for landmarks, handedness_categories in zip(
            result.hand_landmarks,
            result.handedness,
        ):
            index_tip = landmarks[8]
            thumb_tip = landmarks[4]
            pinch_distance = self._calculate_distance(index_tip, thumb_tip)
            handedness = handedness_categories[0]

            hands.append(
                HandData(
                    x=index_tip.x,
                    y=index_tip.y,
                    z=index_tip.z,
                    landmarks=[
                        {"x": point.x, "y": point.y, "z": point.z}
                        for point in landmarks
                    ],
                    handedness=handedness.category_name,
                    is_pinch=pinch_distance < 0.07,
                    pinch_distance=pinch_distance,
                    score=handedness.score,
                ),
            )

        return hands

    def _calculate_distance(self, point_a: Any, point_b: Any) -> float:
        return math.sqrt(
            (point_a.x - point_b.x) ** 2
            + (point_a.y - point_b.y) ** 2
            + (point_a.z - point_b.z) ** 2,
        )


def now_ms() -> int:
    return time.monotonic_ns() // 1_000_000
