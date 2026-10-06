from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.verify_token import verify_token
from app.db.base import get_db
from app.db.models.user import User
from app.schemas.users import MeResponse

user_router = APIRouter(prefix="/users", dependencies=[Depends(verify_token)])


@user_router.get("/me", response_model=MeResponse)
async def me(request: Request, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == request.state.user_id))

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return MeResponse(id=str(user.id), email=user.email)
