from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.verify_token import verify_token
from app.core.subscription_plans import plans
from app.db.base import get_db
from app.db.models.subscription import Subscription
from app.schemas.subscriptions import VerifySubscriptionRequest
from app.utils.datetime import utcnow
from app.utils.subscriptions import subscription_expires_at

subscription_router = APIRouter(
    prefix="/subscriptions", dependencies=[Depends(verify_token)]
)


@subscription_router.get("/me")
async def me_subscriptions(request: Request, db: AsyncSession = Depends(get_db)):
    subscriptions = await db.scalars(
        select(Subscription)
        .where(Subscription.owner_id == request.state.user_id)
        .order_by(Subscription.created_at.desc())
    )

    for subscription in subscriptions:
        plan = plans[subscription.plan_id]
        expires = subscription_expires_at(plan)

        if not expires or expires > utcnow().timestamp():
            return {
                "id": subscription.plan_id,
                "plan": plan,
                "expires_at": expires,
            }

    return None


@subscription_router.post("/create")
async def create_subscription():
    return {"message": "Subscription created successfully"}


@subscription_router.post("/verify")
async def verify_payment(body: VerifySubscriptionRequest):
    pass


@subscription_router.get("/plans")
async def get_plans():
    return plans
