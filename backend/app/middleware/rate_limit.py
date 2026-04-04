# Redis-based rate limiter middleware — with circuit breaker for Redis failures
import time
import logging
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.redis import redis_client, is_redis_available, mark_redis_down, mark_redis_up

logger = logging.getLogger(__name__)

# Rate limits: requests per minute
RATE_LIMIT_PUBLIC = 100
RATE_LIMIT_AUTHENTICATED = 1000


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiter using Redis sliding window. Fails open if Redis is down."""

    async def dispatch(self, request: Request, call_next):
        # Skip health checks, docs, and CORS preflight
        if request.url.path in ("/health", "/docs", "/openapi.json"):
            return await call_next(request)
        if request.method == "OPTIONS":
            return await call_next(request)

        # If Redis is known to be down, skip rate limiting entirely
        if not is_redis_available():
            return await call_next(request)

        # Determine client identity and limit
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            client_key = f"rate:{auth_header[-16:]}"
            limit = RATE_LIMIT_AUTHENTICATED
        else:
            client_ip = request.client.host if request.client else "unknown"
            client_key = f"rate:{client_ip}"
            limit = RATE_LIMIT_PUBLIC

        try:
            current_minute = int(time.time() // 60)
            key = f"{client_key}:{current_minute}"

            count = await redis_client.incr(key)
            if count == 1:
                await redis_client.expire(key, 60)

            mark_redis_up()

            if count > limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {limit} requests per minute.",
                )
        except HTTPException:
            raise
        except Exception as e:
            # Redis is down — mark it and allow the request through
            mark_redis_down()
            logger.warning(f"Rate limiter Redis error (circuit open for 60s): {e}")

        return await call_next(request)
