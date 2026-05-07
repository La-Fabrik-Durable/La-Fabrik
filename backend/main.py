from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from backend.connection_manager import ClientConnection, ConnectionManager
from backend.hand_tracker import HandTracker, now_ms


MAX_FRAME_BYTES = 220_000
MIN_FRAME_INTERVAL_SECONDS = 0.08

manager = ConnectionManager()
tracker: HandTracker | None = None
detection_lock = asyncio.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global tracker
    tracker = HandTracker(max_hands=2)
    yield
    if tracker:
        tracker.close()


app = FastAPI(title="La-Fabrik Hand Tracking", lifespan=lifespan)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(
        {
            "status": "ok",
            "connections": manager.count,
        },
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    connection = await manager.connect(websocket)
    await manager.send(connection, status_payload("connected"))

    try:
        while True:
            message = await websocket.receive_json()
            response = await handle_message(connection, message)
            await manager.send(connection, response)
    except WebSocketDisconnect:
        manager.disconnect(connection)
    except Exception as error:
        await manager.send(connection, error_payload(str(error)))
        manager.disconnect(connection)


async def handle_message(
    connection: ClientConnection,
    message: dict[str, Any],
) -> dict[str, Any]:
    if message.get("type") != "frame":
        return error_payload("Unsupported message type")

    current_time = asyncio.get_running_loop().time()
    if current_time - connection.last_frame_at < MIN_FRAME_INTERVAL_SECONDS:
        return status_payload("rate_limited")

    if connection.is_processing:
        return status_payload("busy")

    image = message.get("image")
    if not isinstance(image, str):
        return error_payload("Missing image payload")

    if len(image) > MAX_FRAME_BYTES:
        return error_payload("Frame payload too large")

    if tracker is None:
        return error_payload("Hand tracker is not ready")

    if detection_lock.locked():
        return status_payload("busy")

    connection.last_frame_at = current_time
    connection.is_processing = True
    try:
        async with detection_lock:
            hands = await asyncio.to_thread(tracker.detect_from_base64_jpeg, image)
        return {
            "type": "hands",
            "timestamp": now_ms(),
            "hands": [hand.to_payload() for hand in hands],
        }
    finally:
        connection.is_processing = False


def status_payload(status: str) -> dict[str, str | int]:
    return {
        "type": "status",
        "timestamp": now_ms(),
        "status": status,
    }


def error_payload(message: str) -> dict[str, str | int | list[Any]]:
    return {
        "type": "error",
        "timestamp": now_ms(),
        "hands": [],
        "message": message,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
