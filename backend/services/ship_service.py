"""
Ship service — uses aisstream.io (free WebSocket AIS feed).

Sign up at https://aisstream.io to get a free API key.
Set AISSTREAM_API_KEY in your .env file.

If no key is configured the layer returns an empty list gracefully.
"""

import asyncio
import json
import logging

import redis_client
from config import settings

logger = logging.getLogger(__name__)

AISSTREAM_WS_URL = "wss://stream.aisstream.io/v0/stream"

# Bounding box covering SA coastal waters + ports
SA_BOUNDING_BOX = [[-36.0, 14.0], [-28.0, 36.0]]  # [[lat_min, lng_min], [lat_max, lng_max]]

SA_LAT_MIN, SA_LAT_MAX = -36.0, -25.0
SA_LON_MIN, SA_LON_MAX = 14.0, 36.0

# How long to collect messages per poll (seconds)
COLLECT_SECONDS = 8
MAX_VESSELS = 300


def _shiptype_to_str(t: int | None) -> str:
    if t is None:
        return "unknown"
    try:
        t = int(t)
    except (TypeError, ValueError):
        return "unknown"
    if t == 30:
        return "fishing"
    elif t in (31, 32):
        return "tug"
    elif t == 33:
        return "dredger"
    elif t == 35:
        return "military"
    elif t == 36:
        return "sailing"
    elif t == 37:
        return "pleasure"
    elif 60 <= t <= 69:
        return "passenger"
    elif 70 <= t <= 79:
        return "cargo"
    elif 80 <= t <= 89:
        return "tanker"
    return "other"


def _parse_position_report(msg: dict) -> dict | None:
    """Parse an aisstream PositionReport or StandardClassBReport message."""
    try:
        meta = msg.get("MetaData", {})
        mmsi = str(meta.get("MMSI", ""))
        name = str(meta.get("ShipName", "") or "").strip()

        lat = meta.get("latitude")
        lng = meta.get("longitude")
        if lat is None or lng is None:
            return None
        lat, lng = float(lat), float(lng)
        if not (SA_LAT_MIN <= lat <= SA_LAT_MAX and SA_LON_MIN <= lng <= SA_LON_MAX):
            return None
        if lat == 0.0 and lng == 0.0:
            return None

        payload = msg.get("Message", {})
        # Flatten — aisstream nests under the message type key
        inner = next(iter(payload.values()), {}) if payload else {}

        speed_kts = float(inner.get("Sog", 0.0) or 0.0)
        heading = float(inner.get("Cog", 0.0) or inner.get("TrueHeading", 0.0) or 0.0)
        shiptype_int = inner.get("TypeOfShipAndCargoType") or inner.get("ShipType")
        vessel_type = _shiptype_to_str(shiptype_int)
        destination = str(inner.get("Destination", "") or "").strip()
        flag = ""  # aisstream doesn't always include flag in position msgs

        return {
            "mmsi": mmsi,
            "name": name,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "speed_kts": round(speed_kts, 1),
            "heading": round(heading % 360, 1),
            "vessel_type": vessel_type,
            "flag": flag,
            "destination": destination,
        }
    except Exception as e:
        logger.debug(f"Error parsing aisstream message: {e}")
        return None


async def _collect_from_websocket() -> list[dict]:
    """Connect to aisstream, collect for COLLECT_SECONDS, return parsed vessels."""
    try:
        import websockets  # type: ignore
    except ImportError:
        logger.error("websockets package not installed — run: pip install websockets")
        return []

    api_key = settings.aisstream_api_key
    if not api_key:
        logger.info("AISSTREAM_API_KEY not set — ships layer disabled")
        return []

    subscribe_msg = {
        "APIKey": api_key,
        "BoundingBoxes": [SA_BOUNDING_BOX],
        "FilterMessageTypes": [
            "PositionReport",
            "StandardClassBPositionReport",
        ],
    }

    vessels: dict[str, dict] = {}  # keyed by mmsi for dedup

    try:
        async with websockets.connect(
            AISSTREAM_WS_URL,
            ping_interval=20,
            ping_timeout=10,
            open_timeout=10,
        ) as ws:
            await ws.send(json.dumps(subscribe_msg))
            deadline = asyncio.get_event_loop().time() + COLLECT_SECONDS
            while asyncio.get_event_loop().time() < deadline and len(vessels) < MAX_VESSELS:
                try:
                    remaining = deadline - asyncio.get_event_loop().time()
                    raw = await asyncio.wait_for(ws.recv(), timeout=max(remaining, 0.1))
                    msg = json.loads(raw)
                    vessel = _parse_position_report(msg)
                    if vessel and vessel["mmsi"]:
                        vessels[vessel["mmsi"]] = vessel
                except asyncio.TimeoutError:
                    break
                except Exception as e:
                    logger.debug(f"WS recv error: {e}")
                    break
    except Exception as e:
        logger.error(f"aisstream WebSocket error: {e}")
        return []

    result = list(vessels.values())
    logger.info(f"aisstream: collected {len(result)} vessels around SA")
    return result


async def fetch_ships() -> list[dict]:
    # Return cached data if fresh (30s TTL)
    cached = await redis_client.getjson("ships:states")
    if cached is not None:
        return cached

    ships = await _collect_from_websocket()

    # Cache even an empty list so we don't hammer the WS on every request
    ttl = 30 if ships else 15
    await redis_client.setjson("ships:states", ships, ex=ttl)
    return ships
