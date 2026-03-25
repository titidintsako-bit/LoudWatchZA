import logging
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from services.wanted_service import get_wanted_persons, get_categories

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["wanted"])


@router.get("/wanted")
async def list_wanted(
    province: Optional[str] = Query(None, description="Filter by province"),
    is_missing: Optional[bool] = Query(None, description="True = missing persons, False = wanted criminals"),
    category: Optional[str] = Query(None, description="Filter by crime category"),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        data = await get_wanted_persons(
            province=province,
            is_missing=is_missing,
            category=category,
            limit=limit,
        )
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/wanted error: {e}")
        return JSONResponse(
            status_code=500,
            content={"persons": [], "total": 0, "last_updated": None, "error": str(e)},
        )


@router.get("/wanted/categories")
async def list_categories():
    try:
        cats = await get_categories()
        return JSONResponse(content={"categories": cats})
    except Exception as e:
        logger.error(f"GET /api/wanted/categories error: {e}")
        return JSONResponse(status_code=500, content={"categories": []})
