# Companies API endpoints — list and detail views for company blueprints
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.companies import CompanyRepository
from app.models.schemas import APIResponse, CompanyBlueprintResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.get("", response_model=APIResponse)
async def list_companies(db: AsyncSession = Depends(get_db)):
    """List all available company blueprints."""
    try:
        repo = CompanyRepository(db)
        companies = await repo.get_all()

        return APIResponse(
            success=True,
            data=[
                CompanyBlueprintResponse.model_validate(c).model_dump()
                for c in companies
            ],
        )
    except Exception as e:
        logger.error(f"Failed to list companies: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch companies")


@router.get("/{slug}", response_model=APIResponse)
async def get_company(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a single company blueprint by slug."""
    try:
        repo = CompanyRepository(db)
        company = await repo.get_by_slug(slug)

        if not company:
            return APIResponse(
                success=False,
                error=f"Company '{slug}' not found",
            )

        return APIResponse(
            success=True,
            data=CompanyBlueprintResponse.model_validate(company).model_dump(),
        )
    except Exception as e:
        logger.error(f"Failed to get company {slug}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch company")


@router.get("/{slug}/scoring-weights", response_model=APIResponse)
async def get_scoring_weights(slug: str, db: AsyncSession = Depends(get_db)):
    """Get only the scoring weights for a company (used by frontend scoring)."""
    try:
        repo = CompanyRepository(db)
        weights = await repo.get_scoring_weights(slug)

        if weights is None:
            return APIResponse(
                success=False,
                error=f"No scoring weights found for '{slug}'",
            )

        return APIResponse(success=True, data=weights)
    except Exception as e:
        logger.error(f"Failed to get scoring weights for {slug}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scoring weights")
