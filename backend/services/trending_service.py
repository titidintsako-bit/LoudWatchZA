"""
Trending Topics & Province Sentiment Service
============================================
Runs hourly. Analyses RSS news articles to identify trending topics,
calculate growth rates, and compute per-province sentiment scores.
Uses Groq (llama3-8b-8192) for topic clustering when available;
falls back to keyword frequency analysis.
"""
import json
import logging
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Optional

import redis_client
from config import settings

logger = logging.getLogger(__name__)

# ── Province resolution ──────────────────────────────────────────────────────

PROVINCE_ALIASES: dict[str, str] = {
    "gauteng": "Gauteng",
    "western cape": "Western Cape",
    "kwazulu-natal": "KwaZulu-Natal",
    "kzn": "KwaZulu-Natal",
    "eastern cape": "Eastern Cape",
    "limpopo": "Limpopo",
    "mpumalanga": "Mpumalanga",
    "north west": "North West",
    "free state": "Free State",
    "northern cape": "Northern Cape",
    # Major cities → province
    "johannesburg": "Gauteng",
    "joburg": "Gauteng",
    "sandton": "Gauteng",
    "soweto": "Gauteng",
    "cape town": "Western Cape",
    "pretoria": "Gauteng",
    "tshwane": "Gauteng",
    "durban": "KwaZulu-Natal",
    "ethekwini": "KwaZulu-Natal",
    "pietermaritzburg": "KwaZulu-Natal",
    "port elizabeth": "Eastern Cape",
    "gqeberha": "Eastern Cape",
    "east london": "Eastern Cape",
    "bloemfontein": "Free State",
    "mangaung": "Free State",
    "nelspruit": "Mpumalanga",
    "mbombela": "Mpumalanga",
    "polokwane": "Limpopo",
    "kimberley": "Northern Cape",
    "upington": "Northern Cape",
    "rustenburg": "North West",
    "mahikeng": "North West",
    "george": "Western Cape",
    "stellenbosch": "Western Cape",
}

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "energy":      ["loadshedding", "load shedding", "eskom", "electricity", "power cut", "solar", "grid"],
    "water":       ["water", "dam", "drought", "sewage", "sanitation", "reservoir", "flood", "day zero"],
    "crime":       ["murder", "arrest", "robbery", "hijack", "shooting", "crime", "saps", "police", "gang"],
    "corruption":  ["corruption", "fraud", "tender", "hawks", "npa", "looting", "bribery", "state capture", "zondo"],
    "economy":     ["rand", "inflation", "unemployment", "gdp", "budget", "jse", "recession", "interest rate", "petrol"],
    "politics":    ["anc", "da", "eff", "parliament", "minister", "presidency", "cabinet", "election", "vote"],
    "health":      ["health", "hospital", "clinic", "disease", "hiv", "tb", "vaccination", "cholera", "outbreak"],
    "education":   ["school", "university", "education", "learner", "teacher", "matric", "nsfas", "student"],
    "protest":     ["protest", "strike", "march", "demonstration", "community", "service delivery", "shut down"],
    "environment": ["climate", "pollution", "environment", "conservation", "wildfire", "rhino"],
}

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "up", "as", "is", "it", "its", "be", "was",
    "are", "were", "has", "have", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "this", "that", "these",
    "those", "not", "no", "so", "if", "than", "then", "there", "what", "who",
    "which", "when", "where", "how", "why", "all", "any", "more", "also",
    "after", "before", "about", "over", "new", "says", "said", "after",
    "amid", "hits", "gets", "two", "three", "four", "five", "six", "into",
    "south", "africa", "african", "south africa", "sabc", "sona",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _classify_category(text: str) -> str:
    text_lower = text.lower()
    best, best_n = "general", 0
    for cat, kws in CATEGORY_KEYWORDS.items():
        n = sum(1 for kw in kws if kw in text_lower)
        if n > best_n:
            best_n, best = n, cat
    return best


def _find_province(text: str) -> Optional[str]:
    text_lower = text.lower()
    for alias, province in PROVINCE_ALIASES.items():
        if alias in text_lower:
            return province
    return None


def _extract_keywords(title: str) -> list[str]:
    """Return meaningful unigrams + bigrams from a headline."""
    clean = re.sub(r"[^a-z0-9\s]", " ", title.lower())
    words = [w for w in clean.split() if len(w) > 3 and w not in STOP_WORDS]
    bigrams = [f"{words[i]} {words[i + 1]}" for i in range(len(words) - 1)]
    return words + bigrams


def _compute_sentiment(text: str) -> float:
    try:
        from services.news_service import POSITIVE_WORDS, NEGATIVE_WORDS
    except Exception:
        return 0.0
    text_lower = text.lower()
    pos = sum(1 for w in POSITIVE_WORDS if w in text_lower)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text_lower)
    return round((pos - neg) / max(pos + neg, 1), 3)


# ── Topic clustering ─────────────────────────────────────────────────────────

def _cluster_topics_simple(
    kw_articles: dict[str, list[dict]],
    prev_topics: dict[str, int],
) -> list[dict]:
    counts = [(kw, len(arts)) for kw, arts in kw_articles.items() if len(arts) > 1]
    counts.sort(key=lambda x: x[1], reverse=True)

    result = []
    for i, (kw, count) in enumerate(counts[:10]):
        prev = prev_topics.get(kw, 0)
        growth = round(((count - prev) / max(prev, 1)) * 100) if prev else 100
        arts = kw_articles.get(kw, [])
        result.append({
            "rank":        i + 1,
            "topic":       kw.title(),
            "mentions":    count,
            "growth_pct":  growth,
            "category":    _classify_category(kw),
            "province":    _find_province(kw) or "National",
            "articles":    [
                {"title": a["title"], "url": a.get("url", ""), "source": a.get("source", "")}
                for a in arts[:3]
            ],
            "is_new": prev == 0,
        })
    return result


async def _cluster_topics_groq(
    articles: list[dict],
    prev_topics: dict[str, int],
) -> list[dict]:
    headlines = "\n".join(
        f"{i + 1}. {a.get('title', '')}" for i, a in enumerate(articles[:30])
    )
    prompt = (
        f"Analyse these {min(len(articles), 30)} South African news headlines and "
        f"identify the top 10 trending topics.\n\nHeadlines:\n{headlines}\n\n"
        "Return a JSON array of exactly 10 objects:\n"
        '[\n  {"topic": "2-3 word name", '
        '"category": "energy|water|crime|corruption|economy|politics|health|education|protest|environment|general", '
        '"province": "Province or National", '
        '"related_headlines": [1,2,3]}\n]\n'
        "Return only valid JSON, no markdown."
    )
    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        resp = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            max_tokens=600,
            temperature=0.3,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        groq_topics = json.loads(raw)

        topic_list = []
        for i, gt in enumerate(groq_topics[:10]):
            idxs = gt.get("related_headlines", [])
            related = [articles[idx - 1] for idx in idxs if 1 <= idx <= len(articles)]
            count = max(len(related), 1)
            prev = prev_topics.get(gt.get("topic", ""), 0)
            growth = round(((count - prev) / max(prev, 1)) * 100) if prev else 100
            topic_list.append({
                "rank":       i + 1,
                "topic":      gt.get("topic", "Unknown"),
                "mentions":   count,
                "growth_pct": growth,
                "category":   gt.get("category", "general"),
                "province":   gt.get("province", "National"),
                "articles":   [
                    {"title": a["title"], "url": a.get("url", ""), "source": a.get("source", "")}
                    for a in related[:3]
                ],
                "is_new": prev == 0,
            })
        return topic_list
    except Exception as e:
        logger.error(f"Groq topic clustering error: {e}")
        # Build kw map for fallback
        kw_map: dict[str, list] = {}
        for a in articles:
            for kw in _extract_keywords(a.get("title", "")):
                kw_map.setdefault(kw, []).append(a)
        return _cluster_topics_simple(kw_map, prev_topics)


# ── Main entry points ────────────────────────────────────────────────────────

async def compute_trending(force: bool = False) -> dict:
    """
    Compute trending topics + province sentiment.
    Returns cached result if available and force=False.
    """
    cache_key = "trending:topics"
    if not force:
        cached = await redis_client.getjson(cache_key)
        if cached:
            return cached

    from services.news_service import fetch_news
    articles = await fetch_news()
    if not articles:
        return _empty_result()

    # Previous hour's topics for growth calculation
    prev_data = await redis_client.getjson("trending:topics:prev") or {}
    prev_topics: dict[str, int] = {
        t["topic"]: t["mentions"] for t in prev_data.get("topics", [])
    }

    # Build keyword → articles map
    kw_map: dict[str, list] = {}
    province_articles: dict[str, list] = {}

    for article in articles:
        title = article.get("title", "")
        combined = f"{title} {article.get('summary', '')}"

        for kw in _extract_keywords(title):
            kw_map.setdefault(kw, []).append(article)

        province = _find_province(combined)
        if province:
            province_articles.setdefault(province, []).append(article)

    # Cluster topics
    if settings.groq_api_key and len(articles) >= 5:
        topics = await _cluster_topics_groq(articles, prev_topics)
    else:
        topics = _cluster_topics_simple(kw_map, prev_topics)

    # Province top topic
    province_topics: dict[str, dict] = {}
    for prov, arts in province_articles.items():
        kw_counter: Counter = Counter()
        for a in arts:
            for kw in _extract_keywords(a.get("title", "")):
                kw_counter[kw] += 1
        top = kw_counter.most_common(1)
        if top:
            province_topics[prov] = {
                "topic":    top[0][0].title(),
                "mentions": top[0][1],
                "category": _classify_category(top[0][0]),
            }

    # Sentiment
    sentiments = [a.get("sentiment", _compute_sentiment(a.get("title", ""))) for a in articles]
    national_sentiment = round(sum(sentiments) / max(len(sentiments), 1), 3)

    province_sentiment: dict[str, float] = {}
    for prov, arts in province_articles.items():
        s = [a.get("sentiment", _compute_sentiment(a.get("title", ""))) for a in arts]
        province_sentiment[prov] = round(sum(s) / max(len(s), 1), 3)

    rising = [t for t in topics if t.get("growth_pct", 0) > 50][:5]

    result = {
        "topics":              topics[:10],
        "rising":              rising,
        "province_topics":     province_topics,
        "sentiment_national":  national_sentiment,
        "province_sentiment":  province_sentiment,
        "computed_at":         datetime.now(timezone.utc).isoformat(),
    }

    # Archive current as prev before saving
    if topics:
        await redis_client.setjson("trending:topics:prev", result, ex=7200)
    await redis_client.setjson(cache_key, result, ex=3600)
    return result


async def get_province_trending(province: str) -> dict:
    trending = await compute_trending()
    prov_topic = trending.get("province_topics", {}).get(province)
    prov_sentiment = trending.get("province_sentiment", {}).get(province, 0.0)
    province_topics = [
        t for t in trending.get("topics", [])
        if t.get("province") == province or prov_topic
    ]
    return {
        "province":          province,
        "top_topic":         prov_topic,
        "sentiment":         prov_sentiment,
        "related_topics":    province_topics[:5],
        "computed_at":       trending.get("computed_at"),
    }


async def get_sentiment_weekly() -> dict:
    cache_key = "trending:sentiment:weekly"
    cached = await redis_client.getjson(cache_key)
    if cached:
        return cached

    trending = await compute_trending()
    prov_sentiment = trending.get("province_sentiment", {})
    national = trending.get("sentiment_national", 0.0)

    if prov_sentiment:
        best  = max(prov_sentiment.items(), key=lambda x: x[1])
        worst = min(prov_sentiment.items(), key=lambda x: x[1])
    else:
        best  = ("Western Cape", 0.2)
        worst = ("Eastern Cape", -0.3)

    result = {
        "national_sentiment":  national,
        "province_sentiment":  prov_sentiment,
        "most_positive":  {"province": best[0],  "score": best[1]},
        "most_negative":  {"province": worst[0], "score": worst[1]},
        "computed_at": trending.get("computed_at"),
    }
    await redis_client.setjson(cache_key, result, ex=3600)
    return result


def _empty_result() -> dict:
    return {
        "topics":             [],
        "rising":             [],
        "province_topics":    {},
        "sentiment_national": 0.0,
        "province_sentiment": {},
        "computed_at":        datetime.now(timezone.utc).isoformat(),
    }
