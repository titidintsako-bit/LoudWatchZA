"""
Aircraft service — uses OpenSky Network REST API.
OpenSky now uses OAuth2 client credentials (client_id + client_secret).
Falls back to anonymous if credentials are not set (lower rate limit).
"""

import logging

import httpx

import redis_client
from config import settings

logger = logging.getLogger(__name__)

OPENSKY_STATES_URL = "https://opensky-network.org/api/states/all"
OPENSKY_TOKEN_URL  = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"

SA_LAT_MIN = -35.0
SA_LAT_MAX = -22.0
SA_LON_MIN = 16.0
SA_LON_MAX = 33.0

# State vector index positions
IDX_ICAO24       = 0
IDX_CALLSIGN     = 1
IDX_LONGITUDE    = 5
IDX_LATITUDE     = 6
IDX_BARO_ALTITUDE = 7
IDX_ON_GROUND    = 8
IDX_VELOCITY     = 9
IDX_TRUE_TRACK   = 10
IDX_GEO_ALTITUDE = 13


async def _get_access_token(client: httpx.AsyncClient) -> str | None:
    """Exchange client_id + client_secret for a Bearer token."""
    client_id     = settings.opensky_client_id
    client_secret = settings.opensky_client_secret
    if not client_id or not client_secret:
        return None
    try:
        resp = await client.post(
            OPENSKY_TOKEN_URL,
            data={
                "grant_type":    "client_credentials",
                "client_id":     client_id,
                "client_secret": client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10.0,
        )
        resp.raise_for_status()
        token = resp.json().get("access_token", "")
        return token if token else None
    except Exception as e:
        logger.warning(f"OpenSky token fetch failed: {e}")
        return None


def _state_to_aircraft(state: list) -> dict | None:
    try:
        icao24   = state[IDX_ICAO24] or ""
        callsign = (state[IDX_CALLSIGN] or "").strip()
        lng      = state[IDX_LONGITUDE]
        lat      = state[IDX_LATITUDE]
        if lat is None or lng is None:
            return None
        lat, lng = float(lat), float(lng)
        if not (SA_LAT_MIN <= lat <= SA_LAT_MAX and SA_LON_MIN <= lng <= SA_LON_MAX):
            return None

        baro_alt   = state[IDX_BARO_ALTITUDE]
        geo_alt    = state[IDX_GEO_ALTITUDE]
        altitude_m = float(baro_alt or geo_alt or 0.0)
        velocity_ms = float(state[IDX_VELOCITY] or 0.0)
        heading     = float(state[IDX_TRUE_TRACK] or 0.0)
        on_ground   = bool(state[IDX_ON_GROUND])

        return {
            "icao24":       icao24,
            "callsign":     callsign,
            "lat":          lat,
            "lng":          lng,
            "altitude_m":   round(altitude_m, 1),
            "velocity_ms":  round(velocity_ms, 1),
            "heading":      round(heading, 1),
            "aircraft_type": "unknown",
            "registration": "",
            "on_ground":    on_ground,
        }
    except Exception as e:
        logger.debug(f"Error parsing aircraft state: {e}")
        return None


async def fetch_aircraft() -> list[dict]:
    cached = await redis_client.getjson("aircraft:states")
    if cached is not None:
        return cached

    params = {
        "lamin": SA_LAT_MIN,
        "lamax": SA_LAT_MAX,
        "lomin": SA_LON_MIN,
        "lomax": SA_LON_MAX,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Try OAuth2 first, fall back to anonymous
            token = await _get_access_token(client)
            headers = {"Authorization": f"Bearer {token}"} if token else {}

            resp = await client.get(OPENSKY_STATES_URL, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        states = data.get("states") or []
        aircraft_list: list[dict] = []
        for state in states:
            ac = _state_to_aircraft(state)
            if ac:
                aircraft_list.append(ac)
            if len(aircraft_list) >= 500:
                break

        logger.info(f"OpenSky: {len(aircraft_list)} aircraft over SA ({'authenticated' if token else 'anonymous'})")
        await redis_client.setjson("aircraft:states", aircraft_list, ex=15)
        return aircraft_list

    except Exception as e:
        logger.error(f"fetch_aircraft error: {e}")
        fallback = await redis_client.getjson("aircraft:states")
        return fallback if fallback is not None else []
