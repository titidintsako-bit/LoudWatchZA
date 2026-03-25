import logging
from typing import Any

from config import settings

logger = logging.getLogger(__name__)

_client = None


def get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.supabase_url or not settings.supabase_service_key:
        logger.warning("Supabase credentials not configured")
        return None
    try:
        from supabase import create_client, Client
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
        return _client
    except Exception as e:
        logger.error(f"Failed to initialise Supabase client: {e}")
        return None


async def upsert(table: str, data: dict | list, on_conflict: str = "id") -> dict | None:
    client = get_client()
    if client is None:
        return None
    try:
        rows = data if isinstance(data, list) else [data]
        result = client.table(table).upsert(rows, on_conflict=on_conflict).execute()
        return result.data
    except Exception as e:
        logger.error(f"Supabase upsert error on {table}: {e}")
        return None


async def select(
    table: str,
    filters: dict | None = None,
    limit: int = 100,
    order: str | None = None,
) -> list[dict]:
    client = get_client()
    if client is None:
        return []
    try:
        query = client.table(table).select("*")
        if filters:
            for col, val in filters.items():
                query = query.eq(col, val)
        if order:
            desc = order.startswith("-")
            col = order.lstrip("-")
            query = query.order(col, desc=desc)
        query = query.limit(limit)
        result = query.execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Supabase select error on {table}: {e}")
        return []


async def insert(table: str, data: dict) -> dict | None:
    client = get_client()
    if client is None:
        return None
    try:
        result = client.table(table).insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Supabase insert error on {table}: {e}")
        return None


async def rpc(fn: str, params: dict) -> Any:
    client = get_client()
    if client is None:
        return None
    try:
        result = client.rpc(fn, params).execute()
        return result.data
    except Exception as e:
        logger.error(f"Supabase RPC error {fn}: {e}")
        return None


async def ping() -> bool:
    client = get_client()
    if client is None:
        return False
    try:
        client.table("municipalities").select("id").limit(1).execute()
        return True
    except Exception as e:
        logger.error(f"Supabase ping failed: {e}")
        return False
