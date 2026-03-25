#!/usr/bin/env python3
"""
scrape_wanted.py
Daily scraper for SAPS Most Wanted & Missing Persons.
Source: https://www.saps.gov.za/crimestop/wanted/

Run:
    cd backend && python scripts/scrape_wanted.py

Requires:
    pip install requests beautifulsoup4 supabase python-dotenv
"""

import hashlib
import logging
import os
import sys
import time
from pathlib import Path

# Allow imports from backend root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SAPS_WANTED_URL = "https://www.saps.gov.za/crimestop/wanted/list.php"
SAPS_MISSING_URL = "https://www.saps.gov.za/crimestop/missing/list.php"
BASE_URL = "https://www.saps.gov.za"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; LoudWatchZA/2.0; "
        "+https://loudwatch.co.za/about)"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-ZA,en;q=0.9",
}

REQUEST_DELAY = 2.0  # seconds between requests — be polite

# Province name → (lat, lng) centroid fallback
PROVINCE_COORDS: dict[str, tuple[float, float]] = {
    "gauteng": (-26.2708, 28.1123),
    "western cape": (-33.2278, 21.8569),
    "kwazulu-natal": (-28.5306, 30.8958),
    "eastern cape": (-32.2968, 26.4194),
    "free state": (-28.4541, 26.7968),
    "mpumalanga": (-25.5653, 30.5279),
    "limpopo": (-23.4013, 29.4179),
    "north west": (-25.8597, 25.6420),
    "northern cape": (-29.0467, 21.8569),
}

PROVINCE_KEYWORDS = {
    "gauteng": ["gauteng", "johannesburg", "pretoria", "tshwane", "ekurhuleni", "soweto"],
    "western cape": ["western cape", "cape town", "stellenbosch", "george", "paarl"],
    "kwazulu-natal": ["kwazulu", "natal", "durban", "pietermaritzburg", "ethekwini"],
    "eastern cape": ["eastern cape", "east london", "port elizabeth", "buffalo city"],
    "free state": ["free state", "bloemfontein", "mangaung"],
    "mpumalanga": ["mpumalanga", "nelspruit", "mbombela", "witbank", "emalahleni"],
    "limpopo": ["limpopo", "polokwane", "musina", "tzaneen"],
    "north west": ["north west", "rustenburg", "mahikeng", "marikana"],
    "northern cape": ["northern cape", "kimberley", "upington"],
}


def _make_scrape_key(full_name: str, case_number: str) -> str:
    raw = f"{full_name.lower().strip()}:{case_number.lower().strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _infer_province(text: str) -> tuple[str, float, float] | tuple[None, None, None]:
    text_lower = text.lower()
    for province, keywords in PROVINCE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                lat, lng = PROVINCE_COORDS[province]
                # Add small random jitter so pins don't stack on centroid
                import random
                lat += random.uniform(-0.5, 0.5)
                lng += random.uniform(-0.5, 0.5)
                return province.title(), lat, lng
    return None, None, None


def _fetch_page(url: str) -> BeautifulSoup | None:
    try:
        # verify=False: SAPS site uses a government CA not trusted by default on Windows
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        resp = requests.get(url, headers=HEADERS, timeout=30, verify=False)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return None


def _extract_text(tag, selector: str) -> str:
    el = tag.select_one(selector)
    return el.get_text(separator=" ", strip=True) if el else ""


def _resolve_photo(src: str, section: str = "wanted") -> str:
    """Resolve a relative thumbnail src to an absolute URL."""
    if not src:
        return ""
    if src.startswith("http"):
        return src
    base_section = BASE_URL + f"/crimestop/{section}/"
    return base_section + src.lstrip("/")


def parse_wanted_page(soup: BeautifulSoup, is_missing: bool) -> list[dict]:
    """
    Parse SAPS wanted/missing persons list page.

    Both pages use:  table#tableformat  tr[id="title"]
    Each row appears TWICE in the parsed tree (malformed nested <tr> on SAPS side)
    — we deduplicate by bid.

    Wanted columns:  td[0]=photo-img  td[1]=surname  td[2]=firstname  th=crime
    Missing columns: td[0]=surname    td[1]=firstname td[2]=age-category  (no photo)
    """
    section = "missing" if is_missing else "wanted"
    persons = []
    seen_bids: set[str] = set()

    rows = soup.select('table#tableformat tr[id="title"]')
    if not rows:
        logger.warning(f"  No rows found with primary selector on {section} page")
        return persons

    for row in rows:
        try:
            tds = row.find_all("td")
            if not tds:
                continue

            # Extract bid for deduplication
            first_a = row.find("a", href=True)
            if not first_a:
                continue
            href = first_a["href"]
            bid = href.split("bid=")[-1].strip() if "bid=" in href else ""
            if not bid or bid in seen_bids:
                continue
            seen_bids.add(bid)

            person: dict = {"is_missing": is_missing, "is_active": True}

            if is_missing:
                # td[0]=surname, td[1]=firstname, td[2]=age_category
                if len(tds) < 2:
                    continue
                surname = tds[0].get_text(strip=True)
                firstname = tds[1].get_text(strip=True)
                age_cat = tds[2].get_text(strip=True) if len(tds) > 2 else ""
                person["full_name"] = f"{firstname} {surname}".strip()
                person["photo_url"] = ""
                person["crime_category"] = "Missing Person"
                person["charges"] = age_cat  # store age category here
                person["case_number"] = bid
            else:
                # td[0]=photo, td[1]=surname, td[2]=firstname, th=crime
                if len(tds) < 3:
                    continue
                img_tag = tds[0].find("img")
                photo_src = img_tag.get("src", "") if img_tag else ""
                surname = tds[1].get_text(strip=True)
                firstname = tds[2].get_text(strip=True)
                # Crime is in a <th> not <td>
                th = row.find("th")
                crime_text = th.get_text(strip=True) if th else ""
                person["full_name"] = f"{firstname} {surname}".strip()
                person["photo_url"] = _resolve_photo(photo_src, "wanted")
                person["crime_category"] = _categorize(crime_text) if crime_text else "Unknown"
                person["charges"] = crime_text
                person["case_number"] = bid

            if len(person["full_name"]) < 2:
                continue

            person["station"] = ""
            person["last_known_location"] = ""

            # Province inference — limited data on list page, default to Unknown
            province, lat, lng = _infer_province(person["full_name"])
            person["province"] = province or "Unknown"
            person["lat"] = lat
            person["lng"] = lng

            person["scrape_key"] = _make_scrape_key(person["full_name"], person["case_number"])
            person["source_url"] = SAPS_MISSING_URL if is_missing else SAPS_WANTED_URL

            persons.append(person)

        except Exception as e:
            logger.warning(f"Failed to parse row: {e}")
            continue

    return persons


def _categorize(text: str) -> str:
    text_lower = text.lower()
    if "murder" in text_lower or "homicide" in text_lower:
        return "Murder"
    if "robbery" in text_lower or "hijack" in text_lower:
        return "Robbery"
    if "rape" in text_lower or "sexual" in text_lower:
        return "Sexual Offences"
    if "fraud" in text_lower or "corruption" in text_lower:
        return "Fraud & Corruption"
    if "drug" in text_lower or "narco" in text_lower:
        return "Drugs"
    if "assault" in text_lower or "gbv" in text_lower:
        return "Assault"
    if "theft" in text_lower or "steal" in text_lower:
        return "Theft"
    if "kidnap" in text_lower or "abduct" in text_lower:
        return "Kidnapping"
    if "terror" in text_lower or "bomb" in text_lower:
        return "Terrorism"
    return "Other"


def upsert_to_supabase(persons: list[dict]) -> int:
    if not persons:
        return 0
    try:
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).parent.parent / ".env")
        from supabase import create_client
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        client = create_client(url, key)
    except Exception as e:
        logger.error(f"Supabase init failed: {e}")
        return 0

    upserted = 0
    for p in persons:
        try:
            client.table("wanted_persons").upsert(p, on_conflict="scrape_key").execute()
            upserted += 1
        except Exception as e:
            logger.warning(f"Upsert failed for {p.get('full_name', '?')}: {e}")

    return upserted


def run():
    logger.info("=== SAPS Wanted Persons Scraper starting ===")

    all_persons: list[dict] = []

    # 1. Wanted criminals
    logger.info(f"Fetching wanted persons: {SAPS_WANTED_URL}")
    soup_wanted = _fetch_page(SAPS_WANTED_URL)
    if soup_wanted:
        wanted = parse_wanted_page(soup_wanted, is_missing=False)
        logger.info(f"  Parsed {len(wanted)} wanted persons")
        all_persons.extend(wanted)
    else:
        logger.warning("  Skipped wanted — page unavailable")

    time.sleep(REQUEST_DELAY)

    # 2. Missing persons
    logger.info(f"Fetching missing persons: {SAPS_MISSING_URL}")
    soup_missing = _fetch_page(SAPS_MISSING_URL)
    if soup_missing:
        missing = parse_wanted_page(soup_missing, is_missing=True)[:500]  # cap — list has 3500+
        logger.info(f"  Parsed {len(missing)} missing persons")
        all_persons.extend(missing)
    else:
        logger.warning("  Skipped missing — page unavailable")

    if not all_persons:
        logger.warning("No persons parsed — check SAPS page structure")
        sys.exit(0)

    logger.info(f"Total parsed: {len(all_persons)} — upserting to Supabase …")
    n = upsert_to_supabase(all_persons)
    logger.info(f"Upserted {n}/{len(all_persons)} records")
    logger.info("=== Done ===")


if __name__ == "__main__":
    run()
