# Score recomputation background tasks
import logging
import asyncio

from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Helper to run async code in Celery's sync context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="recompute_match_scores")
def recompute_match_scores(user_id: str) -> dict:
    """
    Recompute match scores for a user against all their target companies.
    Called after any platform sync completes.
    """
    try:
        return _run_async(_recompute(user_id))
    except Exception as e:
        logger.error(f"Score recomputation failed for {user_id}: {e}")
        return {"success": False, "error": str(e)}


async def _recompute(user_id: str) -> dict:
    """Stub — full implementation in Phase 4 (Scoring Engine)."""
    logger.info(f"Score recomputation requested for user {user_id}")
    return {
        "success": True,
        "message": "Score recomputation stub — full implementation in Phase 4",
        "user_id": user_id,
    }
