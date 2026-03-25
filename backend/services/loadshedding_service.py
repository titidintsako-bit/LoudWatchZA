"""
Loadshedding service — uses Mzansi Loadshedding API (RapidAPI).
Host: mzansi-loadshedding-api.p.rapidapi.com

Endpoints used:
  GET /schedule/{area}   — area schedule (returns slots + current stage)
  GET /status            — national stage (if available)
"""

import logging
from datetime import datetime, timezone

import httpx

import redis_client
from config import settings

logger = logging.getLogger(__name__)

RAPIDAPI_BASE = "https://mzansi-loadshedding-api.p.rapidapi.com"
RAPIDAPI_HOST = "mzansi-loadshedding-api.p.rapidapi.com"

# Default area to probe for the national stage when no area is specified
DEFAULT_PROBE_AREA = "kagiso"


def _headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-rapidapi-key": settings.rapidapi_key,
        "x-rapidapi-host": RAPIDAPI_HOST,
    }


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _extract_stage(data: dict | list) -> int:
    """Best-effort stage extraction from various response shapes."""
    if isinstance(data, list):
        data = data[0] if data else {}
    if not isinstance(data, dict):
        return 0

    # Try common field names
    for key in ("stage", "currentStage", "current_stage", "loadshedding_stage"):
        val = data.get(key)
        if val is not None:
            try:
                return max(0, int(val))
            except (TypeError, ValueError):
                pass

    # Try nested schedule array — pick highest stage slot active now
    schedule = data.get("schedule") or data.get("slots") or []
    if isinstance(schedule, list) and schedule:
        for item in schedule:
            if isinstance(item, dict):
                val = item.get("stage")
                if val is not None:
                    try:
                        return max(0, int(val))
                    except (TypeError, ValueError):
                        pass
    return 0


async def fetch_current_stage() -> dict:
    cached = await redis_client.getjson("loadshedding:stage")
    if cached:
        return cached

    if not settings.rapidapi_key:
        logger.info("RAPIDAPI_KEY not set — loadshedding layer disabled")
        return {"stage": 0, "updated_at": _now_iso(), "areas_affected": 0}

    stage = 0
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try a dedicated /status endpoint first
            try:
                resp = await client.get(f"{RAPIDAPI_BASE}/status", headers=_headers())
                if resp.status_code == 200:
                    stage = _extract_stage(resp.json())
            except Exception:
                pass

            # If we got nothing, probe the default area schedule
            if stage == 0:
                resp = await client.get(
                    f"{RAPIDAPI_BASE}/schedule/{DEFAULT_PROBE_AREA}",
                    headers=_headers(),
                )
                resp.raise_for_status()
                stage = _extract_stage(resp.json())

    except Exception as e:
        logger.error(f"fetch_current_stage error: {e}")
        fallback = await redis_client.getjson("loadshedding:stage")
        if fallback:
            return fallback
        return {"stage": 0, "updated_at": _now_iso(), "areas_affected": 0}

    result = {
        "stage": stage,
        "updated_at": _now_iso(),
        "areas_affected": 0,
    }
    await redis_client.setjson("loadshedding:stage", result, ex=60)
    return result


async def fetch_area_schedule(area_id: str) -> dict:
    cache_key = f"loadshedding:area:{area_id}"
    cached = await redis_client.getjson(cache_key)
    if cached:
        return cached

    if not settings.rapidapi_key:
        return {"area_id": area_id, "area_name": area_id, "stage": 0, "schedule": []}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{RAPIDAPI_BASE}/schedule/{area_id}",
                headers=_headers(),
            )
            resp.raise_for_status()
            data = resp.json()

        # Normalise — data may be a list or dict
        if isinstance(data, list):
            raw = data[0] if data else {}
        else:
            raw = data

        stage = _extract_stage(raw)
        area_name = raw.get("area", area_id) or raw.get("name", area_id) or area_id

        # Build schedule list
        schedule = []
        slots_raw = (
            raw.get("schedule")
            or raw.get("slots")
            or raw.get("days")
            or []
        )
        if isinstance(slots_raw, list):
            for item in slots_raw:
                if isinstance(item, dict):
                    date_str = item.get("date") or item.get("day") or ""
                    times = item.get("times") or item.get("slots") or item.get("stages") or []
                    if isinstance(times, list):
                        times = [str(t) for t in times if t]
                    schedule.append({"date": date_str, "slots": times})
                elif isinstance(item, str):
                    schedule.append({"date": "", "slots": [item]})

        result = {
            "area_id": area_id,
            "area_name": area_name,
            "stage": stage,
            "schedule": schedule,
        }
        await redis_client.setjson(cache_key, result, ex=300)
        return result

    except Exception as e:
        logger.error(f"fetch_area_schedule({area_id}) error: {e}")
        fallback = await redis_client.getjson(cache_key)
        if fallback:
            return fallback
        return {"area_id": area_id, "area_name": area_id, "stage": 0, "schedule": []}
