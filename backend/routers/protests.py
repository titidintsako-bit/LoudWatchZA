import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.protest_service import fetch_protests

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["protests"])


@router.get("/protests")
async def get_protests():
    try:
        incidents = await fetch_protests()
        return JSONResponse(content={"incidents": incidents})
    except Exception as e:
        logger.error(f"GET /api/protests error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve protest incidents"})
