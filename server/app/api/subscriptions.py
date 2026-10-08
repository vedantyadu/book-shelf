from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.verify_token import verify_token
from app.core.config import settings
from app.core.subscription_plans import plans
from app.db.base import get_db
from app.db.models.razorpay_subscription import RazorpaySubscription
from app.db.models.subscription import Subscription
from app.schemas.subscriptions import (
    PurchaseSubscriptionResponse,
    SubscriptionMeResponse,
    VerifySubscriptionRequest,
)
from app.services.razorpay import razorpay_service
from app.utils.datetime import datetime_to_timestamp, timestamp_to_datetime

subscription_router = APIRouter(
    prefix="/subscriptions", dependencies=[Depends(verify_token)]
)


@subscription_router.get("/me")
async def me_subscriptions(request: Request, db: AsyncSession = Depends(get_db)):
    subscriptions = await db.scalars(
        select(Subscription)
        .where(Subscription.owner_id == request.state.user_id)
        .where(Subscription.verified)
        .where(Subscription.active)
        .order_by(Subscription.updated_at.desc())
    )

    for subscription in subscriptions:
        plan = plans[subscription.plan_id]

        if subscription.active:
            return SubscriptionMeResponse(
                id=subscription.plan_id,
                plan=plan,
                renews_on=datetime_to_timestamp(subscription.renews_on),
            )

    for plan_id, plan in plans.items():
        if plan.default:
            return SubscriptionMeResponse(
                id=plan_id,
                plan=plan,
                renews_on=None,
            )

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

        rows = await db.execute(
            select(Subscription, RazorpaySubscription)
            .join(
                RazorpaySubscription,
                RazorpaySubscription.subscription_id == Subscription.id,
            )
            .where(Subscription.owner_id == request.state.user_id)
            .where(Subscription.active)
            .order_by(Subscription.updated_at.desc())
        )

        for subscription, razorpay_subscription in rows.all():
            await razorpay_service.cancel_subscription(
                razorpay_subscription.razorpay_subscription_id, False
            )
            subscription.active = False
            subscription.renews_on = None

        await db.flush()

        plan = plans[plan_id]

        subscription = Subscription(
            plan_id=plan_id,
            owner_id=request.state.user_id,
            active=False,
            renews_on=None,
            verified=False,
        )

        db.add(subscription)
        await db.flush()

        razorpay_plan_id = plan.metadata.razorpay_plan_id

        if plan.billing_cycle.cycle == "yearly":
            total_count = 30
        else:
            total_count = 12 * 30

        razorpay_res = await razorpay_service.create_subscription(
            razorpay_plan_id=razorpay_plan_id, total_count=total_count
        )
        razorpay_subscription_id = razorpay_res["id"]
        razorpay_subscription_status = razorpay_res["status"]

        razorpay_subscription = RazorpaySubscription(
            subscription_id=subscription.id,
            razorpay_subscription_id=razorpay_subscription_id,
            razorpay_subscription_status=razorpay_subscription_status,
        )
        db.add(razorpay_subscription)

        await db.commit()

        return PurchaseSubscriptionResponse(
            subscription_id=razorpay_subscription_id,
            key=settings.RAZORPAY_KEY_ID,
        )

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500)


@subscription_router.post("/verify")
async def verify_subscription(
    body: VerifySubscriptionRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(RazorpaySubscription, Subscription)
            .join(
                Subscription,
                RazorpaySubscription.subscription_id == Subscription.id,
            )
            .where(
                RazorpaySubscription.razorpay_subscription_id
                == body.razorpay_subscription_id
            )
        )

        row = result.first()

        if not row:
            raise HTTPException(
                status_code=404, detail="Razorpay subscription not found"
            )

        razorpay_subscription, subscription = row

        payment_verified = razorpay_service.verify_subscription(
            body.razorpay_subscription_id,
            body.razorpay_payment_id,
            body.razorpay_signature,
        )

        if not payment_verified:
            raise HTTPException(status_code=400, detail="Invalid signature")

        razorpay_subscription_details = await razorpay_service.fetch_subscription(
            razorpay_subscription.razorpay_subscription_id
        )

        renews_on = timestamp_to_datetime(razorpay_subscription_details["charge_at"])

        subscription.active = True
        subscription.verified = True
        subscription.renews_on = renews_on

        await db.commit()

        return {"ok": True}

    except Exception as e:
        raise HTTPException(status_code=500)


@subscription_router.post("/cancel")
async def cancel_subscription(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Subscription, RazorpaySubscription)
            .join(
                RazorpaySubscription,
                RazorpaySubscription.subscription_id == Subscription.id,
            )
            .where(Subscription.owner_id == request.state.user_id)
            .where(Subscription.active)
            .order_by(Subscription.updated_at.desc())
        )

        row = result.first()

        if not row:
            raise HTTPException(status_code=404, detail="No active subscription found")

        subscription, razorpay_subscription = row

        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        if not razorpay_subscription:
            raise HTTPException(
                status_code=404, detail="Razorpay subscription not found"
            )

        res = await razorpay_service.cancel_subscription(
            razorpay_subscription.razorpay_subscription_id, False
        )

        subscription.active = False
        subscription.renews_on = None

        await db.commit()

        return res

    except Exception as err:
        print(err)
        raise HTTPException(status_code=500)


@subscription_router.get("/plans")
async def get_plans():
    return plans


@subscription_router.get("/plans/{plan_id}")
async def get_plan_details(plan_id: str):
    if plan_id not in plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plans[plan_id]
