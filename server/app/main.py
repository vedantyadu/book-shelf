from app.api.router import router
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to the Bookshelf API!"}

app.include_router(router, prefix="/router")
