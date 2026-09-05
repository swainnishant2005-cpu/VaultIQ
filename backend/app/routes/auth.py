from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse

from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session

import os
import secrets

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

from app.models.user import User

from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

from app.services.auth_service import (
    authenticate_user,
    register_user,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# ==================================================
# GOOGLE OAUTH CONFIGURATION
# ==================================================

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url=(
        "https://accounts.google.com/.well-known/openid-configuration"
    ),
    client_kwargs={
        "scope": "openid email profile",
    },
)


# ==================================================
# REGISTER
# ==================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Register a new VaultIQ user.
    """

    try:
        user = register_user(
            db=db,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
    )


# ==================================================
# LOGIN
# ==================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate a VaultIQ user and return JWT tokens.
    """

    user = authenticate_user(
        db=db,
        email=request.email,
        password=request.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        token_type="bearer",
    )


# ==================================================
# GOOGLE LOGIN
# ==================================================

@router.get("/google")
async def google_login(request: Request):
    """
    Redirect the user to Google's login page.
    """

    redirect_uri = request.url_for(
        "google_callback"
    )

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
    )


# ==================================================
# GOOGLE CALLBACK
# ==================================================

@router.get(
    "/google/callback",
    name="google_callback",
)
async def google_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Handle Google's OAuth callback.
    """

    try:
        token = await oauth.google.authorize_access_token(
            request
        )

        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to retrieve Google user information.",
            )

        google_email = user_info.get("email")
        google_name = user_info.get("name")
        google_picture = user_info.get("picture")

        if not google_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account does not provide an email address.",
            )

        # ------------------------------------------
        # Find existing VaultIQ user
        # ------------------------------------------

        user = (
            db.query(User)
            .filter(
                User.email == google_email
            )
            .first()
        )

        # ------------------------------------------
        # Create new VaultIQ user
        # ------------------------------------------

        if not user:

            random_password = secrets.token_urlsafe(32)

            user = User(
                email=google_email,
                password_hash=hash_password(
                    random_password
                ),
                full_name=(
                    google_name
                    or google_email.split("@")[0]
                ),
                avatar_url=google_picture,
                is_active=True,
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        # ------------------------------------------
        # Check user status
        # ------------------------------------------

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is inactive.",
            )

        # ------------------------------------------
        # Generate VaultIQ JWT tokens
        # ------------------------------------------

        access_token = create_access_token(
            str(user.id)
        )

        refresh_token = create_refresh_token(
            str(user.id)
        )

        # ------------------------------------------
        # Redirect to React
        # ------------------------------------------

        frontend_url = "http://localhost:5173"

        redirect_url = (
            f"{frontend_url}/oauth/callback"
            f"?access_token={access_token}"
            f"&refresh_token={refresh_token}"
        )

        return RedirectResponse(
            url=redirect_url
        )

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "Google OAuth Error:",
            str(exc)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed.",
        )


# ==================================================
# CHANGE PASSWORD
# ==================================================

@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change the password of the currently authenticated user.
    """

    # ------------------------------------------
    # Verify current password
    # ------------------------------------------

    if not verify_password(
        data.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    # ------------------------------------------
    # Validate new password
    # ------------------------------------------

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long.",
        )

    # ------------------------------------------
    # Prevent same password
    # ------------------------------------------

    if verify_password(
        data.new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    # ------------------------------------------
    # Update password
    # ------------------------------------------

    current_user.password_hash = hash_password(
        data.new_password
    )

    db.commit()

    return MessageResponse(
        message="Password changed successfully."
    )


# ==================================================
# REFRESH TOKEN
# ==================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a new access token using a valid refresh token.
    """

    try:
        payload = decode_token(
            request.refresh_token
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload.",
        )

    from uuid import UUID

    try:
        user_uuid = UUID(user_id)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier.",
        )

    user = db.get(
        User,
        user_uuid,
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    return TokenResponse(
        access_token=create_access_token(
            str(user.id)
        ),
        refresh_token=create_refresh_token(
            str(user.id)
        ),
        token_type="bearer",
    )


# ==================================================
# CURRENT USER
# ==================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return the currently authenticated user.
    """

    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
    )