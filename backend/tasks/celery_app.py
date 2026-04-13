# Celery application configuration with Upstash Redis broker
import logging
import ssl
from celery import Celery
from app.core.config import settings

logger = logging.getLogger(__name__)

# Upstash uses rediss:// (TLS) — Celery requires explicit ssl_cert_reqs
_broker_url = settings.REDIS_URL
_backend_url = settings.REDIS_URL

if _broker_url.startswith("rediss://"):
    _separator = "&" if "?" in _broker_url else "?"
    _broker_url = f"{_broker_url}{_separator}ssl_cert_reqs=CERT_NONE"
    _backend_url = f"{_backend_url}{_separator}ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    "mintkey",
    broker=_broker_url,
    backend=_backend_url,
    include=[
        "tasks.sync_tasks",
        "tasks.scoring_tasks",
    ],
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 min max per task
    task_soft_time_limit=240,  # 4 min soft limit
    worker_prefetch_multiplier=1,
    worker_concurrency=2,  # Conservative for free tier
    result_expires=3600,  # Results expire after 1 hour
    broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE} if settings.REDIS_URL.startswith("rediss://") else None,
    redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE} if settings.REDIS_URL.startswith("rediss://") else None,
)
