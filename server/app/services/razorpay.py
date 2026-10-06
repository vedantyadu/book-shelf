import razorpay

from app.core.config import settings

razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


def create_razorpay_subscription(razorpay_plan_id: str, total_count: int):
    res = razorpay_client.subscription.create(
        {
            "plan_id": razorpay_plan_id,
            "customer_notify": True,
            "total_count": total_count,
        }
    )

    return res["id"]
