import logging

import database
import redis_client

logger = logging.getLogger(__name__)

# Base municipality data with realistic values.
# unemployment_rate: stored as % (e.g. 35.0 = 35%), converted to fraction in formula
# loadshedding_days: days per month in loadshedding (0-30)
# water_shortage: 0-1 (frequency of water outages)
# blue_green_fail: 0-1 (0=pass, 1=fail DWS Blue/Green Drop report)
# audit_score: 1-5 (1=disclaimer, 5=clean audit)
# no_piped_water_pct / no_electricity_pct / no_sanitation_pct: % from GHS / Census 2022
# ghs_service_fail_score: (no_piped_water + no_electricity + no_sanitation) / 300 → 0-1
# food_insecure_pct: % from GHS
MUNICIPALITIES_BASE = [
    # Gauteng
    {"id": "johannesburg", "name": "Johannesburg", "province": "Gauteng", "lat": -26.2041, "lng": 28.0473,
     "audit_score": 2.0, "unemployment_rate": 32.4, "loadshedding_days": 18.0, "water_shortage": 0.45, "blue_green_fail": 0.6,
     "no_piped_water_pct": 3.2, "no_electricity_pct": 5.1, "no_sanitation_pct": 6.8, "ghs_service_fail_score": 0.050333, "food_insecure_pct": 22.4},
    {"id": "tshwane", "name": "Tshwane", "province": "Gauteng", "lat": -25.7479, "lng": 28.2293,
     "audit_score": 3.0, "unemployment_rate": 28.6, "loadshedding_days": 15.0, "water_shortage": 0.35, "blue_green_fail": 0.4,
     "no_piped_water_pct": 2.8, "no_electricity_pct": 4.2, "no_sanitation_pct": 5.1, "ghs_service_fail_score": 0.040333, "food_insecure_pct": 19.8},
    {"id": "ekurhuleni", "name": "Ekurhuleni", "province": "Gauteng", "lat": -26.1452, "lng": 28.1612,
     "audit_score": 2.0, "unemployment_rate": 34.1, "loadshedding_days": 18.0, "water_shortage": 0.40, "blue_green_fail": 0.55,
     "no_piped_water_pct": 4.1, "no_electricity_pct": 6.3, "no_sanitation_pct": 7.9, "ghs_service_fail_score": 0.061, "food_insecure_pct": 25.1},
    {"id": "emfuleni", "name": "Emfuleni", "province": "Gauteng", "lat": -26.6732, "lng": 27.9313,
     "audit_score": 1.0, "unemployment_rate": 48.2, "loadshedding_days": 25.0, "water_shortage": 0.80, "blue_green_fail": 0.9,
     "no_piped_water_pct": 28.4, "no_electricity_pct": 18.7, "no_sanitation_pct": 24.5, "ghs_service_fail_score": 0.238667, "food_insecure_pct": 48.2},
    {"id": "midvaal", "name": "Midvaal", "province": "Gauteng", "lat": -26.5100, "lng": 28.2300,
     "audit_score": 5.0, "unemployment_rate": 22.4, "loadshedding_days": 10.0, "water_shortage": 0.15, "blue_green_fail": 0.1,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    {"id": "lesedi", "name": "Lesedi", "province": "Gauteng", "lat": -26.4000, "lng": 28.4000,
     "audit_score": 3.0, "unemployment_rate": 30.5, "loadshedding_days": 14.0, "water_shortage": 0.30, "blue_green_fail": 0.35,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # Western Cape
    {"id": "cape_town", "name": "Cape Town", "province": "Western Cape", "lat": -33.9249, "lng": 18.4241,
     "audit_score": 5.0, "unemployment_rate": 20.8, "loadshedding_days": 8.0, "water_shortage": 0.10, "blue_green_fail": 0.05,
     "no_piped_water_pct": 1.1, "no_electricity_pct": 2.8, "no_sanitation_pct": 3.2, "ghs_service_fail_score": 0.023667, "food_insecure_pct": 12.6},
    {"id": "drakenstein", "name": "Drakenstein", "province": "Western Cape", "lat": -33.7340, "lng": 18.9620,
     "audit_score": 5.0, "unemployment_rate": 18.4, "loadshedding_days": 8.0, "water_shortage": 0.10, "blue_green_fail": 0.05,
     "no_piped_water_pct": 2.3, "no_electricity_pct": 4.1, "no_sanitation_pct": 5.6, "ghs_service_fail_score": 0.04, "food_insecure_pct": 16.3},
    {"id": "stellenbosch", "name": "Stellenbosch", "province": "Western Cape", "lat": -33.9360, "lng": 18.8600,
     "audit_score": 5.0, "unemployment_rate": 16.2, "loadshedding_days": 8.0, "water_shortage": 0.08, "blue_green_fail": 0.05,
     "no_piped_water_pct": 1.8, "no_electricity_pct": 3.2, "no_sanitation_pct": 4.1, "ghs_service_fail_score": 0.030333, "food_insecure_pct": 14.2},
    {"id": "george", "name": "George", "province": "Western Cape", "lat": -33.9608, "lng": 22.4617,
     "audit_score": 3.0, "unemployment_rate": 21.5, "loadshedding_days": 10.0, "water_shortage": 0.20, "blue_green_fail": 0.2,
     "no_piped_water_pct": 4.2, "no_electricity_pct": 6.8, "no_sanitation_pct": 8.4, "ghs_service_fail_score": 0.064667, "food_insecure_pct": 21.6},
    # KwaZulu-Natal
    {"id": "ethekwini", "name": "eThekwini", "province": "KwaZulu-Natal", "lat": -29.8587, "lng": 31.0218,
     "audit_score": 3.0, "unemployment_rate": 35.7, "loadshedding_days": 16.0, "water_shortage": 0.35, "blue_green_fail": 0.45,
     "no_piped_water_pct": 8.4, "no_electricity_pct": 12.3, "no_sanitation_pct": 14.6, "ghs_service_fail_score": 0.117667, "food_insecure_pct": 31.7},
    {"id": "msunduzi", "name": "Msunduzi", "province": "KwaZulu-Natal", "lat": -29.6196, "lng": 30.3928,
     "audit_score": 2.0, "unemployment_rate": 39.2, "loadshedding_days": 18.0, "water_shortage": 0.55, "blue_green_fail": 0.65,
     "no_piped_water_pct": 12.1, "no_electricity_pct": 15.6, "no_sanitation_pct": 18.9, "ghs_service_fail_score": 0.154667, "food_insecure_pct": 38.4},
    {"id": "umhlathuze", "name": "uMhlathuze", "province": "KwaZulu-Natal", "lat": -28.7829, "lng": 32.0435,
     "audit_score": 3.0, "unemployment_rate": 28.9, "loadshedding_days": 12.0, "water_shortage": 0.25, "blue_green_fail": 0.3,
     "no_piped_water_pct": 21.4, "no_electricity_pct": 26.8, "no_sanitation_pct": 32.1, "ghs_service_fail_score": 0.267667, "food_insecure_pct": 47.9},
    {"id": "newcastle", "name": "Newcastle", "province": "KwaZulu-Natal", "lat": -27.7569, "lng": 29.9329,
     "audit_score": 2.0, "unemployment_rate": 42.8, "loadshedding_days": 20.0, "water_shortage": 0.50, "blue_green_fail": 0.6,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # Eastern Cape
    {"id": "buffalo_city", "name": "Buffalo City", "province": "Eastern Cape", "lat": -32.9996, "lng": 27.9060,
     "audit_score": 3.0, "unemployment_rate": 41.3, "loadshedding_days": 18.0, "water_shortage": 0.45, "blue_green_fail": 0.55,
     "no_piped_water_pct": 24.3, "no_electricity_pct": 28.6, "no_sanitation_pct": 34.2, "ghs_service_fail_score": 0.290333, "food_insecure_pct": 52.1},
    {"id": "nelson_mandela_bay", "name": "Nelson Mandela Bay", "province": "Eastern Cape", "lat": -33.9608, "lng": 25.6022,
     "audit_score": 2.0, "unemployment_rate": 40.6, "loadshedding_days": 20.0, "water_shortage": 0.60, "blue_green_fail": 0.7,
     "no_piped_water_pct": 18.6, "no_electricity_pct": 22.4, "no_sanitation_pct": 28.7, "ghs_service_fail_score": 0.232333, "food_insecure_pct": 44.8},
    {"id": "enoch_mgijima", "name": "Enoch Mgijima", "province": "Eastern Cape", "lat": -31.8970, "lng": 26.6720,
     "audit_score": 1.0, "unemployment_rate": 55.4, "loadshedding_days": 25.0, "water_shortage": 0.85, "blue_green_fail": 0.95,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    {"id": "makhanda", "name": "Makhanda", "province": "Eastern Cape", "lat": -33.3075, "lng": 26.5240,
     "audit_score": 2.0, "unemployment_rate": 46.7, "loadshedding_days": 22.0, "water_shortage": 0.70, "blue_green_fail": 0.8,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # Free State
    {"id": "mangaung", "name": "Mangaung", "province": "Free State", "lat": -29.1210, "lng": 26.2149,
     "audit_score": 2.0, "unemployment_rate": 38.1, "loadshedding_days": 18.0, "water_shortage": 0.50, "blue_green_fail": 0.65,
     "no_piped_water_pct": 15.2, "no_electricity_pct": 18.4, "no_sanitation_pct": 22.6, "ghs_service_fail_score": 0.186667, "food_insecure_pct": 41.3},
    {"id": "maluti_a_phofung", "name": "Maluti-a-Phofung", "province": "Free State", "lat": -28.5880, "lng": 28.9120,
     "audit_score": 1.0, "unemployment_rate": 58.3, "loadshedding_days": 28.0, "water_shortage": 0.90, "blue_green_fail": 0.95,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    {"id": "moqhaka", "name": "Moqhaka", "province": "Free State", "lat": -27.6810, "lng": 26.6750,
     "audit_score": 1.0, "unemployment_rate": 44.8, "loadshedding_days": 24.0, "water_shortage": 0.80, "blue_green_fail": 0.9,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # Mpumalanga
    {"id": "emalahleni", "name": "Emalahleni", "province": "Mpumalanga", "lat": -25.8735, "lng": 29.2311,
     "audit_score": 3.0, "unemployment_rate": 36.4, "loadshedding_days": 14.0, "water_shortage": 0.35, "blue_green_fail": 0.45,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    {"id": "mbombela", "name": "Mbombela", "province": "Mpumalanga", "lat": -25.4654, "lng": 30.9854,
     "audit_score": 3.0, "unemployment_rate": 34.8, "loadshedding_days": 14.0, "water_shortage": 0.30, "blue_green_fail": 0.4,
     "no_piped_water_pct": 19.8, "no_electricity_pct": 21.4, "no_sanitation_pct": 27.6, "ghs_service_fail_score": 0.226, "food_insecure_pct": 42.8},
    {"id": "steve_tshwete", "name": "Steve Tshwete", "province": "Mpumalanga", "lat": -25.7710, "lng": 29.4630,
     "audit_score": 5.0, "unemployment_rate": 28.7, "loadshedding_days": 10.0, "water_shortage": 0.20, "blue_green_fail": 0.2,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # Limpopo
    {"id": "polokwane", "name": "Polokwane", "province": "Limpopo", "lat": -23.9045, "lng": 29.4689,
     "audit_score": 3.0, "unemployment_rate": 33.9, "loadshedding_days": 15.0, "water_shortage": 0.40, "blue_green_fail": 0.5,
     "no_piped_water_pct": 22.1, "no_electricity_pct": 24.3, "no_sanitation_pct": 31.4, "ghs_service_fail_score": 0.259333, "food_insecure_pct": 46.2},
    {"id": "greater_tzaneen", "name": "Greater Tzaneen", "province": "Limpopo", "lat": -23.8330, "lng": 30.1580,
     "audit_score": 2.0, "unemployment_rate": 42.1, "loadshedding_days": 18.0, "water_shortage": 0.55, "blue_green_fail": 0.65,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # North West
    {"id": "rustenburg", "name": "Rustenburg", "province": "North West", "lat": -25.6658, "lng": 27.2424,
     "audit_score": 2.0, "unemployment_rate": 35.7, "loadshedding_days": 16.0, "water_shortage": 0.45, "blue_green_fail": 0.55,
     "no_piped_water_pct": 16.4, "no_electricity_pct": 19.8, "no_sanitation_pct": 24.1, "ghs_service_fail_score": 0.201, "food_insecure_pct": 39.6},
    {"id": "mahikeng", "name": "Mahikeng", "province": "North West", "lat": -25.8597, "lng": 25.6420,
     "audit_score": 1.0, "unemployment_rate": 52.1, "loadshedding_days": 26.0, "water_shortage": 0.80, "blue_green_fail": 0.9,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
    # Northern Cape
    {"id": "sol_plaatje", "name": "Sol Plaatje", "province": "Northern Cape", "lat": -28.7323, "lng": 24.7713,
     "audit_score": 3.0, "unemployment_rate": 33.4, "loadshedding_days": 14.0, "water_shortage": 0.35, "blue_green_fail": 0.45,
     "no_piped_water_pct": 8.9, "no_electricity_pct": 11.2, "no_sanitation_pct": 13.8, "ghs_service_fail_score": 0.113, "food_insecure_pct": 28.4},
    {"id": "dawid_kruiper", "name": "Dawid Kruiper", "province": "Northern Cape", "lat": -28.4478, "lng": 21.2561,
     "audit_score": 3.0, "unemployment_rate": 31.8, "loadshedding_days": 12.0, "water_shortage": 0.30, "blue_green_fail": 0.4,
     "no_piped_water_pct": 0.0, "no_electricity_pct": 0.0, "no_sanitation_pct": 0.0, "ghs_service_fail_score": 0.0, "food_insecure_pct": 0.0},
]

# Attempt to enrich MUNICIPALITIES_BASE from Supabase at startup.
# Called once during lifespan warm-up via compute_pain_index.
_ghs_enrichment_done = False


async def _enrich_from_supabase() -> None:
    """Best-effort enrichment of MUNICIPALITIES_BASE from ghs_data and census2022."""
    global _ghs_enrichment_done
    if _ghs_enrichment_done:
        return
    try:
        db = database.get_client()

        # GHS enrichment
        ghs_result = db.table("ghs_data").select("municipality, pct_no_piped_water, pct_no_electricity, pct_no_flush_toilet, pct_food_insecure").execute()
        if ghs_result.data:
            ghs_lookup = {row["municipality"].lower(): row for row in ghs_result.data}
            for base in MUNICIPALITIES_BASE:
                key = base["name"].lower()
                if key in ghs_lookup:
                    row = ghs_lookup[key]
                    base["no_piped_water_pct"] = float(row.get("pct_no_piped_water", base["no_piped_water_pct"]))
                    base["no_electricity_pct"] = float(row.get("pct_no_electricity", base["no_electricity_pct"]))
                    base["no_sanitation_pct"]  = float(row.get("pct_no_flush_toilet", base["no_sanitation_pct"]))
                    base["food_insecure_pct"]  = float(row.get("pct_food_insecure", base["food_insecure_pct"]))
                    base["ghs_service_fail_score"] = round(
                        (base["no_piped_water_pct"] + base["no_electricity_pct"] + base["no_sanitation_pct"]) / 300.0, 6
                    )

        # Census enrichment (no_piped_water and no_sanitation may differ from GHS)
        census_result = db.table("census2022").select("municipality, pct_no_electricity, pct_no_piped_water, pct_no_sanitation").execute()
        if census_result.data:
            census_lookup = {row["municipality"].lower(): row for row in census_result.data}
            for base in MUNICIPALITIES_BASE:
                key = base["name"].lower()
                if key in census_lookup:
                    row = census_lookup[key]
                    # Census values take precedence for sanitation (more comprehensive)
                    base["no_piped_water_pct"] = float(row.get("pct_no_piped_water", base["no_piped_water_pct"]))
                    base["no_electricity_pct"] = float(row.get("pct_no_electricity", base["no_electricity_pct"]))
                    base["no_sanitation_pct"]  = float(row.get("pct_no_sanitation", base["no_sanitation_pct"]))
                    base["ghs_service_fail_score"] = round(
                        (base["no_piped_water_pct"] + base["no_electricity_pct"] + base["no_sanitation_pct"]) / 300.0, 6
                    )

        _ghs_enrichment_done = True
        logger.info("MUNICIPALITIES_BASE enriched from Supabase ghs_data and census2022.")
    except Exception as e:
        logger.warning(f"Supabase enrichment of MUNICIPALITIES_BASE failed (using static values): {e}")


def _compute_score(m: dict) -> float:
    audit_score    = float(m.get("audit_score", 3.0))
    unemployment   = float(m.get("unemployment_rate", 35.0))
    loadshedding   = float(m.get("loadshedding_days", 15.0))
    water_shortage = float(m.get("water_shortage", 0.5))
    no_piped       = float(m.get("no_piped_water_pct", 0.0))
    no_elec        = float(m.get("no_electricity_pct", 0.0))
    no_san         = float(m.get("no_sanitation_pct", 0.0))
    ghs_fail       = float(m.get("ghs_service_fail_score", 0.0))

    score = (
        (5 - audit_score)       * 0.20
        + (unemployment / 100)  * 0.20   # normalise to 0-1
        + (loadshedding / 30)   * 0.15   # normalise to 0-1
        + water_shortage        * 0.10
        + (no_piped / 100)      * 0.10
        + (no_elec / 100)       * 0.10
        + (no_san / 100)        * 0.08
        + ghs_fail              * 0.07
    )
    return round(max(0.0, min(5.0, score)), 3)


async def compute_pain_index() -> list[dict]:
    # Enrich base data from Supabase on first call
    await _enrich_from_supabase()

    # Try to enrich from cached upstream data
    unemployment_cache = await redis_client.getjson("unemployment:data")
    audit_cache = await redis_client.getjson("audits:outcomes")
    loadshedding_cache = await redis_client.getjson("loadshedding:stage")

    # Build lookup dicts
    unemp_lookup: dict[str, float] = {}
    if unemployment_cache:
        for record in unemployment_cache.get("municipalities", []):
            unemp_lookup[record["name"].lower()] = record["rate"]

    audit_lookup: dict[str, int] = {}
    if audit_cache:
        for record in audit_cache.get("municipalities", []):
            audit_lookup[record["name"].lower()] = record["score"]

    current_stage = 0
    if loadshedding_cache:
        current_stage = int(loadshedding_cache.get("stage", 0))

    results: list[dict] = []
    for base in MUNICIPALITIES_BASE:
        muni = dict(base)
        name_lower = base["name"].lower()

        # Override unemployment from live cache if available
        if name_lower in unemp_lookup:
            muni["unemployment_rate"] = unemp_lookup[name_lower]

        # Override audit score from live cache if available
        if name_lower in audit_lookup:
            muni["audit_score"] = float(audit_lookup[name_lower])

        # Use current loadshedding stage as proxy (stage × 10 days / 30)
        if current_stage > 0:
            ls_days = min(current_stage * 10.0, 30.0)
            muni["loadshedding_days"] = ls_days

        score = _compute_score(muni)
        muni["pain_score"] = score
        results.append(muni)

    results.sort(key=lambda x: x["pain_score"], reverse=True)

    await redis_client.setjson("pain_index:scores", results, ex=3600)

    # Upsert to Supabase if available
    try:
        await database.upsert("municipalities", results, on_conflict="id")
    except Exception as e:
        logger.warning(f"Supabase upsert for pain index failed: {e}")

    return results
