from datetime import datetime, timedelta, timezone
import os

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash


load_dotenv()
# --------------------------------------------------
# PASSWORD HASHING
# --------------------------------------------------

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2.
    """
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against its Argon2 hash.
    """
    return password_hash.verify(
        plain_password,
        hashed_password,
    )


# --------------------------------------------------
# JWT CONFIGURATION
# --------------------------------------------------

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not configured in the environment."
    )

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256",
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "30",
    )
)

REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv(
        "REFRESH_TOKEN_EXPIRE_DAYS",
        "7",
    )
)


# --------------------------------------------------
# TOKEN CREATION
# --------------------------------------------------

def create_access_token(
    user_id: str,
) -> str:
    """
    Create a short-lived JWT access token.
    """

    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "type": "access",
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(
    user_id: str,
) -> str:
    """
    Create a longer-lived JWT refresh token.
    """

    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        days=REFRESH_TOKEN_EXPIRE_DAYS
    )

    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


# --------------------------------------------------
# TOKEN VERIFICATION
# --------------------------------------------------

def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.

    Raises jwt.InvalidTokenError if the token
    is invalid or expired.
    """

    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
    )