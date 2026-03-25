import json
import logging
import re
from datetime import datetime, timezone

import redis_client
from config import settings

logger = logging.getLogger(__name__)

_FALLBACK_BRIEF = (
    "South Africa's energy sector continues to face significant challenges with Eskom managing "
    "load shedding schedules across the country. The national grid remains under pressure due to "
    "aging infrastructure and maintenance backlogs at key power stations.\n\n"
    "Socioeconomic stress remains elevated across multiple municipalities. Maluti-a-Phofung, "
    "Enoch Mgijima, and Mahikeng continue to record the highest pain index scores driven by "
    "unemployment rates above 50%, persistent water outages, and adverse audit outcomes. "
    "The national unemployment rate stands at 33.5%, with the Eastern Cape and Free State "
    "provinces most severely affected.\n\n"
    "Dam levels across the country average around 72%, with Theewaterskloof in the Western Cape "
    "remaining below seasonal norms. Water infrastructure in several municipalities has been "
    "flagged in the latest DWS Blue/Green Drop assessments, with numerous systems failing to "
    "meet basic compliance standards."
)

_FALLBACK_TOPICS = [
    "loadshedding", "unemployment", "dam levels", "municipal governance",
    "pain index", "water infrastructure",
]


def _extract_topics(text: str) -> list[str]:
    topic_keywords = [
        "loadshedding", "load shedding", "eskom", "electricity",
        "unemployment", "jobs", "economy",
        "dam", "water", "drought",
        "corruption", "audit", "governance",
        "protest", "strike", "service delivery",
        "crime", "murder", "robbery",
        "inflation", "rand", "currency",
        "housing", "land",
        "education", "schools",
        "health", "hospitals",
        "transport", "roads",
        "mining", "agriculture",
    ]
    text_lower = text.lower()
    found: list[str] = []
    for kw in topic_keywords:
        if kw in text_lower and kw not in found:
            found.append(kw)
    # Normalise
    normalised: list[str] = []
    seen: set[str] = set()
    for t in found:
        t_clean = t.replace(" ", "_")
        if t_clean not in seen:
            seen.add(t_clean)
            normalised.append(t_clean)
    return normalised[:10]


async def generate_brief() -> dict:
    cached = await redis_client.getjson("ai:brief")
    if cached:
        return cached

    # Gather context from caches
    loadshedding = await redis_client.getjson("loadshedding:stage") or {}
    pain_index = await redis_client.getjson("pain_index:scores") or []
    dam_data = await redis_client.getjson("dams:levels") or {}
    unemployment = await redis_client.getjson("unemployment:data") or {}

    stage = loadshedding.get("stage", "unknown")
    avg_dam = dam_data.get("avg_level", "unknown")
    national_unemp = unemployment.get("national_rate", 33.5)

    top_3_pain = pain_index[:3] if pain_index else []
    top_pain_str = ", ".join(
        f"{m.get('name', '?')} (score: {m.get('pain_score', 0):.2f})"
        for m in top_3_pain
    )

    context_data = {
        "loadshedding_stage": stage,
        "dam_average_level_percent": avg_dam,
        "national_unemployment_percent": national_unemp,
        "top_pain_municipalities": [
            {
                "name": m.get("name"),
                "score": m.get("pain_score"),
                "unemployment": m.get("unemployment_rate"),
                "audit_score": m.get("audit_score"),
            }
            for m in top_3_pain
        ],
    }
    context_json = json.dumps(context_data, indent=2)

    prompt = (
        "You are an intelligence analyst for South Africa. Write a 3-paragraph daily brief covering: "
        "1) Current loadshedding situation and energy outlook, "
        "2) Key socioeconomic stress points (top municipalities by pain index, unemployment), "
        "3) Infrastructure status (dam levels, water). "
        "Be factual and concise. Use the following current data:\n"
        f"{context_json}"
    )

    if not settings.groq_api_key:
        logger.warning("No GROQ_API_KEY configured, using fallback brief")
        result = {
            "brief": _FALLBACK_BRIEF,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "topics": _FALLBACK_TOPICS,
        }
        await redis_client.setjson("ai:brief", result, ex=21600)
        return result

    try:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            max_tokens=800,
            temperature=0.6,
        )
        brief_text = chat_completion.choices[0].message.content.strip()
        topics = _extract_topics(brief_text)

        result = {
            "brief": brief_text,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "topics": topics,
        }
        await redis_client.setjson("ai:brief", result, ex=21600)
        return result

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        cached_fallback = await redis_client.getjson("ai:brief")
        if cached_fallback:
            return cached_fallback
        result = {
            "brief": _FALLBACK_BRIEF,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "topics": _FALLBACK_TOPICS,
        }
        await redis_client.setjson("ai:brief", result, ex=21600)
        return result
