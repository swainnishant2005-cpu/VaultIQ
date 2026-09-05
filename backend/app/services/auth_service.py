from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.user import User


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    """
    Find a user by email address.
    """

    statement = select(User).where(
        User.email == email.lower()
    )

    return db.scalar(statement)


def register_user(
    db: Session,
    email: str,
    password: str,
    full_name: str | None = None,
) -> User:
    """
    Create a new VaultIQ user.

    Raises:
        ValueError: If the email is already registered.
    """

    normalized_email = email.lower().strip()

    existing_user = get_user_by_email(
        db,
        normalized_email,
    )

    if existing_user:
        raise ValueError(
            "An account with this email already exists."
        )

    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        full_name=full_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    """
    Authenticate a user using email and password.
    """

    user = get_user_by_email(
        db,
        email.lower().strip(),
    )

    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    return user


def create_user_tokens(
    user: User,
) -> dict[str, str]:
    """
    Create access and refresh JWTs for a user.
    """

    user_id = str(user.id)

    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
    }