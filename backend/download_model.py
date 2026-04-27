from __future__ import annotations

from pathlib import Path
from urllib.request import urlretrieve


MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
MODEL_PATH = Path(__file__).with_name("hand_landmarker.task")


def download_model() -> None:
    if MODEL_PATH.exists():
        print(f"Model already exists at {MODEL_PATH}")
        return

    print("Downloading MediaPipe Hand Landmarker model...")
    urlretrieve(MODEL_URL, MODEL_PATH)
    print(f"Model downloaded to {MODEL_PATH}")


if __name__ == "__main__":
    download_model()
