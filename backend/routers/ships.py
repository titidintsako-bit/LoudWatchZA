import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from services.ship_service import fetch_ships

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ships"])


@router.get("/api/ships")
async def get_ships():
    try:
        ships = await fetch_ships()
        return JSONResponse(content={"ships": ships, "count": len(ships)})
    except Exception as e:
        logger.error(f"GET /api/ships error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve ship data"})


@router.websocket("/ws/ships")
async def ws_ships(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket /ws/ships client connected")
    try:
        while True:
            try:
                ships = await fetch_ships()
                payload = json.dumps({"ships": ships, "count": len(ships)})
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(f"ws_ships send error: {e}")
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        logger.info("WebSocket /ws/ships client disconnected")
    except Exception as e:
        logger.error(f"ws_ships unexpected error: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
