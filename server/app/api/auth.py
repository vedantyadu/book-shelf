from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.verify_token import verify_token
from app.core.tokens import generate_jwt, generate_refresh_token
from app.db.base import get_db
from app.db.models.refresh_token import RefreshToken
from app.db.models.user import User
from app.schemas.auth import (
    GoogleLoginRequest,
    GoogleLoginResponse,
    LogoutRequest,
    LogoutResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services.google_auth import google_auth_service
from app.utils.datetime import utcnow
from app.utils.hash import hash_string

auth_router = APIRouter(prefix="/auth")


@auth_router.post("/google", response_model=GoogleLoginResponse)
async def login(body: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):

    token = await google_auth_service.get_google_token(body.code)
    data = await google_auth_service.get_google_user_data(token)

    google_id = data["sub"]
    user_id = await db.scalar(select(User.id).where(User.google_id == google_id))

    if user_id is None:
        user = User(google_id=google_id, email=data["email"])
        db.add(user)
        await db.flush()
        user_id = user.id

    access_token = generate_jwt(
        {"id": str(user_id), "exp": utcnow() + timedelta(seconds=180)}
    )

    refresh_token = generate_refresh_token()

    await db.flush()

    db.add(RefreshToken(owner_id=user_id, token=hash_string(refresh_token)))

    await db.commit()

    return GoogleLoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@auth_router.post(
    "/logout", response_model=LogoutResponse, dependencies=[Depends(verify_token)]
)
async def logout(
    body: LogoutRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.owner_id == request.state.user_id)
        .where(RefreshToken.token == hash_string(body.refresh_token))
        .values(revoked=True)
    )
    await db.commit()

    return LogoutResponse(message="Logged out")


@auth_router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(body: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    token = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.token == hash_string(body.refresh_token),
            RefreshToken.expires_at > utcnow(),
            RefreshToken.revoked == False,
        )
    )

    if not token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = generate_jwt(
        {"id": str(token.owner_id), "exp": utcnow() + timedelta(seconds=15)}
    )
    new_refresh_token = generate_refresh_token()

    new_refresh_token_entry = RefreshToken(
        owner_id=token.owner_id, token=hash_string(new_refresh_token)
    )

    await db.execute(
        update(RefreshToken).where(RefreshToken.id == token.id).values(revoked=True)
    )

    db.add(new_refresh_token_entry)

    await db.commit()

    return RefreshTokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )
