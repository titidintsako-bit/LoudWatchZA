import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.crime_service import get_crime_heatmap

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/crime", tags=["crime"])


@router.get("/heatmap")
async def get_heatmap():
    try:
        data = await get_crime_heatmap()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/crime/heatmap error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve crime heatmap"})
