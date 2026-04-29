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
    is_fist: bool
    score: float

    def to_payload(self) -> dict[str, float | str | bool | list[dict[str, float]]]:
        return {
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "landmarks": self.landmarks,
            "handedness": self.handedness,
            "isFist": self.is_fist,
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
            palm_center = self._average_points(
                [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]],
            )
            is_fist = self._is_fist(landmarks)
            handedness = handedness_categories[0]

            hands.append(
                HandData(
                    x=palm_center["x"],
                    y=palm_center["y"],
                    z=palm_center["z"],
                    landmarks=[
                        {"x": point.x, "y": point.y, "z": point.z}
                        for point in landmarks
                    ],
                    handedness=handedness.category_name,
                    is_fist=is_fist,
                    score=handedness.score,
                ),
            )

        return hands

    def _is_fist(self, landmarks: list[Any]) -> bool:
        palm_center = self._average_points(
            [landmarks[0], landmarks[5], landmarks[9], landmarks[13], landmarks[17]],
        )
        palm_size = self._calculate_distance(landmarks[0], landmarks[9])
        if palm_size <= 0:
            return False

        folded_finger_count = sum(
            self._calculate_distance(landmarks[index], palm_center) / palm_size < 1.05
            for index in (8, 12, 16, 20)
        )

        return folded_finger_count >= 4

    def _average_points(self, points: list[Any]) -> dict[str, float]:
        return {
            "x": sum(point.x for point in points) / len(points),
            "y": sum(point.y for point in points) / len(points),
            "z": sum(point.z for point in points) / len(points),
        }

    def _calculate_distance(self, point_a: Any, point_b: Any) -> float:
        return math.sqrt(
            (self._get_coordinate(point_a, "x") - self._get_coordinate(point_b, "x"))
            ** 2
            + (self._get_coordinate(point_a, "y") - self._get_coordinate(point_b, "y"))
            ** 2
            + (self._get_coordinate(point_a, "z") - self._get_coordinate(point_b, "z"))
            ** 2,
        )

    def _get_coordinate(self, point: Any, axis: str) -> float:
        if isinstance(point, dict):
            return point[axis]

        return getattr(point, axis)


def now_ms() -> int:
    return time.monotonic_ns() // 1_000_000
