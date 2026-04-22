from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

_bearer = HTTPBearer()


def verify_token(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> str:
    if credentials.credentials != get_settings().API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API token",
        )
    return credentials.credentials
