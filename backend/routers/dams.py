import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.dam_service import fetch_dam_levels

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["dams"])


@router.get("/dams")
async def get_dams():
    try:
        data = await fetch_dam_levels()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/dams error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve dam levels"})
