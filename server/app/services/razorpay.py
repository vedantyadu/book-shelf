import asyncio
import hashlib
import hmac

import razorpay

from app.core.config import settings


class RazorpayService:
    def __init__(self, key_id: str, key_secret: str):
        self.client = razorpay.Client(auth=(key_id, key_secret))

    def create_subscription(self, razorpay_plan_id: str, total_count: int):
        return asyncio.to_thread(
            self.client.subscription.create,
            {
                "plan_id": razorpay_plan_id,
                "total_count": total_count,
                # "customer_notify": True,
            },
        )

    def cancel_subscription(self, razorpay_subscription_id: str, immediate: bool):
        return asyncio.to_thread(
            self.client.subscription.cancel,
            razorpay_subscription_id,
            {"cancel_at_cycle_end": 0 if immediate else 1},
        )

    def fetch_subscription(self, razorpay_subscription_id: str):
        return asyncio.to_thread(
            self.client.subscription.fetch, razorpay_subscription_id
        )

    def verify_subscription(self, order: str, payment: str, signature: str):
        msg = f"{payment}|{order}"
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


razorpay_service = RazorpayService(
    settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET
)
