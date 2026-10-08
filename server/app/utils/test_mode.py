import asyncio

from sqlalchemy import select

from app.db.base import AsyncSessionLocal, Base, engine
from app.db.models.razorpay_subscription import RazorpaySubscription
from app.services.razorpay import razorpay_service

TERMINAL = {"cancelled", "completed", "expired"}


async def schema_is_healthy() -> bool:
    """Create missing tables, then confirm every table matches the models."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Selecting every mapped column fails if a column is missing/renamed
            for table in Base.metadata.sorted_tables:
                await conn.execute(select(*table.columns).limit(1))
        return True
    except Exception:
        print("Database schema check failed")
        return False


def _cancel_sync(sub_ids: list[str] | None):
    """Cancel given subscriptions, or all non-terminal ones in Razorpay if ids unknown."""
    if sub_ids is None:
        items = razorpay_service.client.subscription.all({"count": 100})["items"]
        sub_ids = [s["id"] for s in items if s["status"] not in TERMINAL]
    for sid in sub_ids:
        try:
            razorpay_service.cancel_subscription(sid, True)
            print("Cancelled %s", sid)
        except Exception as e:
            print("Skip %s: %s", sid, e)  # already ended, etc.


async def cancel_subscriptions():
    sub_ids = None
    try:
        async with AsyncSessionLocal() as session:
            rows = await session.execute(
                select(RazorpaySubscription.razorpay_subscription_id)
            )
            sub_ids = [r[0] for r in rows]
    except Exception:
        print("Couldn't read subscriptions from DB, falling back to Razorpay list")
    await asyncio.to_thread(_cancel_sync, sub_ids)
