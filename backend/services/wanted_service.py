import logging
from datetime import datetime, timezone

import database

logger = logging.getLogger(__name__)

CACHE_KEY = "wanted:persons"


async def get_wanted_persons(
    province: str | None = None,
    is_missing: bool | None = None,
    category: str | None = None,
    limit: int = 100,
) -> dict:
    """
    Return active wanted/missing persons from Supabase.
    Filters: province, is_missing, crime_category.
    Returns metadata including last_updated for graceful fallback display.
    """
    import redis_client

    # Try Redis cache first (5-min TTL acceptable — data changes daily)
    cache_key = f"{CACHE_KEY}:{province or 'all'}:{is_missing}:{category or 'all'}"
    cached = await redis_client.getjson(cache_key)
    if cached:
        return cached

    try:
        client = database.get_client()
        if client is None:
            return _empty_response("Supabase not configured")

        query = client.table("wanted_persons").select("*").eq("is_active", True)

        if province:
            query = query.eq("province", province)
        if is_missing is not None:
            query = query.eq("is_missing", is_missing)
        if category:
            query = query.eq("crime_category", category)

        query = query.order("date_added", desc=True).limit(limit)
        result = query.execute()
        rows = result.data or []

        # Get last_updated from most recent record
        last_updated: str | None = None
        if rows:
            last_updated = rows[0].get("updated_at") or rows[0].get("date_added")

        # Get metadata counts
        total_query = client.table("wanted_persons").select("id", count="exact").eq("is_active", True)
        total_result = total_query.execute()
        total_count = total_result.count or len(rows)

        response = {
            "persons": rows,
            "total": total_count,
            "last_updated": last_updated,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

        await redis_client.setjson(cache_key, response, ttl=300)
        return response

    except Exception as e:
        logger.error(f"wanted_service error: {e}")
        return _empty_response(str(e))


def _empty_response(reason: str) -> dict:
    return {
        "persons": [],
        "total": 0,
        "last_updated": None,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "error": reason,
    }


async def get_categories() -> list[str]:
    """Return distinct crime categories for filter tabs."""
    try:
        client = database.get_client()
        if client is None:
            return []
        result = (
            client.table("wanted_persons")
            .select("crime_category")
            .eq("is_active", True)
            .eq("is_missing", False)
            .execute()
        )
        cats = {r["crime_category"] for r in (result.data or []) if r.get("crime_category")}
        return sorted(cats)
    except Exception as e:
        logger.error(f"get_categories error: {e}")
        return []
