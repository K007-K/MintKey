# Backend auth router — GitHub OAuth callback from NextAuth
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import create_access_token
from app.models.schemas import APIResponse
from app.repositories.users import UserRepository
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class GitHubAuthRequest(BaseModel):
    """Payload sent by NextAuth JWT callback on first GitHub sign-in."""
    github_oauth_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None


@router.post("/github", response_model=APIResponse)
async def github_auth_callback(
    payload: GitHubAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by NextAuth on first sign-in:
    - If user exists (by github_oauth_id) → return JWT
    - If user doesn't exist → create user → return JWT
    """
    repo = UserRepository(db)

    # Check if user already exists
    user = await repo.get_by_github_oauth_id(payload.github_oauth_id)

    if not user:
        # Create new user
        user = await repo.create(
            email=payload.email or f"{payload.github_oauth_id}@github.oauth",
            name=payload.name,
            avatar_url=payload.avatar_url,
            github_username=payload.github_username,
            github_oauth_id=payload.github_oauth_id,
        )

    # Generate our backend JWT
    access_token = create_access_token(str(user.id))

    return APIResponse(
        success=True,
        data={
            "access_token": access_token,
            "user_id": str(user.id),
            "is_onboarded": user.is_onboarded,
        },
    )
