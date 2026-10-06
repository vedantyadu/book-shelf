from typing import Literal

from pydantic import BaseModel

from app.core.subscription_plans import SubscriptionPlan


class Subscription(BaseModel):
    plan: SubscriptionPlan
    expires_at: int


class RazorpayPayment(BaseModel):
    provider: Literal["razorpay"]
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifySubscriptionRequest(BaseModel):
    id: str
    payment: RazorpayPayment


class MeSubscriptionResponse(BaseModel):
    subscription: Subscription | None
