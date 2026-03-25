import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.audit_service import get_audit_outcomes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["audits"])


@router.get("/audits")
async def get_audits():
    try:
        data = await get_audit_outcomes()
        return JSONResponse(content=data)
    except Exception as e:
        logger.error(f"GET /api/audits error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve audit outcomes"})
