# Analysis endpoints — triggers 8-agent analysis, WebSocket progress
import logging
import json
import uuid
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import asyncio
from pydantic import BaseModel
from typing import Optional

from app.core.redis import redis_client
from app.middleware.auth import get_current_user
from app.models.db import User
from app.models.schemas import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


class AnalysisRequest(BaseModel):
    """Request to trigger a full analysis."""
    github_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    resume_text: Optional[str] = None
    target_companies: list[str] = []
    months_available: int = 6
    hours_per_day: float = 4.0


@router.post("/trigger", response_model=APIResponse)
async def trigger_analysis(
    payload: AnalysisRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Trigger a full 8-agent analysis.
    Returns a task_id to track progress via WebSocket.
    """
    task_id = str(uuid.uuid4())

    # Store task status in Redis
    try:
        await redis_client.set(
            f"analysis:{task_id}",
            json.dumps({
                "status": "queued",
                "user_id": str(current_user.id),
                "progress": [],
            }),
            ex=3600,
        )
    except Exception as e:
        logger.warning(f"Redis set failed: {e}")

    # Run analysis in background
    import asyncio

    async def _run():
        from agents.orchestrator import MintKeyOrchestrator
        from agents.core.models import UserAnalysisRequest

        orchestrator = MintKeyOrchestrator()
        request = UserAnalysisRequest(
            user_id=str(current_user.id),
            github_username=payload.github_username,
            leetcode_username=payload.leetcode_username,
            resume_text=payload.resume_text,
            target_companies=payload.target_companies,
            months_available=payload.months_available,
            hours_per_day=payload.hours_per_day,
        )

        async def progress_cb(event: str, message: str):
            try:
                await redis_client.rpush(f"analysis:progress:{task_id}", json.dumps({
                    "event": event,
                    "message": message,
                }))
            except Exception:
                pass

        try:
            result = await orchestrator.run_full_analysis(request, progress_callback=progress_cb)

            # Store result
            try:
                await redis_client.set(
                    f"analysis:{task_id}",
                    json.dumps({
                        "status": "complete",
                        "result": result.model_dump(),
                    }),
                    ex=3600,
                )
            except Exception:
                pass

            # Save to DB
            try:
                from app.core.database import async_session_factory
                from app.models.db import AnalysisResult
                from datetime import datetime

                result_dict = result.model_dump()

                async with async_session_factory() as session:
                    analysis = AnalysisResult(
                        user_id=current_user.id,
                        status="completed",
                        merged_analysis=result_dict,
                        agent_outputs={
                            "github_analysis": result_dict.get("github_analysis"),
                            "dsa_analysis": result_dict.get("dsa_analysis"),
                            "resume_data": result_dict.get("resume_data"),
                            "trend_data": result_dict.get("trend_data"),
                            "company_blueprints": result_dict.get("company_blueprints"),
                            "gap_analysis": result_dict.get("gap_analysis"),
                            "roadmaps": result_dict.get("roadmaps"),
                        },
                        coaching_message=(
                            result_dict.get("coaching", {}).get("coaching_message", "")
                            if result_dict.get("coaching") else None
                        ),
                        completed_at=datetime.utcnow(),
                    )
                    session.add(analysis)
                    await session.commit()
                    logger.info(f"Analysis saved to DB for user {current_user.id}")
            except Exception as e:
                logger.error(f"Failed to save analysis: {e}")
                import traceback
                traceback.print_exc()

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            try:
                await redis_client.set(
                    f"analysis:{task_id}",
                    json.dumps({"status": "failed", "error": str(e)}),
                    ex=3600,
                )
            except Exception:
                pass

    asyncio.create_task(_run())

    return APIResponse(
        success=True,
        data={"task_id": task_id, "status": "queued"},
    )


@router.get("/status/{task_id}", response_model=APIResponse)
async def get_analysis_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get the status of a running analysis."""
    try:
        data = await redis_client.get(f"analysis:{task_id}")
        if data:
            return APIResponse(success=True, data=json.loads(data))
    except Exception:
        pass

    return APIResponse(success=False, data=None, error="Analysis not found")


@router.websocket("/ws/{task_id}")
async def analysis_websocket(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time analysis progress.
    Streams progress events from Redis.
    """
    await websocket.accept()
    last_index = 0

    try:
        while True:
            # Check for new progress events
            try:
                events = await redis_client.lrange(f"analysis:progress:{task_id}", last_index, -1)
                for event in events:
                    await websocket.send_text(event)
                    last_index += 1
            except Exception:
                pass

            # Check if analysis is complete
            try:
                status_data = await redis_client.get(f"analysis:{task_id}")
                if status_data:
                    parsed = json.loads(status_data)
                    if parsed.get("status") in ("complete", "failed"):
                        await websocket.send_text(json.dumps({
                            "event": "done",
                            "status": parsed["status"],
                        }))
                        break
            except Exception:
                pass

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for task {task_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
