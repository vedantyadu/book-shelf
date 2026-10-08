import hashlib
import hmac
import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import get_db
from app.db.models import RazorpaySubscription, Subscription
from app.utils.datetime import timestamp_to_datetime

webhooks_router = APIRouter(prefix="/webhooks")


@webhooks_router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    x_razorpay_event_id: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    raw = await request.body()

    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(), raw, hashlib.sha256
    ).hexdigest()
    if not x_razorpay_signature or not hmac.compare_digest(
        expected, x_razorpay_signature
    ):
        raise HTTPException(status_code=400)

    body = json.loads(raw)

    if body["event"].startswith("subscription"):
        subscription_id = body["payload"]["subscription"]["entity"]["id"]
        renews_on = body["payload"]["subscription"]["entity"]["charge_at"]

        result = await db.execute(
            select(RazorpaySubscription, Subscription)
            .join(Subscription, RazorpaySubscription.subscription_id == Subscription.id)
            .where(RazorpaySubscription.razorpay_subscription_id == subscription_id)
        )

        row = result.first()

        if row is None:
            return None

        razorpay_subscription, subscription = row
        razorpay_subscription.razorpay_subscription_status = body["event"]

        if body["event"] == "subscription.charged":
            subscription.active = True
            subscription.renews_on = timestamp_to_datetime(renews_on)
        elif body["event"] == "subscription.cancelled":
            subscription.active = False
            subscription.renews_on = None

        await db.commit()

    return {"ok": True}
