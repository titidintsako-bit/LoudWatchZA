import logging
import math
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

import database
import redis_client
from config import settings
from scheduler import start_scheduler, stop_scheduler

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LoudWatch ZA backend starting up …")
    start_scheduler()
    # Warm up primary caches on startup (best-effort, non-blocking errors)
    try:
        from services.loadshedding_service import fetch_current_stage
        await fetch_current_stage()
    except Exception as e:
        logger.warning(f"Startup warm-up loadshedding failed: {e}")
    try:
        from services.dam_service import fetch_dam_levels
        await fetch_dam_levels()
    except Exception as e:
        logger.warning(f"Startup warm-up dams failed: {e}")
    try:
        from services.pain_index_service import compute_pain_index
        await compute_pain_index()
    except Exception as e:
        logger.warning(f"Startup warm-up pain index failed: {e}")
    try:
        from services.crime_service import get_crime_heatmap
        await get_crime_heatmap()
    except Exception as e:
        logger.warning(f"Startup warm-up crime failed: {e}")
    try:
        from services.audit_service import get_audit_outcomes
        await get_audit_outcomes()
    except Exception as e:
        logger.warning(f"Startup warm-up audits failed: {e}")
    try:
        from services.unemployment_service import get_unemployment_data
        await get_unemployment_data()
    except Exception as e:
        logger.warning(f"Startup warm-up unemployment failed: {e}")
    try:
        from services.stats_sa_service import get_ghs_data, get_population_estimates
        await get_ghs_data()
        await get_population_estimates()
    except Exception as e:
        logger.warning(f"Startup warm-up stats_sa failed: {e}")
    logger.info("Startup warm-up complete")
    yield
    logger.info("LoudWatch ZA backend shutting down …")
    stop_scheduler()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="LoudWatch ZA API",
    description="South Africa real-time intelligence dashboard backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
if "*" in _cors_origins:
    _cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)"
    )
    return response


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from routers.loadshedding import router as loadshedding_router
from routers.dams import router as dams_router
from routers.crime import router as crime_router
from routers.audits import router as audits_router
from routers.unemployment import router as unemployment_router
from routers.protests import router as protests_router
from routers.news import router as news_router
from routers.aircraft import router as aircraft_router
from routers.ships import router as ships_router
from routers.pain_index import router as pain_index_router
from routers.ai_brief import router as ai_brief_router
from routers.crowdsource import router as crowdsource_router
from routers.stats_sa import router as stats_sa_router
from routers.wanted import router as wanted_router
from routers.trending import router as trending_router

app.include_router(loadshedding_router)
app.include_router(dams_router)
app.include_router(crime_router)
app.include_router(audits_router)
app.include_router(unemployment_router)
app.include_router(protests_router)
app.include_router(news_router)
app.include_router(aircraft_router)
app.include_router(ships_router)
app.include_router(pain_index_router)
app.include_router(ai_brief_router)
app.include_router(crowdsource_router)
app.include_router(stats_sa_router)
app.include_router(wanted_router)
app.include_router(trending_router)


# ---------------------------------------------------------------------------
# Admin refresh endpoints (triggered by GitHub Actions cron workflows)
# Protected by ADMIN_TOKEN env var; skips check if token not configured
# ---------------------------------------------------------------------------

import os
from fastapi import Header, HTTPException

ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")


def _check_admin(authorization: str) -> None:
    if ADMIN_TOKEN and authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.post("/api/admin/refresh/dams", tags=["admin"])
async def admin_refresh_dams(authorization: str = Header(default="")):
    _check_admin(authorization)
    try:
        from services.dam_service import fetch_dam_levels
        result = await fetch_dam_levels()
        return {"ok": True, "dams": len(result.get("dams", []))}
    except Exception as e:
        logger.error(f"Admin dam refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/refresh/crime", tags=["admin"])
async def admin_refresh_crime(authorization: str = Header(default="")):
    _check_admin(authorization)
    try:
        from services.crime_service import get_crime_heatmap
        result = await get_crime_heatmap()
        return {"ok": True, "points": len(result.get("points", []))}
    except Exception as e:
        logger.error(f"Admin crime refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/refresh/audits", tags=["admin"])
async def admin_refresh_audits(authorization: str = Header(default="")):
    _check_admin(authorization)
    try:
        from services.audit_service import get_audit_outcomes
        result = await get_audit_outcomes()
        return {"ok": True, "records": len(result.get("municipalities", []))}
    except Exception as e:
        logger.error(f"Admin audit refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/refresh/unemployment", tags=["admin"])
async def admin_refresh_unemployment(authorization: str = Header(default="")):
    _check_admin(authorization)
    try:
        from services.unemployment_service import get_unemployment_data
        result = await get_unemployment_data()
        return {"ok": True, "records": len(result.get("municipalities", []))}
    except Exception as e:
        logger.error(f"Admin unemployment refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/refresh/protests", tags=["admin"])
async def admin_refresh_protests(authorization: str = Header(default="")):
    _check_admin(authorization)
    try:
        from services.protest_service import fetch_protests
        result = await fetch_protests()
        return {"ok": True, "incidents": len(result.get("incidents", []))}
    except Exception as e:
        logger.error(f"Admin protest refresh failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["meta"])
async def health_check():
    redis_ok = await redis_client.ping()
    supabase_ok = await database.ping()
    # OpenSky reachability check (lightweight)
    opensky_ok = False
    try:
        import httpx as _httpx
        async with _httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get("https://opensky-network.org/api/states/all?lamin=-26&lamax=-25&lomin=28&lomax=29")
            opensky_ok = r.status_code in (200, 401, 403)
    except Exception:
        opensky_ok = False

    return JSONResponse(
        content={
            "status": "ok",
            "services": {
                "redis": redis_ok,
                "supabase": supabase_ok,
                "opensky": opensky_ok,
            },
        }
    )


# ---------------------------------------------------------------------------
# Dossier endpoint
# ---------------------------------------------------------------------------

def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _find_nearest_municipality(lat: float, lng: float, municipalities: list[dict]) -> dict | None:
    if not municipalities:
        return None
    best = None
    best_dist = float("inf")
    for m in municipalities:
        dist = _haversine_km(lat, lng, m["lat"], m["lng"])
        if dist < best_dist:
            best_dist = dist
            best = m
    return best


def _find_nearest_dam(lat: float, lng: float, dams: list[dict]) -> dict | None:
    if not dams:
        return None
    best = None
    best_dist = float("inf")
    for d in dams:
        dist = _haversine_km(lat, lng, d["lat"], d["lng"])
        if dist < best_dist:
            best_dist = dist
            best = d
    return best if best_dist < 200 else None


@app.get("/api/dossier", tags=["dossier"])
async def get_dossier(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    try:
        pain_data = await redis_client.getjson("pain_index:scores")
        if not pain_data:
            from services.pain_index_service import compute_pain_index
            pain_data = await compute_pain_index()

        nearest = _find_nearest_municipality(lat, lng, pain_data or [])

        ls_data = await redis_client.getjson("loadshedding:stage") or {}
        loadshedding_stage = int(ls_data.get("stage", 0))

        dam_data = await redis_client.getjson("dams:levels") or {}
        dams_list = dam_data.get("dams", [])
        nearest_dam = _find_nearest_dam(lat, lng, dams_list)
        dam_level = nearest_dam["level_percent"] if nearest_dam else None

        protests_data = await redis_client.getjson("protests:incidents") or []
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        protest_count_7d = 0
        for incident in protests_data:
            try:
                incident_date = datetime.fromisoformat(incident.get("date", "").replace("Z", "+00:00"))
                if incident_date >= cutoff:
                    protest_count_7d += 1
            except Exception:
                pass

        news_data = await redis_client.getjson("news:articles") or []
        news_count_7d = 0
        for article in news_data:
            try:
                pub_date = datetime.fromisoformat(article.get("published_at", "").replace("Z", "+00:00"))
                if pub_date >= cutoff:
                    news_count_7d += 1
            except Exception:
                pass

        audit_cache = await redis_client.getjson("audits:outcomes") or {}
        audit_outcome = "Unknown"
        if nearest:
            for record in audit_cache.get("municipalities", []):
                if record.get("name", "").lower() in nearest.get("name", "").lower():
                    audit_outcome = record.get("outcome", "Unknown")
                    break

        if nearest:
            return JSONResponse(
                content={
                    "municipality": nearest["name"],
                    "province": nearest["province"],
                    "pain_score": nearest.get("pain_score", 0.0),
                    "loadshedding_stage": loadshedding_stage,
                    "dam_level": dam_level,
                    "unemployment_rate": nearest.get("unemployment_rate", 33.5),
                    "protest_count_7d": protest_count_7d,
                    "news_count_7d": news_count_7d,
                    "audit_outcome": audit_outcome,
                    "lat": lat,
                    "lng": lng,
                }
            )
        else:
            return JSONResponse(
                content={
                    "municipality": "Unknown",
                    "province": "Unknown",
                    "pain_score": 0.0,
                    "loadshedding_stage": loadshedding_stage,
                    "dam_level": dam_level,
                    "unemployment_rate": 33.5,
                    "protest_count_7d": protest_count_7d,
                    "news_count_7d": news_count_7d,
                    "audit_outcome": "Unknown",
                    "lat": lat,
                    "lng": lng,
                }
            )
    except Exception as e:
        logger.error(f"GET /api/dossier error: {e}")
        return JSONResponse(status_code=500, content={"error": "Failed to build dossier"})


# ---------------------------------------------------------------------------
# Search endpoint
# ---------------------------------------------------------------------------

# Combined search corpus: municipalities + provinces + notable places
_SEARCH_CORPUS: list[dict[str, Any]] = [
    # Provinces
    {"name": "Gauteng", "type": "province", "lat": -26.2708, "lng": 28.1123, "province": "Gauteng"},
    {"name": "Western Cape", "type": "province", "lat": -33.2278, "lng": 21.8569, "province": "Western Cape"},
    {"name": "KwaZulu-Natal", "type": "province", "lat": -28.5306, "lng": 30.8958, "province": "KwaZulu-Natal"},
    {"name": "Eastern Cape", "type": "province", "lat": -32.2968, "lng": 26.4194, "province": "Eastern Cape"},
    {"name": "Free State", "type": "province", "lat": -28.4541, "lng": 26.7968, "province": "Free State"},
    {"name": "Mpumalanga", "type": "province", "lat": -25.5653, "lng": 30.5279, "province": "Mpumalanga"},
    {"name": "Limpopo", "type": "province", "lat": -23.4013, "lng": 29.4179, "province": "Limpopo"},
    {"name": "North West", "type": "province", "lat": -25.8597, "lng": 25.6420, "province": "North West"},
    {"name": "Northern Cape", "type": "province", "lat": -29.0467, "lng": 21.8569, "province": "Northern Cape"},
    # Municipalities
    {"name": "Johannesburg", "type": "municipality", "lat": -26.2041, "lng": 28.0473, "province": "Gauteng"},
    {"name": "Tshwane", "type": "municipality", "lat": -25.7479, "lng": 28.2293, "province": "Gauteng"},
    {"name": "Ekurhuleni", "type": "municipality", "lat": -26.1452, "lng": 28.1612, "province": "Gauteng"},
    {"name": "Emfuleni", "type": "municipality", "lat": -26.6732, "lng": 27.9313, "province": "Gauteng"},
    {"name": "Cape Town", "type": "municipality", "lat": -33.9249, "lng": 18.4241, "province": "Western Cape"},
    {"name": "Drakenstein", "type": "municipality", "lat": -33.7340, "lng": 18.9620, "province": "Western Cape"},
    {"name": "Stellenbosch", "type": "municipality", "lat": -33.9360, "lng": 18.8600, "province": "Western Cape"},
    {"name": "George", "type": "municipality", "lat": -33.9608, "lng": 22.4617, "province": "Western Cape"},
    {"name": "eThekwini", "type": "municipality", "lat": -29.8587, "lng": 31.0218, "province": "KwaZulu-Natal"},
    {"name": "Msunduzi", "type": "municipality", "lat": -29.6196, "lng": 30.3928, "province": "KwaZulu-Natal"},
    {"name": "uMhlathuze", "type": "municipality", "lat": -28.7829, "lng": 32.0435, "province": "KwaZulu-Natal"},
    {"name": "Newcastle", "type": "municipality", "lat": -27.7569, "lng": 29.9329, "province": "KwaZulu-Natal"},
    {"name": "Buffalo City", "type": "municipality", "lat": -32.9996, "lng": 27.9060, "province": "Eastern Cape"},
    {"name": "Nelson Mandela Bay", "type": "municipality", "lat": -33.9608, "lng": 25.6022, "province": "Eastern Cape"},
    {"name": "Enoch Mgijima", "type": "municipality", "lat": -31.8970, "lng": 26.6720, "province": "Eastern Cape"},
    {"name": "Makhanda", "type": "municipality", "lat": -33.3075, "lng": 26.5240, "province": "Eastern Cape"},
    {"name": "Mangaung", "type": "municipality", "lat": -29.1210, "lng": 26.2149, "province": "Free State"},
    {"name": "Maluti-a-Phofung", "type": "municipality", "lat": -28.5880, "lng": 28.9120, "province": "Free State"},
    {"name": "Moqhaka", "type": "municipality", "lat": -27.6810, "lng": 26.6750, "province": "Free State"},
    {"name": "Emalahleni", "type": "municipality", "lat": -25.8735, "lng": 29.2311, "province": "Mpumalanga"},
    {"name": "Mbombela", "type": "municipality", "lat": -25.4654, "lng": 30.9854, "province": "Mpumalanga"},
    {"name": "Steve Tshwete", "type": "municipality", "lat": -25.7710, "lng": 29.4630, "province": "Mpumalanga"},
    {"name": "Polokwane", "type": "municipality", "lat": -23.9045, "lng": 29.4689, "province": "Limpopo"},
    {"name": "Greater Tzaneen", "type": "municipality", "lat": -23.8330, "lng": 30.1580, "province": "Limpopo"},
    {"name": "Thulamela", "type": "municipality", "lat": -22.9480, "lng": 30.4840, "province": "Limpopo"},
    {"name": "Rustenburg", "type": "municipality", "lat": -25.6658, "lng": 27.2424, "province": "North West"},
    {"name": "Mahikeng", "type": "municipality", "lat": -25.8597, "lng": 25.6420, "province": "North West"},
    {"name": "Sol Plaatje", "type": "municipality", "lat": -28.7323, "lng": 24.7713, "province": "Northern Cape"},
    {"name": "Dawid Kruiper", "type": "municipality", "lat": -28.4478, "lng": 21.2561, "province": "Northern Cape"},
    # Notable places / townships
    {"name": "Soweto", "type": "place", "lat": -26.2674, "lng": 27.8589, "province": "Gauteng"},
    {"name": "Alexandra", "type": "place", "lat": -26.1046, "lng": 28.0920, "province": "Gauteng"},
    {"name": "Tembisa", "type": "place", "lat": -25.9960, "lng": 28.2270, "province": "Gauteng"},
    {"name": "Khayelitsha", "type": "place", "lat": -34.0408, "lng": 18.6732, "province": "Western Cape"},
    {"name": "Mitchells Plain", "type": "place", "lat": -34.0558, "lng": 18.6230, "province": "Western Cape"},
    {"name": "Marikana", "type": "place", "lat": -25.7060, "lng": 27.4810, "province": "North West"},
    {"name": "Mamelodi", "type": "place", "lat": -25.7226, "lng": 28.3989, "province": "Gauteng"},
    {"name": "Soshanguve", "type": "place", "lat": -25.5280, "lng": 28.0990, "province": "Gauteng"},
    {"name": "Hammanskraal", "type": "place", "lat": -25.4560, "lng": 28.2770, "province": "Gauteng"},
    {"name": "Diepsloot", "type": "place", "lat": -25.9350, "lng": 28.0130, "province": "Gauteng"},
    {"name": "Umlazi", "type": "place", "lat": -29.9680, "lng": 30.8980, "province": "KwaZulu-Natal"},
    {"name": "KwaMashu", "type": "place", "lat": -29.7480, "lng": 30.9960, "province": "KwaZulu-Natal"},
    {"name": "Pietermaritzburg", "type": "place", "lat": -29.6196, "lng": 30.3928, "province": "KwaZulu-Natal"},
    {"name": "Richards Bay", "type": "place", "lat": -28.7829, "lng": 32.0435, "province": "KwaZulu-Natal"},
    {"name": "Ladysmith", "type": "place", "lat": -28.5598, "lng": 29.7793, "province": "KwaZulu-Natal"},
    {"name": "Pretoria", "type": "place", "lat": -25.7479, "lng": 28.2293, "province": "Gauteng"},
    {"name": "Durban", "type": "place", "lat": -29.8587, "lng": 31.0218, "province": "KwaZulu-Natal"},
    {"name": "Bloemfontein", "type": "place", "lat": -29.1210, "lng": 26.2149, "province": "Free State"},
    {"name": "Port Elizabeth", "type": "place", "lat": -33.9608, "lng": 25.6022, "province": "Eastern Cape"},
    {"name": "East London", "type": "place", "lat": -32.9996, "lng": 27.9060, "province": "Eastern Cape"},
    {"name": "Kimberley", "type": "place", "lat": -28.7323, "lng": 24.7713, "province": "Northern Cape"},
    {"name": "Upington", "type": "place", "lat": -28.4478, "lng": 21.2561, "province": "Northern Cape"},
    {"name": "Nelspruit", "type": "place", "lat": -25.4654, "lng": 30.9854, "province": "Mpumalanga"},
    {"name": "Witbank", "type": "place", "lat": -25.8735, "lng": 29.2311, "province": "Mpumalanga"},
    {"name": "Paarl", "type": "place", "lat": -33.7340, "lng": 18.9620, "province": "Western Cape"},
    {"name": "Mossel Bay", "type": "place", "lat": -34.1827, "lng": 22.1434, "province": "Western Cape"},
    {"name": "Knysna", "type": "place", "lat": -34.0358, "lng": 23.0480, "province": "Western Cape"},
    {"name": "Hermanus", "type": "place", "lat": -34.4188, "lng": 19.2352, "province": "Western Cape"},
    {"name": "Worcester", "type": "place", "lat": -33.6460, "lng": 19.4480, "province": "Western Cape"},
    {"name": "Beaufort West", "type": "place", "lat": -32.3560, "lng": 22.5860, "province": "Western Cape"},
    {"name": "Grahamstown", "type": "place", "lat": -33.3075, "lng": 26.5240, "province": "Eastern Cape"},
    {"name": "Thohoyandou", "type": "place", "lat": -22.9480, "lng": 30.4840, "province": "Limpopo"},
    {"name": "Tzaneen", "type": "place", "lat": -23.8330, "lng": 30.1580, "province": "Limpopo"},
    {"name": "Louis Trichardt", "type": "place", "lat": -23.0430, "lng": 29.9070, "province": "Limpopo"},
    {"name": "Musina", "type": "place", "lat": -22.3406, "lng": 30.0440, "province": "Limpopo"},
    {"name": "Bela-Bela", "type": "place", "lat": -24.8840, "lng": 28.3580, "province": "Limpopo"},
    {"name": "Mokopane", "type": "place", "lat": -24.1910, "lng": 29.0080, "province": "Limpopo"},
    {"name": "Lephalale", "type": "place", "lat": -23.6723, "lng": 27.7083, "province": "Limpopo"},
    {"name": "Secunda", "type": "place", "lat": -26.5196, "lng": 29.1891, "province": "Mpumalanga"},
    {"name": "Middelburg", "type": "place", "lat": -25.7710, "lng": 29.4630, "province": "Mpumalanga"},
    {"name": "Vereeniging", "type": "place", "lat": -26.6732, "lng": 27.9313, "province": "Gauteng"},
    {"name": "Vanderbijlpark", "type": "place", "lat": -26.6980, "lng": 27.8320, "province": "Gauteng"},
    {"name": "Sasolburg", "type": "place", "lat": -26.8148, "lng": 27.8279, "province": "Free State"},
    {"name": "Kuruman", "type": "place", "lat": -27.4540, "lng": 23.4330, "province": "Northern Cape"},
    {"name": "Saldanha", "type": "place", "lat": -32.9980, "lng": 17.9440, "province": "Western Cape"},
    {"name": "Langebaan", "type": "place", "lat": -33.1000, "lng": 18.0350, "province": "Western Cape"},
    {"name": "Franschhoek", "type": "place", "lat": -33.9100, "lng": 19.1210, "province": "Western Cape"},
    {"name": "Plettenberg Bay", "type": "place", "lat": -34.0517, "lng": 23.3682, "province": "Western Cape"},
]


@app.get("/api/search", tags=["search"])
async def search(q: str = Query(..., min_length=1)):
    q_lower = q.strip().lower()
    results = []
    for item in _SEARCH_CORPUS:
        if q_lower in item["name"].lower():
            results.append(item)
        if len(results) >= 10:
            break
    return JSONResponse(content={"results": results})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=False)
