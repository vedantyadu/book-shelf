from fastapi import APIRouter

from app.api.auth import auth_router
from app.api.subscriptions import subscription_router
from app.api.users import user_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(user_router)
router.include_router(subscription_router)


@router.get("/")
async def health():
    return {"message": "OK"}
