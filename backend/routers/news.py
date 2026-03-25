import logging

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from services.news_service import fetch_news

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["news"])


@router.get("/news")
async def get_news(limit: int = Query(default=50, ge=1, le=100)):
    try:
        articles = await fetch_news()
        return JSONResponse(content={"articles": articles[:limit]})
    except Exception as e:
        logger.error(f"GET /api/news error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve news"})
