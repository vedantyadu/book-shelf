import httpx

from app.core.config import settings


async def get_google_token(token: str):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": token,
                "client_id": settings.GOOGLE_OAUTH2_CLIENT_ID,
                "client_secret": settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_OAUTH2_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    return res.json()["access_token"]


async def get_google_user_data(access_token: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    return res.json()
