import json
import logging
from typing import Any
from urllib.parse import quote

import httpx

from config import settings

logger = logging.getLogger(__name__)

_http_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient | None:
    global _http_client
    if not settings.upstash_redis_rest_url or not settings.upstash_redis_rest_token:
        return None
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            base_url=settings.upstash_redis_rest_url,
            headers={"Authorization": f"Bearer {settings.upstash_redis_rest_token}"},
            timeout=10.0,
        )
    return _http_client


async def get(key: str) -> str | None:
    client = _get_http_client()
    if client is None:
        return None
    try:
        resp = await client.get(f"/get/{key}")
        resp.raise_for_status()
        payload = resp.json()
        return payload.get("result")
    except Exception as e:
        logger.debug(f"Redis GET {key} failed: {e}")
        return None


async def set(key: str, value: str, ex: int | None = None) -> bool:
    client = _get_http_client()
    if client is None:
        return False
    try:
        encoded_value = quote(str(value), safe="")
        url = f"/set/{key}/{encoded_value}"
        if ex is not None:
            url += f"?ex={ex}"
        resp = await client.get(url)
        resp.raise_for_status()
        payload = resp.json()
        return payload.get("result") == "OK"
    except Exception as e:
        logger.debug(f"Redis SET {key} failed: {e}")
        return False


async def setjson(key: str, value: Any, ex: int | None = None) -> bool:
    try:
        serialised = json.dumps(value, default=str)
        return await set(key, serialised, ex=ex)
    except Exception as e:
        logger.debug(f"Redis SETJSON {key} failed: {e}")
        return False


async def getjson(key: str) -> dict | list | None:
    raw = await get(key)
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except Exception as e:
        logger.debug(f"Redis GETJSON parse error for {key}: {e}")
        return None


async def delete(key: str) -> bool:
    client = _get_http_client()
    if client is None:
        return False
    try:
        resp = await client.get(f"/del/{key}")
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.debug(f"Redis DEL {key} failed: {e}")
        return False


async def exists(key: str) -> bool:
    client = _get_http_client()
    if client is None:
        return False
    try:
        resp = await client.get(f"/exists/{key}")
        resp.raise_for_status()
        payload = resp.json()
        return bool(payload.get("result", 0))
    except Exception as e:
        logger.debug(f"Redis EXISTS {key} failed: {e}")
        return False


async def ping() -> bool:
    client = _get_http_client()
    if client is None:
        return False
    try:
        resp = await client.get("/ping")
        resp.raise_for_status()
        payload = resp.json()
        return payload.get("result") == "PONG"
    except Exception as e:
        logger.debug(f"Redis PING failed: {e}")
        return False
