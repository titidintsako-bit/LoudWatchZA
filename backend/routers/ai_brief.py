import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.ai_brief_service import generate_brief

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["ai_brief"])


@router.get("/ai-brief")
async def get_ai_brief():
    try:
        brief_data = await generate_brief()
        return JSONResponse(content=brief_data)
    except Exception as e:
        logger.error(f"GET /api/ai-brief error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to generate AI brief"})
