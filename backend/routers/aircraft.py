import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from services.aircraft_service import fetch_aircraft

logger = logging.getLogger(__name__)
router = APIRouter(tags=["aircraft"])


@router.get("/api/aircraft")
async def get_aircraft():
    try:
        aircraft_list = await fetch_aircraft()
        return JSONResponse(content={"aircraft": aircraft_list, "count": len(aircraft_list)})
    except Exception as e:
        logger.error(f"GET /api/aircraft error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve aircraft data"})


@router.websocket("/ws/aircraft")
async def ws_aircraft(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket /ws/aircraft client connected")
    try:
        while True:
            try:
                aircraft_list = await fetch_aircraft()
                payload = json.dumps({"aircraft": aircraft_list, "count": len(aircraft_list)})
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(f"ws_aircraft send error: {e}")
            await asyncio.sleep(15)
    except WebSocketDisconnect:
        logger.info("WebSocket /ws/aircraft client disconnected")
    except Exception as e:
        logger.error(f"ws_aircraft unexpected error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
