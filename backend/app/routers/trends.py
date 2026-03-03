# Stub router for trend endpoints — full implementation in Phase 5
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/trends", tags=["trends"])


@router.get("/")
async def get_trends():
    """Get skill market trends. Implemented in Phase 5."""
    return {"success": True, "data": {"message": "Trends endpoint — not yet implemented (Phase 5)"}}
