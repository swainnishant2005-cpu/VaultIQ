from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.activity_service import create_activity
from app.models.activity import ActivityAction
from app.services.star_service import (
    get_user_star,
    list_starred,
    star_file,
    star_folder,
    unstar,
)


router = APIRouter(
    prefix="/api/stars",
    tags=["Stars"],
)


def star_response(star):
    return {
        "id": str(star.id),
        "user_id": str(star.user_id),
        "file_id": (
            str(star.file_id)
            if star.file_id
            else None
        ),
        "folder_id": (
            str(star.folder_id)
            if star.folder_id
            else None
        ),
        "created_at": star.created_at,
    }


@router.post(
    "/file/{file_id}",
)
def star_file_endpoint(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        file_uuid = UUID(file_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file ID.",
        )

    try:
        star = star_file(
            db=db,
            file_id=file_uuid,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    create_activity(
        db=db,
        user_id=current_user.id,
        action=ActivityAction.STAR,
        file_id=file_uuid,
    )

    return star_response(star)


@router.post(
    "/folder/{folder_id}",
)
def star_folder_endpoint(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        folder_uuid = UUID(folder_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid folder ID.",
        )

    try:
        star = star_folder(
            db=db,
            folder_id=folder_uuid,
            user_id=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    create_activity(
        db=db,
        user_id=current_user.id,
        action=ActivityAction.STAR,
        folder_id=folder_uuid,
    )

    return star_response(star)


@router.get("")
def get_starred(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stars = list_starred(
        db=db,
        user_id=current_user.id,
    )

    return {
        "stars": [
            star_response(star)
            for star in stars
        ],
        "total": len(stars),
    }


@router.delete(
    "/{star_id}",
)
def unstar_endpoint(
    star_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        star_uuid = UUID(star_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid star ID.",
        )

    star = get_user_star(
        db=db,
        star_id=star_uuid,
        user_id=current_user.id,
    )

    if not star:
        raise HTTPException(
            status_code=404,
            detail="Star not found.",
        )

    file_id = star.file_id
    folder_id = star.folder_id

    unstar(
        db=db,
        star=star,
    )

    create_activity(
        db=db,
        user_id=current_user.id,
        action=ActivityAction.UNSTAR,
        file_id=file_id,
        folder_id=folder_id,
    )

    return {
        "message": "Item unstarred successfully."
    }