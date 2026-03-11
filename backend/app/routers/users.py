# User profile endpoints
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.db import User
from app.models.schemas import APIResponse, UserResponse, UserUpdate
from app.repositories.users import UserRepository

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=APIResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get the current user's profile."""
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user).model_dump(),
    )


@router.patch("/me", response_model=APIResponse)
async def update_user_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile."""
    repo = UserRepository(db)
    updated = await repo.update(current_user.id, **updates.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(updated).model_dump(),
    )


@router.delete("/me", response_model=APIResponse)
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account and all associated data."""
    repo = UserRepository(db)
    deleted = await repo.delete(current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse(success=True, data=None)
