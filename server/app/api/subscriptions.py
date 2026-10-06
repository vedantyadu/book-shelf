from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.verify_token import verify_token
from app.core.config import settings
from app.core.subscription_plans import plans
from app.db.base import get_db
from app.db.models.subscription import Subscription
from app.services.razorpay import create_razorpay_subscription
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


@subscription_router.post("/plans/{plan_id}/purchase")
async def purchase_subscription(
    plan_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        if plan_id not in plans:
            raise HTTPException(status_code=404, detail="Plan not found")

        plan = plans[plan_id]
        razorpay_plan_id = plan.metadata.razorpay_plan_id

        if plan.billing_cycle.cycle == "yearly":
            total_count = 30
        else:
            total_count = 12 * 30

        subscription_id = create_razorpay_subscription(
            razorpay_plan_id=razorpay_plan_id, total_count=total_count
        )

        # subscription = Subscription(
        #     owner_id=request.state.user_id,
        #     plan_id=plan_id,
        #     subscription_id=subscription_id,
        # )

        # db.add(subscription)
        # await db.commit()

        return {"subscription_id": subscription_id, "key": settings.RAZORPAY_KEY_ID}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@subscription_router.get("/plans")
async def get_plans():
    return plans


@subscription_router.get("/plans/{plan_id}")
async def get_plan_details(plan_id: str):
    if plan_id not in plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plans[plan_id]
