"""
Import Census 2022 municipal data into Supabase.

Usage:
    python scripts/import_census2022.py [path/to/census2022.xlsx]

If the xlsx path is not provided or the file cannot be read, mock data based on
realistic Stats SA Census 2022 report patterns is used instead.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env from parent directory (backend root)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MOCK_CENSUS = [
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


def _load_from_xlsx(xlsx_path: str) -> list[dict] | None:
    """Attempt to read Census 2022 data from an xlsx file. Returns None on failure."""
    path = Path(xlsx_path)
    if not path.exists():
        logger.warning(f"File not found: {xlsx_path}")
        return None

    required_cols = {"municipality", "province", "pop_total", "pct_no_electricity", "pct_no_piped_water", "pct_no_sanitation", "median_income"}

    # Try pandas first
    try:
        import pandas as pd
        df = pd.read_excel(path)
        df.columns = df.columns.str.lower()
        missing = required_cols - set(df.columns.tolist())
        if missing:
            logger.warning(f"xlsx missing columns: {missing}. Falling back to mock data.")
            return None
        records = df[list(required_cols)].dropna().to_dict(orient="records")
        logger.info(f"Loaded {len(records)} records from xlsx via pandas.")
        return records
    except ImportError:
        logger.info("pandas not available, trying openpyxl.")
    except Exception as e:
        logger.warning(f"pandas read failed: {e}. Trying openpyxl.")

    try:
        import openpyxl
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            logger.warning("xlsx is empty. Falling back to mock data.")
            return None
        headers = [str(h).lower().strip() if h else "" for h in rows[0]]
        required_list = list(required_cols)
        try:
            indices = {col: headers.index(col) for col in required_list}
        except ValueError as e:
            logger.warning(f"openpyxl column mapping failed: {e}. Falling back to mock data.")
            return None
        records = []
        for row in rows[1:]:
            try:
                record = {col: row[idx] for col, idx in indices.items()}
                if any(v is None for v in record.values()):
                    continue
                records.append(record)
            except Exception:
                continue
        logger.info(f"Loaded {len(records)} records from xlsx via openpyxl.")
        return records
    except ImportError:
        logger.warning("openpyxl not available either. Falling back to mock data.")
        return None
    except Exception as e:
        logger.warning(f"openpyxl read failed: {e}. Falling back to mock data.")
        return None


def _get_supabase_client():
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "") or os.environ.get("SUPABASE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment.")
    return create_client(url, key)


def run(xlsx_path: str | None = None) -> None:
    # Determine data source
    records = None
    if xlsx_path:
        records = _load_from_xlsx(xlsx_path)

    if records is None:
        logger.info("Using mock Census 2022 data.")
        records = MOCK_CENSUS

    # Build census2022 upsert payload
    census_rows = []
    for r in records:
        census_rows.append({
            "municipality":       str(r["municipality"]),
            "province":           str(r["province"]),
            "pop_total":          int(r["pop_total"]),
            "pct_no_electricity": float(r["pct_no_electricity"]),
            "pct_no_piped_water": float(r["pct_no_piped_water"]),
            "pct_no_sanitation":  float(r["pct_no_sanitation"]),
            "median_income":      float(r["median_income"]),
        })

    # Build municipalities update payload
    muni_rows = []
    for r in records:
        muni_rows.append({
            "name":               str(r["municipality"]),
            "no_piped_water_pct": float(r["pct_no_piped_water"]),
            "no_electricity_pct": float(r["pct_no_electricity"]),
            "no_sanitation_pct":  float(r["pct_no_sanitation"]),
        })

    supabase = _get_supabase_client()

    # Upsert census2022
    logger.info(f"Upserting {len(census_rows)} rows into census2022 …")
    result = supabase.table("census2022").upsert(census_rows, on_conflict="municipality").execute()
    upserted_census = len(result.data) if result.data else 0
    logger.info(f"census2022 upsert complete: {upserted_census} rows affected.")

    # Update municipalities table row-by-row
    logger.info(f"Updating {len(muni_rows)} rows in municipalities …")
    updated_muni = 0
    for row in muni_rows:
        name = row.pop("name")
        try:
            supabase.table("municipalities").update(row).eq("name", name).execute()
            updated_muni += 1
        except Exception as e:
            logger.warning(f"municipalities update failed for '{name}': {e}")

    logger.info(f"municipalities update complete: {updated_muni} rows affected.")

    print(f"\nSummary:")
    print(f"  Source:                {'xlsx: ' + str(xlsx_path) if xlsx_path and records is not MOCK_CENSUS else 'mock data'}")
    print(f"  census2022 upserted:   {upserted_census}")
    print(f"  municipalities updated: {updated_muni}")


if __name__ == "__main__":
    xlsx_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run(xlsx_arg)
