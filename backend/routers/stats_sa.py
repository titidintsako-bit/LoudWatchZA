"""
Stats SA router — GHS, Census 2022, population estimates, hunger index.
"""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/stats-sa/ghs", tags=["stats-sa"])
async def get_ghs():
    """GHS service access data per municipality."""
    try:
        from services.stats_sa_service import get_ghs_data
        data = await get_ghs_data()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/stats-sa/ghs error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve GHS data"})


@router.get("/api/stats-sa/census", tags=["stats-sa"])
async def get_census():
    """Census 2022 municipal profiles."""
    try:
        from services.stats_sa_service import get_census_data
        data = await get_census_data()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/stats-sa/census error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve Census 2022 data"})


@router.get("/api/stats-sa/population", tags=["stats-sa"])
async def get_population():
    """Mid-year population estimates by province."""
    try:
        from services.stats_sa_service import get_population_estimates
        data = await get_population_estimates()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/stats-sa/population error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve population estimates"})


@router.get("/api/stats-sa/hunger", tags=["stats-sa"])
async def get_hunger():
    """Hunger index derived from GHS food insecurity data."""
    try:
        from services.stats_sa_service import get_hunger_index
        data = await get_hunger_index()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/stats-sa/hunger error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve hunger index"})
