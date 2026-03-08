# Auth endpoints — GitHub OAuth register/login
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.middleware.auth import create_access_token
from app.models.schemas import APIResponse
from app.repositories.users import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class GitHubAuthRequest(BaseModel):
    """Payload sent by NextAuth JWT callback on GitHub sign-in."""
    github_oauth_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None


@router.post("/github", response_model=APIResponse)
async def github_auth(
    payload: GitHubAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register or login a user via GitHub OAuth.
    Called by NextAuth JWT callback on first sign-in.
    Returns a backend JWT + user metadata.
    """
    repo = UserRepository(db)

    try:
        # Check if user already exists by GitHub OAuth ID
        user = await repo.get_by_github_oauth_id(payload.github_oauth_id)

        if user:
            # Existing user — update profile data from GitHub
            if payload.name and payload.name != user.name:
                user.name = payload.name
            if payload.avatar_url and payload.avatar_url != user.avatar_url:
                user.avatar_url = payload.avatar_url
            if payload.github_username and payload.github_username != user.github_username:
                user.github_username = payload.github_username
            await db.flush()
            await db.refresh(user)
            logger.info(f"Existing user logged in: {user.email}")
        else:
            # New user — check if email already exists
            if payload.email:
                existing_by_email = await repo.get_by_email(payload.email)
                if existing_by_email:
                    # Link GitHub to existing account
                    existing_by_email.github_oauth_id = payload.github_oauth_id
                    existing_by_email.github_username = payload.github_username
                    if payload.avatar_url:
                        existing_by_email.avatar_url = payload.avatar_url
                    await db.flush()
                    await db.refresh(existing_by_email)
                    user = existing_by_email
                    logger.info(f"Linked GitHub to existing user: {user.email}")
                else:
                    user = await repo.create(
                        email=payload.email,
                        name=payload.name,
                        avatar_url=payload.avatar_url,
                        github_oauth_id=payload.github_oauth_id,
                        github_username=payload.github_username,
                        is_onboarded=False,
                    )
                    logger.info(f"New user created: {user.email}")
            else:
                # No email — use fallback
                user = await repo.create(
                    email=f"{payload.github_oauth_id}@github.oauth",
                    name=payload.name,
                    avatar_url=payload.avatar_url,
                    github_oauth_id=payload.github_oauth_id,
                    github_username=payload.github_username,
                    is_onboarded=False,
                )
                logger.info(f"New user created with fallback email: {user.email}")

        # Generate JWT
        access_token = create_access_token(str(user.id))

        return APIResponse(
            success=True,
            data={
                "access_token": access_token,
                "user_id": str(user.id),
                "is_onboarded": user.is_onboarded,
                "email": user.email,
                "name": user.name,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GitHub auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
        )
