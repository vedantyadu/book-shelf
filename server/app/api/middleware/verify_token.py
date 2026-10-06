from uuid import UUID

import jwt
from fastapi import HTTPException, Request, status

from app.core.tokens import decode_jwt


async def verify_token(request: Request):
    token = request.headers.get("Authorization")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing access token",
        )

    try:
        parts = token.split(" ")
        token_str = parts[1] if len(parts) == 2 else parts[0]
        payload = decode_jwt(token_str)
        user_id = payload.get("id")
        if not user_id:
            raise ValueError("Missing user id in token")
        request.state.user_id = UUID(str(user_id))
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )
