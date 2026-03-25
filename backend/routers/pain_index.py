import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.pain_index_service import compute_pain_index

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["pain_index"])


@router.get("/pain-index")
async def get_pain_index():
    try:
        municipalities = await compute_pain_index()
        return JSONResponse(content={"municipalities": municipalities})
    except Exception as e:
        logger.error(f"GET /api/pain-index error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to compute pain index"})
