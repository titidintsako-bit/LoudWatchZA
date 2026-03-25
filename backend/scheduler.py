import logging

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)
SAST = pytz.timezone("Africa/Johannesburg")

scheduler = AsyncIOScheduler(timezone=SAST)


async def _job_fetch_loadshedding():
    try:
        from services.loadshedding_service import fetch_current_stage
        await fetch_current_stage()
        logger.debug("Loadshedding stage refreshed")
    except Exception as e:
        logger.error(f"fetch_loadshedding job error: {e}")


async def _job_fetch_aircraft():
    try:
        from services.aircraft_service import fetch_aircraft
        await fetch_aircraft()
        logger.debug("Aircraft states refreshed")
    except Exception as e:
        logger.error(f"fetch_aircraft job error: {e}")


async def _job_fetch_ships():
    try:
        from services.ship_service import fetch_ships
        await fetch_ships()
        logger.debug("Ship states refreshed")
    except Exception as e:
        logger.error(f"fetch_ships job error: {e}")


async def _job_fetch_news():
    try:
        from services import redis_client
        import redis_client as rc
        await rc.delete("news:articles")
        from services.news_service import fetch_news
        await fetch_news()
        logger.debug("News articles refreshed")
    except Exception as e:
        logger.error(f"fetch_news job error: {e}")


async def _job_fetch_protests():
    try:
        import redis_client as rc
        await rc.delete("protests:incidents")
        from services.protest_service import fetch_protests
        await fetch_protests()
        logger.debug("Protest incidents refreshed")
    except Exception as e:
        logger.error(f"fetch_protests job error: {e}")


async def _job_fetch_dams():
    try:
        import redis_client as rc
        await rc.delete("dams:levels")
        from services.dam_service import fetch_dam_levels
        await fetch_dam_levels()
        logger.debug("Dam levels refreshed")
    except Exception as e:
        logger.error(f"fetch_dams job error: {e}")


async def _job_compute_pain_index():
    try:
        from services.pain_index_service import compute_pain_index
        await compute_pain_index()
        logger.debug("Pain index recomputed")
    except Exception as e:
        logger.error(f"compute_pain_index job error: {e}")


async def _job_generate_ai_brief():
    try:
        import redis_client as rc
        await rc.delete("ai:brief")
        from services.ai_brief_service import generate_brief
        await generate_brief()
        logger.debug("AI brief regenerated")
    except Exception as e:
        logger.error(f"generate_ai_brief job error: {e}")


async def _job_compute_trending():
    try:
        from services.trending_service import compute_trending
        await compute_trending(force=True)
        logger.debug("Trending topics recomputed")
    except Exception as e:
        logger.error(f"compute_trending job error: {e}")


def start_scheduler():
    scheduler.add_job(
        _job_fetch_loadshedding,
        trigger=IntervalTrigger(seconds=60),
        id="fetch_loadshedding",
        replace_existing=True,
        misfire_grace_time=30,
    )
    scheduler.add_job(
        _job_fetch_aircraft,
        trigger=IntervalTrigger(seconds=15),
        id="fetch_aircraft",
        replace_existing=True,
        misfire_grace_time=10,
    )
    scheduler.add_job(
        _job_fetch_ships,
        trigger=IntervalTrigger(seconds=30),
        id="fetch_ships",
        replace_existing=True,
        misfire_grace_time=15,
    )
    scheduler.add_job(
        _job_fetch_news,
        trigger=IntervalTrigger(minutes=5),
        id="fetch_news",
        replace_existing=True,
        misfire_grace_time=60,
    )
    scheduler.add_job(
        _job_fetch_protests,
        trigger=IntervalTrigger(hours=1),
        id="fetch_protests",
        replace_existing=True,
        misfire_grace_time=120,
    )
    scheduler.add_job(
        _job_fetch_dams,
        trigger=IntervalTrigger(hours=6),
        id="fetch_dams",
        replace_existing=True,
        misfire_grace_time=300,
    )
    scheduler.add_job(
        _job_compute_pain_index,
        trigger=IntervalTrigger(hours=1),
        id="compute_pain_index",
        replace_existing=True,
        misfire_grace_time=120,
    )
    # Generate AI brief at 06:00 and 18:00 SAST
    scheduler.add_job(
        _job_generate_ai_brief,
        trigger=CronTrigger(hour="6,18", minute=0, timezone=SAST),
        id="generate_ai_brief",
        replace_existing=True,
        misfire_grace_time=300,
    )
    scheduler.add_job(
        _job_compute_trending,
        trigger=IntervalTrigger(hours=1),
        id="compute_trending",
        replace_existing=True,
        misfire_grace_time=120,
    )

    scheduler.start()
    logger.info("APScheduler started with all jobs registered")


def stop_scheduler():
    try:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    except Exception as e:
        logger.warning(f"Scheduler shutdown error: {e}")
