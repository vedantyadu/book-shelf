from typing import Literal

from pydantic import BaseModel

from app.core.subscription_plans import SubscriptionPlan


class SubscriptionMeResponse(BaseModel):
    id: str
    plan: SubscriptionPlan
    renews_on: int | None


class PurchaseSubscriptionResponse(BaseModel):
    subscription_id: str
    key: str


class VerifySubscriptionRequest(BaseModel):
    razorpay_subscription_id: str
    razorpay_payment_id: str
    razorpay_signature: str
