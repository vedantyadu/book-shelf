from app.core.config import settings
import httpx

async def get_google_token(token: str):
  client = httpx.AsyncClient()
  res = await client.post("https://www.googleapis.com/auth/v1/token", data={
    "code": token,
    "client_id": settings.GOOGLE_OAUTH2_CLIENT_ID,
    "client_secret": settings.GOOGLE_OAUTH2_CLIENT_SECRET,
    "redirect_uri": settings.GOOGLE_OAUTH2_REDIRECT_URI,
    "grant_type": "authorization_code"  
  })

  return res.json()["access_token"]

async def get_google_user_data(access_token: str):
  client = httpx.AsyncClient()
  res = await client.get("https://www.googleapis.com/auth/v1/userinfo", headers={
    "Authorization": f"Bearer {access_token}"
  })

  return res.json()["id"]
