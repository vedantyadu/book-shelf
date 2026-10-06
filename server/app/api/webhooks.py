from fastapi import APIRouter, Header, Request

webhooks_router = APIRouter(prefix="/webhooks")


@webhooks_router.post("/razorpay")
def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    x_razorpay_event_id: str = Header(None),
):
    return {"ok": True}
