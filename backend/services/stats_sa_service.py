"""
Stats SA service — GHS, Census 2022, population estimates, and hunger index.

All functions check Redis cache first, fall back to Supabase, and finally
fall back to inline mock data so the API remains functional with no external
connectivity.
"""

import logging

import database
import redis_client

logger = logging.getLogger(__name__)

# ── Coordinates for the 20 base municipalities used in GHS mock data ────────
MUNICIPALITIES_COORDS: dict[str, dict] = {
    "City of Johannesburg":       {"lat": -26.2041, "lng": 28.0473},
    "City of Tshwane":            {"lat": -25.7479, "lng": 28.2293},
    "Ekurhuleni":                 {"lat": -26.1452, "lng": 28.1612},
    "Emfuleni":                   {"lat": -26.6732, "lng": 27.9313},
    "City of Cape Town":          {"lat": -33.9249, "lng": 18.4241},
    "Drakenstein":                {"lat": -33.7340, "lng": 18.9620},
    "Stellenbosch":               {"lat": -33.9360, "lng": 18.8600},
    "eThekwini (Durban)":         {"lat": -29.8587, "lng": 31.0218},
    "Msunduzi (Pietermaritzburg)":{"lat": -29.6196, "lng": 30.3928},
    "Nelson Mandela Bay":         {"lat": -33.9608, "lng": 25.6022},
    "Buffalo City":               {"lat": -32.9996, "lng": 27.9060},
    "Mangaung":                   {"lat": -29.1210, "lng": 26.2149},
    "Matjhabeng (Welkom)":        {"lat": -27.9750, "lng": 26.7370},
    "Polokwane":                  {"lat": -23.9045, "lng": 29.4689},
    "Mbombela (Nelspruit)":       {"lat": -25.4654, "lng": 30.9854},
    "Rustenburg":                 {"lat": -25.6658, "lng": 27.2424},
    "Sol Plaatje (Kimberley)":    {"lat": -28.7323, "lng": 24.7713},
    "Emfuleni (Vereeniging)":     {"lat": -26.6732, "lng": 27.9313},
    "George":                     {"lat": -33.9608, "lng": 22.4617},
    "uMhlathuze":                 {"lat": -28.7829, "lng": 32.0435},
}

# ── Inline mock data (mirrors import_ghs.py MOCK_GHS) ───────────────────────
_MOCK_GHS = [
    {"province": "Gauteng",       "municipality": "City of Johannesburg",       "pct_no_piped_water": 3.2,  "pct_no_electricity": 5.1,  "pct_no_flush_toilet": 6.8,  "pct_food_insecure": 22.4},
    {"province": "Gauteng",       "municipality": "City of Tshwane",            "pct_no_piped_water": 2.8,  "pct_no_electricity": 4.2,  "pct_no_flush_toilet": 5.1,  "pct_food_insecure": 19.8},
    {"province": "Gauteng",       "municipality": "Ekurhuleni",                 "pct_no_piped_water": 4.1,  "pct_no_electricity": 6.3,  "pct_no_flush_toilet": 7.9,  "pct_food_insecure": 25.1},
    {"province": "Gauteng",       "municipality": "Emfuleni",                   "pct_no_piped_water": 28.4, "pct_no_electricity": 18.7, "pct_no_flush_toilet": 24.5, "pct_food_insecure": 48.2},
    {"province": "Western Cape",  "municipality": "City of Cape Town",          "pct_no_piped_water": 1.1,  "pct_no_electricity": 2.8,  "pct_no_flush_toilet": 3.2,  "pct_food_insecure": 12.6},
    {"province": "Western Cape",  "municipality": "Drakenstein",                "pct_no_piped_water": 2.3,  "pct_no_electricity": 4.1,  "pct_no_flush_toilet": 5.6,  "pct_food_insecure": 16.3},
    {"province": "Western Cape",  "municipality": "Stellenbosch",               "pct_no_piped_water": 1.8,  "pct_no_electricity": 3.2,  "pct_no_flush_toilet": 4.1,  "pct_food_insecure": 14.2},
    {"province": "KwaZulu-Natal", "municipality": "eThekwini (Durban)",         "pct_no_piped_water": 8.4,  "pct_no_electricity": 12.3, "pct_no_flush_toilet": 14.6, "pct_food_insecure": 31.7},
    {"province": "KwaZulu-Natal", "municipality": "Msunduzi (Pietermaritzburg)","pct_no_piped_water": 12.1, "pct_no_electricity": 15.6, "pct_no_flush_toilet": 18.9, "pct_food_insecure": 38.4},
    {"province": "Eastern Cape",  "municipality": "Nelson Mandela Bay",         "pct_no_piped_water": 18.6, "pct_no_electricity": 22.4, "pct_no_flush_toilet": 28.7, "pct_food_insecure": 44.8},
    {"province": "Eastern Cape",  "municipality": "Buffalo City",               "pct_no_piped_water": 24.3, "pct_no_electricity": 28.6, "pct_no_flush_toilet": 34.2, "pct_food_insecure": 52.1},
    {"province": "Free State",    "municipality": "Mangaung",                   "pct_no_piped_water": 15.2, "pct_no_electricity": 18.4, "pct_no_flush_toilet": 22.6, "pct_food_insecure": 41.3},
    {"province": "Free State",    "municipality": "Matjhabeng (Welkom)",        "pct_no_piped_water": 32.4, "pct_no_electricity": 28.1, "pct_no_flush_toilet": 38.6, "pct_food_insecure": 58.7},
    {"province": "Limpopo",       "municipality": "Polokwane",                  "pct_no_piped_water": 22.1, "pct_no_electricity": 24.3, "pct_no_flush_toilet": 31.4, "pct_food_insecure": 46.2},
    {"province": "Mpumalanga",    "municipality": "Mbombela (Nelspruit)",       "pct_no_piped_water": 19.8, "pct_no_electricity": 21.4, "pct_no_flush_toilet": 27.6, "pct_food_insecure": 42.8},
    {"province": "North West",    "municipality": "Rustenburg",                 "pct_no_piped_water": 16.4, "pct_no_electricity": 19.8, "pct_no_flush_toilet": 24.1, "pct_food_insecure": 39.6},
    {"province": "Northern Cape", "municipality": "Sol Plaatje (Kimberley)",    "pct_no_piped_water": 8.9,  "pct_no_electricity": 11.2, "pct_no_flush_toilet": 13.8, "pct_food_insecure": 28.4},
    {"province": "Gauteng",       "municipality": "Emfuleni (Vereeniging)",     "pct_no_piped_water": 26.8, "pct_no_electricity": 22.4, "pct_no_flush_toilet": 31.2, "pct_food_insecure": 51.3},
    {"province": "Western Cape",  "municipality": "George",                     "pct_no_piped_water": 4.2,  "pct_no_electricity": 6.8,  "pct_no_flush_toilet": 8.4,  "pct_food_insecure": 21.6},
    {"province": "KwaZulu-Natal", "municipality": "uMhlathuze",                 "pct_no_piped_water": 21.4, "pct_no_electricity": 26.8, "pct_no_flush_toilet": 32.1, "pct_food_insecure": 47.9},
]

_MOCK_CENSUS = [
    {"municipality": "City of Johannesburg",       "province": "Gauteng",       "pop_total": 5635127, "pct_no_electricity": 5.1,  "pct_no_piped_water": 3.2,  "pct_no_sanitation": 6.8,  "median_income": 8200},
    {"municipality": "City of Tshwane",            "province": "Gauteng",       "pop_total": 3275087, "pct_no_electricity": 4.2,  "pct_no_piped_water": 2.8,  "pct_no_sanitation": 5.1,  "median_income": 9100},
    {"municipality": "Ekurhuleni",                 "province": "Gauteng",       "pop_total": 3178470, "pct_no_electricity": 6.3,  "pct_no_piped_water": 4.1,  "pct_no_sanitation": 7.9,  "median_income": 7400},
    {"municipality": "Emfuleni",                   "province": "Gauteng",       "pop_total": 721663,  "pct_no_electricity": 18.7, "pct_no_piped_water": 28.4, "pct_no_sanitation": 24.5, "median_income": 3200},
    {"municipality": "City of Cape Town",          "province": "Western Cape",  "pop_total": 4618000, "pct_no_electricity": 2.8,  "pct_no_piped_water": 1.1,  "pct_no_sanitation": 3.2,  "median_income": 11400},
    {"municipality": "Drakenstein",                "province": "Western Cape",  "pop_total": 301046,  "pct_no_electricity": 4.1,  "pct_no_piped_water": 2.3,  "pct_no_sanitation": 5.6,  "median_income": 8600},
    {"municipality": "Stellenbosch",               "province": "Western Cape",  "pop_total": 184799,  "pct_no_electricity": 3.2,  "pct_no_piped_water": 1.8,  "pct_no_sanitation": 4.1,  "median_income": 9800},
    {"municipality": "eThekwini (Durban)",         "province": "KwaZulu-Natal", "pop_total": 3879104, "pct_no_electricity": 12.3, "pct_no_piped_water": 8.4,  "pct_no_sanitation": 14.6, "median_income": 5600},
    {"municipality": "Msunduzi (Pietermaritzburg)","province": "KwaZulu-Natal", "pop_total": 618536,  "pct_no_electricity": 15.6, "pct_no_piped_water": 12.1, "pct_no_sanitation": 18.9, "median_income": 4400},
    {"municipality": "Nelson Mandela Bay",         "province": "Eastern Cape",  "pop_total": 1253407, "pct_no_electricity": 22.4, "pct_no_piped_water": 18.6, "pct_no_sanitation": 28.7, "median_income": 3800},
    {"municipality": "Buffalo City",               "province": "Eastern Cape",  "pop_total": 834997,  "pct_no_electricity": 28.6, "pct_no_piped_water": 24.3, "pct_no_sanitation": 34.2, "median_income": 2900},
    {"municipality": "Mangaung",                   "province": "Free State",    "pop_total": 747431,  "pct_no_electricity": 18.4, "pct_no_piped_water": 15.2, "pct_no_sanitation": 22.6, "median_income": 3600},
    {"municipality": "Matjhabeng (Welkom)",        "province": "Free State",    "pop_total": 408820,  "pct_no_electricity": 28.1, "pct_no_piped_water": 32.4, "pct_no_sanitation": 38.6, "median_income": 2100},
    {"municipality": "Polokwane",                  "province": "Limpopo",       "pop_total": 633762,  "pct_no_electricity": 24.3, "pct_no_piped_water": 22.1, "pct_no_sanitation": 31.4, "median_income": 3100},
    {"municipality": "Mbombela (Nelspruit)",       "province": "Mpumalanga",    "pop_total": 588794,  "pct_no_electricity": 21.4, "pct_no_piped_water": 19.8, "pct_no_sanitation": 27.6, "median_income": 3400},
    {"municipality": "Rustenburg",                 "province": "North West",    "pop_total": 621804,  "pct_no_electricity": 19.8, "pct_no_piped_water": 16.4, "pct_no_sanitation": 24.1, "median_income": 4200},
    {"municipality": "Sol Plaatje (Kimberley)",    "province": "Northern Cape", "pop_total": 248928,  "pct_no_electricity": 11.2, "pct_no_piped_water": 8.9,  "pct_no_sanitation": 13.8, "median_income": 4800},
    {"municipality": "George",                     "province": "Western Cape",  "pop_total": 193691,  "pct_no_electricity": 6.8,  "pct_no_piped_water": 4.2,  "pct_no_sanitation": 8.4,  "median_income": 7200},
    {"municipality": "Emfuleni (Vereeniging)",     "province": "Gauteng",       "pop_total": 721663,  "pct_no_electricity": 22.4, "pct_no_piped_water": 26.8, "pct_no_sanitation": 31.2, "median_income": 2800},
    {"municipality": "Lephalale",                  "province": "Limpopo",       "pop_total": 142462,  "pct_no_electricity": 31.2, "pct_no_piped_water": 28.6, "pct_no_sanitation": 38.4, "median_income": 2400},
]

_MOCK_POPULATION = [
    {"province": "Gauteng",       "population": 16056840, "year": 2024},
    {"province": "KwaZulu-Natal", "population": 12435670, "year": 2024},
    {"province": "Western Cape",  "population":  7425030, "year": 2024},
    {"province": "Eastern Cape",  "population":  6356790, "year": 2024},
    {"province": "Limpopo",       "population":  5982450, "year": 2024},
    {"province": "Mpumalanga",    "population":  5231690, "year": 2024},
    {"province": "North West",    "population":  4241570, "year": 2024},
    {"province": "Free State",    "population":  3035760, "year": 2024},
    {"province": "Northern Cape", "population":  1301510, "year": 2024},
]

_GHS_CACHE_KEY        = "stats_sa:ghs"
_CENSUS_CACHE_KEY     = "stats_sa:census"
_POPULATION_CACHE_KEY = "stats_sa:population"

_GHS_TTL        = 6 * 3600   # 6 hours
_CENSUS_TTL     = 24 * 3600  # 24 hours
_POPULATION_TTL = 24 * 3600  # 24 hours


def _service_fail_score(pct_no_piped_water: float, pct_no_electricity: float, pct_no_flush_toilet: float) -> float:
    return round((pct_no_piped_water + pct_no_electricity + pct_no_flush_toilet) / 300.0, 6)


async def get_ghs_data() -> dict:
    """Returns GHS service access data per municipality.

    Cache key: stats_sa:ghs  TTL: 6h
    Falls back to mock data if Supabase is unreachable.
    """
    cached = await redis_client.getjson(_GHS_CACHE_KEY)
    if cached:
        return cached

    municipalities = []
    try:
        db = database.get_client()
        result = db.table("ghs_data").select("*").order("municipality").execute()
        if result.data:
            for row in result.data:
                municipalities.append({
                    "municipality":       row["municipality"],
                    "province":           row["province"],
                    "pct_no_piped_water": row.get("pct_no_piped_water", 0.0),
                    "pct_no_electricity": row.get("pct_no_electricity", 0.0),
                    "pct_no_flush_toilet":row.get("pct_no_flush_toilet", 0.0),
                    "pct_food_insecure":  row.get("pct_food_insecure", 0.0),
                    "service_fail_score": _service_fail_score(
                        row.get("pct_no_piped_water", 0.0),
                        row.get("pct_no_electricity", 0.0),
                        row.get("pct_no_flush_toilet", 0.0),
                    ),
                    "survey_year": row.get("survey_year", 2023),
                })
    except Exception as e:
        logger.warning(f"get_ghs_data Supabase query failed: {e}. Using mock data.")

    if not municipalities:
        for row in _MOCK_GHS:
            municipalities.append({
                "municipality":       row["municipality"],
                "province":           row["province"],
                "pct_no_piped_water": row["pct_no_piped_water"],
                "pct_no_electricity": row["pct_no_electricity"],
                "pct_no_flush_toilet":row["pct_no_flush_toilet"],
                "pct_food_insecure":  row["pct_food_insecure"],
                "service_fail_score": _service_fail_score(
                    row["pct_no_piped_water"],
                    row["pct_no_electricity"],
                    row["pct_no_flush_toilet"],
                ),
                "survey_year": 2023,
            })

    payload = {"municipalities": municipalities}
    await redis_client.setjson(_GHS_CACHE_KEY, payload, ex=_GHS_TTL)
    return payload


async def get_census_data() -> dict:
    """Returns Census 2022 municipal profiles.

    Cache key: stats_sa:census  TTL: 24h
    Falls back to mock data if Supabase is unreachable.
    """
    cached = await redis_client.getjson(_CENSUS_CACHE_KEY)
    if cached:
        return cached

    municipalities = []
    try:
        db = database.get_client()
        result = db.table("census2022").select("*").order("municipality").execute()
        if result.data:
            for row in result.data:
                municipalities.append({
                    "municipality":       row["municipality"],
                    "province":           row.get("province", ""),
                    "pop_total":          row.get("pop_total", 0),
                    "pct_no_electricity": row.get("pct_no_electricity", 0.0),
                    "pct_no_piped_water": row.get("pct_no_piped_water", 0.0),
                    "pct_no_sanitation":  row.get("pct_no_sanitation", 0.0),
                    "median_income":      row.get("median_income", 0.0),
                })
    except Exception as e:
        logger.warning(f"get_census_data Supabase query failed: {e}. Using mock data.")

    if not municipalities:
        for row in _MOCK_CENSUS:
            municipalities.append({
                "municipality":       row["municipality"],
                "province":           row["province"],
                "pop_total":          row["pop_total"],
                "pct_no_electricity": row["pct_no_electricity"],
                "pct_no_piped_water": row["pct_no_piped_water"],
                "pct_no_sanitation":  row["pct_no_sanitation"],
                "median_income":      row["median_income"],
            })

    payload = {"municipalities": municipalities}
    await redis_client.setjson(_CENSUS_CACHE_KEY, payload, ex=_CENSUS_TTL)
    return payload


async def get_population_estimates() -> dict:
    """Returns mid-year population estimates by province.

    Cache key: stats_sa:population  TTL: 24h
    Falls back to mock data if Supabase is unreachable.
    """
    cached = await redis_client.getjson(_POPULATION_CACHE_KEY)
    if cached:
        return cached

    provinces = []
    try:
        db = database.get_client()
        result = db.table("population_estimates").select("*").order("province").execute()
        if result.data:
            for row in result.data:
                provinces.append({
                    "province":   row["province"],
                    "population": row["population"],
                    "year":       row.get("year", 2024),
                })
    except Exception as e:
        logger.warning(f"get_population_estimates Supabase query failed: {e}. Using mock data.")

    if not provinces:
        for row in _MOCK_POPULATION:
            provinces.append({
                "province":   row["province"],
                "population": row["population"],
                "year":       row["year"],
            })

    total = sum(p["population"] for p in provinces)
    payload = {"provinces": provinces, "total": total}
    await redis_client.setjson(_POPULATION_CACHE_KEY, payload, ex=_POPULATION_TTL)
    return payload


async def get_hunger_index() -> dict:
    """Returns hunger (food insecurity) data per municipality with coordinates.

    Derived from GHS pct_food_insecure column. Joins municipality coordinates
    from MUNICIPALITIES_COORDS.
    """
    ghs_payload = await get_ghs_data()
    municipalities = []
    for row in ghs_payload.get("municipalities", []):
        name = row["municipality"]
        coords = MUNICIPALITIES_COORDS.get(name, {})
        municipalities.append({
            "municipality":     name,
            "province":         row["province"],
            "food_insecure_pct":row.get("pct_food_insecure", 0.0),
            "lat":              coords.get("lat"),
            "lng":              coords.get("lng"),
        })

    # Sort by food insecurity descending
    municipalities.sort(key=lambda x: x["food_insecure_pct"], reverse=True)
    return {"municipalities": municipalities}
