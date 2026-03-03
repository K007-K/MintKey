# Stub router for analysis endpoints — full implementation in Phase 3
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])


@router.post("/trigger")
async def trigger_analysis():
    """Trigger a full 8-agent analysis. Implemented in Phase 3."""
    return {"success": True, "data": {"message": "Analysis endpoint — not yet implemented (Phase 3)"}}
