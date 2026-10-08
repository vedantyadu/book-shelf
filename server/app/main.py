from contextlib import asynccontextmanager

from fastapi import FastAPI

import app.db.models
from app.api.router import router
from app.core.config import settings
from app.db.base import Base, engine
from app.utils.test_mode import cancel_subscriptions, schema_is_healthy


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not await schema_is_healthy():
        # Safety: never auto-wipe anything outside test mode
        if not settings.RAZORPAY_KEY_ID.startswith("rzp_test_"):
            raise RuntimeError(
                "DB check failed and not in test mode; refusing to reset"
            )

        await cancel_subscriptions()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Welcome to the Bookshelf API!"}


app.include_router(router, prefix="")
