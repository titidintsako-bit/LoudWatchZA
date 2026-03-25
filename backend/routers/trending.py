import logging

from fastapi import APIRouter, Path, Query
from fastapi.responses import JSONResponse

from services.trending_service import (
    compute_trending,
    get_province_trending,
    get_sentiment_weekly,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["trending"])


@router.get("/trending")
async def get_trending(force: bool = Query(default=False)):
    try:
        data = await compute_trending(force=force)
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/trending error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to compute trending"})


@router.get("/trending/province/{province}")
async def get_province(province: str = Path(..., title="Province name")):
    try:
        data = await get_province_trending(province)
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/trending/province/{province} error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve province trending"})


@router.get("/sentiment/weekly")
async def get_weekly_sentiment():
    try:
        data = await get_sentiment_weekly()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/sentiment/weekly error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve weekly sentiment"})
