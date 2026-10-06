from contextlib import asynccontextmanager

from fastapi import FastAPI

import app.db.models
from app.api.router import router
from app.db.base import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Welcome to the Bookshelf API!"}


app.include_router(router, prefix="")
