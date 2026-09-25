from app.core.config import settings
from fastapi import APIRouter
import requests

router = APIRouter(
    prefix="/auth"
)

@router.post("/login/google")
async def login(code: str):
  requests.post("https://oauth2.googleapis.com/token", data={
    "code": code,
    "client_id": settings.GOOGLE_OAUTH2_CLIENT_ID,
    "client_secret": settings.GOOGLE_OAUTH2_CLIENT_SECRET,
    "redirect_uri": settings.GOOGLE_OAUTH2_REDIRECT_URI,
    "grant_type": "authorization_code"  
  })

@router.post("/logout")
async def logout():
  pass

@router.post("/refresh")
async def refresh(refresh_token: str):
  pass
