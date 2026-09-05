import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.file import File


def list_deleted_files(
    db: Session,
    user_id: uuid.UUID,
) -> list[File]:
    statement = (
        select(File)
        .where(
            File.owner_id == user_id,
            File.is_deleted.is_(True),
        )
        .order_by(
            File.deleted_at.desc()
        )
    )

    return list(
        db.scalars(statement).all()
    )


def get_deleted_file(
    db: Session,
    *,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> File | None:
    return db.scalar(
        select(File).where(
            File.id == file_id,
            File.owner_id == user_id,
            File.is_deleted.is_(True),
        )
    )


def restore_deleted_file(
    db: Session,
    file_record: File,
) -> File:
    file_record.is_deleted = False
    file_record.deleted_at = None

    db.commit()
    db.refresh(file_record)

    return file_record


def permanently_delete_file(
    db: Session,
    file_record: File,
) -> None:
    db.delete(file_record)
    db.commit()