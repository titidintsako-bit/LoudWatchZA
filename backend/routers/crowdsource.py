import logging
import uuid

from fastapi import APIRouter
from fastapi.responses import JSONResponse

import database
from models.incident import CrowdsourceReport

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["crowdsource"])


@router.post("/report")
async def submit_report(report: CrowdsourceReport):
    try:
        report_id = str(uuid.uuid4())
        data = {
            "id": report_id,
            "issue_type": report.issue_type,
            "description": report.description,
            "lat": report.lat,
            "lng": report.lng,
            "contact": report.contact,
            "municipality": report.municipality,
        }
        result = await database.insert("crowdsource_reports", data)
        if result is None:
            # Supabase not available, still acknowledge receipt
            return JSONResponse(content={"success": True, "id": report_id})
        inserted_id = result.get("id", report_id)
        return JSONResponse(content={"success": True, "id": str(inserted_id)})
    except Exception as e:
        logger.error(f"POST /api/report error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to submit report"},
        )


@router.get("/reports")
async def get_reports():
    try:
        reports = await database.select(
            "crowdsource_reports",
            limit=100,
            order="-created_at",
        )
        return JSONResponse(content={"reports": reports})
    except Exception as e:
        logger.error(f"GET /api/reports error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to retrieve reports"})
