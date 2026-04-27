# Hand Tracking Backend

Remote-compatible Python backend for La-Fabrik hand tracking.

The browser captures webcam frames, downsizes them, sends JPEG frames to this backend over WebSocket, and receives hand landmarks plus pinch state.

## Setup

```bash
python3.11 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python backend/download_model.py
```

## Run

Run the Vite frontend and the Python backend in two separate terminals.

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
source backend/.venv/bin/activate
python -m backend.main
```

The WebSocket endpoint is:

```txt
ws://localhost:8000/ws
```

## Health Check

```txt
http://localhost:8000/health
```

## Message Flow

Client sends a compressed frame:

```json
{
  "type": "frame",
  "timestamp": 1234567890,
  "width": 320,
  "height": 240,
  "image": "base64-jpeg"
}
```

Server responds with detected hands:

```json
{
  "type": "hands",
  "timestamp": 1234567890,
  "hands": [
    {
      "x": 0.5,
      "y": 0.3,
      "z": 0.1,
      "handedness": "Right",
      "isPinch": true,
      "pinchDistance": 0.05,
      "score": 0.92
    }
  ]
}
```

## Notes

- The backend does not read `cv2.VideoCapture(0)`.
- This keeps local development and production behavior aligned.
- Each browser connection sends its own webcam frames.
- The backend rate-limits frames per connection and drops work when a client is already being processed.
