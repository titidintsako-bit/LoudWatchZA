import hashlib
import logging
import time
from datetime import datetime, timezone

import feedparser

import redis_client
from services.protest_service import SA_PLACES

logger = logging.getLogger(__name__)

RSS_SOURCES = [
    ("News24", "https://feeds.news24.com/articles/news24/TopStories/rss"),
    ("Daily Maverick", "https://www.dailymaverick.co.za/feed/"),
    ("IOL", "https://www.iol.co.za/rss"),
]

POSITIVE_WORDS = [
    "growth", "success", "improved", "record", "boost", "award",
    "recovery", "investment", "breakthrough", "milestone", "progress",
    "expansion", "partnership", "achievement",
]

NEGATIVE_WORDS = [
    "crisis", "corruption", "collapse", "murder", "strike", "protest",
    "shortage", "debt", "loadshedding", "fraud", "arrest", "violence",
    "riot", "shutdown", "decline", "failure", "scandal", "robbery",
    "assault", "hijacking", "drought", "flood",
]

# Default SA centre for articles without a specific location
_SA_DEFAULT = (-29.0, 25.0)


def _compute_sentiment(text: str) -> float:
    text_lower = text.lower()
    pos_count = sum(1 for w in POSITIVE_WORDS if w in text_lower)
    neg_count = sum(1 for w in NEGATIVE_WORDS if w in text_lower)
    denominator = max(pos_count + neg_count, 1)
    return round((pos_count - neg_count) / denominator, 3)


def _find_place(text: str) -> tuple[float, float]:
    text_lower = text.lower()
    best_match: tuple[float, float] | None = None
    best_len = 0
    for place_name, (lat, lng) in SA_PLACES.items():
        if place_name in text_lower and len(place_name) > best_len:
            best_match = (lat, lng)
            best_len = len(place_name)
    return best_match if best_match else _SA_DEFAULT


def _entry_to_article(entry: dict, source: str) -> dict:
    title = entry.get("title", "")
    summary = entry.get("summary", "") or entry.get("description", "") or ""
    link = entry.get("link", "")

    article_id = hashlib.md5(f"{source}{link}{title}".encode()).hexdigest()

    combined = f"{title} {summary}"
    lat, lng = _find_place(combined)
    sentiment = _compute_sentiment(combined)

    # Parse published date
    try:
        t = entry.get("published_parsed") or entry.get("updated_parsed")
        if t:
            published_iso = datetime.fromtimestamp(time.mktime(t), tz=timezone.utc).isoformat()
        else:
            published_iso = datetime.now(timezone.utc).isoformat()
    except Exception:
        published_iso = datetime.now(timezone.utc).isoformat()

    # Truncate summary for frontend display
    clean_summary = summary.replace("<p>", "").replace("</p>", "").strip()[:300]

    return {
        "id": article_id,
        "title": title,
        "url": link,
        "source": source,
        "lat": lat,
        "lng": lng,
        "published_at": published_iso,
        "sentiment": sentiment,
        "summary": clean_summary,
    }


async def fetch_news() -> list[dict]:
    cached = await redis_client.getjson("news:articles")
    if cached is not None:
        return cached

    articles: list[dict] = []
    seen_ids: set[str] = set()

    for source_name, feed_url in RSS_SOURCES:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                article = _entry_to_article(entry, source_name)
                if article["id"] not in seen_ids:
                    seen_ids.add(article["id"])
                    articles.append(article)
        except Exception as e:
            logger.warning(f"Failed to parse news feed {feed_url}: {e}")

    # Sort newest first, cap at 100
    articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    articles = articles[:100]

    await redis_client.setjson("news:articles", articles, ex=300)
    return articles
