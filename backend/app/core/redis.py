# Upstash Redis HTTP client singleton — fast-fail config
import redis.asyncio as aioredis
import time
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Shared Redis health tracking across ALL scrapers ──
_redis_healthy = True
_redis_last_check = 0.0
_REDIS_RETRY_INTERVAL = 60  # seconds between retry attempts


def is_redis_available() -> bool:
    """Check if Redis should be attempted (shared health tracking)."""
    global _redis_healthy, _redis_last_check
    if _redis_healthy:
        return True
    if time.time() - _redis_last_check > _REDIS_RETRY_INTERVAL:
        return True
    return False


def mark_redis_down() -> None:
    """Mark Redis as unhealthy (shared across all scrapers)."""
    global _redis_healthy, _redis_last_check
    _redis_healthy = False
    _redis_last_check = time.time()
    logger.warning("Redis marked DOWN — skipping for 60s")


def mark_redis_up() -> None:
    """Mark Redis as healthy."""
    global _redis_healthy
    _redis_healthy = True


def get_redis_client() -> aioredis.Redis:
    """Create async Redis client with aggressive timeouts."""
    return aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=1,    # 1s connect (was 5s)
        socket_timeout=1,            # 1s per operation
    )


redis_client = get_redis_client()
