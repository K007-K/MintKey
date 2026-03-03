# Upstash Redis HTTP client singleton
import redis.asyncio as aioredis
from app.core.config import settings


def get_redis_client() -> aioredis.Redis:
    """Create and return an async Redis client."""
    return aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=5,
    )


redis_client = get_redis_client()
