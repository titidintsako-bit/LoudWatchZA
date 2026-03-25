"""
Import mid-year population estimates by province into Supabase.
Reads from the real Stats SA MYPE 2025 Excel file.

Usage:
    python scripts/import_population.py
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Path to real Excel file
DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "Population" / "MYPE report table website_ 2025.xlsx"

# Hardcoded from MYPE by province sheet (2025 totals, rows 4-12)
REAL_POPULATION = [
    {"province": "Eastern Cape",   "population": 7_090_788,  "year": 2025},
    {"province": "Free State",     "population": 3_039_834,  "year": 2025},
    {"province": "Gauteng",        "population": 16_104_933, "year": 2025},
    {"province": "KwaZulu-Natal",  "population": 12_232_247, "year": 2025},
    {"province": "Limpopo",        "population": 6_366_192,  "year": 2025},
    {"province": "Mpumalanga",     "population": 5_076_133,  "year": 2025},
    {"province": "Northern Cape",  "population": 1_379_183,  "year": 2025},
    {"province": "North West",     "population": 4_183_947,  "year": 2025},
    {"province": "Western Cape",   "population": 7_627_688,  "year": 2025},
]


def load_from_excel() -> list[dict]:
    """Try to read from real Excel file; fall back to hardcoded values."""
    try:
        import openpyxl
        wb = openpyxl.load_workbook(DATA_FILE, read_only=True, data_only=True)
        ws = wb["MYPE by province"]

        # Province name is in column B (index 2), total population in column C (index 3)
        # Data starts at row 4 (0-indexed row 3), ends at row 12
        records = []
        for row in ws.iter_rows(min_row=4, max_row=12, values_only=True):
            province_name = row[1]  # column B
            population = row[2]     # column C (total)
            if province_name and population:
                records.append({
                    "province": str(province_name).strip(),
                    "population": int(population),
                    "year": 2025,
                })
        wb.close()

        if len(records) >= 9:
            logger.info(f"Loaded {len(records)} provinces from real MYPE Excel file.")
            return records
        else:
            logger.warning(f"Only {len(records)} rows found in Excel; using hardcoded values.")

    except Exception as e:
        logger.warning(f"Could not read Excel file ({e}); using hardcoded 2025 MYPE values.")

    return REAL_POPULATION


def _get_supabase_client():
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "") or os.environ.get("SUPABASE_KEY", "")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
    return create_client(url, key)


def run() -> None:
    records = load_from_excel()

    rows = [
        {
            "province":   r["province"],
            "population": r["population"],
            "year":       r["year"],
        }
        for r in records
    ]

    supabase = _get_supabase_client()
    logger.info(f"Upserting {len(rows)} rows into population_estimates …")
    result = supabase.table("population_estimates").upsert(rows, on_conflict="province").execute()
    upserted = len(result.data) if result.data else 0
    logger.info("Done.")

    total = sum(r["population"] for r in records)
    print(f"\nSummary:")
    print(f"  Source:                     Stats SA MYPE 2025")
    print(f"  population_estimates rows:  {upserted}")
    print(f"  Total SA population (2025): {total:,}")
    for r in records:
        print(f"    {r['province']:20s}  {r['population']:>12,}")


if __name__ == "__main__":
    run()
