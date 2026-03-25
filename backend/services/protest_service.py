import hashlib
import logging
from datetime import datetime, timezone

import feedparser

import redis_client

logger = logging.getLogger(__name__)

RSS_FEEDS = [
    "https://www.groundup.org.za/feed/",
    "https://ewn.co.za/RSS%20Feeds/Latest%20News",
    "https://www.dailymaverick.co.za/feed/",
]

PROTEST_KEYWORDS = [
    "protest", "demonstration", "march", "strike", "shutdown",
    "looting", "riot", "service delivery", "water cut", "electricity",
    "sewage", "blocked road", "community anger", "residents demand",
    "picket", "toyi-toyi",
]

# Comprehensive SA place name to coordinates mapping
SA_PLACES: dict[str, tuple[float, float]] = {
    "johannesburg": (-26.2041, 28.0473),
    "joburg": (-26.2041, 28.0473),
    "jozi": (-26.2041, 28.0473),
    "cape town": (-33.9249, 18.4241),
    "durban": (-29.8587, 31.0218),
    "pretoria": (-25.7479, 28.2293),
    "tshwane": (-25.7479, 28.2293),
    "port elizabeth": (-33.9608, 25.6022),
    "gqeberha": (-33.9608, 25.6022),
    "bloemfontein": (-29.1210, 26.2149),
    "mangaung": (-29.1210, 26.2149),
    "polokwane": (-23.9045, 29.4689),
    "nelspruit": (-25.4654, 30.9854),
    "mbombela": (-25.4654, 30.9854),
    "kimberley": (-28.7323, 24.7713),
    "east london": (-32.9996, 27.9060),
    "buffalo city": (-32.9996, 27.9060),
    "soweto": (-26.2674, 27.8589),
    "alexandra": (-26.1046, 28.0920),
    "tembisa": (-25.9960, 28.2270),
    "khayelitsha": (-34.0408, 18.6732),
    "mitchells plain": (-34.0558, 18.6230),
    "delft": (-33.9780, 18.6340),
    "gugulethu": (-33.9899, 18.5654),
    "langa": (-33.9484, 18.5317),
    "marikana": (-25.7060, 27.4810),
    "rustenburg": (-25.6658, 27.2424),
    "mamelodi": (-25.7226, 28.3989),
    "soshanguve": (-25.5280, 28.0990),
    "hammanskraal": (-25.4560, 28.2770),
    "diepsloot": (-25.9350, 28.0130),
    "kliptown": (-26.2744, 27.8911),
    "evaton": (-26.5260, 27.8800),
    "sebokeng": (-26.5320, 27.8870),
    "vereeniging": (-26.6732, 27.9313),
    "vanderbijlpark": (-26.6980, 27.8320),
    "sasolburg": (-26.8148, 27.8279),
    "emfuleni": (-26.6732, 27.9313),
    "emalahleni": (-25.8735, 29.2311),
    "witbank": (-25.8735, 29.2311),
    "secunda": (-26.5196, 29.1891),
    "middelburg": (-25.7710, 29.4630),
    "pietermaritzburg": (-29.6196, 30.3928),
    "msunduzi": (-29.6196, 30.3928),
    "richards bay": (-28.7829, 32.0435),
    "umhlathuze": (-28.7829, 32.0435),
    "ladysmith": (-28.5598, 29.7793),
    "newcastle": (-27.7569, 29.9329),
    "mossel bay": (-34.1827, 22.1434),
    "george": (-33.9608, 22.4617),
    "knysna": (-34.0358, 23.0480),
    "paarl": (-33.7340, 18.9620),
    "stellenbosch": (-33.9360, 18.8600),
    "franschhoek": (-33.9100, 19.1210),
    "worcester": (-33.6460, 19.4480),
    "beaufort west": (-32.3560, 22.5860),
    "upington": (-28.4478, 21.2561),
    "kuruman": (-27.4540, 23.4330),
    "lebowakgomo": (-24.1980, 29.5270),
    "tzaneen": (-23.8330, 30.1580),
    "thohoyandou": (-22.9480, 30.4840),
    "louis trichardt": (-23.0430, 29.9070),
    "makhado": (-23.0430, 29.9070),
    "musina": (-22.3406, 30.0440),
    "bela-bela": (-24.8840, 28.3580),
    "warmbaths": (-24.8840, 28.3580),
    "thabazimbi": (-24.5920, 27.4020),
    "mokopane": (-24.1910, 29.0080),
    "lephalale": (-23.6723, 27.7083),
    "saldanha": (-32.9980, 17.9440),
    "vredenburg": (-32.9060, 17.9960),
    "langebaan": (-33.1000, 18.0350),
    "hermanus": (-34.4188, 19.2352),
    "swellendam": (-34.0230, 20.4440),
    "riversdale": (-34.0870, 21.2580),
    "plettenberg bay": (-34.0517, 23.3682),
    "humansdorp": (-34.0320, 24.7680),
    "grahamstown": (-33.3075, 26.5240),
    "makhanda": (-33.3075, 26.5240),
    "umlazi": (-29.9680, 30.8980),
    "kwamashu": (-29.7480, 30.9960),
    "mdantsane": (-32.9750, 27.7650),
    "motherwell": (-33.8480, 25.5980),
    "mahikeng": (-25.8597, 25.6420),
    "mafikeng": (-25.8597, 25.6420),
    "botshabelo": (-29.2550, 26.7230),
    "welkom": (-27.9831, 26.7348),
    "maluti-a-phofung": (-28.5880, 28.9120),
    "phuthaditjhaba": (-28.5880, 28.9120),
    "enoch mgijima": (-31.8970, 26.6720),
    "queenstown": (-31.8970, 26.6720),
    "lekwa": (-26.9620, 29.2540),
    "standerton": (-26.9620, 29.2540),
    "moqhaka": (-27.6810, 26.6750),
    "kroonstad": (-27.6510, 27.2340),
    "thulamela": (-22.9480, 30.4840),
    "greater tzaneen": (-23.8330, 30.1580),
    "steve tshwete": (-25.7710, 29.4630),
    "sol plaatje": (-28.7323, 24.7713),
    "dawid kruiper": (-28.4478, 21.2561),
    "overstrand": (-34.4188, 19.2352),
    "swartland": (-33.4680, 18.6860),
    "drakenstein": (-33.7340, 18.9620),
    "midvaal": (-26.5100, 28.2300),
    "lesedi": (-26.4000, 28.4000),
}


def _find_place(text: str) -> tuple[str, float, float] | None:
    text_lower = text.lower()
    best_match: tuple[str, float, float] | None = None
    best_len = 0
    for place_name, (lat, lng) in SA_PLACES.items():
        if place_name in text_lower and len(place_name) > best_len:
            best_match = (place_name.title(), lat, lng)
            best_len = len(place_name)
    return best_match


def _contains_keywords(text: str) -> bool:
    text_lower = text.lower()
    return any(kw in text_lower for kw in PROTEST_KEYWORDS)


def _entry_to_incident(entry: dict, category: str = "protest") -> dict | None:
    title = entry.get("title", "")
    summary = entry.get("summary", "") or entry.get("description", "")
    combined_text = f"{title} {summary}"

    if not _contains_keywords(combined_text):
        return None

    place_match = _find_place(combined_text)
    if place_match is None:
        return None

    place_name, lat, lng = place_match

    published_raw = entry.get("published", "") or entry.get("updated", "")
    try:
        import time
        t = entry.get("published_parsed") or entry.get("updated_parsed")
        if t:
            date_iso = datetime.fromtimestamp(time.mktime(t), tz=timezone.utc).isoformat()
        else:
            date_iso = datetime.now(timezone.utc).isoformat()
    except Exception:
        date_iso = datetime.now(timezone.utc).isoformat()

    link = entry.get("link", "")
    incident_id = hashlib.md5(f"{link}{title}".encode()).hexdigest()

    # Detect more specific category from text
    text_lower = combined_text.lower()
    if any(w in text_lower for w in ["loot", "riot", "violent"]):
        category = "riot"
    elif any(w in text_lower for w in ["strike", "shutdown", "stayaway"]):
        category = "strike"
    elif any(w in text_lower for w in ["water", "sewage", "sanitation"]):
        category = "service_delivery"
    elif any(w in text_lower for w in ["electricity", "loadshedding", "eskom"]):
        category = "electricity"
    elif any(w in text_lower for w in ["march", "demonstration"]):
        category = "march"
    else:
        category = "protest"

    return {
        "id": incident_id,
        "title": title,
        "lat": lat,
        "lng": lng,
        "date": date_iso,
        "description": summary[:500] if summary else title,
        "category": category,
        "municipality": place_name,
    }


async def fetch_protests() -> list[dict]:
    cached = await redis_client.getjson("protests:incidents")
    if cached is not None:
        return cached

    incidents: list[dict] = []
    seen_ids: set[str] = set()

    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                incident = _entry_to_incident(entry)
                if incident and incident["id"] not in seen_ids:
                    seen_ids.add(incident["id"])
                    incidents.append(incident)
        except Exception as e:
            logger.warning(f"Failed to parse protest feed {feed_url}: {e}")

    # Sort by date descending
    incidents.sort(key=lambda x: x.get("date", ""), reverse=True)

    await redis_client.setjson("protests:incidents", incidents, ex=3600)
    return incidents
