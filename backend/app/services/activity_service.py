import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.activity import (
    Activity,
    ActivityAction,
)


def create_activity(
    db: Session,
    *,
    user_id: uuid.UUID,
    action: ActivityAction,
    file_id: uuid.UUID | None = None,
    folder_id: uuid.UUID | None = None,
    extra_data: dict | None = None,
) -> Activity:
    activity = Activity(
        user_id=user_id,
        action=action,
        file_id=file_id,
        folder_id=folder_id,
        extra_data=extra_data,
    )

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


def list_activities(
    db: Session,
    user_id: uuid.UUID,
) -> list[Activity]:
    statement = (
        select(Activity)
        .where(
            Activity.user_id == user_id
        )
        .order_by(
            Activity.created_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )


def get_activity(
    db: Session,
    *,
    activity_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Activity | None:
    return db.scalar(
        select(Activity).where(
            Activity.id == activity_id,
            Activity.user_id == user_id,
        )
    )