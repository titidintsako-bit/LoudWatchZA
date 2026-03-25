import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.loadshedding_service import fetch_area_schedule, fetch_current_stage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/loadshedding", tags=["loadshedding"])


@router.get("/current")
async def get_current_stage():
    try:
        data = await fetch_current_stage()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/loadshedding/current error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to retrieve loadshedding stage"},
        )


@router.get("/area/{area_id}")
async def get_area_schedule(area_id: str):
    try:
        data = await fetch_area_schedule(area_id)
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/loadshedding/area/{area_id} error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve schedule for area {area_id}"},
        )
