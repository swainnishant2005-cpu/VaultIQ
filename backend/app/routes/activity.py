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
from app.services.activity_service import (
    get_activity,
    list_activities,
)


router = APIRouter(
    prefix="/api/activity",
    tags=["Activity"],
)


def activity_response(activity):
    return {
        "id": str(activity.id),
        "user_id": str(activity.user_id),
        "action": activity.action.value,
        "file_id": (
            str(activity.file_id)
            if activity.file_id
            else None
        ),
        "folder_id": (
            str(activity.folder_id)
            if activity.folder_id
            else None
        ),
        "extra_data": activity.extra_data,
        "created_at": activity.created_at,
    }


@router.get("")
def get_activity_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    activities = list_activities(
        db=db,
        user_id=current_user.id,
    )

    return {
        "activities": [
            activity_response(activity)
            for activity in activities
        ],
        "total": len(activities),
    }


@router.get(
    "/{activity_id}",
)
def get_single_activity(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        activity_uuid = UUID(activity_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid activity ID.",
        )

    activity = get_activity(
        db=db,
        activity_id=activity_uuid,
        user_id=current_user.id,
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found.",
        )

    return activity_response(activity)