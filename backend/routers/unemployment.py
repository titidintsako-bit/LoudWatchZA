import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.unemployment_service import get_unemployment_data

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["unemployment"])


@router.get("/unemployment")
async def get_unemployment():
    try:
        data = await get_unemployment_data()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/unemployment error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve unemployment data"})
