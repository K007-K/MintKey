# Stub router for roadmap endpoints — full implementation in Phase 4
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/roadmap", tags=["roadmap"])


@router.get("/{company_slug}")
async def get_roadmap(company_slug: str):
    """Get roadmap for a company. Implemented in Phase 4."""
    return {"success": True, "data": {"message": f"Roadmap for {company_slug} — not yet implemented (Phase 4)"}}
